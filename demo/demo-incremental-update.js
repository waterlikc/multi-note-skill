/**
 * 演示示例5：增量更新功能
 * 展示如何将新内容添加到已有笔记中
 */

import { NoteParser } from '../core/note-parser.js'
import { ContentComparer } from '../core/content-comparer.js'
import { NoteMerger } from '../core/note-merger.js'
import { VersionManager } from '../core/version-manager.js'

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`
}

const divider = '═'.repeat(60)

// 模拟已有笔记
const existingNote = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <title>Python基础教程笔记</title>
</head>
<body>
    <h1>Python基础教程笔记</h1>
    
    <h2>1. 变量和数据类型</h2>
    <p>Python中的变量不需要声明类型，可以直接赋值。</p>
    <pre><code>
x = 10          # 整数
y = 3.14        # 浮点数
name = "Alice"  # 字符串
is_true = True  # 布尔值
    </code></pre>
    
    <h2>2. 控制流</h2>
    <p>Python使用缩进来表示代码块。</p>
    <pre><code>
if x > 5:
    print("x大于5")
else:
    print("x小于等于5")
    </code></pre>
    
    <h2>3. 循环</h2>
    <p>Python支持for和while循环。</p>
    <pre><code>
for i in range(5):
    print(i)

while x > 0:
    x -= 1
    </code></pre>
</body>
</html>
`

// 新学习的内容
const newContents = [
  {
    name: '函数定义',
    content: `
      Python 函数定义
      
      使用 def 关键字定义函数：
      
      def greet(name):
          """问候函数"""
          return f"Hello, {name}!"
      
      带默认参数的函数：
      
      def power(base, exponent=2):
          return base ** exponent
      
      Lambda 函数：
      
      square = lambda x: x ** 2
      
      函数注解：
      
      def add(a: int, b: int) -> int:
          return a + b
    `,
    changes: '添加函数定义相关内容'
  },
  {
    name: '列表推导式',
    content: `
      列表推导式
      
      基本语法：
      squares = [x**2 for x in range(10)]
      
      带条件的列表推导式：
      evens = [x for x in range(20) if x % 2 == 0]
      
      嵌套列表推导式：
      matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
      flat = [x for row in matrix for x in row]
      
      字典推导式：
      squares_dict = {x: x**2 for x in range(5)}
      
      集合推导式：
      unique_lengths = {len(word) for word in ["hello", "world", "python"]}
    `,
    changes: '添加列表推导式内容'
  }
]

