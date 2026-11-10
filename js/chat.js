/* ─────────────────────────────────────────────
   风语对话 — 关键词回复 / 诗意简洁 / 发图
   本地演示：脚本化回复，不连接真实模型
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORE_KEY = "kazuha.wind.session.v1";

  /* ── 大模型配置（js/config.local.js，进 .gitignore） ── */
  const CFG = window.KAZUHA_CONFIG || {};
  const ENGINE = {
    key: String(CFG.API_KEY || "").trim(),
    base: String(CFG.BASE_URL || "https://api.deepseek.com").replace(/\/+$/, ""),
    model: String(CFG.MODEL || "deepseek-chat"),
    online: String(CFG.API_KEY || "").trim().length > 0
  };

  const PERSONA = [
    "你是《原神》中的角色「枫原万叶」，稻妻浪人武士，风元素，擅使单手剑。",
    "你说话温和、克制、有分寸，习惯用风、枫叶、旅途、短歌作比，但从不故弄玄虚。",
    "称呼对方为「旅人」或「你」。不主动提及自己是 AI、模型或程序。",
    "不要复述设定资料，不要写大段说明；不堆砌辞藻，不写小作文标题。",
    "回答控制在 120 字以内，必要时可分 2 至 3 个短段。"
  ].join("\n");

  /* ── 拾遗图集（用于右侧预览与图鉴跳转） ── */
  const GALLERY = [
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

  /* ── 回复库 ─────────────────────────────── */
  const POEM = "《风与叶》\n\n风过无痕处，\n一叶红于水上秋，\n人间正微凉。\n\n——若不合心意，我可以再写一首。";

  const REPLIES = [
    {
      keys: ["你好", "您好", "嗨", "hi", "hello", "在吗", "在么", "早上好", "晚上好"],
      poetic: "风带来了你的声音，旅人。\n\n我是枫原万叶。若你不急着赶路，不妨在这里坐一会儿——说说此刻的风，或者此刻的你。",
      plain: "你好，我是枫原万叶。有什么想聊的？"
    },
    {
      keys: ["你是谁", "介绍", "万叶", "名字", "身份", "认识一下"],
      poetic: "浪人武士，枫原万叶。\n\n曾行走于稻妻的雨中，如今随友人的船漂泊四方。我以风为耳，以叶为记——你若愿意，我便把一路听见的故事说给你听。",
      plain: "枫原万叶，浪人武士，风元素。喜欢枫叶、短歌和安静的风。"
    },
    {
      keys: ["风", "wind", "天气"],
      poetic: "风没有形状，却能吹动整片枫林。\n\n人心也是如此——看不见，却足以让一个人走向很远的地方。",
      plain: "风是自由的意思，也是我听见世界的方式。"
    },
    {
      keys: ["剑", "刀", "战斗", "打架", "打怪", "武艺"],
      poetic: "刀剑是不得已的语言。\n\n若可以，我更愿意让风替我说话——它从不伤人，却能让对面的刀，先停下来。",
      plain: "我练剑，但不喜欢无谓的争斗。"
    },
    {
      keys: ["稻妻", "故乡", "回家", "家乡"],
      poetic: "稻妻的雨很细，落在瓦上几乎无声；枫叶却红得张扬。\n\n我离开那里很久了，但每逢起风，还是能听见故乡的潮声。",
      plain: "稻妻是我出生、也离开的地方。那里的枫叶很好看。"
    },
    {
      keys: ["枫叶", "叶子", "秋天", "红叶", "落叶"],
      poetic: "枫叶落下时并不急着落地，总要先绕一个弯。\n\n人生大约也是这样——绕远的那段路，往往藏着更好的风景。",
      plain: "枫叶是很会讲故事的东西。"
    },
    {
      keys: ["诗", "短歌", "写诗", "作诗", "俳句", "文采"],
      poetic: POEM,
      plain: "风过无痕处，一叶红于水上秋，人间正微凉。"
    },
    {
      keys: ["旅行", "旅途", "远方", "流浪", "漂泊", "路上"],
      poetic: "旅途的意义不在抵达，而在沿途那些不经意的停留。\n\n我见过雨夜的港口、山间的雾，也见过陌生人为我留的一盏灯。",
      plain: "我一直在路上。下一站还没定。"
    },
    {
      keys: ["朋友", "友人", "同行", "伙伴", "同伴"],
      poetic: "有人愿意同行一段，已是难得。\n\n风会把我们吹散，也会在某个拐角，把我们重新吹到一起。",
      plain: "朋友是很重要的人。"
    },
    {
      keys: ["难过", "伤心", "迷茫", "累", "孤独", "烦", "焦虑", "乱", "压力", "想哭", "不开心", "怎么办", "难受"],
      poetic: "风会停，雨也会停。此刻觉得过不去的，多半会在某个清晨变得很轻。\n\n若你愿意，我陪你站一会儿——什么也不说，也可以。",
      plain: "慢慢来。风会带你走出去的。"
    },
    {
      keys: ["谢谢", "感谢", "多谢", "thanks"],
      poetic: "不必谢。风把话带到了，而我恰好在这里听见。",
      plain: "不客气。"
    },
    {
      keys: ["晚安", "再见", "告辞", "拜拜", "睡觉"],
      poetic: "晚安。愿你梦里有风，有红叶，也有不被打扰的安静。",
      plain: "晚安，路上小心。"
    },
    {
      keys: ["猫", "猫猫", "小动物"],
      poetic: "那小家伙总在我练剑时卧在刀鞘上，毛上落了一片枫叶，也不肯动。\n\n大概它也觉得，风停的时候最适合睡觉。",
      plain: "我喜欢猫，它们懂得如何安静地陪着人。"
    },
    {
      keys: ["吃什么", "吃饭", "饿", "美食", "烤鱼"],
      poetic: "粗茶淡饭就好，浪人不能挑食。\n\n不过烤鱼——若有的话，我确实会多看一眼。",
      plain: "烤鱼不错。简单的食物最可靠。"
    },
    {
      keys: ["喜欢", "爱", "心动"],
      poetic: "若你问风喜欢什么，它大概喜欢自由；若问我，我喜欢此刻的安静。\n\n还有，愿意听我说话的人。",
      plain: "我喜欢安静的风，和愿意听我说话的人。"
    },
    {
      keys: ["能做什么", "功能", "帮助", "怎么用", "会什么", "你可以"],
      poetic: "我可以陪你聊天，替你写短歌，讲一路的见闻，也愿意听你把心事说完。\n\n风从哪里来，我便从哪里答。",
      plain: "我可以聊天、写短歌、讲见闻。"
    },
    {
      keys: ["雨", "下雨"],
      poetic: "若下雨，就把刀收进鞘里，找处屋檐坐着听。\n\n雨声，比剑声好听。",
      plain: "听雨也很好。"
    },
    {
      keys: ["枫原", "姓"],
      poetic: "枫原，是我曾经的家名。\n\n如今它只是一枚旧印，别在旅途的行囊上——提醒我从哪里来，却不必回到哪里去。",
      plain: "枫原是我旧日的家名。"
    },
    {
      keys: ["茶", "酒", "煮茶", "清酒", "喝一杯"],
      poetic: "茶要等水凉一点再冲，酒要等风停一点再饮。\n\n急不得。好东西都藏在“等一等”里。",
      plain: "茶和酒都好，别急，慢慢喝。"
    },
    {
      keys: ["琴", "弹琴", "音乐", "唱歌", "曲子", "旋律"],
      poetic: "我弹得不算好，只是喜欢在起风的夜里拨几下。\n\n有没有人听不重要——琴声本来就是说给风听的。",
      plain: "我会弹一点琴，不太熟练。"
    },
    {
      keys: ["雪", "冬天", "寒冬", "下雪"],
      poetic: "稻妻少雪。第一次见雪是在北边的山里，白得让人不敢落脚。\n\n那时才知道，安静也可以有重量。",
      plain: "雪很美，也很安静。"
    },
    {
      keys: ["月亮", "月色", "月光", "月夜", "赏月"],
      poetic: "月亮不解释自己为什么圆缺。\n\n它只是照着，照着赶路的人，也照着我这样的浪人。",
      plain: "月亮很亮，适合赶路。"
    },
    {
      keys: ["星星", "星空", "星辰", "银河"],
      poetic: "在海上值夜时，星星是我唯一的地址。\n\n看得久了会发现，它们也在慢慢走——和我们一样，没有真正的归处，只有方向。",
      plain: "夜里看星星，能看清方向。"
    },
    {
      keys: ["海", "船", "潮", "港口", "浪"],
      poetic: "海从不催人。它只是把船推远，再推回来。\n\n我在船上学会一件事：着急的时候，先看看潮水。",
      plain: "海和船，是我最熟悉的地方。"
    },
    {
      keys: ["花", "樱花", "蒲公英", "梅花"],
      poetic: "花开花落都不打招呼。\n\n所以看见的时候就该多看一会儿——下一次路过，未必还是这一朵。",
      plain: "花很好看，开得也短。"
    },
    {
      keys: ["时间", "四季", "岁月", "流年", "季节"],
      poetic: "四季是风的四种说法。\n\n春说“等等”，夏说“去吧”，秋说“记得”，冬说“别怕”。我都听过。",
      plain: "四季轮着来，风也换着说话。"
    },
    {
      keys: ["离别", "想念", "思念", "舍不得", "离开"],
      poetic: "离别不必说得太重。\n\n把该说的话说完，把该看的看一眼，然后转身走——风会把没说完的部分，替我送到。",
      plain: "离别难免，记得就好。"
    },
    {
      keys: ["祝福", "平安", "好运", "顺利", "保重"],
      poetic: "愿你此去风顺，遇桥过桥，遇雨有檐。\n\n若哪天真走累了，记得风里还有一处枫树下的位置，是留给你的。",
      plain: "愿你一路顺风，平安就好。"
    }
  ];

  const FALLBACKS = [
    "风刚才掠过，像是有什么话没说完。\n\n你可以再说一点吗？我想听。",
    "这个我还没想明白。不如换个话题——比如，你今天见过最好的光，是什么样子？",
    "嗯……让我想想。\n\n若一时没有答案，也不必着急。叶子也要绕一个弯，才肯落地。",
    "我听见了，只是还没找到合适的话。\n\n有些事需要先在心里过一遍风，才说得清。",
    "这话我先记下行囊里。\n\n旅途还长，说不定哪一天，我们会在别的路口把它想明白。"
  ];

  const PLAIN_FALLBACKS = [
    "再说一点吧，我想听。",
    "嗯，这个我还没想明白。换个话题？",
    "不急，叶子也要绕一个弯才落地。",
    "我记下了，慢慢想。",
    "这个我先收着，路上再想。"
  ];

  const WELCOME = "风带来了你的声音。\n\n我是枫原万叶。旅途漫长，若你不急着赶路，便在这里坐一会儿吧——说说此刻的风，或者此刻的你。";

  /* ── 状态 ───────────────────────────────── */
  const state = {
    mode: "poetic",
    messages: [],
    today: 0,
    leaves: 0,
    busy: false,
    fallbackIndex: 0
  };

  let pendingClip = null;
  let pendingText = null;

  const els = {
    messages: $("#messages"),
    input: $("#input"),
    composer: $("#composer"),
    send: $(".send-btn"),
    chatStatus: $("#chatStatus"),
    statToday: $("#statToday"),
    statLeaves: $("#statLeaves"),
    gallery: $("#gallery"),
    galleryCount: $("#galleryCount"),
    fileInput: $("#fileInput"),
    guestHint: $("#guestHint"),
    engineNote: $("#engineNote")
  };

  const now = () => {
    const d = new Date();
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const dayStart = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

  const scrollDown = (smooth = true) => {
    els.messages.scrollTo({
      top: els.messages.scrollHeight,
      behavior: smooth && !reduceMotion ? "smooth" : "auto"
    });
  };

  /* ── 持久化 ─────────────────────────────── */
  function save() {
    try {
      const data = {
        mode: state.mode,
        today: state.today,
        leaves: state.leaves,
        todayDate: new Date().toDateString(),
        messages: state.messages.slice(-40).map(m => ({ role: m.role, text: m.text, ts: m.ts, at: m.at, clip: m.clip }))
      };
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) { /* 存储不可用时静默降级 */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.messages) || !data.messages.length) return false;
      state.mode = data.mode === "plain" ? "plain" : "poetic";
      state.today = Number(data.today) || 0;
      state.leaves = Number(data.leaves) || 0;
      state.messages = data.messages.filter(m => m && m.role && typeof m.text === "string");
      return state.messages.length > 0;
    } catch (e) {
      return false;
    }
  }

  /* 今日对话：以消息时间戳为准，旧数据回退到计数 */
  function countToday() {
    const hasAt = state.messages.some(m => typeof m.at === "number");
    if (!hasAt) return state.today;
    const start = dayStart();
    return state.messages.filter(m => m.role === "user" && typeof m.at === "number" && m.at >= start).length;
  }

  /* ── 消息渲染 ───────────────────────────── */
  function messageEl(msg) {
    const wrap = document.createElement("div");
    wrap.className = `msg ${msg.role}`;

    if (msg.role === "assistant") {
      const ava = document.createElement("div");
      ava.className = "msg-ava";
      const img = document.createElement("img");
      img.src = "assets/img/avatar.jpg?v=1";
      img.alt = "";
      ava.appendChild(img);
      wrap.appendChild(ava);
    }

    const body = document.createElement("div");
    body.className = "msg-body";

    if (msg.img) {
      const pic = document.createElement("img");
      pic.className = "msg-img";
      pic.src = msg.img;
      pic.alt = "你分享的图片";
      body.appendChild(pic);
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (msg.text) bubble.textContent = msg.text;
    body.appendChild(bubble);

    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = msg.ts || now();
    body.appendChild(time);

    if (msg.role === "assistant" && msg.text && msg.clip) addVoiceButton(body, msg.clip, msg.text);

    wrap.appendChild(body);
    return { wrap, bubble };
  }

  /* 官方原声：每类话题对应一句已录音的中文台词 */
  function clipForText(text) {
    const lower = String(text || "").toLowerCase();
    const idx = REPLIES.findIndex(r => r.keys.some(k => lower.includes(k.toLowerCase())));
    const lines = window.KazuhaLines;
    if (!lines) return null;
    return (idx >= 0 && lines.replies[idx]) || lines.fallback || null;
  }

  function addVoiceButton(body, clipId, sayText) {
    const lines = window.KazuhaLines;
    const clip = lines && lines.byId && lines.byId[clipId];
    if (!clip) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "speak-btn";
    btn.dataset.clip = clipId;
    if (sayText) btn.dataset.say = sayText;
    btn.innerHTML = `<i aria-hidden="true"></i><span>万叶的声音</span>`;
    const quote = document.createElement("p");
    quote.className = "voice-quote";
    quote.textContent = `「${clip.text}」`;
    body.append(btn, quote);
  }

  function playPending() {
    if (!pendingClip || !window.KazuhaVoice || !window.KazuhaVoice.enabled) return;
    const last = els.messages.querySelector(".msg.assistant:last-of-type .speak-btn");
    if (pendingText && window.KazuhaVoice.speak) window.KazuhaVoice.speak(pendingText, pendingClip, last);
    else window.KazuhaVoice.playClip(pendingClip, last);
  }

  function appendMessage(msg, { stream = false, silent = false } = {}) {
    const { wrap, bubble } = messageEl(msg);
    els.messages.appendChild(wrap);
    if (!silent) scrollDown();

    if (stream && msg.role === "assistant" && !reduceMotion) {
      streamText(bubble, msg.text);
    }
    return wrap;
  }

  function streamText(el, text) {
    el.textContent = "";
    const textNode = document.createTextNode("");
    const caret = document.createElement("span");
    caret.className = "caret";
    el.append(textNode, caret);
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      textNode.nodeValue = text.slice(0, i);
      scrollDown(false);
      if (i >= text.length) {
        clearInterval(timer);
        caret.remove();
        scrollDown();
      }
    }, 26);
  }

  function typingEl() {
    const wrap = document.createElement("div");
    wrap.className = "msg assistant typing";
    wrap.innerHTML = `
      <div class="msg-ava"><img src="assets/img/avatar.jpg?v=1" alt=""></div>
      <div class="msg-body"><div class="bubble"><i></i><i></i><i></i></div></div>`;
    return wrap;
  }

  function sysEl(text) {
    const el = document.createElement("div");
    el.className = "sys-msg";
    el.textContent = text;
    return el;
  }

  function renderAll() {
    els.messages.replaceChildren();
    els.messages.appendChild(sysEl(ENGINE.online
      ? `已接入 ${ENGINE.model} · 万叶在此`
      : "本地演示模式 · 未接入模型"));
    state.messages.forEach(m => appendMessage(m, { silent: true }));
    syncStats();
    scrollDown(false);
  }

  /* ── 统计与状态文案 ──────────────────────── */
  function syncStats() {
    els.statToday.textContent = state.today;
    els.statLeaves.textContent = state.leaves;
  }

  function setStatus(text) {
    els.chatStatus.textContent = text;
  }

  /* ── 对话逻辑 ───────────────────────────── */
  function pickReply(text) {
    const lower = text.toLowerCase();
    const hit = REPLIES.find(r => r.keys.some(k => lower.includes(k.toLowerCase())));
    if (hit) return state.mode === "plain" ? hit.plain : hit.poetic;

    if (state.mode === "plain") {
      return PLAIN_FALLBACKS[state.fallbackIndex++ % PLAIN_FALLBACKS.length];
    }
    return FALLBACKS[state.fallbackIndex++ % FALLBACKS.length];
  }

  function send(text, img) {
    const clean = (text || "").trim();
    if ((!clean && !img) || state.busy) return;

    const msg = { role: "user", text: clean, img, ts: now(), at: Date.now() };
    state.messages.push(msg);
    appendMessage(msg);

    pendingClip = img ? null : clipForText(clean);

    state.today += 1;
    state.leaves = Math.min(10, state.leaves + 1);
    syncStats();
    save();

    if (img) {
      respondLocal(state.mode === "plain"
        ? "这张光景很好。我收下了。"
        : "很好的一张光景。风把它送来，我便收下了。\n\n若你愿意，也可以讲讲它背后的故事。");
      setStatus("正在听风……");
      return;
    }

    if (ENGINE.online) {
      respondRemote();
    } else {
      respondLocal(pickReply(clean));
      setStatus("正在听风……");
    }
  }

  function lockUI(on) {
    state.busy = on;
    els.send.disabled = on;
    els.input.disabled = on;
  }

  function finishReply() {
    lockUI(false);
    setStatus("在枫树下等你");
    save();
    els.input.focus({ preventScroll: true });
    if (state.messages.length > 40) state.messages = state.messages.slice(-40);
  }

  /* ── 本地脚本回复（无 Key 或发图时） ─────── */
  function respondLocal(text) {
    lockUI(true);

    const typing = typingEl();
    els.messages.appendChild(typing);
    scrollDown();

    const delay = reduceMotion ? 120 : 520 + Math.random() * 420;

    setTimeout(() => {
      typing.remove();
      pendingText = text;
      const msg = { role: "assistant", text, ts: now(), at: Date.now(), clip: pendingClip };
      state.messages.push(msg);

      const wrap = appendMessage(msg, { stream: true });

      if (reduceMotion) {
        playPending();
        finishReply();
        return;
      }

      const check = setInterval(() => {
        if (wrap.querySelector(".caret") === null) {
          clearInterval(check);
          playPending();
          finishReply();
        }
      }, 80);
    }, delay);
  }

  /* ── 大模型流式回复 ─────────────────────── */
  function buildHistory() {
    const modeRule = state.mode === "plain"
      ? "这一条请用简洁口语回答，一句话说清，不超过 40 字。"
      : "这一条请保持诗意，但不要冗长，不写标题、不列清单。";

    const list = [{ role: "system", content: `${PERSONA}\n${modeRule}` }];
    state.messages
      .filter(m => typeof m.text === "string" && m.text.trim() && !m.img)
      .slice(-12)
      .forEach(m => list.push({ role: m.role, content: m.text }));
    return list;
  }

  function assistantShell() {
    const wrap = document.createElement("div");
    wrap.className = "msg assistant";

    const ava = document.createElement("div");
    ava.className = "msg-ava";
    const img = document.createElement("img");
    img.src = "assets/img/avatar.jpg?v=1";
    img.alt = "";
    ava.appendChild(img);

    const body = document.createElement("div");
    body.className = "msg-body";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = now();

    body.append(bubble, time);
    wrap.append(ava, body);
    return { wrap, bubble, time };
  }

  async function readStream(res, onDelta, signal) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done || signal.aborted) break;
      buf += decoder.decode(value, { stream: true });

      let cut;
      while ((cut = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, cut).trim();
        buf = buf.slice(cut + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const obj = JSON.parse(payload);
          const delta = obj.choices && obj.choices[0] && obj.choices[0].delta;
          if (delta && delta.content) onDelta(delta.content);
        } catch (e) { /* 跳过不完整分片 */ }
      }
    }
  }

  function explainError(err) {
    const raw = String((err && err.message) || err || "");
    if (raw.includes("401")) return "API Key 无效，请检查 js/config.local.js";
    if (raw.includes("402")) return "账户余额不足，风暂时过不来";
    if (raw.includes("429")) return "说得太急，稍等片刻";
    if (raw.includes("403")) return "这个 Key 没有该模型权限";
    if (raw.includes("abort")) return "等得太久，连接已收线";
    if (raw.includes("Failed to fetch") || raw.includes("NetworkError")) return "网络不通，或请求被浏览器拦住";
    return `连接失败：${raw.slice(0, 80)}`;
  }

  async function respondRemote() {
    lockUI(true);
    setStatus(ENGINE.online ? "风正在赶来……" : "正在听风……");

    const typing = typingEl();
    els.messages.appendChild(typing);
    scrollDown();

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);

    let shell = null;
    let acc = "";
    let raf = 0;

    const paint = () => {
      raf = 0;
      if (shell) {
        shell.bubble.textContent = acc;
        scrollDown(false);
      }
    };

    try {
      const res = await fetch(`${ENGINE.base}/chat/completions`, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENGINE.key}`
        },
        body: JSON.stringify({
          model: ENGINE.model,
          messages: buildHistory(),
          stream: true,
          temperature: state.mode === "plain" ? 0.6 : 0.9,
          max_tokens: 400
        })
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`${res.status} ${detail.slice(0, 120)}`);
      }

      await readStream(res, delta => {
        if (!shell) {
          typing.remove();
          shell = assistantShell();
          els.messages.appendChild(shell.wrap);
        }
        acc += delta;
        if (!raf) raf = requestAnimationFrame(paint);
      }, ctrl.signal);

      clearTimeout(timer);
      typing.remove();

      const finalText = acc.trim() ? acc.trim() : "风只送来了沉默。（模型没有返回内容，可以再说一次。）";

      if (!shell) {
        shell = assistantShell();
        els.messages.appendChild(shell.wrap);
        shell.bubble.textContent = finalText;
      } else {
        shell.bubble.textContent = finalText;
      }

      pendingText = finalText;
      const msg = { role: "assistant", text: finalText, ts: now(), at: Date.now(), clip: pendingClip };
      state.messages.push(msg);
      addVoiceButton(shell.wrap.querySelector(".msg-body"), pendingClip, finalText);
      scrollDown();
      playPending();
      finishReply();
    } catch (err) {
      clearTimeout(timer);
      typing.remove();
      if (shell) {
        if (acc.trim()) {
          shell.bubble.textContent = `${acc.trim()}\n\n（风断了，剩下的没来得及说完。）`;
        } else {
          shell.wrap.remove();
        }
      }
      const reason = explainError(err);
      els.messages.appendChild(sysEl(`风被挡住了：${reason}`));
      setStatus("风暂时停了");
      lockUI(false);
      if (window.Kazuha) window.Kazuha.toast(reason);
      scrollDown();
    }
  }

  /* ── 输入区 ─────────────────────────────── */
  function autoGrow() {
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(els.input.scrollHeight, 128)}px`;
  }

  els.input.addEventListener("input", autoGrow);

  els.composer.addEventListener("submit", e => {
    e.preventDefault();
    const text = els.input.value;
    if (!text.trim()) return;
    els.input.value = "";
    autoGrow();
    send(text);
  });

  els.input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      els.composer.requestSubmit();
    }
  });

  $$(".suggest button").forEach(btn => {
    btn.addEventListener("click", () => send(btn.dataset.say));
  });

  $("#btnPoem").addEventListener("click", () => {
    if (state.busy) return;
    send("替我写一首短歌");
  });

  $("#btnClear").addEventListener("click", () => {
    if (state.busy) return;
    if (window.KazuhaVoice) window.KazuhaVoice.stop();
    state.today = 0;
    state.leaves = 0;
    state.messages = [{ role: "assistant", text: WELCOME, ts: now(), at: Date.now() }];
    save();
    renderAll();
    setStatus("在枫树下等你");
    els.input.focus({ preventScroll: true });
  });

  els.fileInput.addEventListener("change", () => {
    const file = els.fileInput.files && els.fileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    send("这张光景，给你看看。", url);
    els.fileInput.value = "";
  });

  $("#btnAttach").addEventListener("click", () => els.fileInput.click());

  $$(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode === "plain" ? "plain" : "poetic";
      $$(".seg-btn").forEach(b => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      save();
      setStatus(state.mode === "poetic" ? "正在斟酌字句……" : "在枫树下等你");
      setTimeout(() => setStatus("在枫树下等你"), 1400);
    });
  });

  /* ── 右侧拾遗预览（点击进图鉴） ─────────── */
  function buildRail() {
    els.galleryCount.textContent = GALLERY.length;
    GALLERY.slice(0, 6).forEach((item, i) => {
      const link = document.createElement("a");
      link.className = "thumb";
      link.href = `gallery.html#${item.id}`;
      link.setAttribute("aria-label", `在枫叶图鉴中查看：${item.title}`);
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.title;
      img.loading = i < 2 ? "eager" : "lazy";
      const label = document.createElement("span");
      label.textContent = item.title;
      link.append(img, label);
      els.gallery.appendChild(link);
    });
  }

  /* ── 启动 ───────────────────────────────── */
  function boot() {
    buildRail();

    if (els.engineNote) {
      els.engineNote.textContent = ENGINE.online
        ? `已接入 ${ENGINE.model} · 流式回复`
        : "本地演示模式 · 填入 API Key 后接入大模型";
    }

    if (els.guestHint && !window.Kazuha.user.get()) {
      els.guestHint.hidden = false;
    }

    const restored = load();
    state.today = countToday();

    $$(".seg-btn").forEach(b => {
      const on = b.dataset.mode === state.mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    if (restored) {
      renderAll();
    } else {
      const greeting = { role: "assistant", text: WELCOME, ts: now(), at: Date.now() };
      state.messages.push(greeting);
      renderAll();
      save();
    }

    syncStats();
    els.input.focus({ preventScroll: true });
  }

  boot();
})();
