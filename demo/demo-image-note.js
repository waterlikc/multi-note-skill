/**
 * 演示示例2：图片笔记生成
 * 展示如何从图片（PPT截图、白板照片等）自动生成笔记
 */

import { MultimodalProcessor } from '../core/multimodal-processor.js'
import { SubjectDetector } from '../core/subject-detector.js'
import { ComplexityAnalyzer } from '../core/complexity-analyzer.js'
import { KnowledgeExtractor } from '../core/knowledge-extractor.js'

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
}

const divider = '═'.repeat(60)

// 模拟图片内容（实际使用时会通过OCR识别）
const mockImageContents = [
  {
    name: '课堂PPT截图',
    content: `
      第三章：数据结构
      
      1. 数组（Array）
         - 连续内存存储
         - 随机访问 O(1)
         - 插入删除 O(n)
      
      2. 链表（Linked List）
         - 非连续内存
         - 顺序访问 O(n)
         - 插入删除 O(1)
      
      3. 栈（Stack）
         - LIFO 后进先出
         - push/pop 操作
      
      4. 队列（Queue）
         - FIFO 先进先出
         - enqueue/dequeue 操作
    `
  },
  {
    name: '数学公式白板',
    content: `
      微积分基础
      
      导数公式：
      - (x^n)' = nx^(n-1)
      - (sin x)' = cos x
      - (cos x)' = -sin x
      - (e^x)' = e^x
      
      积分公式：
      - ∫x^n dx = x^(n+1)/(n+1) + C
      - ∫sin x dx = -cos x + C
      - ∫cos x dx = sin x + C
    `
  },
  {
    name: '编程代码截图',
    content: `
      Python 函数定义
      
      def fibonacci(n):
          """计算斐波那契数列"""
          if n <= 1:
              return n
          return fibonacci(n-1) + fibonacci(n-2)
      
      # 使用示例
      for i in range(10):
          print(fibonacci(i))
    `
  }
]

async function demoImageNote() {
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('🖼️ 演示示例2：图片笔记生成'))
  console.log(colors.cyan(divider + '\n'))

  const processor = new MultimodalProcessor()
  const subjectDetector = new SubjectDetector()
  const complexityAnalyzer = new ComplexityAnalyzer()
  const knowledgeExtractor = new KnowledgeExtractor()

  for (const image of mockImageContents) {
    console.log(colors.blue(`\n📸 处理图片: ${image.name}`))
    console.log('─'.repeat(50))

    // 1. 检测输入类型
    const inputType = processor.detectInputType(image.content)
    console.log(colors.green(`✓ 输入类型: ${inputType}`))

    // 2. 分析内容
    const content = image.content

    // 学科识别
    const subjectResult = subjectDetector.detect(content)
    console.log(colors.green(`✓ 学科识别: ${subjectResult.subjectName} (${subjectResult.icon})`))
    console.log(`  置信度: ${(subjectResult.confidence * 100).toFixed(1)}%`)

    // 复杂度分析
    const complexityResult = complexityAnalyzer.analyze(content)
    console.log(colors.green(`✓ 复杂度: ${complexityResult.score}/10 (${complexityResult.level.name})`))

    // 知识点提取
    const knowledgeResult = knowledgeExtractor.extract(content)
    console.log(colors.green(`✓ 知识点: ${knowledgeResult.knowledgePoints.length} 个`))

    // 显示提取的知识点
    if (knowledgeResult.knowledgePoints.length > 0) {
      console.log(colors.yellow('\n📚 提取的知识点:'))
      knowledgeResult.knowledgePoints.slice(0, 5).forEach((point, i) => {
        console.log(`  ${i + 1}. [${point.type}] ${point.text}`)
      })
    }

    // 3. 显示内容预览
    console.log(colors.yellow('\n📝 内容预览:'))
    console.log('─'.repeat(50))
    const preview = content.trim().substring(0, 300)
    console.log(preview + (content.length > 300 ? '...' : ''))
  }

  // 演示批量处理
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('📦 批量处理演示'))
  console.log(colors.cyan(divider + '\n'))

  console.log(colors.yellow('批量处理多张图片:'))
  for (let i = 0; i < mockImageContents.length; i++) {
    console.log(`  ${i + 1}. ${mockImageContents[i].name}`)
  }
  console.log(colors.green('\n✓ 所有图片处理完成'))

  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('✅ 图片笔记演示完成'))
  console.log(colors.cyan(divider + '\n'))
}

// 运行演示
demoImageNote().catch(console.error)
