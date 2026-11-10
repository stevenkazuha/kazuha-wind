/* ─────────────────────────────────────────────
   风之旅程 — 原生 canvas 图表与本地记录
   心情折线 / 属性雷达 / 拾叶进度环 / 主题横条
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const STORE_KEY = "kazuha.wind.session.v1";
  const TOTAL_LEAVES = 10;
  const DAY = 86400000;
  const F_UI = '"PingFang SC","Microsoft YaHei",sans-serif';
  const F_SERIF = '"Noto Serif SC","Songti SC",serif';

  /* ── 本地记录 ───────────────────────────── */
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  const store = loadStore();
  const messages = Array.isArray(store.messages)
    ? store.messages.filter(m => m && m.role && typeof m.text === "string")
    : [];
  const userMessages = messages.filter(m => m.role === "user");
  const leaves = Math.max(0, Math.min(TOTAL_LEAVES, Number(store.leaves) || 0));

  /* 没有本地记录时，面板以示例数据展示；
     只要说过一句话，所有面板自动切换为真实记录。 */
  const DEMO = { chats: 6, leaves: 9, mood: 82, scores: [72, 66, 80, 74, 86, 78, 88] };
  const demoMode = userMessages.length === 0;
  const shownLeaves = demoMode ? DEMO.leaves : leaves;

  /* ── 情绪估算 ───────────────────────────── */
  const POS_WORDS = ["谢谢", "开心", "喜欢", "温柔", "安静", "愿意", "陪", "暖", "美", "好", "花", "月", "星", "平安", "祝福", "顺风"];
  const NEG_WORDS = ["难过", "伤心", "迷茫", "累", "孤独", "烦", "焦虑", "乱", "压力", "想哭", "不开心", "难受", "怕", "痛", "舍不得", "想念"];

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function moodScore(text) {
    let score = 70;
    POS_WORDS.forEach(k => { if (text.includes(k)) score += 4; });
    NEG_WORDS.forEach(k => { if (text.includes(k)) score -= 9; });
    return clamp(score, 20, 96);
  }

  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  /* 最近七日 */
  const days = [];
  const today = startOfDay(new Date());
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY);
    days.push({
      date,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      scores: [],
      score: 64,
      hasData: false
    });
  }

  userMessages.forEach(m => {
    if (typeof m.at !== "number") return;
    const d = startOfDay(new Date(m.at)).getTime();
    const slot = days.find(x => x.date.getTime() === d);
    if (slot) slot.scores.push(moodScore(m.text));
  });

  days.forEach(d => {
    if (d.scores.length) {
      d.score = d.scores.reduce((a, b) => a + b, 0) / d.scores.length;
      d.hasData = true;
    }
  });

  if (demoMode) {
    DEMO.scores.forEach((s, i) => {
      days[i].score = s;
      days[i].hasData = true;
    });
  }

  const recentMoods = userMessages.slice(-10).map(m => moodScore(m.text));
  const moodIndex = recentMoods.length
    ? Math.round(recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length)
    : null;
  const shownMood = demoMode ? DEMO.mood : moodIndex;

  /* 属性雷达 */
  const AXES = [
    { label: "风", base: 92, keys: ["风"] },
    { label: "诗", base: 86, keys: ["诗", "短歌", "俳句", "歌"] },
    { label: "剑", base: 74, keys: ["剑", "刀", "战"] },
    { label: "静", base: 68, keys: ["静", "安", "夜", "睡", "雨"] },
    { label: "行", base: 80, keys: ["旅行", "路", "远方", "旅途", "走", "漂泊"] }
  ];

  const radarData = AXES.map(axis => {
    const hits = userMessages.filter(m => axis.keys.some(k => m.text.includes(k))).length;
    return { label: axis.label, value: clamp(axis.base + hits * 2, 42, 98) };
  });

  /* 话题分布 */
  const TOPICS = [
    { name: "风", keys: ["风"] },
    { name: "枫叶", keys: ["枫叶", "红叶", "落叶", "秋天", "枫"] },
    { name: "稻妻", keys: ["稻妻", "故乡", "家乡", "回家"] },
    { name: "心事", keys: ["难过", "伤心", "迷茫", "累", "孤独", "烦", "焦虑", "乱", "压力", "想哭", "不开心", "难受"] },
    { name: "短歌", keys: ["诗", "短歌", "俳句", "歌"] },
    { name: "旅途", keys: ["旅行", "旅途", "远方", "流浪", "漂泊", "路上"] },
    { name: "刀剑", keys: ["剑", "刀", "战斗", "武艺", "打怪"] },
    { name: "听雨", keys: ["雨", "雪", "听雨"] }
  ];

  const topicCounts = TOPICS.map(t => ({
    name: t.name,
    value: userMessages.filter(m => t.keys.some(k => m.text.includes(k))).length
  }));

  const hasTopicData = topicCounts.some(t => t.value > 0);
  const topicData = hasTopicData
    ? topicCounts
    : [
        { name: "风", value: 6 },
        { name: "枫叶", value: 5 },
        { name: "稻妻", value: 4 },
        { name: "心事", value: 3 },
        { name: "短歌", value: 4 },
        { name: "旅途", value: 3 },
        { name: "刀剑", value: 2 },
        { name: "听雨", value: 2 }
      ];

  /* ── 画布工具 ───────────────────────────── */
  function fit(canvas) {
    const w = Math.max(1, canvas.clientWidth || canvas.parentElement.clientWidth);
    const h = Math.max(1, canvas.clientHeight || 200);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /* ── 心情折线 ───────────────────────────── */
  function drawMood() {
    const canvas = $("#moodChart");
    if (!canvas) return;
    const { ctx, w, h } = fit(canvas);
    const pad = { l: 34, r: 14, t: 16, b: 28 };
    const pw = Math.max(1, w - pad.l - pad.r);
    const ph = Math.max(1, h - pad.t - pad.b);

    ctx.font = `10px ${F_UI}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    [0, 25, 50, 75, 100].forEach(v => {
      const y = pad.t + ph * (1 - v / 100);
      ctx.beginPath();
      ctx.strokeStyle = v === 50 ? "rgba(169,134,63,0.32)" : "rgba(169,134,63,0.16)";
      ctx.lineWidth = 1;
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(123,118,105,0.72)";
      ctx.fillText(String(v), 5, y);
    });

    const stepX = pw / (days.length - 1);
    const pts = days.map((d, i) => ({
      x: pad.l + i * stepX,
      y: pad.t + ph * (1 - d.score / 100),
      d
    }));

    // 面积渐变
    const areaGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph);
    areaGrad.addColorStop(0, "rgba(201,168,107,0.42)");
    areaGrad.addColorStop(1, "rgba(180,71,58,0)");

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const mx = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
    }
    ctx.lineTo(pts[pts.length - 1].x, pad.t + ph);
    ctx.lineTo(pts[0].x, pad.t + ph);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // 折线
    const lineGrad = ctx.createLinearGradient(pad.l, 0, w - pad.r, 0);
    lineGrad.addColorStop(0, "rgba(169,134,63,0.85)");
    lineGrad.addColorStop(1, "rgba(180,71,58,0.95)");
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const mx = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(mx, p0.y, mx, p1.y, p1.x, p1.y);
    }
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // 节点与日期
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.d.hasData ? 3.4 : 2.6, 0, Math.PI * 2);
      if (p.d.hasData) {
        ctx.fillStyle = "#c9a86b";
        ctx.fill();
        ctx.strokeStyle = "#fffdf7";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#f6efe2";
        ctx.fill();
        ctx.strokeStyle = "rgba(169,134,63,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = i === pts.length - 1 ? "rgba(169,134,63,0.95)" : "rgba(123,118,105,0.6)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(p.d.label, p.x, h - pad.b + 9);
    });
  }

  /* ── 属性雷达 ───────────────────────────── */
  function drawRadar() {
    const canvas = $("#radarChart");
    if (!canvas) return;
    const { ctx, w, h } = fit(canvas);
    const cx = w / 2;
    const cy = h / 2 + 2;
    const R = Math.min(w, h) / 2 - 34;
    const n = radarData.length;
    const start = -Math.PI / 2;
    const angleAt = i => start + (i * Math.PI * 2) / n;

    // 网格
    [0.25, 0.5, 0.75, 1].forEach(k => {
      ctx.beginPath();
      radarData.forEach((_, i) => {
        const a = angleAt(i);
        const x = cx + Math.cos(a) * R * k;
        const y = cy + Math.sin(a) * R * k;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = k === 1 ? "rgba(169,134,63,0.4)" : "rgba(169,134,63,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 轴线
    radarData.forEach((_, i) => {
      const a = angleAt(i);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = "rgba(169,134,63,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 数据面
    ctx.beginPath();
    radarData.forEach((d, i) => {
      const a = angleAt(i);
      const r = (R * d.value) / 100;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(90,169,147,0.24)";
    ctx.fill();
    ctx.strokeStyle = "rgba(90,169,147,0.85)";
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.stroke();

    // 顶点
    radarData.forEach((d, i) => {
      const a = angleAt(i);
      const r = (R * d.value) / 100;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = "#b4473a";
      ctx.fill();
    });

    // 标签
    ctx.font = `12px ${F_SERIF}`;
    ctx.textBaseline = "middle";
    radarData.forEach((d, i) => {
      const a = angleAt(i);
      const lx = cx + Math.cos(a) * (R + 16);
      const ly = cy + Math.sin(a) * (R + 16);
      const cos = Math.cos(a);
      ctx.textAlign = cos > 0.3 ? "left" : cos < -0.3 ? "right" : "center";
      ctx.fillStyle = "rgba(63,70,86,0.86)";
      ctx.fillText(d.label, lx, ly);
    });
  }

  /* ── 拾叶进度环 ─────────────────────────── */
  function drawRing() {
    const canvas = $("#ringChart");
    if (!canvas) return;
    const { ctx, w, h } = fit(canvas);
    const size = Math.min(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = size / 2 - 15;

    // 18 枚刻度
    for (let i = 0; i < TOTAL_LEAVES; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / TOTAL_LEAVES;
      const filled = i < shownLeaves;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R + 7), cy + Math.sin(a) * (R + 7));
      ctx.lineTo(cx + Math.cos(a) * (R + 11), cy + Math.sin(a) * (R + 11));
      ctx.strokeStyle = filled ? "rgba(169,134,63,0.95)" : "rgba(169,134,63,0.2)";
      ctx.lineWidth = filled ? 2 : 1.2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // 底环
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(169,134,63,0.16)";
    ctx.lineWidth = 9;
    ctx.stroke();

    // 进度
    if (shownLeaves > 0) {
      const pct = shownLeaves / TOTAL_LEAVES;
      const grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      grad.addColorStop(0, "#a9863f");
      grad.addColorStop(1, "#b4473a");
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // 中心文字
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3f4656";
    ctx.font = `600 ${Math.round(size * 0.18)}px ${F_SERIF}`;
    ctx.fillText(String(shownLeaves), cx, cy - 6);

    ctx.fillStyle = "rgba(169,134,63,0.9)";
    ctx.font = `11px ${F_UI}`;
    ctx.fillText(`/ ${TOTAL_LEAVES} 片`, cx, cy + 20);
  }

  /* ── 主题横条 ───────────────────────────── */
  function drawTopic() {
    const canvas = $("#topicChart");
    if (!canvas) return;
    const { ctx, w, h } = fit(canvas);
    const labelW = 52;
    const valueW = 26;
    const trackX = labelW;
    const trackW = Math.max(20, w - labelW - valueW - 6);
    const top = 8;
    const bottom = 6;
    const rowH = (h - top - bottom) / topicData.length;
    const max = Math.max(1, ...topicData.map(t => t.value));

    const palette = [
      ["#e2c48c", "#b4473a"],
      ["#d98d80", "#a13a2e"],
      ["#8fd0bb", "#4a8f7b"],
      ["#e6b57f", "#b06a3c"],
      ["#d9c49a", "#8a7248"],
      ["#b9cdc2", "#5b7d6d"]
    ];

    topicData.forEach((t, i) => {
      const centerY = top + rowH * i + rowH / 2;
      const barH = Math.min(10, rowH * 0.42);

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `11.5px ${F_UI}`;
      ctx.fillStyle = "rgba(63,70,86,0.8)";
      ctx.fillText(t.name, 2, centerY);

      // 轨道
      roundRect(ctx, trackX, centerY - barH / 2, trackW, barH, barH / 2);
      ctx.fillStyle = "rgba(169,134,63,0.14)";
      ctx.fill();

      // 数值条
      const len = Math.max(barH, (trackW * t.value) / max);
      const pair = palette[i % palette.length];
      const grad = ctx.createLinearGradient(trackX, 0, trackX + trackW, 0);
      grad.addColorStop(0, pair[0]);
      grad.addColorStop(1, pair[1]);
      roundRect(ctx, trackX, centerY - barH / 2, len, barH, barH / 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.textAlign = "right";
      ctx.font = `11px ${F_UI}`;
      ctx.fillStyle = "rgba(169,134,63,0.95)";
      ctx.fillText(String(t.value), w - 2, centerY);
    });
  }

  function drawAll() {
    drawMood();
    drawRadar();
    drawRing();
    drawTopic();
  }

  /* ── 概览与时间线 ───────────────────────── */
  function fillOverview() {
    const start = today.getTime();
    const todayCount = userMessages.filter(m => typeof m.at === "number" && m.at >= start).length;
    const chats = messages.some(m => typeof m.at === "number")
      ? todayCount
      : (Number(store.today) || 0);

    $("#ovChats").textContent = demoMode ? DEMO.chats : chats;
    $("#ovLeaves").textContent = shownLeaves;
    $("#ovMood").textContent = shownMood === null ? "—" : shownMood;

    if (demoMode) {
      $("#moodNote").textContent = "示例数据：七日心情用于演示，开始对话后自动换成你的曲线。";
      $("#topicNote").textContent = "示例数据：主题分布用于演示，说说你的话题后会重新统计。";
      $("#ringNote").textContent = "示例数据：九片枫叶用于演示，在对话里说一句便真实拾得一片。";
    } else {
      if (!days.some(d => d.hasData)) {
        $("#moodNote").textContent = "还没有留下对话，七日曲线暂以基线示意。";
      }
      if (!hasTopicData) {
        $("#topicNote").textContent = "尚无对话记录，暂以示意分布占位；说几句话后会自动统计。";
      }
      if (leaves >= TOTAL_LEAVES) {
        $("#ringNote").textContent = "十片已满。秋色收好了，剩下的路慢慢走。";
      }
    }

    const chip = $("#demoChip");
    if (chip) chip.hidden = !demoMode;
  }

  const DEMO_MESSAGES = [
    { role: "user", text: "今天的风有点凉，你那边呢？", ts: "20:41" },
    { role: "assistant", text: "凉一点也好。风从稻妻来，带着一点海味。", ts: "20:42" },
    { role: "user", text: "我想听你念一句短歌。", ts: "20:44" },
    { role: "assistant", text: "「风过无痕处，一叶红于水上秋，人间正微凉。」", ts: "20:44" }
  ];

  function fillTimeline() {
    const list = $("#timeline");
    if (!list) return;
    const recent = demoMode ? DEMO_MESSAGES : messages.slice(-5).reverse();

    if (!recent.length) {
      const li = document.createElement("li");
      li.className = "tl-empty";
      li.innerHTML = '还没有留下对话。<a href="chat.html">去和万叶说一句</a>，风会替你记下。';
      list.appendChild(li);
      return;
    }

    recent.forEach(m => {
      const isUser = m.role === "user";
      const li = document.createElement("li");
      li.className = `tl-item${isUser ? " is-user" : ""}`;

      const meta = document.createElement("div");
      meta.className = "tl-meta";

      const role = document.createElement("span");
      role.className = "tl-role";
      role.textContent = isUser ? "你" : "万叶";

      const time = document.createElement("span");
      let label = m.ts || "";
      if (typeof m.at === "number") {
        const d = new Date(m.at);
        label = `${d.getMonth() + 1}/${d.getDate()} ${m.ts || ""}`.trim();
      }
      if (demoMode) label = label ? `示例 · ${label}` : "示例";
      time.textContent = label;

      meta.append(role, time);

      const text = document.createElement("p");
      text.textContent = m.text || "（一张光景）";

      li.append(meta, text);
      list.appendChild(li);
    });
  }

  /* ── 听风练习 4-7-8 ─────────────────────── */
  function initBreath() {
    const circle = $("#breathCircle");
    const phaseEl = $("#breathPhase");
    const countEl = $("#breathCount");
    const toggle = $("#breathToggle");
    const reset = $("#breathReset");
    if (!circle || !toggle) return;

    const phases = [
      { key: "inhale", label: "吸气", sec: 4, scale: 1.16 },
      { key: "hold", label: "屏息", sec: 7, scale: 1.16 },
      { key: "exhale", label: "呼气", sec: 8, scale: 0.84 }
    ];

    let running = false;
    let index = 0;
    let phaseTimer = 0;
    let tickTimer = 0;
    let remain = 0;

    function enter(i) {
      const p = phases[i];
      remain = p.sec;
      circle.style.transitionDuration = p.key === "hold" ? "0.2s" : `${p.sec}s`;
      circle.style.transform = `scale(${p.scale})`;
      phaseEl.textContent = p.label;
      countEl.textContent = `${remain} 秒`;

      clearInterval(tickTimer);
      tickTimer = setInterval(() => {
        remain -= 1;
        if (remain > 0) countEl.textContent = `${remain} 秒`;
      }, 1000);

      clearTimeout(phaseTimer);
      phaseTimer = setTimeout(() => {
        if (!running) return;
        index = (index + 1) % phases.length;
        enter(index);
      }, p.sec * 1000);
    }

    function stop() {
      running = false;
      clearTimeout(phaseTimer);
      clearInterval(tickTimer);
      circle.style.transitionDuration = "0.9s";
      circle.style.transform = "scale(1)";
      phaseEl.textContent = "静";
      countEl.textContent = "备";
      toggle.textContent = "开始呼吸";
      toggle.setAttribute("aria-pressed", "false");
    }

    toggle.addEventListener("click", () => {
      if (running) {
        stop();
        return;
      }
      running = true;
      index = 0;
      toggle.textContent = "停下";
      toggle.setAttribute("aria-pressed", "true");
      enter(0);
    });

    reset.addEventListener("click", stop);
  }

  /* ── 重绘与启动 ─────────────────────────── */
  let queued = false;
  function scheduleDraw() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      drawAll();
    });
  }

  function boot() {
    const current = window.Kazuha.user.get();
    $("#journeyWho").textContent = current ? `旅人 · ${current.name}` : "旅人 · 访客";

    fillOverview();
    fillTimeline();
    drawAll();
    initBreath();

    window.addEventListener("resize", scheduleDraw, { passive: true });
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(scheduleDraw);
      ["#moodChart", "#radarChart", "#ringChart", "#topicChart"].forEach(sel => {
        const el = $(sel);
        if (el && el.parentElement) ro.observe(el.parentElement);
      });
    }
  }

  boot();
})();
