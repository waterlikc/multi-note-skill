# START HERE · 给队员

> 这是一份指令型技能，不是可调用工具。  
> 在 DeepSeek Harness 里，先让它读本文件同级的 SKILL.md，再按“程序模式”执行；不要调用名为 multi-note-skill 的工具。

## 1. 这是什么

把学习材料（文字/图片转写/字幕/网页正文）整理成单文件、离线、可打印、可续学的 HTML 笔记。

- 输入：note.json（+ 可选 state.json）
- 输出：一份 HTML + 更新后的 state.json
- 特点：CSS/SVG 内联，无脚本、无外链、无远程字体；三种主题；A4 可打印。

## 2. 30 秒跑通

要求：Node.js ≥ 20。

Windows 双击 quickstart.cmd，或命令行：

    node cli/note.mjs render examples/quickstart.json out/quickstart.html examples/course.state.json
    node cli/note.mjs audit out
    node cli/note.mjs lint examples/quickstart.json out/quickstart.html

看到“审计通过 / 规范检查通过”就说明环境没问题。

## 3. 在 DeepSeek Harness 里怎么用

把整个 multi-note-skill 文件夹作为工作区打开，然后对 DSH 说：

> 读 SKILL.md。按程序模式，把 examples/quickstart.json 渲染成 out/quickstart.html，再跑 audit 和 lint。

DSH 有 shell 时，它会调用 node cli/note.mjs ...；  
DSH 只有 write_file、没有 shell 时，按 SKILL.md 的“直接生成模式”，不要读 references/assets，也不要假装跑过命令。

## 4. 常用命令

| 命令 | 作用 |
|---|---|
| render | JSON + 可选 state → HTML |
| update | 增量合并，冲突退出码 2 |
| audit | 查外链、锚点、表格列数、图片、计划顺序 |
| lint | 查章节/目标/自测/迁移/场景规则 |
| cards | 导出 Anki CSV |
| plan | 生成 N 天复习计划 HTML |
| subs | SRT/VTT → 带时间戳来源块 |
| pack | 批量渲染 + 课程包索引 + 关键词页 |

示例：

    node cli/note.mjs subs 字幕.srt
    node cli/note.mjs pack 课程包/src 课程包/index.html

## 5. 内容契约（只改 JSON，不改模板）

六类块：

- paragraph：text
- list：items[]
- code：text + language
- table：headers[] + rows[][]
- callout：text
- image：data URI + alt（禁止外链图片）

必填：

- schemaVersion: 1
- id / revision / title / scene / style / summary
- sources[]：id、label、text；可选 https url
- sections[]：id、heading、origin、sourceIds、blocks

可选：

- objectives（3–6 个，每个 ≥2 条验收标准）
- practice（3–6 道，simulated 必须显式）
- keywords（1–8 个）
- state.graph（节点 + 边 + 依据）

## 6. 示例地图

| 文件 | 场景 |
|---|---|
| examples/quickstart.json | 课堂 |
| examples/quickstart.json | 技术 |
| examples/meeting.json | 会议（决策/行动表） |
| examples/project.json | 项目 |
| examples/math.json | 数学 |
| examples/physics.json | 物理 |
| examples/programming.json | 编程 |

每个 JSON 都有对应 .html 和 .state.json 可对照。

## 7. 三条规矩

1. 不要手改 assets/template-*.html：它们是 tools/build.mjs 生成的，改主题请改 assets/theme-*.css 后重跑 build。
2. 交付前必须跑 audit + lint；没有通过不要发。
3. 没有原文不要编：只有链接不算已读；视频先取平台 ASR 或本地 `video` 公开字幕，取不到就返回 needs_transcript。

## 7.5 概念动画

- 章节里加 `animation` 块（flow/state/timeline），渲染成内联 SVG + CSS；
- 自动循环、暂停、打印最终帧；无脚本；
- 规格见 `docs/概念动画.md`，示例见 `examples/tcp-handshake.json`；
- GIF 导出：`node cli/note.mjs animate examples/tcp-handshake.json out.gif --block tcp-three-way`（需本机 Chrome/Edge + ffmpeg）。

## 8. 当前状态

- 版本：v3.2.0
- 测试：105 项 + 14 项自检
- 课程包：6 份 / 60 节 / 27 个关键词 / 0 审计问题
- 单份：约 0.12s、38KB；动画示例约 60KB
- 许可：MIT（见 LICENSE）

## 9. 已知限制

- 没有真实学习者数据，不宣称提高成绩；
- 会议/读书之外的场景检查还在补；
- 平台只有 qwen3.6，Qwen3-Next 未开通；
- 平台文件不支持预览/下载。

## 10. 交付回来什么

- out/*.html
- 对应 *.state.json（如果续学）
- audit / lint 的终端输出
- 一句话说明：用了哪个场景、哪些来源、哪些是 supplement


## 11. 交接测试

Windows 双击 `跑测试.cmd`；macOS/Linux 用 `bash run-tests.sh`。  
预期：105 tests / 14 selfchecks / 0 audit issues。  
细节与文件指纹见 `TESTING-给队友.md`；两个人跑完交换结果文件。