/* ─────────────────────────────────────────────
   风语 · 安装页
   处理 PWA 安装提示、平台差异与安装状态
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const $ = sel => document.querySelector(sel);
  const btn = $("#installBtn");
  const state = $("#installState");
  if (!btn || !state) return;

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    navigator.standalone === true;

  const isIOS = () =>
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let deferred = null;
  let installed = isStandalone();

  function paint(mode) {
    btn.disabled = true;
    btn.classList.remove("is-ready");

    if (mode === "installed") {
      state.textContent = "它已经留在这台设备上了。往后从桌面图标掀开，就是风。";
      btn.textContent = "已安放在设备";
      return;
    }
    if (mode === "offline") {
      state.textContent = "你正捧着一只离线包。它已在你手里，无需再安装，也无需再下载。";
      btn.textContent = "在离线包里";
      return;
    }
    if (mode === "ios") {
      state.textContent = "iPhone / iPad 要亲手添一笔：用 Safari 打开本页 → 底部分享 → 「添加到主屏幕」。";
      btn.textContent = "按说明添加";
      return;
    }
    if (mode === "ready") {
      state.textContent = "当前浏览器愿意收留它。装好之后，桌面会多一枚「风语」，断网也开得了门。";
      btn.textContent = "安装到设备";
      btn.disabled = false;
      btn.classList.add("is-ready");
      return;
    }
    state.textContent = "这个浏览器不肯放手（微信内置浏览器多是这样）。换 Chrome / Edge / Safari，或取一只离线包带走。";
    btn.textContent = "换个浏览器试试";
  }

  function refresh() {
    if (location.protocol === "file:") { paint("offline"); return; }
    installed = isStandalone();
    if (installed) paint("installed");
    else if (deferred) paint("ready");
    else if (isIOS()) paint("ios");
    else paint("none");
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferred = event;
    if (!installed) paint("ready");
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    paint("installed");
    if (window.Kazuha && window.Kazuha.toast) window.Kazuha.toast("装好了。往后风就住在你的设备里。");
  });

  btn.addEventListener("click", async () => {
    if (!deferred) return;
    const prompt = deferred;
    deferred = null;
    btn.disabled = true;
    try {
      prompt.prompt();
      const result = await prompt.userChoice;
      if (result && result.outcome === "accepted") {
        state.textContent = "正在安放…稍后桌面会多一枚「风语」。";
        btn.textContent = "正在安放…";
      } else {
        paint("ready");
        deferred = prompt;
        state.textContent = "取消了也不要紧。风不赶时间，想装时再点一次就好。";
        btn.disabled = false;
        btn.classList.add("is-ready");
      }
    } catch (e) {
      paint("none");
    }
  });

  refresh();
  setTimeout(refresh, 600);

  // 从离线包直接打开（file://）时没有服务器，下载入口也没意义
  if (location.protocol === "file:") {
    const dl = document.querySelector(".install-download");
    if (dl) {
      dl.removeAttribute("href");
      dl.removeAttribute("download");
      dl.textContent = "离线包已在你手上";
      dl.setAttribute("aria-disabled", "true");
      dl.style.opacity = "0.6";
      dl.style.pointerEvents = "none";
    }
  }
})();
