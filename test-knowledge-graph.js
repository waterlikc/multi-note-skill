// 知识图谱系统测试用例
import { KnowledgeGraph } from './core/knowledge-graph.js'
import { LearningPath, generateLearningPath } from './core/learning-path.js'
import { WeaknessDetector, detectWeaknesses } from './core/weakness-detector.js'
import { SmartNoteGenerator, createSmartNoteGenerator } from './core/smart-note-generator.js'

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

// 异步测试函数
async function testAsync(name, fn) {
  testResults.total++
  try {
    await fn()
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

// ==================== 知识图谱测试 ====================
console.log(colors.cyan('\n🧠 知识图谱测试'))

test('添加知识点', () => {
  const graph = new KnowledgeGraph()
  const nodeId = graph.addNode({
    name: 'Python基础',
    subject: '编程',
    difficulty: 3,
    importance: 7
  })
  assert(nodeId, '应该返回节点ID')
  assert(graph.getNode(nodeId), '应该能获取节点')
  assert(graph.getNode(nodeId).name === 'Python基础', '节点名称应该匹配')
})

test('批量添加知识点', () => {
  const graph = new KnowledgeGraph()
  const nodeIds = graph.addNodes([
    { name: '变量', subject: '编程', difficulty: 2 },
    { name: '数据类型', subject: '编程', difficulty: 3 },
    { name: '控制流', subject: '编程', difficulty: 4 }
  ])
  assert(nodeIds.length === 3, '应该返回3个节点ID')
  assert(graph.nodes.size === 3, '应该有3个节点')
})

test('添加关系', () => {
  const graph = new KnowledgeGraph()
  const id1 = graph.addNode({ name: '变量', subject: '编程' })
  const id2 = graph.addNode({ name: '数据类型', subject: '编程' })
  
  graph.addEdge(id1, id2, 'prerequisite', 0.8)
  const edges = graph.getEdges(id1)
  assert(edges.length === 1, '应该有1条边')
  assert(edges[0].type === 'prerequisite', '关系类型应该是prerequisite')
})

test('搜索知识点', () => {
  const graph = new KnowledgeGraph()
  graph.addNode({ name: 'Python基础', subject: '编程', tags: ['python'] })
  graph.addNode({ name: 'JavaScript基础', subject: '编程', tags: ['javascript'] })
  graph.addNode({ name: '数学公式', subject: '数学', tags: ['math'] })
  
  const results = graph.searchNodes('基础')
  assert(results.length === 2, '应该找到2个结果')
})

test('按学科获取知识点', () => {
  const graph = new KnowledgeGraph()
  graph.addNode({ name: 'Python', subject: '编程', chapter: '基础' })
  graph.addNode({ name: 'JavaScript', subject: '编程', chapter: '基础' })
  graph.addNode({ name: '数学', subject: '数学', chapter: '代数' })
  
  const nodes = graph.getNodesByChapter('编程', '基础')
  assert(nodes.length === 2, '应该找到2个编程基础节点')
})

// ==================== 学习路径测试 ====================
console.log(colors.cyan('\n📚 学习路径测试'))

test('生成学习路径', () => {
  const graph = new KnowledgeGraph()
  const id1 = graph.addNode({ name: '变量', subject: '编程', difficulty: 2 })
  const id2 = graph.addNode({ name: '数据类型', subject: '编程', difficulty: 3 })
  const id3 = graph.addNode({ name: '函数', subject: '编程', difficulty: 5 })
  
  graph.addEdge(id1, id2, 'prerequisite', 0.8)
  graph.addEdge(id2, id3, 'prerequisite', 0.8)
  
  const learningPath = new LearningPath({ knowledgeGraph: graph })
  const result = learningPath.generatePath({
    studentId: 'test-student',
    subject: '编程',
    targetKnowledge: '函数',
    currentKnowledge: [id1]
  })
  
  assert(result.success, '应该成功生成路径')
  assert(result.paths.length > 0, '应该有学习路径')
})

test('学习路径包含前置知识', () => {
  const graph = new KnowledgeGraph()
  const id1 = graph.addNode({ name: '变量', subject: '编程', difficulty: 2 })
  const id2 = graph.addNode({ name: '数据类型', subject: '编程', difficulty: 3 })
  const id3 = graph.addNode({ name: '函数', subject: '编程', difficulty: 5 })
  
  graph.addEdge(id1, id2, 'prerequisite', 0.8)
  graph.addEdge(id2, id3, 'prerequisite', 0.8)
  
  const learningPath = new LearningPath({ knowledgeGraph: graph })
  const result = learningPath.generatePath({
    studentId: 'test-student',
    subject: '编程',
    targetKnowledge: '函数',
    currentKnowledge: []
  })
  
  assert(result.success, '应该成功生成路径')
  assert(result.bestPath, '应该有最佳路径')
  assert(result.bestPath.nodes.length >= 2, '路径应该包含多个知识点')
})

test('学习路径估计时间', () => {
  const graph = new KnowledgeGraph()
  const id1 = graph.addNode({ name: '变量', subject: '编程', difficulty: 2 })
  const id2 = graph.addNode({ name: '函数', subject: '编程', difficulty: 5 })
  
  graph.addEdge(id1, id2, 'prerequisite', 0.8)
  
  const learningPath = new LearningPath({ knowledgeGraph: graph })
  const result = learningPath.generatePath({
    studentId: 'test-student',
    subject: '编程',
    targetKnowledge: '函数',
    currentKnowledge: [id1]
  })
  
  assert(result.success, '应该成功生成路径')
  assert(result.bestPath.estimatedTime > 0, '应该有估计学习时间')
})

// ==================== 薄弱点识别测试 ====================
console.log(colors.cyan('\n🔍 薄弱点识别测试'))

test('检测薄弱点', () => {
  const graph = new KnowledgeGraph()
  graph.addNode({ name: '变量', subject: '编程', difficulty: 2 })
  graph.addNode({ name: '函数', subject: '编程', difficulty: 5 })
  graph.addNode({ name: '类', subject: '编程', difficulty: 7 })
  
  const detector = new WeaknessDetector({ knowledgeGraph: graph })
  const result = detector.detectWeaknesses({
    studentId: 'test-student',
    subject: '编程',
    learningRecords: {}
  })
  
  assert(result.success, '应该成功检测')
  assert(result.weaknesses.length > 0, '应该检测到薄弱点')
})

test('薄弱点分析包含原因', () => {
  const graph = new KnowledgeGraph()
  graph.addNode({ name: '变量', subject: '编程', difficulty: 2 })
  graph.addNode({ name: '函数', subject: '编程', difficulty: 5 })
  
  const detector = new WeaknessDetector({ knowledgeGraph: graph })
  const result = detector.detectWeaknesses({
    studentId: 'test-student',
    subject: '编程',
    learningRecords: {}
  })
  
  assert(result.success, '应该成功检测')
  assert(result.analysis, '应该有分析结果')
  assert(result.analysis.notStudied, '应该有未学习分析')
})

test('薄弱点生成建议', () => {
  const graph = new KnowledgeGraph()
  graph.addNode({ name: '变量', subject: '编程', difficulty: 2 })
  graph.addNode({ name: '函数', subject: '编程', difficulty: 5 })
  
  const detector = new WeaknessDetector({ knowledgeGraph: graph })
  const result = detector.detectWeaknesses({
    studentId: 'test-student',
    subject: '编程',
    learningRecords: {}
  })
  
  assert(result.success, '应该成功检测')
  assert(result.suggestions, '应该有建议')
  assert(result.suggestions.length > 0, '应该有改进建议')
})

// ==================== 智能笔记生成器知识图谱集成测试 ====================
console.log(colors.cyan('\n🚀 智能笔记生成器知识图谱集成测试'))

test('创建带知识图谱的生成器', () => {
  const generator = createSmartNoteGenerator()
  assert(generator.knowledgeGraph, '应该有知识图谱')
  assert(generator.learningPath, '应该有学习路径')
  assert(generator.weaknessDetector, '应该有薄弱点检测器')
})

test('添加知识点到知识图谱', () => {
  const generator = createSmartNoteGenerator()
  const nodeId = generator.addKnowledgePoint({
    name: 'Python基础',
    subject: '编程',
    difficulty: 3
  })
  assert(nodeId, '应该返回节点ID')
  assert(generator.knowledgeGraph.getNode(nodeId), '应该能获取节点')
})

test('从笔记内容提取知识点', () => {
  const generator = createSmartNoteGenerator()
  const result = generator.extractAndAddKnowledge(
    'Python是一种编程语言，变量用于存储数据，函数用于封装代码。',
    { subject: '编程' }
  )
  assert(result.success, '应该成功提取')
  assert(result.addedCount > 0, '应该添加知识点')
})

test('获取知识图谱统计', () => {
  const generator = createSmartNoteGenerator()
  generator.addKnowledgePoint({ name: 'Python', subject: '编程' })
  generator.addKnowledgePoint({ name: 'JavaScript', subject: '编程' })
  
  const stats = generator.getKnowledgeGraphStats()
  assert(stats.nodeCount === 2, '应该有2个节点')
})

test('搜索知识点', () => {
  const generator = createSmartNoteGenerator()
  generator.addKnowledgePoint({ name: 'Python基础', subject: '编程' })
  generator.addKnowledgePoint({ name: 'JavaScript基础', subject: '编程' })
  
  const results = generator.searchKnowledge('Python')
  assert(results.length === 1, '应该找到1个结果')
  assert(results[0].name === 'Python基础', '应该找到Python基础')
})

// ==================== 测试结果统计 ====================
console.log(colors.cyan('\n' + '='.repeat(50)))
console.log(colors.cyan('📊 知识图谱系统测试结果统计'))
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
