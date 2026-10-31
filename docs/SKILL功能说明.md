# multi-note-skill 功能说明（v3.2.0）

## 一句话

把学习材料变成**单文件、离线、可打印、可续学**的 HTML 笔记；不是聊天总结器。

## 输入

- 文字：正文、讲义、网页正文；
- 图片：OCR/转写后的文字；
- 视频：平台 ASR/视频理解、公开字幕或转写；只有链接不算已读，没转写返回 needs_transcript；本地 `video` 命令可探测公开字幕；
- 会议/读书：按场景规则整理。

## 输出

- 一份 HTML：CSS/SVG 内联，无脚本、无外链、无远程字体；
- 一份状态 JSON：目标、作答、复习排期，转义后嵌进 HTML；
- 三种主题：A 杂志、B 蓝图、C 手账；换 style 字段即可。

## 内容契约

六类块：paragraph、list、code、table、callout、image（内联 data URI）；新增 animation 块（flow/state/timeline，内联 SVG + CSS）。

字段：

- sources：S 编号 + 原文 + 可选 https 链接；
- origin：source / supplement / uncertain；
- objectives：3–6 个目标，每个 ≥2 条验收标准；
- practice：默认 3–6 道自测，compact 2–4 道；simulated 标演示；先问后答，答案折叠，打印另附答案页；
- keywords：1–8 个，用于笔记内跳转与课程包索引；
- graph/state：前置关系、掌握状态、复习记录。

## 命令行

| 命令 | 作用 |
|---|---|
| render | JSON + 可选 state → HTML |
| update | 增量合并，冲突退出码 2 |
| audit | 查外链、锚点、表格列数、图片、计划顺序 |
| lint | 查默认 8–16 节（compact 4–8）、目标、自测、迁移、场景规则 |
| cards | 导出 Anki CSV |
| plan | 生成 N 天复习计划 HTML |
| subs | SRT/VTT → 带时间戳来源块 |
| pack | 批量渲染 + 课程包索引 + 关键词页 |

## 场景规则

- 技术/课堂：目标 + 自测 + 迁移；
- 会议：不要求学习字段，必须有决策/行动表；
- 读书：必须有原文引用 + 个人解释；
- 科研/项目/科普：通用结构，场景级必填还在补。

## 概念动画

- 流程 / 状态机 / 时间线三预设；
- 自动循环、暂停/继续、打印最终帧 + 步骤列表；
- 无脚本、无外链；`prefers-reduced-motion` 静态降级；
- `node cli/note.mjs animate note.json out.gif --block <id>` 可导出 GIF/MP4（需要本机 Chrome/Edge + ffmpeg；没有则退出码 3）。

## 课程包

- 12 份笔记 / 104 节 / 31 个关键词 / 0 审计问题；
- 关键词页只列正文真实出现的词，点进命中章节；
- 每份笔记带学习路径 + 知识结构图与复习记录。

## 质量

- 105 项自动测试、22 项自检；
- 单份渲染约 0.12s，单文件 38KB；动画示例约 60KB；
- 审计反例：http 来源 → 退出码 1。

## 平台现状

- 在线创建技能可注入，实测生成 8 节 JavaWeb；
- zip 上传只注入元数据，模型读不到 SKILL.md；
- 平台“切换模型”只有 qwen3.6，没有 Qwen3-Next-80B；
- 平台文件预览仍不支持；项目文件“更多 → 下载”可下载 HTML。

## 边界

- 没有真实学习者数据，不宣称提高成绩；
- 没字幕的视频不做摘要；
- 会议/读书之外的场景检查未做；
- 演示作答不计入掌握。