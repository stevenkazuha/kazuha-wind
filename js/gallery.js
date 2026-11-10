/* ─────────────────────────────────────────────
   枫叶图鉴 — 分类筛选与通用灯箱
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  const ITEMS = [
    { id: "s01", src: "assets/img/official/splash-kv.jpg", title: "红叶逐荒波", tag: "立绘" },
    { id: "s02", src: "assets/img/official/splash-gacha.jpg", title: "祈愿之姿", tag: "立绘" },
    { id: "s03", src: "assets/img/official/splash-fullbody.jpg", title: "浪人立绘", tag: "立绘" },
    { id: "s04", src: "assets/img/official/splash-vertical.jpg", title: "命之座", tag: "立绘" },
    { id: "s05", src: "assets/img/official/collab-concert.jpg", title: "弦上风起", tag: "联动" },
    { id: "s06", src: "assets/img/official/collab-cadillac.jpg", title: "礼服之夜", tag: "联动" },
    { id: "s07", src: "assets/img/official/birthday-2022.jpg", title: "秋叶与君", tag: "贺图" },
    { id: "s08", src: "assets/img/official/birthday-2024.jpg", title: "夜色航船", tag: "贺图" },
    { id: "s09", src: "assets/img/official/birthday-2025.jpg", title: "白猫与枫", tag: "贺图" },
    { id: "s10", src: "assets/img/official/wallpaper-birthday-2022.jpg", title: "生日壁纸", tag: "壁纸" },
    { id: "s11", src: "assets/img/official/pv-autumn-tree.jpg", title: "月下风来 · 枫树", tag: "PV" },
    { id: "s12", src: "assets/img/official/pv-combat-glow.jpg", title: "刀光起处", tag: "PV" },
    { id: "s13", src: "assets/img/official/pv-duel-stairs.jpg", title: "与北斗并肩", tag: "PV" },
    { id: "s14", src: "assets/img/official/pv-red-maple-fight.jpg", title: "红叶林拔刀", tag: "PV" },
    { id: "s15", src: "assets/img/official/pv-moonlit-deck.jpg", title: "月夜船头", tag: "PV" },
    { id: "s16", src: "assets/img/official/pv-portrait-closeup.jpg", title: "侧脸", tag: "PV" },
    { id: "s17", src: "assets/img/official/detail-kv-face.jpg", title: "红叶逐荒波 · 特写", tag: "细节" },
    { id: "s18", src: "assets/img/official/detail-cat-maple.jpg", title: "白猫与枫 · 特写", tag: "细节" },
    { id: "s19", src: "assets/img/official/detail-night-deck.jpg", title: "夜色航船 · 特写", tag: "细节" }
  ];

  const TAGS = ["全部", "立绘", "贺图", "联动", "PV", "细节", "壁纸"];

  const grid = $("#grid");
  const filterBar = $("#filters");
  const badge = $("#totalBadge");

  let current = "全部";
  let filtered = ITEMS;

  const countOf = tag => tag === "全部" ? ITEMS.length : ITEMS.filter(item => item.tag === tag).length;

  function buildFilters() {
    TAGS.forEach(tag => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter" + (tag === current ? " is-active" : "");
      btn.dataset.tag = tag;
      btn.setAttribute("aria-pressed", String(tag === current));
      btn.innerHTML = `${tag}<span class="cnt">${countOf(tag)}</span>`;
      btn.addEventListener("click", () => setFilter(tag));
      filterBar.appendChild(btn);
    });
  }

  function syncFilters() {
    filterBar.querySelectorAll(".filter").forEach(btn => {
      const on = btn.dataset.tag === current;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function renderGrid() {
    grid.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "grid-empty";
      empty.textContent = "这一类还没有拾到叶子。换个册子看看？";
      grid.appendChild(empty);
      return;
    }

    filtered.forEach((item, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gcard";
      card.setAttribute("aria-label", `查看大图：${item.title}（${item.tag}）`);

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.title;
      img.loading = i < 4 ? "eager" : "lazy";

      const thumb = document.createElement("span");
      thumb.className = "gthumb";
      thumb.appendChild(img);

      const info = document.createElement("div");
      info.className = "info";
      const title = document.createElement("h3");
      title.textContent = item.title;
      const tag = document.createElement("span");
      tag.textContent = item.tag;
      info.append(title, tag);

      card.append(thumb, info);
      card.addEventListener("click", () => {
        window.Kazuha.openLightbox(filtered, i);
      });
      grid.appendChild(card);
    });
  }

  function setFilter(tag) {
    current = tag;
    filtered = tag === "全部" ? ITEMS : ITEMS.filter(item => item.tag === tag);
    badge.textContent = `共 ${filtered.length} 张`;
    syncFilters();
    renderGrid();
  }

  function boot() {
    buildFilters();
    badge.textContent = `共 ${ITEMS.length} 张`;

    // 支持从对话页/首页带 #g01 直接放大某张
    const hashId = location.hash.replace("#", "");
    const deepIndex = hashId ? ITEMS.findIndex(item => item.id === hashId) : -1;

    renderGrid();

    if (deepIndex >= 0) {
      window.Kazuha.openLightbox(ITEMS, deepIndex);
    }
  }

  boot();
})();
