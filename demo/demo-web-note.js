/**
 * 演示示例3：网页笔记生成
 * 展示如何从博客、技术文档等网页自动生成笔记
 */

import { MultimodalProcessor } from '../core/multimodal-processor.js'
import { SubjectDetector } from '../core/subject-detector.js'
import { ComplexityAnalyzer } from '../core/complexity-analyzer.js'
import { KnowledgeExtractor } from '../core/knowledge-extractor.js'
import { StructureSelector } from '../core/structure-selector.js'

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
}

const divider = '═'.repeat(60)

// 模拟网页内容（实际使用时会通过URL抓取）
const mockWebContents = [
  {
    name: '技术博客文章',
    url: 'https://blog.example.com/python-async',
    content: `
      Python 异步编程指南
      
      什么是异步编程？
      异步编程是一种并发编程方式，允许程序在等待I/O操作时执行其他任务。
      
      asyncio 基础
      Python 的 asyncio 模块提供了异步编程的核心功能：
      
      async def main():
          print('Hello')
          await asyncio.sleep(1)
          print('World')
      
      asyncio.run(main())
      
      协程（Coroutine）
      协程是使用 async def 定义的函数。它们可以暂停执行并在稍后恢复。
      
      任务（Task）
      任务用于并发运行协程：
      
      async def fetch_data():
          await asyncio.sleep(2)
          return "data"
      
      task = asyncio.create_task(fetch_data())
      
      最佳实践
      1. 避免在异步代码中使用阻塞操作
      2. 使用 asyncio.gather() 并发运行多个协程
      3. 合理使用超时控制
    `
  },
  {
    name: '官方文档',
    url: 'https://docs.example.com/react-hooks',
    content: `
      React Hooks 文档
      
      useState
      useState Hook 用于在函数组件中添加状态：
      
      const [count, setCount] = useState(0)
      
      useEffect
      useEffect Hook 用于处理副作用：
      
      useEffect(() => {
        document.title = \`Count: \${count}\`
      }, [count])
      
      useContext
      useContext Hook 用于访问 Context：
      
      const value = useContext(MyContext)
      
      自定义 Hook
      自定义 Hook 是以 "use" 开头的函数：
      
      function useCounter(initialValue = 0) {
        const [count, setCount] = useState(initialValue)
        const increment = () => setCount(c => c + 1)
        return { count, increment }
      }
      
      Hook 规则
      1. 只在顶层调用 Hook
      2. 只在 React 函数中调用 Hook
      3. 自定义 Hook 必须以 "use" 开头
    `
  },
  {
    name: '教程文章',
    url: 'https://tutorial.example.com/git-basics',
    content: `
      Git 基础教程
      
      什么是 Git？
      Git 是一个分布式版本控制系统，用于跟踪文件的更改。
      
      基本命令
      
      初始化仓库
      git init
      
      添加文件到暂存区
      git add .
      
      提交更改
      git commit -m "Initial commit"
      
      查看状态
      git status
      
      查看历史
      git log
      
      分支操作
      创建分支：git branch feature
      切换分支：git checkout feature
      合并分支：git merge feature
      
      远程操作
      添加远程：git remote add origin <url>
      推送：git push origin main
      拉取：git pull origin main
      
      最佳实践
      1. 频繁提交，小步快跑
      2. 写清晰的提交信息
      3. 使用分支进行开发
      4. 定期同步远程仓库
    `
  }
]

async function demoWebNote() {
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('🌐 演示示例3：网页笔记生成'))
  console.log(colors.cyan(divider + '\n'))

  const processor = new MultimodalProcessor()
  const subjectDetector = new SubjectDetector()
  const complexityAnalyzer = new ComplexityAnalyzer()
  const knowledgeExtractor = new KnowledgeExtractor()
  const structureSelector = new StructureSelector()

  for (const web of mockWebContents) {
    console.log(colors.blue(`\n📄 处理网页: ${web.name}`))
    console.log(`   URL: ${web.url}`)
    console.log('─'.repeat(50))

    // 1. 检测输入类型
    const inputType = processor.detectInputType(web.url)
    console.log(colors.green(`✓ 输入类型: ${inputType}`))

    // 2. 分析内容
    const content = web.content

    // 学科识别
    const subjectResult = subjectDetector.detect(content)
    console.log(colors.green(`✓ 学科识别: ${subjectResult.subjectName} (${subjectResult.icon})`))

    // 复杂度分析
    const complexityResult = complexityAnalyzer.analyze(content)
    console.log(colors.green(`✓ 复杂度: ${complexityResult.score}/10 (${complexityResult.level.name})`))

    // 知识点提取
    const knowledgeResult = knowledgeExtractor.extract(content)
    console.log(colors.green(`✓ 知识点: ${knowledgeResult.knowledgePoints.length} 个`))

    // 结构选择
    const structureResult = structureSelector.select(
      subjectResult.subject,
      complexityResult.score
    )
    console.log(colors.green(`✓ 推荐结构: ${structureResult.structure.name}`))
    console.log(`  章节: ${structureResult.structure.sections.join(' → ')}`)

    // 显示提取的知识点
    if (knowledgeResult.knowledgePoints.length > 0) {
      console.log(colors.yellow('\n📚 核心知识点:'))
      knowledgeResult.knowledgePoints.slice(0, 5).forEach((point, i) => {
        const icon = point.importance === 'high' ? '⭐' : point.importance === 'medium' ? '📌' : '📝'
        console.log(`  ${icon} ${point.text}`)
      })
    }

    // 3. 内容预览
    console.log(colors.yellow('\n📝 内容预览:'))
    console.log('─'.repeat(50))
    const preview = content.trim().substring(0, 200)
    console.log(preview + '...')
  }

  // 生成笔记预览
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('📋 生成笔记预览'))
  console.log(colors.cyan(divider + '\n'))

  const sampleContent = mockWebContents[0].content
  const subjectResult = subjectDetector.detect(sampleContent)
  const structureResult = structureSelector.select(subjectResult.subject, 5)

  console.log(colors.yellow('笔记结构:'))
  console.log('─'.repeat(50))
  structureResult.structure.sections.forEach((section, i) => {
    console.log(`  ${i + 1}. ${section}`)
  })

  console.log(colors.yellow('\n推荐模板:'))
  console.log(`  ${structureResult.recommendedTemplate.name}`)
  console.log(`  ${structureResult.recommendedTemplate.description}`)

  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('✅ 网页笔记演示完成'))
  console.log(colors.cyan(divider + '\n'))
}

// 运行演示
demoWebNote().catch(console.error)
