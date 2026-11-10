# 风语 · 枫原万叶

一个以《原神》角色枫原万叶为原型的互动小站：能聊天、能走剧情、能收枫叶图鉴，装到手机主屏幕或 Windows 桌面上，断网也能翻开。

原生 HTML / CSS / JavaScript 手写，无框架、无构建步骤，克隆下来双击 `index.html` 就能跑。

![首页预览](docs/preview.png)

## 里面有什么

| 页面 | 内容 |
|---|---|
| `index.html` | 首页：风起、短歌、入口卡片 |
| `chat.html` | 风语对话：接入大模型，语气与「短歌」人设一致；无 Key 时走本地台词库 |
| `story.html` | 风语剧情：Q 版立绘 + 打字机 + 选项 + 好感度 + 三种结局 + 本地存档 |
| `journey.html` | 风之旅程：时间线式的角色小传 |
| `gallery.html` | 枫叶图鉴：官方立绘、生日贺图、联动图 |
| `install.html` | 安装与离线：PWA 一键安装、Windows 桌面版、离线包 |
| `login.html` | 本地身份：起个名字，好感度与存档跟着它走 |

几个细节：

- **Q 版立绘**用官方表情包素材（透明 WebP，含动态表情），点击会换表情、换台词，点满五次有彩蛋。
- **手记与存档**全部写进 `localStorage`，不上传任何服务器。
- **图片自愈**：加载失败会自动重试两次，网络抖动不至于留下空白框。
- **离线优先**：Service Worker 预缓存骨架，页面走网络优先、媒体走缓存优先。
- **无障碍**：跳过导航、键盘可操作、动效尊重 `prefers-reduced-motion`。

## 快速开始

```bash
git clone https://github.com/<your-name>/kazuha-wind.git
cd kazuha-wind
```

直接双击 `index.html` 即可浏览（`file://` 下不注册 Service Worker，其余功能正常）。

想完整体验安装能力，需要一个本地服务器：

```bash
python -m http.server 8001
# 打开 http://127.0.0.1:8001
```

## 配置对话模型（可选）

复制一份 `js/config.local.js`（该文件已被 `.gitignore` 忽略，不会进仓库）：

```js
window.KAZUHA_CONFIG = {
  API_KEY: "sk-...",                     // 你的 Key
  BASE_URL: "https://api.deepseek.com",  // 兼容 OpenAI 协议的服务
  MODEL: "deepseek-chat"
};
```

留空时对话页会退回到内置台词库，功能不会中断。

## 装成「软件」

- **PWA**：在 `https://` 或 `localhost` 下打开 `install.html`，点「安装到设备」。安卓 Chrome、桌面 Chrome / Edge 都支持；iPhone 用 Safari 的「添加到主屏幕」。
- **Windows 桌面版**：`download/kazuha-wind-setup.exe`（约 55 MB），pywebview + WebView2 独立窗口，装到 `%LOCALAPPDATA%\Programs\FengYu`，带桌面图标、开始菜单项与卸载入口。由于体积原因，安装程序放在 [Releases](../../releases) 里。
- **离线包**：`download/kazuha-wind-offline.zip`，解压双击 `index.html`，适合拷进 U 盘。

## 目录结构

```
kazuha-wind/
├── index.html / chat.html / story.html / journey.html / gallery.html / install.html / login.html
├── css/                 每个页面一份样式，base.css 是共用骨架
├── js/
│   ├── common.js        导航、枫叶粒子、Q 版伙伴、图片重试
│   ├── chat.js          对话逻辑与本地台词库
│   ├── story.js         剧情引擎（打字机 / 选项 / 好感度 / 存档）
│   ├── story-script.js  三章脚本（改这里就能改剧情）
│   └── voice*.js        预渲染语音
├── assets/
│   ├── img/official/    官方立绘与贺图（含 SOURCES.md 素材出处）
│   ├── img/story/       Q 版表情立绘
│   └── audio/           语音与音效
├── manifest.webmanifest PWA 清单
└── sw.js                Service Worker（缓存策略）
```

## 素材与版权

角色「枫原万叶」及站内使用的官方立绘、表情、贺图，版权归 **米哈游 / HoYoverse** 所有。素材出处逐条记录在 [`assets/img/official/SOURCES.md`](assets/img/official/SOURCES.md)，未对官方图做生成式改画，仅做裁切、去透明边与压缩。

本项目为个人练习作品，**仅供学习交流，不作商业用途**。若版权方有异议，会立即删除相关素材。

## 技术栈

原生 JavaScript（ES2019+）· CSS Grid / Flex · Canvas 粒子 · Service Worker · Web App Manifest · Python 3 + pywebview + PyInstaller（仅用于打包 Windows 桌面版）
