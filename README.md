# multi-note-skill 3.2.0

把学习材料或会议记录整理成**单文件、离线、可打印**的 HTML 笔记，并保留可携带的学习状态（目标、作答、掌握度、复习节奏）。

零第三方依赖，Node ≥ 20。

## 安装

```powershell
git clone https://github.com/waterlikc/multi-note-skill.git
cd multi-note-skill
node cli/note.mjs --help
```

零依赖，不需要 `npm install`；Node ≥ 20。

## 快速开始

```powershell
node cli/note.mjs --help
node scripts/render.mjs 笔记.json 笔记.html [状态.json]
node scripts/update.mjs 旧状态.json 更新.json 新状态.json
node scripts/cards.mjs 笔记.json 卡片.csv
node scripts/plan.mjs 状态.json 计划.html --days 7 --start 2026-10-21
node scripts/audit.mjs [目录]
node scripts/pack.mjs 笔记目录 课程包.html
node scripts/subs.mjs 字幕.srt
node scripts/video.mjs <链接> [来源.json]
node scripts/animate.mjs note.json out.gif --block <id>
```

退出码：`0` 成功 / `1` 输入或校验错误 / `2` 合并冲突（不写新文件）。

`scripts/` 是标准入口，依赖 `cli/` 与 `src/`；`node cli/note.mjs …` 仍可用，参数不变。

## 目录结构

| 路径 | 作用 |
|---|---|
| `SKILL.md` | 模型入口：判路径、场景默认、输出红线 |
| `index.mjs` | 公开 API 门面，re-export `src/render/note.mjs` |
| `src/contract.mjs` | 内容契约与校验 |
| `src/state.mjs` | 状态、合并、冲突 |
| `src/input.mjs` | 输入适配（图片/视频/网页/音频/文本） |
| `src/render/note.mjs` | 组装 HTML：章节、表格、代码、目标、自测、结构图 |
| `src/render/file.mjs` | 原子写文件（临时文件 + rename） |
| `src/export/cards.mjs` | Anki CSV 导出 |
| `src/export/plan.mjs` | N 天计划与复习排期 |
| `src/export/pack.mjs` | 课程包：批量渲染 + 关键词索引 |
| `src/audit.mjs` | 产物审计：外链、锚点、表格、计划顺序 |
| `scripts/*.mjs` | 标准命令入口：render/update/cards/plan/audit/lint/pack/subs/video/animate |
| `assets/theme-{a,b,c}.css` | 三套视觉源文件 |
| `assets/template-*.html` | **生成物**（`tools/build.mjs` 产出），不要手改 |
| `cli/note.mjs` | 统一 CLI 实现，scripts 复用 |
| `tools/` | 开发用：重建模板与示例（可选） |
| `tests/runtime.test.mjs` | 主测试集（与 `tests/animation.test.mjs` 合计 105 项） |
| `references/` | 契约、状态、输入、动画四份细则 |

## 来源引用

`sources[].url` 可选，渲染为来源后的「原文」链接；审计只允许来源区出现 https 外链，正文其他位置与外链图片仍会被拦下。只给**实际读过**的页面加链接，补充内容用 `origin: supplement` 标出。

## 课程包与检索

`pack` 扫描目录下的 `*.json`，逐份渲染成 HTML，并生成一个离线 `index.html`：

- 顶部统计：份数、节数、目标数、审计问题数；
- 关键词条：只列**正文里真的出现**的词，点进去是跨笔记的命中页；
- 每张卡片带场景与审计徽章，点开进入单篇笔记。

笔记可带 1–8 个 `keywords`，渲染在标题下方；课程包会把它们汇总成静态关键词页，不依赖脚本或搜索服务。

场景规则：会议笔记不要求学习目标/自测/迁移章节，但必须有决策/行动表；读书笔记必须有原文引用与个人解释。

图片块用内联 `data:image/...;base64`，审计会拦外链图片；视频来源在 label 含 `mm:ss` 时自动带 `?t=` 深链（B 站/YouTube）。

## 概念动画（新）

在 note.json 的章节里加入 `animation` 块，可生成内联 SVG + CSS 的“会动的笔记”：

- 三种预设：flow（流程）、state（状态机）、timeline（时间线）；
- 三种节奏随主题：A 杂志=calm、B 蓝图=precise、C 手账=lively，块内 `motion` 可覆盖；
- 节点入场、边绘制、沿边圆点、焦点环、时间线游标；自动循环、暂停/继续；
- 打印最终帧 + 步骤列表；遵循 `prefers-reduced-motion`，无脚本、无外链；
- 规格见 [docs/概念动画.md](docs/概念动画.md)，主示例 [examples/tcp-handshake.json](examples/tcp-handshake.json)；
- 四例画廊 [examples/motions/index.html](examples/motions/index.html)（TCP flow、TCP state、HTTP timeline、二分查找）。

