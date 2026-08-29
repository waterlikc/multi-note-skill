/**
 * 演示示例1：视频笔记生成
 * 展示如何从YouTube/Bilibili视频自动生成结构化笔记
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

// 分隔线
const divider = '═'.repeat(60)

async function demoVideoNote() {
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('🎬 演示示例1：视频笔记生成'))
  console.log(colors.cyan(divider + '\n'))

  // 测试视频URL
  const videoUrls = [
    'https://www.bilibili.com/video/BV1eb5i6FEsR',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  ]

  const processor = new MultimodalProcessor()
  const subjectDetector = new SubjectDetector()
  const complexityAnalyzer = new ComplexityAnalyzer()
  const knowledgeExtractor = new KnowledgeExtractor()
  const structureSelector = new StructureSelector()

  for (const url of videoUrls) {
    console.log(colors.blue(`\n📹 处理视频: ${url}`))
    console.log('─'.repeat(50))

    // 1. 检测输入类型
    const inputType = processor.detectInputType(url)
    console.log(colors.green(`✓ 输入类型: ${inputType}`))

    // 2. 处理视频
    console.log('⏳ 正在处理视频...')
    const result = await processor.process(url)

    if (result.success) {
      console.log(colors.green(`✓ 视频处理成功`))
      console.log(`  平台: ${result.metadata?.platform || '未知'}`)
      console.log(`  处理时间: ${result.metadata?.processingTime}`)

      // 3. 分析内容
      const content = result.content
      
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
      console.log(`  模板: ${structureResult.recommendedTemplate.name}`)

      // 4. 显示提取的内容
      console.log(colors.yellow('\n📝 提取内容预览:'))
      console.log('─'.repeat(50))
      const preview = content.substring(0, 500)
      console.log(preview + (content.length > 500 ? '...' : ''))
    } else {
      console.log(colors.yellow(`⚠ 视频处理: ${result.error || '未找到字幕'}`))
    }
  }

  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('✅ 视频笔记演示完成'))
  console.log(colors.cyan(divider + '\n'))
}

// 运行演示
demoVideoNote().catch(console.error)
