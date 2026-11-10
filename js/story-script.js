/* ─────────────────────────────────────────────
   风语 · 剧情脚本（Q 版 · 好感度分支）
   三章短篇：月下船头 / 白猫与枫 / 红叶林
   素材：官方 Q 版表情包 + 官方 CG
   选项 aff = 好感度增量；结局按总好感度分流
   ───────────────────────────────────────────── */

window.KAZUHA_STORY = {
  title: "风之章",
  subtitle: "三段与风有关的小事",
  maxAff: 12,
  chapters: [
    {
      id: "moon",
      label: "第一章 · 月下船头",
      bg: "assets/img/official/pv-moonlit-deck.jpg",
      beats: [
        { t: "narr", text: "夜海很静。月亮挂在帆边，像一枚没写完的句号。" },
        { t: "say", who: "万叶", emo: "含笑", text: "睡不着？船头的风比舱里干净，就是有点凉。" },
        { t: "say", who: "万叶", emo: "温柔", text: "过来些。我这边背风。" },
        {
          t: "choice",
          prompt: "你要——",
          options: [
            {
              label: "往他那边挪一点",
              aff: 2,
              then: [
                { t: "narr", text: "你把肩膀挪过去，衣袖擦到了他的衣袖。" },
                { t: "say", who: "万叶", emo: "害羞", text: "……嗯。这样就吹不到你了。" }
              ]
            },
            {
              label: "先嘴硬说不冷",
              aff: 1,
              then: [
                { t: "say", who: "万叶", emo: "含笑", text: "嘴硬的人，耳朵总是先冷。" },
                { t: "narr", text: "他笑着把衣领立起来，替你挡了半边风。" }
              ]
            }
          ]
        },
        { t: "say", who: "万叶", emo: "平静", text: "今晚的月亮值一整首诗。可惜我只带了一半的句子。" },
        {
          t: "choice",
          prompt: "你说",
          options: [
            {
              label: "那另一半呢？",
              aff: 2,
              then: [
                { t: "say", who: "万叶", emo: "怅然", text: "另一半得有人接。你要是愿意，就当接住了。" }
              ]
            },
            {
              label: "我帮你补上",
              aff: 1,
              then: [
                { t: "say", who: "万叶", emo: "含笑", text: "那我可要挑剔了。押韵可以不讲，风得讲。" }
              ]
            }
          ]
        },
        { t: "say", who: "万叶", emo: "温柔", text: "……其实不必补。你在这儿，句子自己就圆了。" }
      ]
    },
    {
      id: "cat",
      label: "第二章 · 白猫与枫",
      bg: "assets/img/official/birthday-2025.jpg",
      beats: [
        { t: "narr", text: "午后的院子很暖。白猫窝在他怀里，尾巴尖扫过一片枫叶。" },
        { t: "say", who: "万叶", emo: "含笑", text: "它不认生。大概是闻到了风的味道。" },
        {
          t: "choice",
          prompt: "你要",
          options: [
            {
              label: "伸手摸摸猫",
              aff: 1,
              then: [
                { t: "say", who: "万叶", emo: "温柔", text: "小心，它会记住你的手。下次见面，它会自己走过来。" }
              ]
            },
            {
              label: "去戳他的发梢",
              aff: 2,
              then: [
                { t: "say", who: "万叶", emo: "害羞", text: "……别闹。枫叶会掉进我眼睛里。" },
                { t: "narr", text: "他这么说，却一点也没躲。" }
              ]
            }
          ]
        },
        { t: "say", who: "万叶", emo: "平静", text: "有些相遇不需要理由。就像它挑了这个下午，挑了这棵树，挑了我。" },
        {
          t: "choice",
          prompt: "你说",
          options: [
            {
              label: "那我也挑对了？",
              aff: 2,
              then: [
                { t: "say", who: "万叶", emo: "含笑", text: "你挑了一个好天气。" },
                { t: "say", who: "万叶", emo: "怅然", text: "而我挑了一个愿意听的人。" }
              ]
            },
            {
              label: "猫可比你放松",
              aff: 1,
              then: [
                { t: "say", who: "万叶", emo: "含笑", text: "它敢。我还在等风给个许可。" }
              ]
            }
          ]
        },
        { t: "say", who: "万叶", emo: "温柔", text: "下次它再睡过来，你也来。位置够两个人。" }
      ]
    },
    {
      id: "maple",
      label: "第三章 · 红叶林",
      bg: "assets/img/official/pv-red-maple-fight.jpg",
      beats: [
        { t: "narr", text: "红叶林里，刀光比风更快。叶子被削落，在半空里转了个身。" },
        { t: "say", who: "万叶", emo: "认真", text: "退后一点。这里的风，带着铁的味道。" },
        {
          t: "choice",
          prompt: "你决定",
          options: [
            {
              label: "并肩",
              aff: 2,
              then: [
                { t: "say", who: "万叶", emo: "含笑", text: "好。左边归你，右边归我。" },
                { t: "say", who: "万叶", emo: "认真", text: "记住，别追。让他们撞上你的刀。" }
              ]
            },
            {
              label: "乖乖退后",
              aff: 0,
              then: [
                { t: "say", who: "万叶", emo: "平静", text: "聪明。看好了，我只演一次。" }
              ]
            }
          ]
        },
        { t: "narr", text: "他踏前半步，剑光贴着风走。红叶落下来时，两半都还是完整的。" },
        { t: "say", who: "万叶", emo: "平静", text: "收刀。风停了。" },
        {
          t: "choice",
          prompt: "你",
          options: [
            {
              label: "替他拣一片红叶",
              aff: 2,
              then: [
                { t: "say", who: "万叶", emo: "害羞", text: "……谢谢。这片得收好，不然对不起它。" }
              ]
            },
            {
              label: "先看他有没有受伤",
              aff: 0,
              then: [
                { t: "say", who: "万叶", emo: "温柔", text: "没有。你抓我袖子的力气，比刀稳。" }
              ]
            }
          ]
        },
        { t: "say", who: "万叶", emo: "含笑", text: "走吧。前面还有路，路的尽头有海。" },
        { t: "say", who: "万叶", emo: "怅然", text: "有些地方，去过一次就够了。但风会记得。" }
      ]
    }
  ],
  endings: [
    {
      min: 8,
      title: "风停在你的肩上",
      text: "好感度满得快要溢出来。他把外套留给了你，说海上的夜还长——反正明晚，还是同一片风。",
      actions: [
        { label: "再走一遍", href: "story.html" },
        { label: "去和他聊聊", href: "chat.html" }
      ]
    },
    {
      min: 0,
      title: "风会记得",
      text: "三章走完。风不会替人留住什么，但它会记得你来过。也许下一次，你会走得更近一点。",
      actions: [
        { label: "再试一次", href: "story.html" },
        { label: "去和他聊聊", href: "chat.html" }
      ]
    }
  ]
};
