# 测试交接 · 给队友

版本：multi-note-skill v3.2.0  
目标：两个人跑同一套测试，结果能对上；不是“我觉得能跑”。

## 1. 前提

- Node.js 20 或更高；
- 不需要 npm install，没有第三方依赖；
- 不需要联网；
- 不需要 Chrome/ffmpeg（GIF 导出才需要）。

## 2. 一键跑（Windows）

双击 **跑测试.cmd**，或命令行：

    cd multi-note-skill
    跑测试.cmd

它会依次跑：

1. `node tests/selfcheck.mjs`（14 项自检）
2. `node --test tests/runtime.test.mjs tests/animation.test.mjs`（105 项）
3. `node cli/note.mjs audit .`

结果写入 **测试结果-你的电脑名.txt**，最后一行应是：

    PASS: 105 tests / 14 selfchecks / 0 audit issues

## 3. macOS / Linux

    bash run-tests.sh

结果同样写入 `测试结果-主机名.txt`。

## 4. 手动跑（排查用）

    node -v
    node tests/selfcheck.mjs
    node --test tests/runtime.test.mjs tests/animation.test.mjs
    node cli/note.mjs audit .
    node tools/hash-manifest.mjs

## 5. 预期数字

| 项目 | 预期 |
|---|---|
| 自检 | 14 项通过 |
| runtime + animation | 105 项通过，0 fail |
| audit | 0 个审计问题 |
| 退出码 | 0 / 0 / 0 |

如果数字不是 105，先发完整输出，不要改代码。

## 6. 文件指纹

在干净交接包上运行 `node tools/hash-manifest.mjs`，应得到：

| 文件 | SHA256 前 16 位 |
|---|---|
| SKILL.md | ab9693e9cf8c3178 |
| package.json | b2ec7daced9d701d |
| tests/runtime.test.mjs | 48b660a06645c4ea |
| tests/animation.test.mjs | bc22b71a1c837c0a |
| tests/selfcheck.mjs | b86bce692533f0db |
| src/animation/schema.mjs | 6697ed1c4b826dc8 |
| src/animation/timeline.mjs | fa06f469a6bfdeca |
| src/animation/layout.mjs | 89dc359bfe189ccb |
| src/animation/svg.mjs | f69590199639b819 |
| examples/tcp-handshake.json | d1a85b66bf6f38f7 |
| examples/tcp-handshake.html | d384c3c5a6d1832c |
| examples/tcp-handshake.gif | cf908854026e458a |
| docs/概念动画.md | c45970d75230becf |

只要有一行不同，说明文件被改过或不是同一包。先停下，把 manifest 发我。

## 7. 视觉验收（不替代自动测试）

打开 `examples/tcp-handshake.html`：

- [ ] 自动循环；
- [ ] 点“暂停 / 继续”能停/继续；
- [ ] 打印预览有最终帧 + 全部步骤，没有暂停按钮；
- [ ] 系统开启“减少动态”后静态可读；
- [ ] 375px 宽不横向滚动；
- [ ] 深色模式下文字和折线仍看得清。

打开 `examples/tcp-handshake.gif`：应看到 5 秒循环，58 帧。

GIF 导出依赖本机 Chrome/Edge + ffmpeg，不属于必测；要测就运行：

    node cli/note.mjs animate examples/tcp-handshake.json out.gif --block tcp-three-way --fps 12 --width 960

## 8. 回传什么

请发我：

1. 操作系统 + `node -v`；
2. **测试结果-你的电脑名.txt**；
3. `node tools/hash-manifest.mjs` 的完整输出；
4. 任何一项失败时的完整终端输出（不要只发“失败了”）。

## 9. 对照表

| 项 | 我（本机） | 队友 |
|---|---|---|
| 系统 / Node |  |  |
| selfcheck |  |  |
| tests 105 / fail |  |  |
| audit 0 |  |  |
| hash manifest 一致 |  |  |
| 视觉验收 6 项 |  |  |

## 10. 注意

- 不要改测试来“让它过”；
- 不要把 `node_modules`、`out/`、个人账号密码打进包；
- 测试失败先保留现场，别删文件；
- 这是交接包，不是含账号的登录包。
