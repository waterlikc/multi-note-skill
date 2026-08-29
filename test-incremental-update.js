// 增量更新系统测试用例
import { NoteParser, parseNote } from './core/note-parser.js'
import { ContentComparer, compareContent } from './core/content-comparer.js'
import { NoteMerger, mergeNote } from './core/note-merger.js'
import { VersionManager, createVersionManager } from './core/version-manager.js'
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

// ==================== 笔记解析器测试 ====================
console.log(colors.cyan('\n📝 笔记解析器测试'))

testAsync('解析HTML标题', async () => {
  const html = '<html><head><title>测试标题</title></head><body><h1>内容</h1></body></html>'
  const result = await parseNote(html)
  assert(result.success, '应该成功解析')
  assert(result.title === '测试标题', `期望 测试标题，实际 ${result.title}`)
})

testAsync('解析HTML章节', async () => {
  const html = `
    <html>
      <body>
        <section>
          <h2>第一章</h2>
          <p>这是第一章的内容</p>
        </section>
        <section>
          <h2>第二章</h2>
          <p>这是第二章的内容</p>
        </section>
      </body>
    </html>
  `
  const result = await parseNote(html)
  assert(result.success, '应该成功解析')
  assert(result.sections.length === 2, `期望 2 个章节，实际 ${result.sections.length}`)
})

testAsync('解析代码块', async () => {
  const html = `
    <html>
      <body>
        <pre><code class="language-python">
def hello():
    print("Hello, World!")
        </code></pre>
      </body>
    </html>
  `
  const result = await parseNote(html)
  assert(result.success, '应该成功解析')
  assert(result.codeBlocks.length === 1, `期望 1 个代码块，实际 ${result.codeBlocks.length}`)
  assert(result.codeBlocks[0].language === 'python', `期望 python，实际 ${result.codeBlocks[0].language}`)
})

testAsync('解析知识点', async () => {
  const html = `
    <html>
      <body>
        <p><span class="highlight">重要概念</span></p>
        <p><span class="red-text">重点内容</span></p>
      </body>
    </html>
  `
  const result = await parseNote(html)
  assert(result.success, '应该成功解析')
  assert(result.knowledgePoints.length >= 2, `期望 >= 2 个知识点，实际 ${result.knowledgePoints.length}`)
})

// ==================== 内容对比器测试 ====================
console.log(colors.cyan('\n🔍 内容对比器测试'))

test('对比相同内容', () => {
  const oldContent = '这是测试内容'
  const newContent = '这是测试内容'
  const result = compareContent(oldContent, newContent)
  assert(result.success, '应该成功对比')
  assert(result.similarity === 1, `期望相似度 1，实际 ${result.similarity}`)
})

test('对比不同内容', () => {
  const oldContent = '这是旧内容'
  const newContent = '这是新内容'
  const result = compareContent(oldContent, newContent)
  assert(result.success, '应该成功对比')
  assert(result.similarity < 1, `期望相似度 < 1，实际 ${result.similarity}`)
})

test('检测新增内容', () => {
  const oldContent = '第一段内容\n\n第二段内容'
  const newContent = '第一段内容\n\n第二段内容\n\n第三段新增内容'
  const result = compareContent(oldContent, newContent)
  assert(result.success, '应该成功对比')
  assert(result.added.length > 0, '应该检测到新增内容')
})

test('检测删除内容', () => {
  const oldContent = '第一段内容\n\n第二段内容\n\n第三段内容'
  const newContent = '第一段内容\n\n第三段内容'
  const result = compareContent(oldContent, newContent)
  assert(result.success, '应该成功对比')
  assert(result.removed.length > 0, '应该检测到删除内容')
})

// ==================== 笔记合并器测试 ====================
console.log(colors.cyan('\n🔗 笔记合并器测试'))

