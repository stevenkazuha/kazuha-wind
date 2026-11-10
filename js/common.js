/* ─────────────────────────────────────────────
   风语 · 枫原万叶 — 公共脚本
   导航高亮 / 登录态 / 飘叶 / 数字滚动 / 提示条
   / 年份 / 通用灯箱
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const USER_KEY = "kazuha.user";

  /* ── 登录态 ─────────────────────────────── */
  const user = {
    get() {
      try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data.name !== "string" || !data.name.trim()) return null;
        return data;
      } catch (e) {
        return null;
      }
    },
    set(data) {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      } catch (e) { /* 本地存储不可用时静默降级 */ }
    },
    clear() {
      try {
        localStorage.removeItem(USER_KEY);
      } catch (e) { /* 同上 */ }
    }
  };

  function renderAuth() {
    const host = $("#navAuth");
    if (!host) return;
    const current = user.get();
    host.replaceChildren();

    if (current) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "auth-btn is-user";
      btn.title = "点击退出登录";
      const dot = document.createElement("i");
      dot.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "auth-name";
      label.textContent = `旅人 · ${current.name}`;
      btn.append(dot, label);
      btn.addEventListener("click", () => {
        user.clear();
        renderAuth();
        toast("风已歇，期待再会。");
        document.dispatchEvent(new CustomEvent("kazuha:userchange"));
      });
      host.appendChild(btn);
    } else {
      const link = document.createElement("a");
      link.className = "auth-btn";
      link.href = "login.html";
      link.textContent = "登录";
      host.appendChild(link);
    }
  }

  /* ── 导航高亮 ───────────────────────────── */
  function markNav() {
    const page = document.body.dataset.page;
    if (!page) return;
    $$(".nav-links a[data-nav]").forEach(a => {
      const on = a.dataset.nav === page;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page");
    });
  }

  /* ── 提示条 ─────────────────────────────── */
  let toastEl = null;
  let toastTimer = 0;

  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => toastEl.classList.add("is-on"));
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
  }

  /* ── 年份 ───────────────────────────────── */
  function fillYear() {
    const year = String(new Date().getFullYear());
    $$("[data-year]").forEach(el => { el.textContent = year; });
  }

  /* ── 数字滚动 ───────────────────────────── */
  function initCounters() {
    const nums = $$("[data-count]");
    if (!nums.length) return;
    if (reduceMotion) return; // 减少动效时保留 HTML 里的最终值

    const format = (el, value) => {
      const n = Math.round(value);
      el.textContent = el.hasAttribute("data-comma") ? n.toLocaleString("en-US") : String(n);
    };

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        const target = Number(el.dataset.count) || 0;
        const start = performance.now();
        const dur = 1100;
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          format(el, target * eased);
          if (p < 1) requestAnimationFrame(tick);
          else format(el, target);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.35 });

    nums.forEach(el => {
      el.textContent = "0";
      io.observe(el);
    });
  }

  /* ── 飘落的枫叶 ─────────────────────────── */
  function initLeaves() {
    if (reduceMotion) return;
    const canvas = $("#leavesCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COLORS = ["#c2453a", "#d97742", "#c9a86b", "#9c3b31", "#e0a35a"];
    let W = 0;
    let H = 0;
    let leaves = [];

    const path = new Path2D();
    path.moveTo(0, -11);
    path.lineTo(2.4, -5.5);
    path.lineTo(7.5, -7.5);
    path.lineTo(5.2, -1.6);
    path.lineTo(11.5, -1.2);
    path.lineTo(5.8, 3.4);
    path.lineTo(9.6, 9.2);
    path.lineTo(2.8, 6.6);
    path.lineTo(0.8, 12);
    path.lineTo(-0.8, 12);
    path.lineTo(-2.8, 6.6);
    path.lineTo(-9.6, 9.2);
    path.lineTo(-5.8, 3.4);
    path.lineTo(-11.5, -1.2);
    path.lineTo(-5.2, -1.6);
    path.lineTo(-7.5, -7.5);
    path.lineTo(-2.4, -5.5);
    path.closePath();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeLeaf(randomY) {
      const size = 6 + Math.random() * 8;
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : -30 - Math.random() * 120,
        size,
        speed: 14 + Math.random() * 24,
        sway: 20 + Math.random() * 36,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.12 + Math.random() * 0.26 // 低透明度，不抢正文
      };
    }

    resize();
    leaves = Array.from({ length: Math.max(10, Math.min(20, Math.floor(W / 100))) }, () => makeLeaf(true));

    let last = performance.now();
    let running = true;

    function frame(t) {
      if (!running) return;
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      ctx.clearRect(0, 0, W, H);

      for (const leaf of leaves) {
        leaf.y += leaf.speed * dt;
        leaf.phase += dt * 1.1;
        leaf.x += Math.sin(leaf.phase) * leaf.sway * dt;
        leaf.rot += leaf.spin * dt;

        if (leaf.y > H + 40 || leaf.x < -60 || leaf.x > W + 60) {
          Object.assign(leaf, makeLeaf(false));
        }

        ctx.save();
        ctx.globalAlpha = leaf.alpha;
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rot);
        ctx.fillStyle = leaf.color;
        ctx.scale(leaf.size / 12, leaf.size / 12);
        ctx.fill(path);
        ctx.restore();
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) {
        last = performance.now();
        requestAnimationFrame(frame);
      }
    });
  }

  /* ── 通用灯箱 ───────────────────────────── */
  const lb = {
    el: null,
    items: [],
    index: 0,
    lastFocus: null,
    prevOverflow: ""
  };

  function ensureLightbox() {
    if (lb.el) return lb.el;
    const box = document.createElement("div");
    box.className = "lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "图片浏览");
    box.innerHTML = `
      <div class="lb-backdrop" data-close></div>
      <figure class="lb-frame">
        <img id="lbImg" alt="">
        <figcaption><span id="lbCaption"></span><span id="lbCount"></span></figcaption>
      </figure>
      <button class="lb-close" type="button" data-close aria-label="关闭">×</button>
      <button class="lb-nav lb-prev" type="button" aria-label="上一张">‹</button>
      <button class="lb-nav lb-next" type="button" aria-label="下一张">›</button>`;
    document.body.appendChild(box);

    box.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeLightbox));
    box.querySelector(".lb-prev").addEventListener("click", () => stepLightbox(-1));
    box.querySelector(".lb-next").addEventListener("click", () => stepLightbox(1));

    document.addEventListener("keydown", e => {
      if (!lb.el || lb.el.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stepLightbox(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); stepLightbox(1); }
    });

    lb.el = box;
    return box;
  }

  function paintLightbox() {
    const item = lb.items[lb.index];
    if (!item) return;
    const img = lb.el.querySelector("#lbImg");
    img.src = item.src;
    img.alt = item.title;
    lb.el.querySelector("#lbCaption").textContent = item.tag ? `${item.title} · ${item.tag}` : item.title;
    lb.el.querySelector("#lbCount").textContent = `${lb.index + 1} / ${lb.items.length}`;
  }

  function openLightbox(items, index = 0) {
    if (!items || !items.length) return;
    ensureLightbox();
    lb.items = items;
    lb.index = Math.max(0, Math.min(index, items.length - 1));
    lb.lastFocus = document.activeElement;
    lb.prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lb.el.hidden = false;
    paintLightbox();
    lb.el.querySelector(".lb-close").focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lb.el || lb.el.hidden) return;
    lb.el.hidden = true;
    document.body.style.overflow = lb.prevOverflow;
    if (lb.lastFocus && lb.lastFocus.focus) lb.lastFocus.focus({ preventScroll: true });
  }

  function stepLightbox(dir) {
    if (!lb.el || lb.el.hidden || !lb.items.length) return;
    lb.index = (lb.index + dir + lb.items.length) % lb.items.length;
    paintLightbox();
  }

  /* ── 滚动入场 ───────────────────────────── */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(el => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach(el => io.observe(el));
  }

  /* ── Q 版小万叶：随页同行 ─────────────── */
  const BUDDY_STATES = [
    { src: "assets/img/story/q-smile.webp", lines: ["风起时，记得抬头。", "你来了，风就顺了。"] },
    { src: "assets/img/story/q-petal.webp", lines: ["枫叶落在肩上，就当是打招呼。", "这一片是给你的，别嫌它轻。"] },
    { src: "assets/img/story/q-toast.webp", lines: ["不必急着赶路——风会把该遇见的吹来。", "坐下吧，茶还温着。"] },
    { src: "assets/img/story/q-bread.webp", lines: ["今天的风，适合慢慢说话。", "先吃口东西，路还长。"] },
    { src: "assets/img/story/q-doze.webp", lines: ["若你累了，就停一停；叶子也懂得歇。"] },
    { src: "assets/img/story/q-bird.webp", lines: ["我把耳朵借给风，也借给你。", "它刚从海那边回来，带了消息。"] },
    { src: "assets/img/story/q-rest.webp", lines: ["海上的夜很长，故事可以慢慢讲。"] },
    { src: "assets/img/story/q-spark.webp", lines: ["有好事要发生——我闻到了风里的甜。"] },
    { src: "assets/img/story/q-portrait.webp", lines: ["若你愿意，就多留一会儿。"] },
    { src: "assets/img/story/q-mug.webp", lines: ["嗯？你刚才说什么，风太吵了。"] },
    { src: "assets/img/story/q-zzz.webp", lines: ["困了就先睡吧，风替你守着。"] },
    { src: "assets/img/story/q-desk.webp", lines: ["在写一点旧事，字比风慢。"] }
  ];
  const CHEER = "assets/img/story/q-cheer.webp";

  function initBuddy() {
    const startChibi = $(".start-chibi img");
    if (startChibi) {
      const pool = ["q-smile", "q-petal", "q-portrait"];
      startChibi.src = "assets/img/story/" + pool[Math.floor(Math.random() * pool.length)] + ".webp";
    }
    const chatAvatar = $(".chat-avatar img");
    if (chatAvatar) {
      const pool = ["q-smile", "q-petal", "q-portrait", "q-spark"];
      chatAvatar.src = "assets/img/story/" + pool[Math.floor(Math.random() * pool.length)] + ".webp";
    }
    if (document.body.classList.contains("page-story")) return;
    if (!$(".site-footer") && document.body.dataset.page !== "login") return;
    if (document.querySelector(".qbuddy")) return;

    const wrap = document.createElement("aside");
    wrap.className = "qbuddy";
    wrap.setAttribute("aria-label", "Q 版万叶");

    const start = Math.floor(Math.random() * BUDDY_STATES.length);
    const bubble = document.createElement("p");
    bubble.className = "qbuddy-bubble";
    bubble.setAttribute("role", "status");
    bubble.textContent = BUDDY_STATES[start].lines[0];

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qbuddy-btn";
    btn.setAttribute("aria-label", "和万叶说句话");
    const img = document.createElement("img");
    img.src = BUDDY_STATES[start].src;
    img.alt = "";
    btn.appendChild(img);

    wrap.append(bubble, btn);
    document.body.appendChild(wrap);

    let state = start;
    let clicks = 0;
    let hideTimer = 0;
    let cheerTimer = 0;

    const showBubble = text => {
      if (text) bubble.textContent = text;
      wrap.classList.add("is-talk");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => wrap.classList.remove("is-talk"), 7000);
    };

    btn.addEventListener("click", () => {
      state = (state + 1) % BUDDY_STATES.length;
      clicks += 1;
      clearTimeout(cheerTimer);
      img.src = BUDDY_STATES[state].src;
      const lines = BUDDY_STATES[state].lines;
      showBubble(lines[Math.floor(Math.random() * lines.length)]);
      /* 偶尔换一张动态表情，让小家伙活起来 */
      if (clicks % 5 === 0) {
        img.src = CHEER;
        cheerTimer = setTimeout(() => { img.src = BUDDY_STATES[state].src; }, 3600);
      }
    });

    /* 手机上不主动冒气泡，免得压住正文；点了才说话 */
    if (!window.matchMedia("(max-width: 760px)").matches) {
      setTimeout(() => showBubble(), 900);
    }
  }

  /* ── 图片兜底：偶发断链时自动再试两次 ────── */
  function initImageRetry() {
    if (initImageRetry.done) return;
    initImageRetry.done = true;
    document.addEventListener("error", event => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement)) return;
      const tries = Number(img.dataset.retry || 0);
      if (tries >= 2) return;
      const base = (img.getAttribute("src") || "").split("?")[0].split("#")[0];
      if (!base) return;
      img.dataset.retry = String(tries + 1);
      const next = tries + 1;
      setTimeout(() => {
        img.src = base + "?retry=" + next + "&t=" + Date.now();
      }, 700 * next);
    }, true);
  }

  /* ── 启动 ───────────────────────────────── */
  markNav();
  renderAuth();
  fillYear();
  initLeaves();
  initCounters();
  initReveal();
  initBuddy();
  initImageRetry();

  /* ── PWA：注册离线缓存 ───────────────────── */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* 不支持时静默 */ });
    });
  }

  window.Kazuha = {
    user,
    toast,
    openLightbox,
    closeLightbox,
    renderAuth
  };
})();
