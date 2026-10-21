# 双模式内容契约

程序模式先把材料整理为以下结构，再渲染；渲染器不会自行理解视频或总结文本。直接生成模式遵循相同信息结构，无须先输出 JSON。

```json
{
  "schemaVersion": 1,
  "id": "math-linear",
  "revision": 1,
  "title": "一次函数的斜率",
  "scene": "course",
  "style": "style-a",
  "summary": "斜率表示纵坐标变化量与横坐标变化量的比值。",
  "sources": [{"id":"S1","label":"课堂记录，第1段","text":"一次函数 y=kx+b，k≠0，k 表示斜率。"}],
  "sections": [{
    "id":"concept","heading":"核心概念",
    "blocks":[{"type":"paragraph","text":"一次函数 y=kx+b，其中 k≠0。"}],
    "sourceIds":["S1"],"origin":"source"
  }]
}
```

id 稳定、不随排序变化；revision 为正整数。sources 可加 url（https），渲染为“原文”链接；只给读过的页面加。scene 为 tech/course/science/reading/meeting/research/project；style 为 style-a/b/c。

块类型：paragraph、callout 用 text；list 用 items 字符串数组；code 用 text 与可选 language；table 用 headers 字符串数组与 rows 二维字符串数组，每行等宽。不接受原始 HTML。数学公式使用可离线读取的 Unicode 文本（如 Δy/Δx），复杂公式可由直接模式写静态 MathML 并附文本解释。

章节 origin 为 source / supplement / uncertain，对应来源材料 / 补充解释 / 需确认。source、uncertain 章节必须有 sourceIds；纯模型补充可用空数组但必须标 supplement。来源 text 是实际取得的原文片段，label 写页码/时间戳（未知则写未提供）；不编造引文。

源码入口：`index.mjs` 导出 generateNote(note, state?)；命令行 `node cli/note.mjs render note.json note.html [state.json]`，也可直接以完整 state.json 作输入。JSON 校验、转义、套用一种模板，再原子写出 HTML；错误写 stderr 并返回非零退出码。

主题模板中的大写占位符由渲染器一次性替换；模型直接生成时保留 CSS，替换 header/main 内的示例，删除占位符注释。两种模式都必须包含标题、摘要、正文、来源；更新任务包含版本与变更摘要。

代码无法运行时直接生成同样结构；不能把 JS 代码块当作已执行结果。网页获取或 OCR 不属于渲染器职责。


## 可选字段：objectives（学习目标）

用于知识清单与学习计划：编号、描述、验收标准、对应章节四者缺一不可。

```json
{"id":"obj-slope","text":"能说明斜率与截距的含义",
 "criteria":["能解释 k 的符号与增减性","能由两点求出斜率"],
 "sectionIds":["concept","example"]}
```

- id 规则与笔记 id 相同，集合内唯一；**id 是引用键，不面向读者**——渲染与计划里显示为「目标 N」，id 只出现在小字编号与 title 属性中。
- criteria 至少一条，渲染成验收清单。
- sectionIds 必须指向已有章节；没有对应章节的目标不允许存在。

## 可选字段：practice（作答记录）

用于自测错题与间隔复习；每条记录必须标明真实还是演示作答。

```json
{"id":"p1","objectiveId":"obj-slope","verdict":"right","simulated":false,
 "question":"y=-3x+2 中 y 随 x 增大如何变化？","answer":"y 减小，因为 k=-3<0"}
```

- verdict 只能是 right / wrong / skip。
- simulated 必须是布尔值；为 true 时不计入掌握，也不推进复习间隔。
- objectiveId 可选，一旦填写必须指向已有的学习目标。
- **只有演示作答时，任何知识节点都不得给出掌握状态**（状态校验会拒绝）。

## 交互版（可选）

`render … --interactive` 内联三套 CSS，右上角切换排版、右下角翻页；含脚本，仅用于演示；默认导出无脚本单主题。

## 两个导出脚本

`node cli/note.mjs cards` 导出 Anki CSV（目标/章节各一张卡，含逗号引号自动转义）；`node cli/note.mjs plan --days 7 [--start YYYY-MM-DD]` 生成按天排期、带复习项的单文件 HTML。

旧入口 `scripts/*.mjs` 保留一版薄封装，命令与参数不变，便于已有脚本过渡。

## 深色模式

左下角「◐ 夜间」是纯 CSS 开关（checkbox + :has），默认浅色；打印隐藏开关并强制浅色。不依赖脚本与系统设置。

## 排版触发词

同一份内容可以换 style 重渲染，不用重写笔记本身。

| 用户怎么说 | style | 视觉特征 |
|---|---|---|
| “默认”“干净一点”，或没提 | style-a | 杂志排版：宋体大标题、页边红色章节号、引文式提示 |
| “像期刊/杂志”“正式一点”“答辩用” | style-a | 同上 |
| “工程图纸”“蓝图”“技术风”“像接口文档” | style-b | 网格纸、角标、SEC 编号、NOTE 虚线框、等宽标签 |
| “手账”“贴纸”“便签”“手写”“轻松一点” | style-c | 手写标题、荧光笔、珊瑚贴纸、便签与胶带 |

用户明确说了样式就听用户的；没说时按场景默认（技术/项目 → b，课堂/会议 → a，阅读 → c）。
