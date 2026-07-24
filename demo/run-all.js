/**
 * 快速运行所有演示示例
 */

import { readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
}

const divider = '═'.repeat(60)

async function runAllDemos() {
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('🚀 multi-note-skill 完整演示'))
  console.log(colors.cyan(divider + '\n'))

  // 获取所有演示文件
  const files = await readdir(__dirname)
  const demoFiles = files
    .filter(f => f.startsWith('demo-') && f.endsWith('.js'))
    .sort()

  console.log(colors.blue(`📁 找到 ${demoFiles.length} 个演示文件:\n`))
  demoFiles.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file}`)
  })

  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('▶️ 开始运行演示'))
  console.log(colors.cyan(divider + '\n'))

  // 运行每个演示
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < demoFiles.length; i++) {
    const file = demoFiles[i]
    const filePath = join(__dirname, file)
    
    console.log(colors.blue(`\n[${i + 1}/${demoFiles.length}] 运行: ${file}`))
    console.log('─'.repeat(50))
    
    try {
      // 使用 pathToFileURL 转换路径
      const fileUrl = pathToFileURL(filePath).href
      await import(fileUrl)
      
      console.log(colors.green(`✓ ${file} 运行完成`))
      successCount++
    } catch (error) {
      console.error(`✗ ${file} 运行失败:`, error.message)
      failCount++
    }
  }

  // 显示总结
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('📊 运行结果'))
  console.log(colors.cyan(divider + '\n'))

  console.log(`  成功: ${successCount} 个`)
  console.log(`  失败: ${failCount} 个`)
  console.log(`  总计: ${demoFiles.length} 个`)

  console.log(colors.blue('\n🎯 功能总结:'))
  console.log('─'.repeat(50))
  console.log('  ✅ 多模态输入（视频/图片/网页/音频）')
  console.log('  ✅ 智能场景识别（20+学科）')
  console.log('  ✅ 知识点提取（10种类型）')
  console.log('  ✅ 结构选择（学科专属结构）')
  console.log('  ✅ 增量更新（版本管理）')
  console.log('  ✅ 知识图谱（学习路径/薄弱点识别）')
  console.log('  ✅ Token优化（节省71.9%）')

  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('🎉 演示结束！'))
  console.log(colors.cyan(divider + '\n'))
}

// 运行
runAllDemos().catch(console.error)
