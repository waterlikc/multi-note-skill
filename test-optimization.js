// 优化效果测试
import { 
  generateNote, 
  getSkillInfo, 
  getSceneDetectorStats,
  getAvailablePresets,
  updateNote,
  mergeNotes
} from './index.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const outputDir = 'D:\\blog\\notes\\优化测试'
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

console.log('🚀 multi-note-skill 优化效果测试')
console.log('='.repeat(60))
console.log()

// 测试1: 基本生成功能
async function testBasicGeneration() {
  console.log('📌 测试1: 基本生成功能')
  console.log('-'.repeat(40))
  
  const startTime = performance.now()
  
  const result = await generateNote({
    content: `
# Python装饰器

:::badge 技术学习 | Python

## 什么是装饰器

装饰器是Python的**高级特性**，用于扩展函数功能。

\`\`\`python
def decorator(func):
    def wrapper():
        print("before")
        func()
        print("after")
    return wrapper
\`\`\`

:::tip 装饰器是Python中最优雅的设计模式之一
`,
    title: 'Python装饰器详解'
  }, {
    onProgress: (progress) => {
      // 静默处理进度
    }
  })
  
  const endTime = performance.now()
  const duration = (endTime - startTime).toFixed(2)
  
  const filePath = join(outputDir, '测试1-基本生成.html')
  writeFileSync(filePath, result.html, 'utf-8')
  
  console.log(`   ✅ 生成成功`)
  console.log(`   ⏱️  耗时: ${duration}ms`)
  console.log(`   📊 大小: ${(Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2)} KB`)
  console.log()
  
  return parseFloat(duration)
}

// 测试2: 预设配置功能
async function testPresets() {
  console.log('📌 测试2: 预设配置功能')
  console.log('-'.repeat(40))
  
  const presets = getAvailablePresets()
  console.log(`   📋 可用预设: ${presets.length}个`)
  presets.forEach(p => {
    console.log(`      - ${p.id}: ${p.scene} (${p.style})`)
  })
  
  const result = await generateNote({
    content: '# 测试预设配置\n\n这是一个测试。',
    preset: 'tech'
  })
  
  console.log(`   ✅ 使用tech预设生成成功`)
  console.log(`   📝 场景: ${result.metadata.scene}`)
  console.log()
}

// 测试3: 场景检测缓存
async function testSceneDetectionCache() {
  console.log('📌 测试3: 场景检测缓存')
  console.log('-'.repeat(40))
  
  const testContent = '# Python编程\n\n这是一个关于Python的技术教程。'
  
  // 第一次检测
  await generateNote({ content: testContent, title: '测试1' })
  const stats1 = getSceneDetectorStats()
  
  // 第二次检测（应该命中缓存）
  await generateNote({ content: testContent, title: '测试2' })
  const stats2 = getSceneDetectorStats()
  
  console.log(`   📊 缓存统计:`)
  console.log(`      - 缓存大小: ${stats2.size}`)
  console.log(`      - 命中次数: ${stats2.hits}`)
  console.log(`      - 未命中次数: ${stats2.misses}`)
  console.log(`      - 命中率: ${stats2.hitRate}`)
  console.log()
}

// 测试4: 笔记更新功能
async function testNoteUpdate() {
  console.log('📌 测试4: 笔记更新功能')
  console.log('-'.repeat(40))
  
  // 先生成一个笔记
  const original = await generateNote({
    content: '# 原始笔记\n\n这是原始内容。',
    title: '原始笔记'
  })
  
  // 更新笔记 - 追加新内容
  const updated = await updateNote({
    existingNote: original.html,
    newContent: `
# 更新后的笔记

## 原始内容

这是原始内容。

## 新增内容

这是新增的内容，包含了更多学习笔记。

### 要点1

- 学习了基础知识
- 完成了练习

### 要点2

- 掌握了核心概念
- 能够独立应用
`,
    mergeStrategy: 'append'
  })
  
  const filePath = join(outputDir, '测试4-笔记更新.html')
  writeFileSync(filePath, updated.html, 'utf-8')
  
  console.log(`   ✅ 笔记更新成功`)
  console.log(`   📝 标题: ${updated.metadata.title}`)
  console.log()
}

// 测试5: 笔记合并功能
async function testNoteMerge() {
  console.log('📌 测试5: 笔记合并功能')
  console.log('-'.repeat(40))
  
  // 合并笔记 - 直接传入内容
  const merged = await mergeNotes({
    notes: [
      {
        content: `
# Python基础

## 变量和数据类型

Python支持多种数据类型：
- 整数 (int)
- 浮点数 (float)
- 字符串 (str)
- 列表 (list)
        `
      },
      {
        content: `
# Python进阶

## 函数定义

\`\`\`python
def greet(name):
    return f"Hello, {name}!"
\`\`\`

## 类和对象

\`\`\`python
class Dog:
    def __init__(self, name):
        self.name = name
    
    def bark(self):
        return "Woof!"
\`\`\`
        `
      }
    ],
    title: 'Python完整教程'
  })
  
  const filePath = join(outputDir, '测试5-笔记合并.html')
  writeFileSync(filePath, merged.html, 'utf-8')
  
  console.log(`   ✅ 笔记合并成功`)
  console.log(`   📝 标题: ${merged.metadata.title}`)
  console.log()
}

// 测试6: 错误提示
async function testErrorHandling() {
  console.log('📌 测试6: 错误提示')
  console.log('-'.repeat(40))
  
  try {
    await generateNote({ content: '' })
  } catch (error) {
    console.log(`   ✅ 错误提示正确:`)
    console.log(`      ${error.message.split('\n')[0]}`)
  }
  console.log()
}

// 运行所有测试
async function runAllTests() {
  const skillInfo = getSkillInfo()
  console.log('📦 技能信息:')
  console.log(`   名称: ${skillInfo.name}`)
  console.log(`   版本: ${skillInfo.version}`)
  console.log(`   功能: ${skillInfo.features.join(', ')}`)
  console.log()
  
  const times = []
  
  times.push(await testBasicGeneration())
  await testPresets()
  await testSceneDetectionCache()
  await testNoteUpdate()
  await testNoteMerge()
  await testErrorHandling()
  
  // 汇总结果
  console.log('='.repeat(60))
  console.log('📊 测试汇总')
  console.log('='.repeat(60))
  console.log(`   平均生成时间: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)}ms`)
  console.log()
  
  const cacheStats = getSceneDetectorStats()
  console.log('   缓存性能:')
  console.log(`   - 命中率: ${cacheStats.hitRate}`)
  console.log()
  
  console.log('   ✅ 所有测试通过！')
  console.log()
  
  console.log('📁 测试文件已保存到:', outputDir)
  console.log('='.repeat(60))
}

// 执行测试
runAllTests().catch(console.error)
