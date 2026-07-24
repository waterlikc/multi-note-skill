// 智能笔记生成器 v2.0 测试用例
import { SmartNoteGenerator, createSmartNoteGenerator, smartGenerate } from './core/smart-note-generator.js'
import { SubjectDetector, detectSubject } from './core/subject-detector.js'
import { ComplexityAnalyzer, analyzeComplexity } from './core/complexity-analyzer.js'
import { KnowledgeExtractor, extractKnowledge } from './core/knowledge-extractor.js'
import { StructureSelector, selectStructure } from './core/structure-selector.js'

// 测试颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
}

// 测试函数
function test(name, fn) {
  testResults.total++
  try {
    fn()
    testResults.passed++
    console.log(colors.green(`✅ PASS: ${name}`))
  } catch (error) {
    testResults.failed++
    console.log(colors.red(`❌ FAIL: ${name}`))
    console.log(colors.red(`   Error: ${error.message}`))
  }
}

// 断言函数
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

// ==================== 学科识别测试 ====================
console.log(colors.cyan('\n📚 学科识别测试'))

test('识别数学内容', () => {
  const content = '数学公式：E = mc²，定理：勾股定理，计算微积分'
  const result = detectSubject(content)
  assert(result.subject === 'mathematics', `期望 mathematics，实际 ${result.subject}`)
  assert(result.confidence > 0, '置信度应该大于0')
})

test('识别编程内容', () => {
  const content = 'Python编程，def function()，class MyClass，import os'
  const result = detectSubject(content)
  assert(result.subject === 'python' || result.subject === 'programming', 
    `期望 python 或 programming，实际 ${result.subject}`)
})

test('识别物理内容', () => {
  const content = '物理定律：F = ma，牛顿力学，电磁学，量子力学'
  const result = detectSubject(content)
  assert(result.subject === 'physics', `期望 physics，实际 ${result.subject}`)
})

test('识别英语内容', () => {
  const content = 'English grammar, vocabulary, tense, sentence structure'
  const result = detectSubject(content)
  assert(result.subject === 'english', `期望 english，实际 ${result.subject}`)
})

test('识别历史内容', () => {
  const content = '历史事件：1949年新中国成立，古代历史，近代史'
  const result = detectSubject(content)
  assert(result.subject === 'history', `期望 history，实际 ${result.subject}`)
})

// ==================== 复杂度分析测试 ====================
console.log(colors.cyan('\n📊 复杂度分析测试'))

test('分析简单内容复杂度', () => {
  const content = '这是一个简单的介绍，适合初学者。'
  const result = analyzeComplexity(content)
  assert(result.score >= 1 && result.score <= 10, '复杂度分数应该在1-10之间')
  assert(result.level, '应该有复杂度等级')
})

test('分析复杂内容复杂度', () => {
  const content = `人工智能（AI）是计算机科学的一个分支，致力于创建能够模拟人类智能的系统。
  机器学习是AI的核心技术之一，包括监督学习、无监督学习和强化学习。
  深度学习使用神经网络，特别是卷积神经网络（CNN）和循环神经网络（RNN）。
  自然语言处理（NLP）是AI的另一个重要领域，包括文本分析、机器翻译等。
  计算机视觉使机器能够理解和解释图像和视频。`
  const result = analyzeComplexity(content)
  assert(result.score > 3, '复杂内容的分数应该较高')
  assert(result.scores.vocabulary > 0 || result.scores.concept > 0, '应该识别到专业词汇或概念')
})

test('分析数学公式复杂度', () => {
  const content = '公式：∫f(x)dx = F(x) + C，∑(i=1 to n) = n(n+1)/2'
  const result = analyzeComplexity(content)
  assert(result.scores.math > 0, '应该识别到数学公式')
})

// ==================== 知识点提取测试 ====================
console.log(colors.cyan('\n💡 知识点提取测试'))

test('提取定义类知识点', () => {
  const content = '人工智能是指由人工系统实现的智能。机器学习是指通过数据训练模型的方法。'
  const result = extractKnowledge(content)
  assert(result.knowledgePoints.length > 0, '应该提取到知识点')
  const definitions = result.knowledgePoints.filter(p => p.type === 'definition')
  assert(definitions.length > 0, '应该提取到定义类知识点')
})

