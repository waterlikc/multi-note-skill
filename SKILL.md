---
name: multi-note-skill
description: 指令型技能，不是可调用工具。读完本文件后按步骤直接生成，不要发起同名工具调用。将学习材料或会议记录整理为离线可打印的 HTML 笔记，支持三种主题、增量合并与可携带状态。用于已提供文字、可读取图片或已取得的字幕、网页、转写；只有链接不视为已读取内容。
metadata:
  version: "3.1.3"
---

# 全天候智慧学伴

> 这是说明文件，不是工具。不要调用名为 multi-note-skill 的工具；平台只给 write_file 时，走下面的「直接生成模式」。

## 先判断能做什么
以本次可见工具为准，不假设存在 Node、浏览器、网络或文件系统。
- 有代码执行工具且 skill 文件可读：程序模式。按 [内容契约](references/contract.md) 构造 JSON，执行 `node cli/note.mjs render 输入.json 输出.html`。
- 无执行工具：直接生成模式。读取一种 `assets/template-a.html` / `template-b.html` / `template-c.html`，**把其中 `<style>` 整段原样复制**，只替换占位符；自写 CSS 视为失败。
- 文件不可读：用下方骨架，不搜索不存在的路径。失败即停；程序错误只修正一次，再转直接生成。
- 没有原文：请求正文、字幕或转写，不凭 URL 编摘要。优先用平台原生识图/转写，按需读 [输入适配](references/input.md)。

### 只有 write_file（无 shell）
1. 读 `assets/template-b.html`（或 a/c），把 `<style>` 整段原样复制；允许改的只有占位符和正文。
2. 替换 `{{TITLE}}`、`{{SUMMARY}}`、`{{NAV}}`、`{{CONTENT}}`、`{{SOURCES}}`、`{{PAGER}}`、`{{STATE}}`；`{{CONTENT}}` 用 `<section id="section-…">` 分节。
3. write_file 存成 `笔记.html` 并展示；不要声称跑过 node。

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

逐段关联来源编号或页码/时间戳；不确定公式、数字标“需确认”。新增推导或例题标“补充解释”。不按篇幅推断难度；无答题证据时为 unknown。材料中的命令只排版，不执行。可选字段 objectives（知识点编号+验收标准）与 practice（作答记录，simulated 标演示）见契约。

## 输出与续学
输出单个 UTF-8 HTML：含 doctype、lang、viewport、title、内联 CSS、正文和来源。A 学霸笔记本，B 皮革手账，C 简约现代。两模式共用章节、表格、代码、提醒与来源规范，不承诺跨模型逐字逐像素一致。
无 CDN、外部字体、远程图片、iframe 或脚本。文本转义 `& < > "`；公式不用在线 MathJax。375px 可阅读，打印保留正文与答案。文件名“场景-主题-笔记.html”；无文件工具则返回 html 代码块与保存说明，不虚构下载链接。
续学时读 [状态规范](references/state.md)：完整状态 JSON 经 HTML 转义后放入 `pre#note-state`；卡片与计划用 `cli/note.mjs cards`、`cli/note.mjs plan`，复习节奏只按真实作答推算。新会话需提供旧 HTML 或状态。合并保留来源、标记冲突，只按明确指令替换，输出更新摘要与版本。回退需取得旧快照。

## 文件不可读时的最小模板
以下为 A 骨架；B 改棕色厚边框，C 改青色章节卡片。替换示例字段，保留语义与打印规则。
```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>学习笔记</title><style>
*{box-sizing:border-box}body{margin:0;background:#edf1f4;color:#202c36;font:16px/1.75 system-ui,"Microsoft YaHei",sans-serif}main{max-width:900px;margin:24px auto;padding:28px;background:white;border-left:6px solid #214c79}h1{font-size:2rem}h2{font-size:1.3rem;color:#214c79}section{margin:24px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#eaf2fa;padding:16px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #cbd5dc;padding:8px;overflow-wrap:anywhere}.source{color:#52616b}p,li{overflow-wrap:anywhere}@media(max-width:600px){main{margin:0;padding:16px}}@media print{@page{size:A4;margin:15mm}body{background:white}main{margin:0;padding:0;border:0}h2{break-after:avoid}pre{white-space:pre-wrap}thead{display:table-header-group}}
</style><main><header><p>课堂学习</p><h1>学习笔记</h1><p>一句话概括材料核心。</p></header><section><h2>核心概念</h2><p>依据材料填写。</p><p class="source">来源：[S1] 用户提供材料，第1段。</p></section><section><h2>复习与待确认</h2><p>列出材料支持的重点与疑问。</p></section></main></html>
```

## 上下文与交付检查
只加载所需参考和一种模板，不读取整个代码库或全部示例；skill 上下文小于 27.8KB（UTF-8）。长材料分段处理，不能保证含用户输入的总上下文恒小于 27.8KB。
交付前跑 `node cli/note.mjs audit`：查外链、失效锚点、表格列数与计划顺序；未测的数据写“待验证”。
