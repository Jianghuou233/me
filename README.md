# me.s1on.wtf — Night Log

Jianghuou233 的个人观测站。与原版 `me` 页面同一份内容，换了一套更安静的视觉语言：
不再是「名片 + 便当盒链接」，而是一段自天空往下坠落的夜航日志 —— 观测者、星图、主星、回信。

纯静态：原生 HTML5 + CSS3 + ES2020，零依赖、零构建，双击 `index.html` 就能看。

---

## 结构

```
index.html     页面结构与你需要改动的文案
style.css      全部视觉：天空相位、星野、排版、响应式
script.js      CONFIG 在文件顶部，其余是星空、时钟、复制、彩蛋
images/
  avatar.webp  头像（640×640）
CNAME          me.s1on.wtf —— GitHub Pages 自定义域名
.nojekyll      跳过 Jekyll 处理
```

## 四个章节

- **00 / Hero** — 观测者。巨大的名字、日文别名、镜头式头像（环轨 + 扫描线）、实时 CST 时钟。
- **01 / 关于这个信号** — 一段引文、两段自述、一张档案数据表。天空转为暮色。
- **02 / 散落的星图** — B 站、网易云、卡饭、GitHub 四颗星；进入视野时，连线会沿着卡片之间的空隙自动画出来。
- **03 / 主星** — s1on.wtf 纪念站。37 / 19 / 34 三个数字会在滚动到时自增。
- **04 / 回信** — 邮箱一键复制（带降级方案）与直接发信。天空变为最初的晨光。
- **Footer** — 域名、托管信息、以及一句「没有奇迹了，但有星。」

## 交互

- 全屏 Canvas 星野：视差、闪烁、偶发流星；指针移动会轻微拖动星层。
- 天空随章节切换相位（deep → dusk → night → ember → dawn），2.4s 交叉淡入。
- 滚动进度线、导航高亮、章节大字视差、内容逐段浮现。
- 点击任意位置会溅起几颗金色小星；**偶发**（约 22%）还会飘出一句 `Ciallo～(∠・ω< )⌒★` —— 原站彩蛋的克制版，概率在 `CONFIG.cialloChance` 里调。
- 自定义光标光环（仅精确指针设备）；触屏与 `prefers-reduced-motion` 下自动禁用。

## 改内容

文案全在 `index.html`，改文字不会影响布局。需要改的通常是：

| 想改什么 | 改哪里 |
| --- | --- |
| 邮箱、时区、彩蛋概率 | `script.js` 顶部 `CONFIG` |
| 各平台链接 / UID | `index.html` 里 `.star__card` 的 `href` 与 `.star__meta` |
| 主星数字（37 / 19 / 34） | `.primary__stats` 的 `data-count` 与文本 |
| 头像 | 替换 `images/avatar.webp`，保持 1:1 |
| 天空颜色 | `style.css` 的 `.sky__layer--*` 五个渐变 |

## 部署

已按 GitHub Pages 根目录部署配置好：

1. 把整个目录推到仓库根目录（`index.html` 在最外层）。
2. Settings → Pages → Deploy from a branch → `main` / `root`。
3. 仓库里的 `CNAME` 会把它绑定到 `me.s1on.wtf`；若域名不同，改这一行即可。

没有构建步骤，也没有需要安装的依赖。

## 无障碍与兼容

- 语义标题层级、Skip Link、可见焦点环、`aria-hidden` 装饰层、`aria-live` 复制提示。
- 键盘可完整浏览；链接与按钮均有可读名称。
- 支持 `prefers-reduced-motion`（关闭星野动画、视差、光标、彩蛋）、`prefers-contrast: more`、打印样式。
- 无 JS 时内容依旧可见（`html.js` 才会触发浮现动画，另备 `@media (scripting: none)` 兜底）。
- 未引入任何外部字体或 CDN，离线可开。

---

*个人页面，非商业。`eden*`、其角色、CG 与音乐版权归 minori 及各自权利人所有；站内引用仅作纪念之用。*