```powershell
node cli/note.mjs render examples/tcp-handshake.json out/tcp.html
node cli/note.mjs audit out
```

平台只有 write_file 时不要伪造动画，保留静态分镜与步骤列表。

## 设计约束

- **单文件**：CSS 内联、SVG 内联，无脚本、无外链、无 CDN；断网可直接打开。
- **可打印**：A4 打印保留正文与答案页，隐藏导航、翻页器与状态块。
- **可携带状态**：完整状态 JSON 转义后放进 `pre#note-state`，新会话复制即可续学。
- **上下文预算**：SKILL.md ≤ 9,000 字节；参考 ≤ 12,000；单模板 < 10,000；合计 < 31,000。
- **诚实边界**：演示作答（`simulated: true`）不计入掌握；没有证据时 mastery 只能是 `unknown`。

## 视觉

三套主题，可用一句话切换（详见 `references/contract.md` 的“排版触发词”）：

- **A 杂志排版**：宋体大标题、页边红色章节号、引文式提示
- **B 工程蓝图**：网格纸、角标、SEC 编号、NOTE 虚线框
- **C 手账拼贴**：手写标题、荧光笔、珊瑚贴纸、便签

## 统一版面

所有主题共用同一套外框：固定顶栏（标题 + 版本 + 夜间开关）、内容区 900px、右下角章节翻页；打印隐藏顶栏与开关。切换主题不再改变页面宽度。

## 交互版（可选）

`node cli/note.mjs render 笔记.json 输出.html --interactive`：内联三套主题 CSS，右上角切换杂志/蓝图/手账，右下角翻页；文件含脚本，仅用于演示与答辩。默认导出仍是单主题、无脚本版本。

## 深色模式与输入边界

- 右上角顶栏「◐ 夜间」按钮手动切换（纯 CSS checkbox，无脚本）；默认浅色，打印隐藏开关且始终浅色。
- 只有链接不算已读；识别置信度 < 0.8 会先请求核对；单次材料 > 200,000 字符会要求拆分。

## 测试与验收

```powershell
node --test tests/runtime.test.mjs tests/animation.test.mjs  # 105 项
node cli/note.mjs audit          # 示例产物审计
```

## 已知边界

- 摘要只收字符串，算不了文件哈希（契约决定）。
- 翻页器是章节跳转，不是真正分页；真分页需要脚本或多文件。
- 测试仍是单文件；`src/render/note.mjs` 尚未拆分成 blocks/diagrams 模块。

## 许可

MIT，见 [LICENSE](LICENSE)。


## 规范基线（lint）

```bash
node cli/note.mjs lint 笔记.json 产物.html
```

- 默认 8–16 节，`compact:true` 时 4–8 节；每节 1–8 个内容块；
- 默认 3–6 个学习目标，compact 时 2–4 个，每个至少 2 条验收标准；
- 默认 3–6 道自测，compact 时 2–4 道，必须标明真实/演示；
- 至少 1 个迁移任务小节、1 个表格、1 个提示块；
- 来源 ≥1，链接只允许 https；
- 产物无 script/link，audit 通过；
- 同一输入多次渲染字节一致，三种主题结构一致。


## 视频链接怎么变成笔记

只贴链接时先取转写，不凭标题编摘要：

- 平台有 ASR/视频理解时，走宿主适配器取带时间戳全文；
- 本地 `node cli/note.mjs video <链接> [来源.json]` 只读公开接口，不登录、不绕权限；
- 返回 `ready` 才进入生成；`needs_transcript` 时把原因和下一步转告用户；`error` 说明网络/接口失败。

字幕进入 sources 的 label（如「视频字幕 · 00:12」），章节用 sourceIds 回指，重点与补充分开标注。

拿到 .srt / .vtt 文件时：`parseSubtitles(text)` 解析时间轴，`toSources(cues)` 合并成带 `00:12–00:48` 的来源块，不需要手工抄时间。

## 创新点（答辩口径）

1. **契约化**：五类块 + S 编号，产物可审计，不靠模型自觉。
2. **可携带**：单文件 HTML + 状态 JSON，断网、换设备、打印都不散。
3. **视频可回溯**：链接只做线索，时间戳进来源，笔记能回到原视频。
4. **迁移任务**：练习不是复述，换情境/换字段/造测试/改结论，给自评标准。
5. **零依赖**：Node ≥20，无第三方运行时依赖，平台与本地同一套契约。


## 技术文档

架构、契约、视频链路、质量保障与已知限制见 [docs/技术文档.md](docs/技术文档.md)。

## 字幕文件转来源

```bash
node cli/note.mjs subs 字幕.srt 600
```

输出可直接粘进 note.json 的 `sources`，label 自带 `00:12–00:48` 时间范围。