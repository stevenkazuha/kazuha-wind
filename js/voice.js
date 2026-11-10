/* ─────────────────────────────────────────────
   风语 · 语音
   原声播放（本地中文配音片段）与语音听写
   开关状态保存在本机
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const KEY = "kazuha.voice.v1";
  const DATA = window.KazuhaLines || { byId: {}, replies: [], fallback: null };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const STT_OK = Boolean(SR);

  let enabled = false;
  let audio = null;
  let currentId = null;
  let activeEl = null;
  let rec = null;
  let recActive = false;
  let recBase = "";
  let recEl = null;

  try {
    enabled = localStorage.getItem(KEY) === "on";
  } catch (e) { /* 存储不可用时保持默认关闭 */ }

  const clipOf = id => (DATA.byId && DATA.byId[id]) || null;

  /* ── 播放原声 ───────────────────────────── */
  function revealQuote(el) {
    if (!el) return;
    const body = el.closest(".msg-body");
    if (body) body.classList.add("show-voice");
  }

  function setActiveEl(el) {
    if (activeEl && activeEl !== el) activeEl.classList.remove("is-speaking");
    activeEl = el || null;
    if (activeEl) activeEl.classList.add("is-speaking");
  }

  function endPlayback() {
    currentId = null;
    audio = null;
    setActiveEl(null);
    document.dispatchEvent(new CustomEvent("kazuha:speakend"));
    syncToggle();
  }

  function playAudio(src, el, id) {
    stop();
    revealQuote(el);
    setActiveEl(el);
    currentId = id;

    audio = new Audio(src);
    audio.preload = "auto";

    audio.addEventListener("ended", endPlayback, { once: true });
    audio.addEventListener("error", () => {
      if (window.Kazuha) window.Kazuha.toast("这段录音没有找到");
      endPlayback();
    }, { once: true });

    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (window.Kazuha) window.Kazuha.toast("浏览器拦住了播放，请再点一下");
        endPlayback();
      });
    }

    document.dispatchEvent(new CustomEvent("kazuha:speakstart", { detail: { id } }));
    syncToggle();
  }

  function playClip(id, el) {
    const clip = clipOf(id);
    if (!clip) return false;
    playAudio(clip.file, el, id);
    return true;
  }

  /* ── 万叶声线（本地 GPT-SoVITS 实时合成） ──── */
  /* 用 http(s) 打开时走同源 /tts 代理（服务端转发到 9880），手机与局域网也能合成；
     用 file:// 直接打开时退回本机 9880 */
  const sameOrigin = location.protocol === "http:" || location.protocol === "https:";
  const TTS = Object.assign(
    {
      base: sameOrigin ? location.origin : "http://127.0.0.1:9880",
      ref: "D:/A/Temp/kz/ref/kazuha_ref.wav",
      prompt: "有船有海风，不吟诗几句，岂不是不解风情？"
    },
    window.KazuhaTTS || {}
  );
  /* 预渲染语料：chat.js 的固定回复直接播放本地万叶声线 */
  const staticMap = new Map(
    (window.KazuhaTtsLines || []).map(item => [item.t, item.f])
  );

  const ttsCache = new Map();
  let ttsBroken = false;
  let synthesizing = false;

  async function ttsAudioUrl(text) {
    const hit = ttsCache.get(text);
    if (hit) return hit;
    const res = await fetch(`${TTS.base}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        text_lang: "zh",
        ref_audio_path: TTS.ref,
        prompt_text: TTS.prompt,
        prompt_lang: "zh",
        text_split_method: "cut5",
        media_type: "wav",
        streaming_mode: false
      })
    });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    ttsCache.set(text, url);
    return url;
  }

  /* 先用万叶声线念这段话，合成失败再退回官方原声片段 */
  async function speak(text, clipId, el) {
    const say = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
    const fallback = () => (clipId ? playClip(clipId, el) : false);
    if (!say) return fallback();

    const baked = staticMap.get(say);
    if (baked) {
      playAudio(baked, el, clipId || baked);
      return true;
    }
    if (ttsBroken || synthesizing) return fallback();

    synthesizing = true;
    if (el) el.classList.add("is-synth");
    try {
      const url = await ttsAudioUrl(say);
      playAudio(url, el, clipId || `tts:${say.slice(0, 12)}`);
      return true;
    } catch (e) {
      ttsBroken = true;
      return fallback();
    } finally {
      if (el) el.classList.remove("is-synth");
      synthesizing = false;
    }
  }

  function stop() {
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) { /* 忽略 */ }
    }
    if (currentId || activeEl) endPlayback();
  }

  /* ── 听写 ───────────────────────────────── */
  function targetInput() {
    return document.querySelector("#input") || document.querySelector("textarea");
  }

  function setRecUI(on, el) {
    recActive = on;
    if (recEl) recEl.classList.remove("is-rec");
    recEl = on ? el : null;
    if (recEl) recEl.classList.add("is-rec");
    document.dispatchEvent(new CustomEvent("kazuha:recordchange", { detail: { active: on } }));
  }

  function startDictation(el) {
    if (!STT_OK) {
      if (window.Kazuha) window.Kazuha.toast("这个浏览器不支持语音输入");
      return;
    }
    if (recActive) {
      stopDictation();
      return;
    }

    const input = targetInput();
    recBase = input ? input.value : "";

    rec = new SR();
    rec.lang = "zh-CN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setRecUI(true, el);
      if (window.Kazuha) window.Kazuha.toast("请说话，风在听");
    };

    rec.onresult = event => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) finalText += item[0].transcript;
        else interim += item[0].transcript;
      }
      if (finalText) recBase = `${recBase}${finalText}`;
      if (input) {
        input.value = `${recBase}${interim}`;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus({ preventScroll: true });
      }
      if (finalText) {
        document.dispatchEvent(new CustomEvent("kazuha:speechresult", { detail: { text: finalText } }));
      }
    };

    rec.onerror = event => {
      const code = event && event.error;
      let msg = "风没听清，再说一次？";
      if (code === "not-allowed" || code === "service-not-allowed") msg = "麦克风未获授权，请在浏览器设置里允许";
      else if (code === "no-speech") msg = "没有听见声音";
      else if (code === "network") msg = "语音识别需要联网";
      if (window.Kazuha) window.Kazuha.toast(msg);
    };

    rec.onend = () => {
      setRecUI(false);
      rec = null;
    };

    try {
      rec.start();
    } catch (e) {
      setRecUI(false);
      if (window.Kazuha) window.Kazuha.toast("语音输入启动失败");
    }
  }

  function stopDictation() {
    if (!rec) return;
    try { rec.stop(); } catch (e) { /* 已停止 */ }
    setRecUI(false);
    rec = null;
  }

  /* ── 开关 ───────────────────────────────── */
  function setEnabled(on, silent) {
    enabled = Boolean(on);
    try {
      localStorage.setItem(KEY, enabled ? "on" : "off");
    } catch (e) { /* 忽略 */ }
    if (!enabled) stop();
    syncToggle();
    document.dispatchEvent(new CustomEvent("kazuha:voicechange", { detail: { enabled } }));
    if (enabled && !silent) playClip("burst");
  }

  function syncToggle() {
    document.querySelectorAll("[data-voice-toggle]").forEach(btn => {
      btn.classList.toggle("is-on", enabled);
      btn.classList.toggle("is-speaking", currentId !== null);
      btn.setAttribute("aria-pressed", String(enabled));
      btn.title = enabled ? "关闭原声" : "开启原声";
      const label = btn.querySelector("span");
      if (label) label.textContent = enabled ? "原声已开" : "原声";
    });
  }

  /* 点击带 data-clip 的元素即播放对应原声；再点同一句则停止 */
  document.addEventListener("click", event => {
    const clipEl = event.target.closest("[data-clip]");
    if (clipEl) {
      event.preventDefault();
      const id = clipEl.dataset.clip;
      const say = clipEl.dataset.say;
      if (currentId === id) stop();
      else if (say && !ttsBroken) speak(say, id, clipEl);
      else playClip(id, clipEl);
      return;
    }

    const toggle = event.target.closest("[data-voice-toggle]");
    if (toggle) {
      setEnabled(!enabled);
      return;
    }

    const mic = event.target.closest("[data-voice-mic]");
    if (mic) startDictation(mic);
  });

  function boot() {
    syncToggle();
    document.querySelectorAll("[data-voice-mic]").forEach(btn => {
      if (!STT_OK) btn.hidden = true;
    });
  }

  window.KazuhaVoice = {
    stt: STT_OK,
    clips: DATA,
    playClip,
    speak,
    stop,
    setEnabled,
    startDictation,
    stopDictation,
    get enabled() { return enabled; },
    get speaking() { return currentId !== null; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
