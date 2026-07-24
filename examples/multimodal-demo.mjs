// 多模态笔记生成示例
import { 
  generateNoteFromImage,
  generateNoteFromVideo,
  generateNoteFromAudio,
  generateNoteFromUrl,
  processMultimodalBatch,
  checkMultimodalDependencies
} from '../index.js'

// 示例1: 从图片生成笔记
async function exampleImageToNote() {
  console.log('📸 示例1: 从图片生成笔记\n')

  // 本地图片文件
  const localImage = 'D:\\Screenshots\\lecture-ppt.png'
  
  // 或者图片URL
  const imageUrl = 'https://example.com/screenshot.jpg'

  try {
    const result = await generateNoteFromImage(localImage, {
      title: '课堂PPT笔记',
      ocrLanguage: 'chi_sim+eng' // 中文+英文
    })

    console.log('✅ 图片笔记生成成功!')
    console.log('标题:', result.metadata.title)
    console.log('场景:', result.metadata.scene)
    console.log('多模态类型:', result.metadata.multimodal?.inputType)
    console.log('OCR文字长度:', result.metadata.multimodal?.textLength)
    console.log('\n生成的HTML文件已保存\n')
  } catch (error) {
    console.error('❌ 图片笔记生成失败:', error.message)
  }
}

// 示例2: 从YouTube视频生成笔记
async function exampleVideoToNote() {
  console.log('🎥 示例2: 从YouTube视频生成笔记\n')

  const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

  try {
    const result = await generateNoteFromVideo(youtubeUrl, {
      title: '视频教程笔记',
      language: 'zh' // 尝试获取中文字幕
    })

    console.log('✅ 视频笔记生成成功!')
    console.log('标题:', result.metadata.title)
    console.log('平台:', result.metadata.multimodal?.platform)
    console.log('字幕长度:', result.metadata.multimodal?.subtitleLength)
    console.log('\n')
  } catch (error) {
    console.error('❌ 视频笔记生成失败:', error.message)
  }
}

// 示例3: 从Bilibili视频生成笔记
async function exampleBilibiliToNote() {
  console.log('📺 示例3: 从Bilibili视频生成笔记\n')

  const bilibiliUrl = 'https://www.bilibili.com/video/BV1xx411c7mD'

  try {
    const result = await generateNoteFromVideo(bilibiliUrl, {
      title: 'Bilibili教程笔记'
    })

    console.log('✅ Bilibili笔记生成成功!')
    console.log('标题:', result.metadata.title)
    console.log('平台:', result.metadata.multimodal?.platform)
    console.log('\n')
  } catch (error) {
    console.error('❌ Bilibili笔记生成失败:', error.message)
  }
}

// 示例4: 从音频文件生成笔记
async function exampleAudioToNote() {
  console.log('🎵 示例4: 从音频文件生成笔记\n')

  const audioFile = 'D:\\Recordings\\lecture-recording.mp3'

  try {
    const result = await generateNoteFromAudio(audioFile, {
      title: '讲座录音笔记',
      whisperApiCaller: async (audioBuffer) => {
        // 这里可以调用Whisper API
        // 示例：return await callWhisperAPI(audioBuffer)
        return '[音频转文字需要配置Whisper API]'
      }
    })

    console.log('✅ 音频笔记生成成功!')
    console.log('标题:', result.metadata.title)
    console.log('转录长度:', result.metadata.multimodal?.transcriptionLength)
    console.log('\n')
  } catch (error) {
    console.error('❌ 音频笔记生成失败:', error.message)
  }
}

// 示例5: 从网页URL生成笔记
async function exampleUrlToNote() {
  console.log('🌐 示例5: 从网页URL生成笔记\n')

  const blogUrl = 'https://blog.example.com/article-about-javascript'

  try {
    const result = await generateNoteFromUrl(blogUrl, {
      title: '博客文章笔记'
    })

    console.log('✅ 网页笔记生成成功!')
    console.log('标题:', result.metadata.title)
    console.log('内容长度:', result.metadata.multimodal?.contentLength)
    console.log('包含图片:', result.metadata.multimodal?.hasImages)
    console.log('\n')
  } catch (error) {
    console.error('❌ 网页笔记生成失败:', error.message)
  }
}

// 示例6: 批量多模态处理
async function exampleBatchProcessing() {
  console.log('📦 示例6: 批量多模态处理\n')

  const inputs = [
    'D:\\Screenshots\\slide1.png',
    'D:\\Screenshots\\slide2.png',
    'D:\\Screenshots\\slide3.png',
    'https://www.youtube.com/watch?v=example'
  ]

  try {
    const results = await processMultimodalBatch(inputs, {
      batchSize: 2 // 每批处理2个
    })

    console.log('✅ 批量处理完成!')
    console.log(`处理了 ${results.length} 个输入`)
    
    results.forEach((result, index) => {
      console.log(`\n输入 ${index + 1}:`)
      console.log('  类型:', result.inputType)
      console.log('  成功:', result.success)
      if (result.error) {
        console.log('  错误:', result.error)
      }
    })
    console.log('\n')
  } catch (error) {
    console.error('❌ 批量处理失败:', error.message)
  }
}

// 示例7: 检查依赖状态
async function exampleCheckDependencies() {
  console.log('🔍 示例7: 检查多模态依赖状态\n')

  try {
    const deps = await checkMultimodalDependencies()

    console.log('依赖状态:')
    console.log('  tesseract.js (OCR):', deps.tesseract ? '✅ 已安装' : '❌ 未安装')
    console.log('  youtube-transcript:', deps.youtubeTranscript ? '✅ 已安装' : '❌ 未安装')
    console.log('  whisper:', deps.whisper ? '✅ 已安装' : '❌ 未安装')
    console.log('  cheerio:', deps.cheerio ? '✅ 已安装' : '❌ 未安装')

    if (!deps.tesseract || !deps.youtubeTranscript) {
      console.log('\n💡 安装建议:')
      if (!deps.tesseract) {
        console.log('  npm install tesseract.js  # 启用图片OCR')
      }
      if (!deps.youtubeTranscript) {
        console.log('  npm install youtube-transcript  # 启用YouTube字幕')
      }
    }
    console.log('\n')
  } catch (error) {
    console.error('❌ 依赖检查失败:', error.message)
  }
}

// 运行所有示例
async function runAllExamples() {
  console.log('🚀 multi-note-skill 多模态功能演示\n')
  console.log('=' .repeat(50) + '\n')

  // 先检查依赖
  await exampleCheckDependencies()
  
  // 运行各个示例（根据依赖情况可能部分失败）
  await exampleImageToNote()
  await exampleVideoToNote()
  await exampleBilibiliToNote()
  await exampleAudioToNote()
  await exampleUrlToNote()
  await exampleBatchProcessing()

  console.log('=' .repeat(50))
  console.log('\n✨ 所有示例运行完成!')
  console.log('\n💡 提示:')
  console.log('  1. 安装依赖以启用完整功能: npm install tesseract.js youtube-transcript')
  console.log('  2. 音频转文字需要配置Whisper API')
  console.log('  3. 查看 SKILL.md 了解更多使用方法')
}

// 运行示例
runAllExamples().catch(console.error)