test('提取方法类知识点', () => {
  const content = '方法：首先安装依赖，然后配置环境，最后运行程序。'
  const result = extractKnowledge(content)
  const methods = result.knowledgePoints.filter(p => p.type === 'method')
  assert(methods.length > 0, '应该提取到方法类知识点')
})

test('提取重点类知识点', () => {
  const content = '重点：这是核心概念。关键：这是重要原理。'
  const result = extractKnowledge(content)
  const importants = result.knowledgePoints.filter(p => p.type === 'important')
  assert(importants.length > 0, '应该提取到重点类知识点')
})

test('提取公式类知识点', () => {
  const content = '公式：E = mc²，计算公式：v = d/t'
  const result = extractKnowledge(content)
  const formulas = result.knowledgePoints.filter(p => p.type === 'formula')
  assert(formulas.length > 0, '应该提取到公式类知识点')
})

// ==================== 结构选择测试 ====================
console.log(colors.cyan('\n📋 结构选择测试'))

test('选择数学结构', () => {
  const result = selectStructure('mathematics', 5)
  assert(result.structure, '应该有结构')
  assert(result.structure.sections.length > 0, '应该有章节')
  assert(result.recommendedTemplate, '应该有推荐模板')
})

test('选择编程结构', () => {
  const result = selectStructure('programming', 6)
  assert(result.structure, '应该有结构')
  assert(result.subjectName === '编程', `期望 编程，实际 ${result.subjectName}`)
})

test('选择入门级结构', () => {
  const result = selectStructure('physics', 2)
  assert(result.structure.name.includes('基础') || result.structure.name.includes('入门'), 
    '入门级应该选择基础结构')
})

test('选择高级结构', () => {
  const result = selectStructure('ai', 9)
  assert(result.structure.name.includes('高级') || result.structure.name.includes('专家'), 
    '高级应该选择高级结构')
})

// ==================== 智能笔记生成器测试 ====================
console.log(colors.cyan('\n🚀 智能笔记生成器测试'))

test('创建智能笔记生成器', () => {
  const generator = createSmartNoteGenerator()
  assert(generator instanceof SmartNoteGenerator, '应该创建SmartNoteGenerator实例')
  assert(generator.config, '应该有配置')
})

test('生成笔记 - 文本输入', async () => {
  const generator = createSmartNoteGenerator()
  const result = await generator.generate('Python编程基础：def function()定义函数')
  assert(result.success, '应该成功生成')
  assert(result.note, '应该有笔记内容')
  assert(result.metadata.subject, '应该有学科信息')
  assert(result.metadata.complexity, '应该有复杂度信息')
})

test('生成笔记 - 带选项', async () => {
  const generator = createSmartNoteGenerator()
  const result = await generator.generate('数学公式：E = mc²', {
    title: '物理公式笔记',
    template: 'styleA'
  })
  assert(result.success, '应该成功生成')
  assert(result.note.title === '物理公式笔记', '标题应该匹配')
})

test('获取统计信息', () => {
  const generator = createSmartNoteGenerator()
  const stats = generator.getStats()
  assert(stats, '应该有统计信息')
  assert(typeof stats.cacheSize === 'number', '缓存大小应该是数字')
})

// ==================== 测试结果统计 ====================
console.log(colors.cyan('\n' + '='.repeat(50)))
console.log(colors.cyan('📊 测试结果统计'))
console.log(colors.cyan('='.repeat(50)))
console.log(`总计: ${testResults.total}`)
console.log(colors.green(`通过: ${testResults.passed}`))
console.log(colors.red(`失败: ${testResults.failed}`))
console.log(colors.yellow(`跳过: ${testResults.skipped}`))

if (testResults.failed === 0) {
  console.log(colors.green('\n🎉 所有测试通过！'))
} else {
  console.log(colors.red(`\n⚠️ 有 ${testResults.failed} 个测试失败`))
}

// 导出测试结果
export { testResults }
