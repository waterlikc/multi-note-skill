---
name: multi-note-skill
description: 指令型技能，不是可调用工具。读完本文件后按步骤直接生成，不要发起同名工具调用。将学习材料或会议记录整理为离线可打印的 HTML 笔记，支持三种主题、增量合并与可携带状态。用于已提供文字、可读取图片或已取得的字幕、网页、转写；只有链接不视为已读取内容。
metadata:
  version: "3.2.0"
---

# 全天候智慧学伴

> 这是说明文件，不是工具；平台只给 write_file 时，走下面的「直接生成模式」。

## 先判断能做什么
以本次可见工具为准，不假设存在 Node、浏览器、网络或文件系统。
- 有代码执行工具且 skill 文件可读：程序模式。按 [内容契约](references/contract.md) 构造 JSON，执行 `node scripts/render.mjs 输入.json 输出.html`；`scripts/` 是入口，依赖 `cli/`、`src/`。
- 无执行工具：直接生成模式。优先把下方「内联样式」整段放进 `<style>`；读不到 assets 时不要反复找文件，也不要自写 CSS。
- 文件不可读：用下方骨架，不搜索不存在的路径。失败即停；程序错误只修正一次，再转直接生成。
- 没有原文：请求正文、字幕或转写，不凭 URL 编摘要。视频先用平台 ASR/视频理解取转写；本地 `video <url>` 取公开字幕；无转写即停。适配见 [输入适配](references/input.md)。

### 只有 write_file（无 shell）
1. 用下方「输出骨架」，把「内联样式」整段放进 `<style>`；不要读 `assets/`，不要自写 CSS。
2. 正文按 3–8 个 `<section id="section-…">` 组织；标题、目标、自测按内容补齐。
3. write_file 存成 `笔记.html` 并展示；不要声称跑过 node。

## 练习：先事实，再迁移

- 事实题 3–4 道，先问后答，用于间隔复习。
- 每份笔记至少 3 个迁移任务：换情境、换字段、造测试、改结论。
- 迁移任务不给唯一答案，给「自评标准 + 参考思路」；必须离线可做，不要求学生把笔记再发给 AI。
- 先写方案，再对照标准自评；不给范文。

## 内联样式（平台必用）

平台读不到 `assets/` 时，把下面这段 CSS **原样**放进 `<style>`，不要自写：


```css
:root{--ink:#12293d;--accent:#1a7f8e;--line:#c9d8e0;--muted:#5b7283}
*{box-sizing:border-box}
body{margin:0;background:#eef3f6;color:var(--ink);font:16px/1.75 "Microsoft YaHei",system-ui,sans-serif}
.topbar{position:fixed;inset:0 0 auto;height:48px;display:flex;align-items:center;gap:10px;padding:0 18px;background:var(--ink);color:#fff;font:600 12.5px/1 "Segoe UI","Microsoft YaHei",sans-serif;z-index:30}
.topbar .meta{margin-left:auto;opacity:.65;font-weight:400}
main{max-width:900px;margin:72px auto 48px;padding:36px 40px;background:#fff;border-left:6px solid var(--ink);box-shadow:0 10px 30px rgba(18,41,61,.08)}
h1{font-size:2rem;margin:0 0 8px}
.lead{color:var(--muted);margin:0 0 18px}
nav{display:flex;flex-wrap:wrap;gap:6px;padding:10px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:18px}
nav a{font:12px/1 Consolas,monospace;color:var(--ink);text-decoration:none;border:1px solid var(--line);padding:6px 9px;border-radius:3px}
section{margin:26px 0}
h2{font-size:1.3rem;color:var(--accent);margin:0 0 10px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;font-size:14px}
th{background:#eef5f8;font:600 12px/1.4 Consolas,monospace;color:var(--accent)}
pre{background:#f2f6f8;border:1px solid var(--line);border-left:3px solid var(--accent);padding:14px;overflow:auto;font:13px/1.6 Consolas,monospace}
code{font-family:Consolas,monospace}
.callout{background:#eef7f8;border:1px dashed var(--accent);padding:12px 16px;margin:14px 0}
.pager{position:fixed;right:18px;bottom:18px;display:flex;gap:6px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 10px;font:12px/1 Consolas,monospace}
.pager a{color:var(--ink);text-decoration:none;padding:4px 6px}
#note-state{margin-top:28px;padding-top:12px;border-top:1px dashed var(--line);font:11px/1.5 Consolas,monospace;color:var(--muted)}
@media print{.topbar,.pager{display:none}main{margin:0;box-shadow:none;border:0;max-width:none}}
@media screen{
.night-toggle{position:fixed;left:12px;bottom:12px;width:1px;height:1px;opacity:0}
.night-toggle-label{position:fixed;left:12px;bottom:12px;z-index:9;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;font:600 12px/1 system-ui;color:var(--ink);cursor:pointer}
.night-toggle-label:before{content:"◐ 夜间"}
html:has(#night:checked){color-scheme:dark}
html:has(#night:checked) .night-toggle-label{background:#16232e;color:#d6e2ea;border-color:#2c4453}
html:has(#night:checked) .night-toggle-label:before{content:"◑ 白天"}
html:has(#night:checked) body{background:#101820;color:#d6e2ea}
html:has(#night:checked) main{background:#16232e;border-color:#2c4453}
html:has(#night:checked) h1,html:has(#night:checked) h2{color:#eaf3f8}
html:has(#night:checked) .lead,html:has(#night:checked) nav a{color:#9fb6c4}
html:has(#night:checked) pre,html:has(#night:checked) table{background:#1b2b36;border-color:#2c4453;color:#d6e2ea}
html:has(#night:checked) th{background:#203442;color:#9ed3dd}
}
@media print{.night-toggle,.night-toggle-label{display:none}body{background:#fff}main{box-shadow:none}}
```

