# 可携带学习状态

“对话内维护”受上下文长度限制，不是数据库。每次更新输出完整当前快照，用户保存 HTML 或 JSON；新会话重新提供，才能恢复。程序与直接模式共用：

```json
{"schemaVersion":1,"note":{"说明":"这里放完整 note 对象，输出时删掉本说明"},
 "graph":{"nodes":[{"id":"slope","label":"斜率","sectionIds":["concept"],"mastery":"unknown","evidence":[]}],"edges":[]},
 "history":[{"revision":1,"summary":"首次整理"}]}
```

完整可运行示例见 `examples/math.state.json`。node.mastery 仅用 unknown / learning / mastered / review；后面三种必须附实际答题或用户自评的 evidence 字符串，不捏造百分比。关系 `{from,to,type,basis}`，type 为 prerequisite / related / extends / contains。prerequisite 的方向是“前置概念 → 目标概念”；basis 记录材料或解释依据。边不能悬空；前置关系出现环时先修正，不伪造学习顺序。复杂路径是候选建议，不承诺个性化教学效果。

## 合并规则
1. 优先读完整旧状态；只有旧笔记就从内容恢复并标明图谱/历史未知；两者都没有时请用户提供，不得假称更新成功。
2. 保留稳定 id：同章节同内容跳过，新 id 追加，同 id 不同内容保留旧版并报冲突；来源同理。
3. 只有用户明确要求时才替换章节，保留来源与变更记录；程序只做 id 与结构比对，不冒充语义合并。
4. 冲突时先列差异让用户决定；可先交付已确认部分。一次有效合并 +1 版，完全重复不加版。
5. 已掌握章节被改写时，相关节点置 unknown 并清空依据，提醒重测；新节点由模型依材料提出。

`createState(note)`、`mergeState(state, patch)` 见 core/state.mjs。patch 为 `{baseRevision, summary, sources:[], sections:[], replaceIds:[]}`，baseRevision 必须与当前一致；不支持删除，避免意外丢失旧知识。返回 `{state, conflicts, changed}`，conflicts 非空时整次不提交。

CLI：`node cli/note.mjs update 旧状态.json 更新.json 新状态.json`；随后 `node cli/note.mjs render 新状态.json 新笔记.html`。输出状态必须是新文件；冲突返回退出码2且不写文件，其他错误返回1。

HTML 用 `<pre id="note-state">` 存转义后的 JSON；复制显示文字即可 parse，读源码要先解实体。打印隐藏状态块但保留正文；状态不是云端保存。

history 只是索引，不含全文；回退要拿到目标快照并作为新 revision 输出。状态过大时按主题导出，摘要里列出分卷与省略范围；不要静默删除学习证据。


## 演示作答与复习节奏

- 作答记录在 practice；simulated:true 只用于演示，不计入掌握，也不推进复习。
- 只有演示作答时，状态校验拒绝任何非 unknown 的 mastery。
- 间隔：有答错 → 次日；答对 1 / 2 / 3 次以上 → 3 / 7 / 16 天。只是排期建议，不代表学习效果。
