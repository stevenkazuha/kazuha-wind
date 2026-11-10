/* ─────────────────────────────────────────────
   风语 · 剧情引擎（Q 版 galgame）
   打字机、分支选项、好感度、自动播放、跳过、记录
   语音走 KazuhaVoice（预渲染万叶声线）
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const DATA = window.KAZUHA_STORY;
  if (!DATA) return;

  const $ = sel => document.querySelector(sel);
  const el = {
    stage: $("#stage"),
    bgA: $("#bgA"),
    bgB: $("#bgB"),
    sprite: $("#sprite"),
    chapterCard: $("#chapterCard"),
    chapterLabel: $("#chapterLabel"),
    chapterName: $("#chapterName"),
    dialog: $("#dialog"),
    speaker: $("#speaker"),
    emotion: $("#emotion"),
    text: $("#text"),
    next: $("#next"),
    choices: $("#choices"),
    start: $("#start"),
    startBtn: $("#startBtn"),
    resumeBtn: $("#resumeBtn"),
    logPanel: $("#logPanel"),
    logList: $("#logList"),
    ending: $("#ending"),
    endingTitle: $("#endingTitle"),
    endingText: $("#endingText"),
    affResult: $("#affResult"),
    endingActions: $("#endingActions"),
    affHud: $("#affHud"),
    affHearts: $("#affHearts"),
    affPop: $("#affPop"),
    autoBtn: $('[data-act="auto"]'),
    skipBtn: $('[data-act="skip"]'),
    exempt: $('[data-act="log"]')
  };

  const V = window.KazuhaVoice || null;
  const KEY = "kazuha.story.v1";
  const MAX_AFF = DATA.maxAff || 12;
  const CHIBI = {
    含笑: "assets/img/story/q-smile.webp",
    温柔: "assets/img/story/q-soft.webp",
    怅然: "assets/img/story/q-soft.webp",
    平静: "assets/img/story/q-calm.webp",
    低语: "assets/img/story/q-calm.webp",
    认真: "assets/img/story/q-calm.webp",
    害羞: "assets/img/story/q-shy.webp",
    惊讶: "assets/img/story/q-huh.webp"
  };
  const DEFAULT_FACE = CHIBI["含笑"];

  let ch = -1;
  let aff = 0;
  let queue = [];
  let current = null;
  let typing = false;
  let typeTimer = null;
  let autoTimer = null;
  let auto = false;
  let skip = false;
  let logLines = [];
  let bgFront = el.bgA;
  let bgBack = el.bgB;
  let cardOn = false;
  let cardTimer = null;

  /* ── 打字机 ─────────────────────────────── */
  const PAUSE = /[，。！？…、；：]/;

  function typeText(full) {
    clearTimeout(typeTimer);
    typing = true;
    el.next.classList.remove("is-ready");
    let i = 0;
    el.text.textContent = "";
    const step = () => {
      if (i >= full.length) {
        typing = false;
        el.next.classList.add("is-ready");
        if (auto) scheduleAuto();
        return;
      }
      const chs = full[i];
      el.text.textContent += chs;
      i += 1;
      typeTimer = setTimeout(step, PAUSE.test(chs) ? 190 : 36);
    };
    step();
  }

  function completeTyping() {
    if (!typing) return false;
    clearTimeout(typeTimer);
    el.text.textContent = current && current.text ? current.text : el.text.textContent;
    typing = false;
    el.next.classList.add("is-ready");
    scheduleAuto();
    return true;
  }

  /* ── 好感度 ─────────────────────────────── */
  function heartCount() {
    return Math.min(5, Math.max(0, Math.round(aff / MAX_AFF * 5)));
  }

  function renderAff(bump) {
    const on = heartCount();
    [...el.affHearts.children].forEach((h, i) => {
      h.classList.toggle("is-on", i < on);
    });
    el.affHud.classList.toggle("is-full", on >= 5);
    if (bump) {
      el.affHud.classList.remove("is-bump");
      void el.affHud.offsetWidth;
      el.affHud.classList.add("is-bump");
      popHearts(bump);
    }
  }

  function popHearts(n) {
    if (!el.affPop) return;
    for (let i = 0; i < n; i += 1) {
      const h = document.createElement("span");
      h.className = "aff-pop-heart";
      h.textContent = "♥";
      h.style.setProperty("--dx", `${(i - (n - 1) / 2) * 16}px`);
      h.style.animationDelay = `${i * 70}ms`;
      el.affPop.appendChild(h);
      setTimeout(() => h.remove(), 1100);
    }
  }

  function addAff(n) {
    if (!n) return;
    aff = Math.max(0, Math.min(MAX_AFF, aff + n));
    renderAff(n);
    save();
  }

  /* ── 章节 ───────────────────────────────── */
  function setBackground(url) {
    const front = bgFront;
    const back = bgBack;
    front.style.backgroundImage = `url("${url}")`;
    front.classList.add("is-on");
    back.classList.remove("is-on");
    bgFront = back;
    bgBack = front;
  }

  function setFace(emo) {
    const src = CHIBI[emo] || DEFAULT_FACE;
    if (el.sprite.getAttribute("src") === src) return;
    el.stage.classList.remove("is-pop");
    el.sprite.src = src;
    void el.stage.offsetWidth;
    el.stage.classList.add("is-pop");
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ch, aff }));
    } catch (e) { /* 忽略 */ }
  }

  function startChapter(index) {
    ch = index;
    const chapter = DATA.chapters[ch];
    if (!chapter) return finishStory();

    setBackground(chapter.bg);
    el.dialog.hidden = true;
    el.choices.hidden = true;
    el.stage.classList.remove("is-ending");
    el.next.classList.remove("is-ready");
    el.stage.classList.add("has-chibi", "is-dark");

    el.chapterName.textContent = chapter.label.replace(/^第.章 · /, "");
    el.chapterLabel.textContent = chapter.label;
    el.chapterCard.classList.add("is-on");
    cardOn = true;

    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => {
      cardOn = false;
      el.chapterCard.classList.remove("is-on");
      el.stage.classList.remove("is-dark");
      queue = chapter.beats.slice();
      el.dialog.hidden = false;
      playNext();
    }, 1800);

    save();
  }

  /* ── 节拍 ───────────────────────────────── */
  function playNext() {
    clearTimeout(autoTimer);
    if (cardOn || !el.choices.hidden) return;
    if (!queue.length) {
      if (ch + 1 < DATA.chapters.length) startChapter(ch + 1);
      else finishStory();
      return;
    }
    const beat = queue.shift();
    current = beat;

    if (beat.t === "choice") {
      showChoices(beat);
      return;
    }

    el.choices.hidden = true;
    el.stage.classList.remove("is-choosing");
    el.dialog.hidden = false;

    const isNarr = beat.t === "narr";
    el.speaker.textContent = isNarr ? "旁白" : beat.who || "万叶";
    el.dialog.classList.toggle("is-narr", isNarr);
    el.emotion.hidden = isNarr || !beat.emo;
    if (!isNarr && beat.emo) el.emotion.textContent = beat.emo;
    if (!isNarr) setFace(beat.emo);

    logLines.push({ who: isNarr ? "旁白" : beat.who || "万叶", text: beat.text });
    if (logLines.length > 200) logLines.shift();

    if (!skip) speakLine(beat, isNarr);

    el.text.textContent = "";
    if (skip) {
      el.text.textContent = beat.text;
      el.next.classList.add("is-ready");
      typing = false;
      autoTimer = setTimeout(playNext, 140);
      return;
    }
    typeText(beat.text);
  }

  function speakLine(beat, isNarr) {
    if (!V || isNarr) return;
    if (!V.enabled) return;
    V.speak(beat.text, null, el.speaker);
  }

  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!auto || skip || typing) return;
    if (!queue.length && ch + 1 >= DATA.chapters.length) return;
    const wait = 1100;
    autoTimer = setTimeout(() => {
      if (auto && !typing && el.choices.hidden) playNext();
    }, wait);
  }

  /* ── 选项 ───────────────────────────────── */
  function showChoices(beat) {
    clearTimeout(autoTimer);
    el.next.classList.remove("is-ready");
    el.choices.replaceChildren();
    el.choices.hidden = false;
    el.stage.classList.add("is-choosing");

    if (beat.prompt) {
      const p = document.createElement("p");
      p.className = "choices-prompt";
      p.textContent = beat.prompt;
      el.choices.appendChild(p);
    }

    beat.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.style.animationDelay = `${i * 90}ms`;
      const label = document.createElement("span");
      label.textContent = opt.label;
      btn.appendChild(label);
      if (opt.aff) {
        const hint = document.createElement("em");
        hint.className = "choice-aff";
        hint.textContent = "♥".repeat(opt.aff);
        btn.appendChild(hint);
      }
      btn.addEventListener("click", () => {
        el.choices.hidden = true;
        addAff(opt.aff || 0);
        queue = (opt.then || []).concat(queue);
        playNext();
      });
      el.choices.appendChild(btn);
    });
  }

  /* ── 结局 ───────────────────────────────── */
  function pickEnding() {
    const list = DATA.endings || [];
    const sorted = list.slice().sort((a, b) => (b.min || 0) - (a.min || 0));
    return sorted.find(item => aff >= (item.min || 0)) || sorted[sorted.length - 1] || {
      title: "风会记得",
      text: "三章已经走完。",
      actions: [{ label: "再走一遍", href: "story.html" }]
    };
  }

  function finishStory() {
    clearTimeout(autoTimer);
    clearTimeout(cardTimer);
    cardOn = false;
    el.dialog.hidden = true;
    el.choices.hidden = true;
    el.stage.classList.remove("is-choosing");
    el.next.classList.remove("is-ready");
    if (V) V.stop();
    setSkip(false);
    setAuto(false);

    const end = pickEnding();
    el.endingTitle.textContent = end.title;
    el.endingText.textContent = end.text;
    el.affResult.textContent = `好感度 ${aff} / ${MAX_AFF}　${"♥".repeat(heartCount())}${"♡".repeat(5 - heartCount())}`;
    el.endingActions.replaceChildren();
    (end.actions || []).forEach(a => {
      const link = document.createElement("a");
      link.className = "btn btn-primary";
      link.href = a.href;
      link.textContent = a.label;
      el.endingActions.appendChild(link);
    });
    el.ending.classList.add("is-on");
    el.stage.classList.add("is-ending");
  }

  /* ── 交互 ───────────────────────────────── */
  function advance() {
    if (el.ending.classList.contains("is-on") || cardOn) return;
    if (!el.choices.hidden) return;
    if (typing) {
      completeTyping();
      return;
    }
    playNext();
  }

  function setAuto(on) {
    auto = Boolean(on);
    el.autoBtn.classList.toggle("is-active", auto);
    el.autoBtn.setAttribute("aria-pressed", String(auto));
    if (auto) {
      if (!typing) scheduleAuto();
    } else {
      clearTimeout(autoTimer);
    }
  }

  function setSkip(on) {
    skip = Boolean(on);
    el.skipBtn.classList.toggle("is-active", skip);
    el.skipBtn.setAttribute("aria-pressed", String(skip));
    if (skip) {
      if (V) V.stop();
      clearTimeout(autoTimer);
      if (!el.choices.hidden) return;
      if (typing) completeTyping();
      autoTimer = setTimeout(() => {
        if (el.choices.hidden) playNext();
      }, 140);
    }
  }

  function toggleLog(force) {
    const show = force !== undefined ? force : el.logPanel.hidden;
    if (show) {
      el.logList.replaceChildren();
      if (!logLines.length) {
        const empty = document.createElement("p");
        empty.className = "log-empty";
        empty.textContent = "还没有走过的句子。";
        el.logList.appendChild(empty);
      }
      logLines.forEach(item => {
        const row = document.createElement("div");
        row.className = "log-row";
        const who = document.createElement("b");
        who.textContent = item.who;
        const p = document.createElement("p");
        p.textContent = item.text;
        row.append(who, p);
        el.logList.appendChild(row);
      });
      el.logPanel.hidden = false;
      el.logList.scrollTop = el.logList.scrollHeight;
    } else {
      el.logPanel.hidden = true;
    }
  }

  el.next.addEventListener("click", () => advance());

  el.stage.addEventListener("click", event => {
    if (event.target.closest("button, a, .choices, .log-panel, .ending, .start, .vn-top, .aff-hud")) return;
    if (el.start.classList.contains("is-on")) return;
    advance();
  });

  document.addEventListener("keydown", event => {
    if (event.key === " " || event.key === "Enter") {
      if (el.start.classList.contains("is-on")) return;
      event.preventDefault();
      advance();
    } else if (event.key === "Escape") {
      toggleLog(false);
    }
  });

  el.autoBtn.addEventListener("click", () => setAuto(!auto));
  el.skipBtn.addEventListener("click", () => setSkip(!skip));
  el.exempt.addEventListener("click", () => toggleLog());
  $("#logClose").addEventListener("click", () => toggleLog(false));
  el.logPanel.addEventListener("click", event => {
    if (event.target === el.logPanel) toggleLog(false);
  });

  $("#replay").addEventListener("click", () => {
    if (!V || !current || current.t === "narr") return;
    V.speak(current.text, null, el.speaker);
  });

  $("#exit").addEventListener("click", () => {
    location.href = "index.html";
  });

  /* ── 开始 ───────────────────────────────── */
  function begin(fromStart) {
    el.start.classList.remove("is-on");
    if (V) {
      V.setEnabled(true, true);
      V.stop();
    }
    logLines = [];
    let startAt = 0;
    aff = 0;
    if (!fromStart) {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "null");
        if (saved && typeof saved.ch === "number") startAt = Math.min(saved.ch, DATA.chapters.length - 1);
        if (saved && typeof saved.aff === "number") aff = Math.min(MAX_AFF, Math.max(0, saved.aff));
      } catch (e) { /* 忽略 */ }
    }
    renderAff(0);
    startChapter(startAt);
  }

  function boot() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) { /* 忽略 */ }
    if (saved && typeof saved.ch === "number") {
      el.resumeBtn.hidden = false;
      aff = typeof saved.aff === "number" ? saved.aff : 0;
    }
    renderAff(0);

    el.startBtn.addEventListener("click", () => begin(true));
    el.resumeBtn.addEventListener("click", () => begin(false));

    /* 预加载第一屏背景 */
    const first = DATA.chapters[0];
    bgFront.style.backgroundImage = `url("${first.bg}")`;
  }

  boot();
})();