test('追加合并', () => {
  const oldHtml = '<html><body><div class="notebook"><h1>旧内容</h1></div></body></html>'
  const newContent = '新增内容'
  const compareResult = { success: true, added: [], removed: [], modified: [], duplicates: [] }
  
  const merger = new NoteMerger()
  const result = merger.performMerge(oldHtml, newContent, compareResult, { strategy: 'append' })
  
  assert(result.success, '应该成功合并')
  assert(result.mergedHtml.includes('新增内容'), '应该包含新增内容')
  assert(result.mergedHtml.includes('旧内容'), '应该保留旧内容')
})

test('智能合并', () => {
  const oldHtml = '<html><body><div class="notebook"><h1>笔记</h1><p>旧内容</p></div></body></html>'
  const newContent = '新内容'
  const compareResult = { 
    success: true, 
    added: [{ content: '新内容', position: 1 }], 
    removed: [], 
    modified: [], 
    duplicates: [] 
  }
  
  const merger = new NoteMerger()
  const result = merger.performMerge(oldHtml, newContent, compareResult, { strategy: 'smart' })
  
  assert(result.success, '应该成功合并')
})

// ==================== 版本管理器测试 ====================
console.log(colors.cyan('\n📚 版本管理器测试'))

test('创建版本', async () => {
  const manager = new VersionManager()
  const noteData = { content: '测试内容', title: '测试标题' }
  
  const result = await manager.createVersion('test.html', noteData)
  assert(result.success, '应该成功创建版本')
  assert(result.version, '应该有版本信息')
  assert(result.version.version === 'v1.0.0', `期望 v1.0.0，实际 ${result.version.version}`)
})

test('获取版本历史', async () => {
  const manager = new VersionManager()
  
  await manager.createVersion('test.html', { content: '版本1' })
  await manager.createVersion('test.html', { content: '版本2' })
  await manager.createVersion('test.html', { content: '版本3' })
  
  const history = manager.getVersionHistory('test.html')
  assert(history.length === 3, `期望 3 个版本，实际 ${history.length}`)
})

test('版本号递增', async () => {
  const manager = new VersionManager()
  
  const result1 = await manager.createVersion('test.html', { content: '版本1' })
  const result2 = await manager.createVersion('test.html', { content: '版本2' })
  
  assert(result1.version.version === 'v1.0.0', `期望 v1.0.0，实际 ${result1.version.version}`)
  assert(result2.version.version === 'v1.0.1', `期望 v1.0.1，实际 ${result2.version.version}`)
})

test('获取最新版本', async () => {
  const manager = new VersionManager()
  
  await manager.createVersion('test.html', { content: '版本1' })
  await manager.createVersion('test.html', { content: '版本2' })
  
  const latest = manager.getLatestVersion('test.html')
  assert(latest.version === 'v1.0.1', `期望 v1.0.1，实际 ${latest.version}`)
})

test('比较版本', async () => {
  const manager = new VersionManager()
  
  const result1 = await manager.createVersion('test.html', { content: '版本1', title: '标题1' })
  const result2 = await manager.createVersion('test.html', { content: '版本2', title: '标题2' })
  
  const comparison = manager.compareVersions('test.html', result1.version.id, result2.version.id)
  assert(comparison.success, '应该成功比较')
})

// ==================== 智能笔记生成器增量更新测试 ====================
console.log(colors.cyan('\n🚀 智能笔记生成器增量更新测试'))

test('创建带增量更新功能的生成器', () => {
  const generator = createSmartNoteGenerator()
  assert(generator.noteParser, '应该有笔记解析器')
  assert(generator.contentComparer, '应该有内容对比器')
  assert(generator.noteMerger, '应该有笔记合并器')
  assert(generator.versionManager, '应该有版本管理器')
})

test('获取笔记版本历史', async () => {
  const generator = createSmartNoteGenerator()
  const history = generator.getNoteVersionHistory('test.html')
  assert(history, '应该有版本历史')
})

// ==================== 测试结果统计 ====================
console.log(colors.cyan('\n' + '='.repeat(50)))
console.log(colors.cyan('📊 增量更新系统测试结果统计'))
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
