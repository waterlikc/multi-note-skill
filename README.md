# multi-note-skill 3.1.2

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
node cli/note.mjs render 笔记.json 笔记.html [状态.json]
node cli/note.mjs update 旧状态.json 更新.json 新状态.json
node cli/note.mjs cards 笔记.json 卡片.csv
node cli/note.mjs plan 状态.json 计划.html --days 7 --start 2026-10-21
node cli/note.mjs audit [目录]
```

退出码：`0` 成功 / `1` 输入或校验错误 / `2` 合并冲突（不写新文件）。

旧入口 `node scripts/render.mjs …` 仍可用，参数不变（薄封装，内部调用同一套实现）。

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
| `src/audit.mjs` | 产物审计：外链、锚点、表格、计划顺序 |
| `cli/note.mjs` | 唯一命令行入口 |
| `assets/theme-{a,b,c}.css` | 三套视觉源文件 |
| `assets/template-*.html` | **生成物**（`tools/build.mjs` 产出），不要手改 |
| `scripts/*.mjs` | 兼容薄封装 |
| `tools/` | 开发用：重建模板与示例（可选） |
| `tests/runtime.test.mjs` | 54 项测试 |
| `references/` | 契约、状态、输入三份细则 |

## 来源引用

`sources[].url` 可选，渲染为来源后的「原文」链接；审计只允许来源区出现 https 外链，正文其他位置与外链图片仍会被拦下。只给**实际读过**的页面加链接，补充内容用 `origin: supplement` 标出。

## 设计约束

- **单文件**：CSS 内联、SVG 内联，无脚本、无外链、无 CDN；断网可直接打开。
- **可打印**：A4 打印保留正文与答案，隐藏导航、翻页器与状态块。
- **可携带状态**：完整状态 JSON 转义后放进 `pre#note-state`，新会话复制即可续学。
- **上下文预算**：SKILL.md < 5,000 字节；参考 < 12,000；单模板 < 10,000；合计 < 27,000。
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
node tests/runtime.test.mjs      # 47 项
node cli/note.mjs audit          # 示例产物审计
```

## 已知边界

- 摘要只收字符串，算不了文件哈希（契约决定）。
- 翻页器是章节跳转，不是真正分页；真分页需要脚本或多文件。
- 测试仍是单文件；`src/render/note.mjs` 尚未拆分成 blocks/diagrams 模块。

## 许可

MIT，见 [LICENSE](LICENSE)。
