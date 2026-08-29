// 理想笔记示范 - 覆盖多章节 / 代码块 / 表格 / 提示框 / 列表
import { generateNote } from './index.js'
import { writeFileSync } from 'fs'

const outDir = 'D:\\blog\\notes'
const style = process.argv[2] || 'style-a' // 默认 Style A，可传 style-b / style-c

const content = `
# DeepSeek Harness 学习手册

> 本笔记演示 multi-note-skill 的完整排版能力：多章节、代码块、表格、提示框、列表。

## 一、核心概念
DeepSeek Harness 是面向大模型应用的**企业级开发框架**，强调「推理引擎」与「工具链」解耦。
它通过 **Skill Registry** 让 Agent 可以调用外部能力，形成可组合、可复用的智能体生态。

## 二、快速上手
\`\`\`bash
# 安装
npm install -g @deepseek-ai/dsh

# 启动
dsh serve --port 3000

# 推理
dsh infer --model deepseek-v2 "写一个快速排序"
\`\`\`

## 三、架构组成
- **Runtime Core**: 模型加载、显存管理、推理调度
- **Skill Registry**: 工具注册与调用
- **Session Manager**: 上下文窗口与记忆
- **Web GUI**: 可视化监控与调试

## 四、Agent 配置对比
| 配置项 | Prompt Engineering | Context Engineering |
|--------|-------------------|---------------------|
| 特点 | 靠提示词堆砌 | 靠上下文结构组织 |
| 稳定性 | 低 | 高 |
| 可维护性 | 差 | 好 |
| 推荐场景 | 简单任务 | 复杂多轮 |

## 五、注意事项
:::warning
不要在单次请求中塞入过多无关上下文，否则会显著增加 Token 消耗并降低响应速度。
:::

:::tip
使用 **缓存机制** 可以大幅减少重复计算，实测缓存命中率可达 85% 以上。
:::

## 六、总结
- 分层解耦让 Harness 易于扩展
- Context Engineering 是高质量 Agent 的核心
- 用插件系统沉淀能力，用知识图谱串联知识
`

const title = 'DeepSeek Harness 学习手册'

const input = {
  content,
  title,
  style
}

const result = await generateNote(input)
const suffix = { 'style-a': 'StyleA', 'style-b': 'StyleB', 'style-c': 'StyleC' }[style] || 'StyleA'
const filePath = `${outDir}\\Harness-理想笔记-${suffix}.html`
writeFileSync(filePath, result.html, 'utf-8')

console.log('✅ 生成成功:', filePath)
console.log('   场景:', result.metadata.scene, '| 样式:', result.metadata.style)