async function demoIncrementalUpdate() {
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('🔄 演示示例5：增量更新功能'))
  console.log(colors.cyan(divider + '\n'))

  // 初始化模块
  const noteParser = new NoteParser()
  const contentComparer = new ContentComparer()
  const noteMerger = new NoteMerger()
  const versionManager = new VersionManager()

  // 1. 解析已有笔记
  console.log(colors.blue('\n📄 步骤1：解析已有笔记'))
  console.log('─'.repeat(50))

  const parseResult = noteParser.parseContent(existingNote)
  console.log(colors.green(`✓ 笔记解析成功`))
  console.log(`  标题: ${parseResult.title}`)
  console.log(`  章节数: ${parseResult.sections.length}`)
  console.log(`  代码块: ${parseResult.codeBlocks.length}`)

  // 2. 创建初始版本
  console.log(colors.blue('\n📚 步骤2：创建初始版本'))
  console.log('─'.repeat(50))

  const version1 = await versionManager.createVersion('python-notes.html', existingNote, {
    changes: '初始版本',
    tags: ['python', '基础']
  })
  console.log(colors.green(`✓ 版本创建成功`))
  console.log(`  版本号: ${version1.version.version}`)
  console.log(`  版本ID: ${version1.version.id}`)

  // 3. 增量更新
  for (const newContent of newContents) {
    console.log(colors.blue(`\n📝 步骤3：添加新内容 - ${newContent.name}`))
    console.log('─'.repeat(50))

    // 对比内容
    console.log('⏳ 正在对比内容...')
    const compareResult = contentComparer.compare(parseResult, newContent.content)
    console.log(colors.green(`✓ 内容对比完成`))
    console.log(`  新增内容: ${compareResult.added.length} 段`)
    console.log(`  重复内容: ${compareResult.duplicates.length} 段`)
    console.log(`  相似度: ${(compareResult.similarity * 100).toFixed(1)}%`)

    // 合并内容
    console.log('⏳ 正在合并内容...')
    const mergeResult = await noteMerger.merge(
      parseResult,
      newContent.content,
      compareResult,
      { strategy: 'smart' }
    )
    console.log(colors.green(`✓ 内容合并完成`))
    console.log(`  合并策略: ${mergeResult.mergeDetails.strategy}`)
    console.log(`  新增字节: ${mergeResult.statistics.addedLength}`)

    // 创建新版本
    const newVersion = await versionManager.createVersion(
      'python-notes.html',
      mergeResult.mergedHtml,
      {
        changes: newContent.changes,
        tags: ['python', '更新']
      }
    )
    console.log(colors.green(`✓ 新版本创建成功`))
    console.log(`  版本号: ${newVersion.version.version}`)
  }

  // 4. 版本历史
  console.log(colors.blue('\n📊 步骤4：查看版本历史'))
  console.log('─'.repeat(50))

  const history = versionManager.exportVersionHistory('python-notes.html')
  console.log(colors.green(`✓ 版本历史`))
  console.log(`  总版本数: ${history.versions.length}`)
  console.log('\n  版本列表:')
  history.versions.forEach((v, i) => {
    console.log(`    ${i + 1}. ${v.version} - ${v.changes} (${v.timestamp})`)
  })

  // 5. 版本比较
  console.log(colors.blue('\n🔍 步骤5：版本比较'))
  console.log('─'.repeat(50))

  if (history.versions.length >= 2) {
    const v1 = history.versions[0]
    const v2 = history.versions[history.versions.length - 1]
    const comparison = versionManager.compareVersions(
      'python-notes.html',
      v1.id,
      v2.id
    )
    console.log(colors.green(`✓ 版本比较完成`))
    console.log(`  版本1: ${comparison.version1.version}`)
    console.log(`  版本2: ${comparison.version2.version}`)
    console.log(`  时间差: ${comparison.differences.timeDiff}ms`)
    console.log(`  内容变化: +${comparison.differences.contentDiff.wordCountDiff} 字`)
  }

  // 6. 展示增量更新优势
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('💡 增量更新优势'))
  console.log(colors.cyan(divider + '\n'))

  const advantages = [
    { icon: '🔄', name: '智能合并', desc: '自动识别并合并新内容，避免重复' },
    { icon: '📚', name: '版本管理', desc: '保留历史版本，支持回退' },
    { icon: '🔍', name: '内容对比', desc: '新旧内容对比，识别差异' },
    { icon: '🎯', name: '精准更新', desc: '只更新变化部分，保持结构' },
    { icon: '📝', name: '变更记录', desc: '记录每次更新的内容和原因' }
  ]

  advantages.forEach(adv => {
    console.log(`  ${adv.icon} ${adv.name}: ${adv.desc}`)
  })

  // 7. 使用场景
  console.log(colors.cyan('\n📋 使用场景'))
  console.log('─'.repeat(50))

  const scenarios = [
    '今天学了新知识，想添加到笔记中',
    '发现笔记中有错误，需要修正',
    '想要补充更多示例和细节',
    '需要更新过时的内容',
    '想要回退到之前的版本'
  ]

  scenarios.forEach((scenario, i) => {
    console.log(`  ${i + 1}. ${scenario}`)
  })

  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('✅ 增量更新演示完成'))
  console.log(colors.cyan(divider + '\n'))
}

// 运行演示
demoIncrementalUpdate().catch(console.error)