## 输出骨架（照此结构）

```html
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>标题</title>
<style>/* 上面「内联样式」整段 */</style></head>
<body>
<input type="checkbox" id="night" class="night-toggle" aria-label="夜间模式"><label for="night" class="night-toggle-label" title="切换夜间/白天"></label>
<header class="topbar"><strong>学习笔记</strong><span class="meta">v1 · 离线可打印</span></header>
<main>
<h1>标题</h1><p class="lead">一句话摘要。</p>
<nav><a href="#section-1">1 小节</a><a href="#section-2">2 小节</a><a href="#section-3">3 小节</a></nav>
<section id="section-1"><h2>1 小节</h2><p>正文。</p></section>
<section id="section-2"><h2>2 小节</h2><p>正文。</p></section>
<section id="section-3"><h2>3 小节</h2><p>正文。</p></section>
<nav class="pager"><a href="#section-1">‹</a><span>1 / 3</span><a href="#section-2">›</a></nav>
<p id="note-state">状态：v1 · 3 节 · 离线可读</p>
</main></body></html>
```

## 整理规则
用户指定的场景、风格、深度优先；否则根据材料选择。信息不足时保留空缺，不为了结构补造事实。
| 场景 | 组织顺序 | 默认主题 |
|---|---|---|
| 技术 tech | 概念→用法→代码→易错→练习 | B |
| 课堂 course | 框架→定义/公式→例题→易错→自测 | A |
| 科普 science | 现象→原理→边界→思考 | A |
| 读书 reading | 观点→原文依据→分析→个人感想 | A |
| 会议 meeting | 议题→讨论→决议→负责人/期限 | B |
| 调研 research | 问题→方法→证据→局限→建议 | C |
| 项目 project | 目标→进展→问题→下一步 | B |

逐段关联来源编号或页码/时间戳；不确定公式、数字标“需确认”。新增推导或例题标“补充解释”。不按篇幅推断难度；无答题证据时为 unknown。可选字段 objectives、practice、keywords、image 与 animation 块见契约；短材料可 `compact:true`；需要动画时读 [概念动画](references/animation.md)，直接模式不要伪造动画。多篇用 pack 生成课程包与关键词索引。

## 输出与续学
输出单个 UTF-8 HTML：含 doctype、lang、viewport、title、内联 CSS、正文和来源。两模式共用章节、表格、代码、提醒与来源规范，不承诺跨模型逐字逐像素一致。
无 CDN、外部字体、远程图片、iframe 或脚本。文本转义 `& < > "`；375px 可阅读，打印保留正文与答案页。文件名“场景-主题-笔记.html”；无文件工具则返回 html 代码块与保存说明，不虚构下载链接。
续学时读 [状态规范](references/state.md)：完整状态 JSON 经 HTML 转义后放入 `pre#note-state`；卡片与计划用 `scripts/cards.mjs`、`scripts/plan.mjs`，复习节奏只按真实作答推算。新会话需提供旧 HTML 或状态。合并保留来源、标记冲突，只按明确指令替换，输出更新摘要与版本。回退需取得旧快照。

## 文件不可读时的最小模板
只保留 doctype、main、section、来源与打印规则；去掉装饰，不搜索 assets，不自写第二套 CSS。

## 上下文与交付检查
只加载所需参考和一种模板，不读整个代码库；skill 上下文小于 31KB。长材料分段处理，不能保证含用户输入的总上下文恒小于 31KB。
交付前跑 `node scripts/audit.mjs`：查外链、失效锚点、表格列数与计划顺序；未测的数据写“待验证”。