// 案例生成脚本 - DeepSeek Harness 学习笔记
import { generateNote, getSkillInfo } from './index.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🎯 DeepSeek Harness 笔记生成案例')
console.log('='.repeat(60))
console.log()

const outputDir = 'D:\\blog\\notes'

if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
}

// 案例1: DeepSeek Harness 基础入门
async function generateDeepSeekBasics() {
    console.log('📌 案例1: DeepSeek Harness 基础入门')
    console.log('-'.repeat(40))

    const input = {
        content: `
# DeepSeek Harness 基础入门

## 什么是 DeepSeek Harness
DeepSeek Harness 是一个用于运行和优化大模型的开发框架。
它提供了一套完整的工具链，用于模型推理、微调和部署。

## 核心组件
1. **Model Engine**: 核心推理引擎
2. **Tooling CLI**: 命令行工具集
3. **Web GUI**: 可视化操作界面

## 快速开始
\`\`\`bash
# 安装 Harness
npm install -g @deepseek-ai/dsh

# 启动 Web 服务
dsh serve --port 3000

# 运行推理任务
dsh infer --model deepseek-coder "Write a hello world"
\`\`\`

## 配置示例
\`\`\`json
{
  "model": "deepseek-v2",
  "max_tokens": 4096,
  "temperature": 0.7
}
\`\`\`
        `,
        title: 'DeepSeek Harness 基础入门'
    }

    const result = await generateNote(input)
    const filePath = join(outputDir, 'DeepSeek-Harness-基础入门.html')
    writeFileSync(filePath, result.html, 'utf-8')
    console.log('✅ 生成成功:', filePath)
    return result
}

// 案例2: DeepSeek Harness 工具链详解
async function generateDeepSeekTooling() {
    console.log('📌 案例2: DeepSeek Harness 工具链详解')
    console.log('-'.repeat(40))

    const input = {
        content: `
# DeepSeek Harness 工具链详解

## CLI 常用命令
- \`dsh serve\`: 启动服务
- \`dsh infer\`: 执行推理
- \`dsh eval\`: 评估模型
- \`dsh export\`: 导出模型

## Web GUI 功能
1. **实时监控**: Token 使用量、延迟、吞吐量
2. **交互式调试**: 逐步查看推理过程
3. **可视化**: 注意力图、激活值分布

## 插件系统
\`\`\`javascript
// 自定义工具插件示例
export const weatherTool = {
    name: 'get_weather',
    description: 'Get weather for a location',
    parameters: {
        type: 'object',
        properties: {
            location: { type: 'string' }
        }
    },
    async execute({ location }) {
        return { temp: 25, condition: 'sunny' }
    }
}
\`\`\`

## 最佳实践
- 使用 Context Engineering 管理提示词
- 利用缓存机制减少重复计算
- 监控显存使用避免 OOM
        `,
        title: 'DeepSeek Harness 工具链详解'
    }

    const result = await generateNote(input)
    const filePath = join(outputDir, 'DeepSeek-Harness-工具链详解.html')
    writeFileSync(filePath, result.html, 'utf-8')
    console.log('✅ 生成成功:', filePath)
    return result
}

// 案例3: DeepSeek Harness 进阶技巧
async function generateDeepSeekAdvanced() {
    console.log('📌 案例3: DeepSeek Harness 进阶技巧')
    console.log('-'.repeat(40))

    const input = {
        content: `
# DeepSeek Harness 进阶技巧

## 性能优化
1. **KV Cache 优化**: 减少重复计算
2. **量化支持**: INT8/INT4 量化推理
3. **Flash Attention**: 优化注意力计算

## RAG 集成
\`\`\`python
from deepseek_harness import RAG

rag = RAG(
    model="deepseek-chat",
    vector_store="faiss",
    chunk_size=512
)

# 检索增强生成
response = rag.query("What is attention mechanism?")
\`\`\`

## Agent 模式
- 工具调用：支持自定义工具
- 多轮对话：上下文管理
- 代码执行：安全沙箱环境

## 调试技巧
\`\`\`bash
# 开启详细日志
dsh infer --verbose --log-level debug

# 导出推理轨迹
dsh trace export > trace.json
\`\`\`
        `,
        title: 'DeepSeek Harness 进阶技巧'
    }

    const result = await generateNote(input)
    const filePath = join(outputDir, 'DeepSeek-Harness-进阶技巧.html')
    writeFileSync(filePath, result.html, 'utf-8')
    console.log('✅ 生成成功:', filePath)
    return result
}

// 执行生成
async function main() {
    try {
        await generateDeepSeekBasics()
        await generateDeepSeekTooling()
        await generateDeepSeekAdvanced()
        
        console.log()
        console.log('✨ 所有案例生成完成!')
        console.log('📁 文件保存在:', outputDir)
    } catch (error) {
        console.error('❌ 生成失败:', error)
    }
}

main()
