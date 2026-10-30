# 概念动画示例（motions）

这组示例只回答一件事：**抽象过程能不能在单文件笔记里动起来，而且不牺牲打印和降级。**

画廊：`index.html`（GIF 内嵌，离线可看，约 1 MB）。

| 文件 | 预设 | 主题 | 节奏 | 时长 | 看点 |
|---|---|---|---|---|---|
| `tcp-state.json` | state | style-b 蓝图 | precise | 5.5s | 四个状态环形排布，迁移边带箭头 |
| `http-timeline.json` | timeline | style-a 杂志 | calm | 5.4s | 里程碑逐个点亮，游标匀速推进 |
| `binary-search.json` | flow | style-c 手账 | lively | 6.1s | 4 节点 2×2，区间每次砍半 |

另有主示例 `../tcp-handshake.json`（flow / 5.0s），以及它导出的 `../tcp-handshake.gif`。

## 重新生成

在仓库根目录执行：

```bash
node cli/note.mjs animate examples/motions/tcp-state.json examples/motions/tcp-state.gif --style style-b --fps 12 --width 960
node cli/note.mjs animate examples/motions/http-timeline.json examples/motions/http-timeline.gif --style style-a --fps 12 --width 960
node cli/note.mjs animate examples/motions/binary-search.json examples/motions/binary-search.gif --style style-c --fps 12 --width 960
node cli/note.mjs animate examples/tcp-handshake.json examples/tcp-handshake.gif --block tcp-three-way --fps 12 --width 960
node tools/build-motion-gallery.mjs
```

裸动画块 JSON 可以直接导出，不必先写整份笔记；整份笔记用 `--block` 指定块 id。GIF 导出需要本机 Chrome/Edge + ffmpeg，缺少时退出码 3，HTML 动画不受影响。

## 三主题与三节奏

| 主题 | 默认 motion | 入场 | 边 | 适合 |
|---|---|---|---|---|
| style-a 杂志 | calm | 上浮淡入 | 平稳绘制 | 阅读型材料、版本演进 |
| style-b 蓝图 | precise | 轻微缩放 | 精准对位 | 协议、状态机、工程流程 |
| style-c 手账 | lively | 弹性放大 | 稍快 | 课堂演示、算法步骤 |

块内写 `"motion": "calm|precise|lively"` 可覆盖主题默认值。

## 边界

- 动画是 HTML 内的内联 SVG + CSS，不是视频，不含音频；
- 暂停是纯 CSS checkbox，不引入脚本；
- 打印和 `prefers-reduced-motion` 下显示最终帧与全部步骤；
- 平台只有 `write_file` 时不要伪造动画，保留静态分镜；
- 不宣称动画提升成绩，只提供“可复看”的过程表达。
