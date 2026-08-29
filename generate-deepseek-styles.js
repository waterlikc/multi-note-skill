// 案例生成脚本 - DeepSeek Harness 详解 (全 Style 演示)
import { generateNote, getSkillInfo } from './index.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🚀 DeepSeek Harness 全样式演示生成')
console.log('='.repeat(60))
console.log()

const outputDir = 'D:\\blog\\notes'

if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
}

// 案例1: Style A - 技术学习 (Harness 核心架构)
async function generateStyleA() {
    console.log('🎨 Style A: 学霸笔记本 (技术架构)')
    console.log('-'.repeat(40))

    const input = {
        content: `
# DeepSeek Harness 核心架构

## 设计哲学
DeepSeek Harness 旨在提供企业级的大模型应用开发体验。
它采用分层架构，将**推理引擎**、**工具链**与**可视化界面**解耦。

## 核心模块详解

### 1. Runtime Core (运行时核心)
- **负责**: 模型加载、内存管理、推理调度
- **特性**: 支持 4-bit/8-bit 量化，Flash Attention 2 加速

### 2. Skill Registry (技能注册中心)
- **负责**: 管理 Agent 可调用的外部工具
- **协议**: 基于 JSON Schema 定义输入输出
\`\`\`javascript
{
  "name": "search_web",
  "description": "搜索互联网",
  "parameters": { "query": { "type": "string" } }
}
\`\`\`

### 3. Session Manager (会话管理)
- **负责**: 维护多轮对话上下文 (Context Window)
- **策略**: 滑动窗口 + 摘要压缩，保证长对话不丢失关键信息

## 性能优化策略
1. **KV Cache 复用**: 减少重复计算
2. **Continuous Batching**: 动态批处理请求
3. **Flash Decoding**: 加速解码阶段
        `,
        title: 'DeepSeek Harness 核心架构',
        style: 'style-a' // 强制指定 Style A
    }

    const result = await generateNote(input)
    const filePath = join(outputDir, 'Harness-详解-StyleA-架构.html')
    writeFileSync(filePath, result.html, 'utf-8')
    console.log('✅ 生成成功:', filePath)
}

// 案例2: Style B - 会议纪要 (团队技术评审)
async function generateStyleB() {
    console.log('🎨 Style B: 手账皮革本 (技术评审)')
    console.log('-'.repeat(40))

    const input = {
        content: `
# Harness 插件系统评审会议

**时间**: 2026-08-23 10:00 AM
**参会人**: 核心开发组、架构师、产品经理

## 议题一：插件隔离机制
**结论**: 采用 WebAssembly Sandbox 方案。
- **优点**: 安全性高，冷启动快 (5ms)
- **缺点**: 内存限制 128MB
- **行动**: 张三负责完成 WASI 适配层开发 (DDL: 8.25)

## 议题二：工具热更新
**结论**: 引入 File Watcher + ESM Dynamic Import。
- **流程**: 代码变更 -> 检测 -> 注入 -> Fiber 重建
- **风险**: 循环依赖检测
- **行动**: 李四编写回归测试用例

## 议题三：可视化监控面板
**结论**: 集成 Prometheus Exporter。
- **指标**: Token 消耗、延迟 P99、缓存命中率
- **UI**: 采用 Vue3 + ECharts 实现

## 待办事项
| 任务 | 负责人 | 截止日期 |
|---|---|---|
| WASM 适配层 | 张三 | 2026-08-25 |
| 热更新测试 | 李四 | 2026-08-26 |
| Dashboard 原型 | 王五 | 2026-08-27 |
        `,
        title: 'Harness 插件系统评审',
        style: 'style-b' // 强制指定 Style B
    }

    const result = await generateNote(input)
    const filePath = join(outputDir, 'Harness-详解-StyleB-评审.html')
    writeFileSync(filePath, result.html, 'utf-8')
    console.log('✅ 生成成功:', filePath)
}

// 案例3: Style C - 课程大纲 (Masterclass)
async function generateStyleC() {
    console.log('🎨 Style C: 简约现代 (课程大纲)')
    console.log('-'.repeat(40))

    const input = {
        content: `
# DeepSeek Harness 开发大师课

## 课程简介
本课程旨在帮助开发者掌握企业级 Agent 应用的开发流程，从基础的 Prompt Engineering 到复杂的插件系统开发。

## 课程大纲

### 第一阶段：基础篇
- 环境搭建与 CLI 使用
- Context Engineering 基础
- 第一个 Hello World Skill

### 第二阶段：进阶篇
- 多模态输入处理 (OCR/ASR)
- 结构化输出与 JSON Mode
- 记忆系统设计 (RAG)

### 第三阶段：高级篇
- 自定义插件开发 (Node.js/Python)
- 性能优化与部署
- 安全性与合规性

## 学习成果
- 掌握 Harness 核心 API
- 能够独立开发并部署生产级 Agent
- 获得 DeepSeek 官方认证证书

## 导师团队
- **首席架构师**: 拥有 10 年 AI 工程经验
- **技术专家**: 负责 Harness 核心模块开发
        `,
        title: 'Harness 开发大师课',
        style: 'style-c' // 强制指定 Style C
    }

    const result = await generateNote(input)
    const filePath = join(outputDir, 'Harness-详解-StyleC-课程.html')
    writeFileSync(filePath, result.html, 'utf-8')
    console.log('✅ 生成成功:', filePath)
}

// 执行
async function main() {
    try {
        await generateStyleA()
        await generateStyleB()
        await generateStyleC()
        console.log('\n✨ 全样式演示生成完毕！')
    } catch (error) {
        console.error('❌ 生成失败:', error)
    }
}

main()
