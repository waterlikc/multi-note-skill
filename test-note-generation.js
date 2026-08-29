// 核心功能测试 - 笔记生成
import { generateNote, getSkillInfo } from './index.js'

console.log('='.repeat(60))
console.log('📝 multi-note-skill 核心功能测试')
console.log('='.repeat(60))
console.log()

// 测试1: 文本输入 → 学习笔记
async function testTextToNote() {
  console.log('📌 测试1: 文本输入 → 学习笔记')
  console.log('-'.repeat(40))

  const input = {
    content: `
# Python列表推导式

## 什么是列表推导式
列表推导式（List Comprehension）是Python中创建列表的简洁语法。

## 基本语法
\`\`\`python
[表达式 for 变量 in 可迭代对象]
\`\`\`

## 示例
1. 生成平方数列表
\`\`\`python
squares = [x**2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
\`\`\`

2. 带条件筛选
\`\`\`python
even_squares = [x**2 for x in range(10) if x % 2 == 0]
# [0, 4, 16, 36, 64]
\`\`\`

3. 嵌套循环
\`\`\`python
pairs = [(x, y) for x in [1, 2] for y in [3, 4]]
# [(1, 3), (1, 4), (2, 3), (2, 4)]
\`\`\`

## 优点
- 代码简洁
- 执行效率高
- 可读性好（对于简单场景）

## 注意事项
- 避免过于复杂的推导式
- 考虑代码可维护性
    `,
    title: 'Python列表推导式学习笔记'
  }

  try {
    const result = await generateNote(input)
    console.log('✅ 生成成功!')
    console.log('   标题:', result.metadata.title)
    console.log('   场景:', result.metadata.scene)
    console.log('   样式:', result.metadata.style)
    console.log('   格式:', Object.keys(result).filter(k => k !== 'metadata').join(', '))
    console.log()
    return result
  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    console.log()
    return null
  }
}

// 测试2: 课堂笔记场景
async function testClassroomNote() {
  console.log('📌 测试2: 课堂笔记场景')
  console.log('-'.repeat(40))

  const input = {
    content: `
高中物理 - 牛顿第二定律

一、定义
物体加速度的大小与作用力成正比，与物体质量成反比。

二、公式
F = ma

三、单位
- F: 力 (牛顿 N)
- m: 质量 (千克 kg)
- a: 加速度 (米/秒² m/s²)

四、应用举例
1. 推箱子问题
2. 电梯超重失重
3. 连接体问题

五、易错点
1. 合力与分力混淆
2. 忘记考虑摩擦力
3. 加速度方向判断错误
    `,
    title: '牛顿第二定律课堂笔记',
    scene: 'classroom'
  }

  try {
    const result = await generateNote(input)
    console.log('✅ 生成成功!')
    console.log('   标题:', result.metadata.title)
    console.log('   场景:', result.metadata.scene)
    console.log()
    return result
  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    console.log()
    return null
  }
}

// 测试3: 会议纪要场景
async function testMeetingNote() {
  console.log('📌 测试3: 会议纪要场景')
  console.log('-'.repeat(40))

  const input = {
    content: `
项目周会纪要

时间：2026年7月19日 14:00-15:00
地点：3楼会议室
参会人：张三、李四、王五

一、上周工作汇报
1. 张三：完成用户模块开发
2. 李四：完成UI设计稿
3. 王五：完成数据库优化

二、本周工作计划
1. 张三：开始订单模块开发
2. 李四：完善详情页设计
3. 王五：编写API文档

三、问题讨论
- 订单模块与支付系统对接方案待定
- 设计稿需要产品确认

四、行动项
| 任务 | 负责人 | 截止日期 |
|------|--------|----------|
| 支付方案调研 | 张三 | 7月22日 |
| 设计稿确认 | 李四 | 7月21日 |
| API文档初稿 | 王五 | 7月23日 |
    `,
    title: '项目周会纪要'
  }

  try {
    const result = await generateNote(input)
    console.log('✅ 生成成功!')
    console.log('   标题:', result.metadata.title)
    console.log('   场景:', result.metadata.scene)
    console.log()
    return result
  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    console.log()
    return null
  }
}

// 测试4: 保存HTML文件
async function testSaveHtml(result, filename) {
  if (!result || !result.html) {
    console.log('⚠️  跳过保存：没有HTML内容')
    return
  }

  console.log('📌 保存HTML文件')
  console.log('-'.repeat(40))

  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const outputDir = 'D:\\blog\\notes'
    
    // 确保目录存在
    try {
      await fs.access(outputDir)
    } catch {
      await fs.mkdir(outputDir, { recursive: true })
    }

    const filePath = path.join(outputDir, filename)
    await fs.writeFile(filePath, result.html, 'utf-8')
    
    console.log('✅ 保存成功!')
    console.log('   路径:', filePath)
    console.log()
  } catch (error) {
    console.error('❌ 保存失败:', error.message)
    console.log()
  }
}

// 运行所有测试
async function runAllTests() {
  const skillInfo = getSkillInfo()
  console.log('📦 技能信息:')
  console.log('   名称:', skillInfo.name)
  console.log('   版本:', skillInfo.version)
  console.log('   功能:', skillInfo.features.join(', '))
  console.log()

  // 测试文本笔记
  const result1 = await testTextToNote()
  await testSaveHtml(result1, 'Python列表推导式-学习笔记.html')

  // 测试课堂笔记
  const result2 = await testClassroomNote()
  await testSaveHtml(result2, '牛顿第二定律-课堂笔记.html')

  // 测试会议纪要
  const result3 = await testMeetingNote()
  await testSaveHtml(result3, '项目周会-会议纪要.html')

  console.log('='.repeat(60))
  console.log('✨ 测试完成!')
  console.log()
  console.log('📁 生成的笔记文件位于: D:\\blog\\notes\\')
  console.log('   可以用浏览器打开查看效果')
  console.log('='.repeat(60))
}

// 执行测试
runAllTests().catch(console.error)
