# 概念动画（animation）

只在程序模式使用；直接生成模式用静态分镜 + 步骤列表。用于文字讲不清“先后、因果、状态变化”的过程，一个概念一个动画，最多 8 步。

## 块结构

```json
{"type":"animation","id":"tcp","preset":"flow","title":"TCP 三次握手",
 "alt":"客户端与服务器三次报文交换的动画示意","caption":"第三次 ACK 后建立连接",
 "motion":"precise","nodes":[{"id":"client","label":"客户端","detail":"CLOSED","tone":"accent"}],
 "edges":[{"id":"syn","from":"client","to":"server","label":"SYN"}],
 "steps":[{"id":"s1","label":"客户端发 SYN","detail":"进入 SYN-SENT","focus":["client","syn"],"hold":1.6}]}
```

## 字段

- preset：flow / state / timeline；flow、state 为 2–6 节点、1–8 边；timeline 只写 steps。
- steps 2–8；label 1–24 字，detail ≤48 字，hold 0.8–4 秒，总 4–20 秒；focus 0–4 个本块节点/边 id。
- motion：calm / precise / lively，缺省随主题 A/B/C；tone：accent / ink / muted / warn / ok。
- alt 8–160 字；caption ≤120 字；loop 为布尔。
- 禁止原始 SVG/HTML、任意 JS、外部图片和自造颜色。

渲染自动循环；暂停为纯 CSS checkbox；打印/reduced-motion 显示最终帧 + 步骤；三主题不引入新色板。
