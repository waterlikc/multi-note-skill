// multi-note-skill 完整功能展示
import { generateNote, getSkillInfo, getSupportedFormats, checkMultimodalDependencies } from './index.js'
import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const outputDir = 'D:\\blog\\notes'

console.log('╔════════════════════════════════════════════════════════════╗')
console.log('║         multi-note-skill 智能笔记生成器 v1.1.0           ║')
console.log('╚════════════════════════════════════════════════════════════╝')
console.log()

// 1. 系统信息展示
console.log('📦 【系统信息】')
console.log('─'.repeat(60))
const skillInfo = getSkillInfo()
console.log(`   名称: ${skillInfo.name}`)
console.log(`   版本: ${skillInfo.version}`)
console.log(`   描述: ${skillInfo.description}`)
console.log(`   功能: ${skillInfo.features.join(' | ')}`)
console.log()

// 2. 支持格式展示
console.log('📄 【支持格式】')
console.log('─'.repeat(60))
const formats = getSupportedFormats()
console.log(`   输出格式: ${formats.join(' | ')}`)
console.log()

// 3. 笔记类型展示
console.log('📚 【笔记类型分类】')
console.log('─'.repeat(60))
const categories = [
  { name: '技术学习', icon: '💻', desc: '编程、开发、技术文档' },
  { name: '课堂学习', icon: '📖', desc: '学校课程、培训、讲座' },
  { name: '科普知识', icon: '🔬', desc: '科学普及、知识拓展' },
  { name: '读书笔记', icon: '📚', desc: '书籍阅读、文章阅读' },
  { name: '会议纪要', icon: '📋', desc: '工作会议、学术会议' },
  { name: '调研分析', icon: '📊', desc: '市场调研、数据分析' },
  { name: '项目报告', icon: '📁', desc: '项目进展、工作总结' },
  { name: '课程大纲', icon: '📝', desc: '教学计划、课程设计' },
  { name: '创意写作', icon: '✍️', desc: '小说创作、文案写作' },
  { name: '生活记录', icon: '🌿', desc: '日记、旅行、美食' }
]
categories.forEach(cat => {
  console.log(`   ${cat.icon} ${cat.name.padEnd(8)} - ${cat.desc}`)
})
console.log()

// 4. 组件系统展示
console.log('🧩 【组件系统】')
console.log('─'.repeat(60))
console.log('   文字样式: highlight | highlight-pink | highlight-green | red-text | blue-text | code-term')
console.log('   布局组件: flow-box | compare-box | attack-flow | os-grid | side-note')
console.log('   信息框:   question-box | summary-box | big-warning | safe-box | fix-box')
console.log('   特殊语法: :::question | :::tip | :::warning | :::success | :::danger | :::badge')
console.log('             :::grid | :::steps | :::flow | :::compare | :::summary')
console.log()

// 5. 模板样式展示
console.log('🎨 【模板样式】')
console.log('─'.repeat(60))
console.log('   Style A: 学霸笔记本 - 手写体、螺旋装订、横线纸张')
console.log('   Style B: 手账皮革本 - 皮革质感、翻页效果、金属装订')
console.log('   Style C: 简约现代   - 现代设计、清晰布局、代码高亮')
console.log()

// 6. 多模态功能展示
console.log('🖼️  【多模态输入】')
console.log('─'.repeat(60))
console.log('   📷 图片: OCR文字识别、图片描述生成')
console.log('   🎬 视频: YouTube/Bilibili字幕提取')
console.log('   🎵 音频: 语音转文字（需配置Whisper）')
console.log('   🌐 网页: 网页内容提取、正文解析')
console.log()

// 7. 动画效果展示
console.log('✨ 【动画效果】')
console.log('─'.repeat(60))
console.log('   📝 write-in: 逐渐生成动画，每个元素依次显示')
console.log('   📄 paperFloat: 纸张浮动动画，模拟真实笔记本')
console.log('   🖼️  slideUp: 滑入动画，内容从下方滑入')
console.log()

// 8. 生成示例笔记
console.log('🚀 【开始生成示例笔记】')
console.log('═'.repeat(60))
console.log()

// 示例1: 技术学习笔记
async function demo1() {
  console.log('📌 示例1: 技术学习笔记')
  console.log('─'.repeat(40))
  
  const content = `
# Python装饰器详解

:::badge 技术学习 | Python | 进阶

## 一、什么是装饰器

:::question 装饰器是什么？为什么需要装饰器？

装饰器是Python中的一个**高级特性**，它允许你在不修改原函数代码的情况下，为函数添加额外的功能。

:::tip 装饰器本质上是一个函数，它接受一个函数作为参数，并返回一个新的函数

## 二、基本语法

\`\`\`python
def my_decorator(func):
    def wrapper():
        print("装饰器开始执行")
        func()
        print("装饰器执行完毕")
    return wrapper

@my_decorator
def say_hello():
    print("Hello, World!")

say_hello()
\`\`\`

:::steps
1. 定义装饰器函数 my_decorator
2. 定义内部函数 wrapper
3. 使用 @my_decorator 语法应用装饰器
4. 调用被装饰的函数

## 三、带参数的装饰器

\`\`\`python
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Hello, {name}!")
\`\`\`

:::compare
| 类型 | 参数 | 返回值 | 用途 |
|------|------|--------|------|
| 简单装饰器 | 函数 | 新函数 | 基础功能扩展 |
| 带参装饰器 | 参数 | 装饰器 | 灵活配置 |
| 类装饰器 | 类 | 新类 | 类功能扩展 |

## 四、常用场景

:::grid
日志记录
权限验证
性能计时
缓存处理
错误处理
重试机制

## 五、注意事项

:::warning 注意：装饰器会改变函数的__name__和__doc__属性

:::success 使用 functools.wraps 可以保留原函数的元信息

## 六、总结

:::summary
- **装饰器**是Python的高级特性
- **本质**是一个高阶函数
- **用途**是为函数添加额外功能
- **优点**是代码复用、解耦合
:::

:::danger 切记：不要过度使用装饰器，保持代码可读性！
`

  const result = await generateNote({
    content,
    title: 'Python装饰器详解',
    scene: 'tech'
  })
  
  const filePath = join(outputDir, '技术学习', 'Python装饰器详解.html')
  if (!existsSync(join(outputDir, '技术学习'))) {
    mkdirSync(join(outputDir, '技术学习'), { recursive: true })
  }
  writeFileSync(filePath, result.html, 'utf-8')
  
  console.log(`   ✅ 生成成功: Python装饰器详解.html`)
  console.log(`   📁 位置: 技术学习/`)
  console.log(`   📊 大小: ${(Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2)} KB`)
  console.log()
}

// 示例2: 课堂学习笔记
async function demo2() {
  console.log('📌 示例2: 课堂学习笔记')
  console.log('─'.repeat(40))
  
  const content = `
# 高中物理 - 牛顿运动定律

:::badge 课堂学习 | 物理 | 力学

## 一、牛顿第一定律

:::question 什么是惯性定律？

**内容**：一切物体在没有受到外力作用的时候，总保持匀速直线运动状态或静止状态。

:::tip 又称惯性定律，力不是维持运动的原因，力是改变运动状态的原因

## 二、牛顿第二定律

**公式**：F = ma

:::compare
| 符号 | 名称 | 单位 | 说明 |
|------|------|------|------|
| F | 力 | N | 合力 |
| m | 质量 | kg | 物体质量 |
| a | 加速度 | m/s² | 加速度 |

## 三、牛顿第三定律

**内容**：两个物体之间的作用力和反作用力，总是同时存在，大小相等，方向相反。

:::steps
1. 作用力与反作用力同时产生
2. 同时消失
3. 作用在不同物体上
4. 不能抵消

## 四、易错点

:::warning 混淆平衡力与作用力反作用力

:::danger 忘记考虑所有力：重力、支持力、摩擦力、拉力等

## 五、总结

:::summary
- **第一定律**：惯性定律，力是改变运动状态的原因
- **第二定律**：F = ma，力与加速度的关系
- **第三定律**：作用力与反作用力，大小相等方向相反
:::
`

  const result = await generateNote({
    content,
    title: '牛顿运动定律',
    scene: 'course'
  })
  
  const filePath = join(outputDir, '课堂学习', '牛顿运动定律.html')
  if (!existsSync(join(outputDir, '课堂学习'))) {
    mkdirSync(join(outputDir, '课堂学习'), { recursive: true })
  }
  writeFileSync(filePath, result.html, 'utf-8')
  
  console.log(`   ✅ 生成成功: 牛顿运动定律.html`)
  console.log(`   📁 位置: 课堂学习/`)
  console.log(`   📊 大小: ${(Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2)} KB`)
  console.log()
}

// 示例3: 科普知识笔记
async function demo3() {
  console.log('📌 示例3: 科普知识笔记')
  console.log('─'.repeat(40))
  
  const content = `
# 太阳系探秘

:::badge 科普知识 | 天文 | 宇宙

## 一、太阳系概述

:::question 太阳系是如何形成的？

太阳系是以**太阳**为中心，受太阳引力约束在一起的天体系统，形成于约**46亿年前**。

:::grid
太阳
八大行星
矮行星
小行星
彗星
流星体

## 二、八大行星

### 类地行星

:::compare
| 行星 | 距日距离 | 公转周期 | 特点 |
|------|----------|----------|------|
| 水星 | 0.39 AU | 88天 | 最近、温差最大 |
| 金星 | 0.72 AU | 225天 | 最热、逆向自转 |
| 地球 | 1.00 AU | 365天 | 有生命 |
| 火星 | 1.52 AU | 687天 | 红色星球 |

### 类木行星

:::flow 木星 -> 土星 -> 天王星 -> 海王星

## 三、有趣的事实

:::success 木星大红斑：比地球还大的风暴，已持续数百年

:::tip 土星光环：主要由冰块和岩石碎片组成

:::warning 金星一天比一年长：自转周期243天，公转周期225天

## 四、总结

:::summary
- **太阳**：黄矮星，表面温度约5500°C
- **类地行星**：水星、金星、地球、火星
- **类木行星**：木星、土星、天王星、海王星
- **特点**：各具特色，组成丰富多彩的太阳系
:::
`

  const result = await generateNote({
    content,
    title: '太阳系探秘',
    scene: 'science'
  })
  
  const filePath = join(outputDir, '科普知识', '太阳系探秘.html')
  if (!existsSync(join(outputDir, '科普知识'))) {
    mkdirSync(join(outputDir, '科普知识'), { recursive: true })
  }
  writeFileSync(filePath, result.html, 'utf-8')
  
  console.log(`   ✅ 生成成功: 太阳系探秘.html`)
  console.log(`   📁 位置: 科普知识/`)
  console.log(`   📊 大小: ${(Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2)} KB`)
  console.log()
}

// 示例4: 读书笔记
async function demo4() {
  console.log('📌 示例4: 读书笔记')
  console.log('─'.repeat(40))
  
  const content = `
# 《小王子》读书笔记

:::badge 读书笔记 | 文学 | 经典

## 一、作品概述

《小王子》是法国作家**安托万·德·圣-埃克苏佩里**于1943年出版的著名短篇小说。

:::question 这本书为什么能感动全世界的读者？

## 二、经典语录

:::success "用心去看才能看清楚，用眼睛看不清本质的东西"

:::tip "你为你的玫瑰花花费的时间，使你的玫瑰花变得重要"

## 三、核心主题

:::compare
| 主题 | 内容 | 启示 |
|------|------|------|
| 爱与责任 | 驯养的意義 | 付出让事物变得珍贵 |
| 童心与成长 | 大人都是孩子 | 保持好奇心和想象力 |
| 友谊 | 狐狸与小王子 | 建立联系需要时间 |

## 四、阅读感悟

:::steps
1. 珍惜眼前人：小王子最终明白了玫瑰花的重要性
2. 用心感受：生活中很多美好需要用心去发现
3. 保持童心：在成长中不要失去纯真和好奇

## 五、总结

:::summary
- **作者**：安托万·德·圣-埃克苏佩里
- **类型**：寓言/童话
- **主题**：爱、责任、友谊、人生意义
- **推荐指数**：⭐⭐⭐⭐⭐
:::

:::danger 切记：不要在成长中丢失童心！
`

  const result = await generateNote({
    content,
    title: '《小王子》读书笔记',
    scene: 'reading'
  })
  
  const filePath = join(outputDir, '读书笔记', '小王子读书笔记.html')
  if (!existsSync(join(outputDir, '读书笔记'))) {
    mkdirSync(join(outputDir, '读书笔记'), { recursive: true })
  }
  writeFileSync(filePath, result.html, 'utf-8')
  
  console.log(`   ✅ 生成成功: 小王子读书笔记.html`)
  console.log(`   📁 位置: 读书笔记/`)
  console.log(`   📊 大小: ${(Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2)} KB`)
  console.log()
}

// 示例5: 会议纪要
async function demo5() {
  console.log('📌 示例5: 会议纪要')
  console.log('─'.repeat(40))
  
  const content = `
# 项目周会纪要

:::badge 会议纪要 | 项目 | 周会

**时间**：2026年7月19日 14:00-15:30
**地点**：3楼会议室A
**参会人**：张三（PM）、李四（前端）、李五（后端）、王六（测试）

## 一、上周工作汇报

:::steps
1. 前端：完成用户登录页面、注册流程优化
2. 后端：完成用户认证API、数据导出功能
3. 测试：完成登录模块测试、提交3个Bug

## 二、问题讨论

:::warning 接口响应慢：用户列表接口响应时间超过3秒

:::tip 解决方案：添加索引、分页查询、缓存热门数据

## 三、本周计划

:::compare
| 任务 | 负责人 | 截止日期 | 优先级 |
|------|--------|----------|--------|
| 个人中心开发 | 李四 | 7月22日 | 高 |
| 订单模块API | 李五 | 7月23日 | 高 |
| 集成测试 | 王六 | 7月24日 | 中 |
| 文档更新 | 张三 | 7月25日 | 低 |

## 四、行动项

:::grid
李四：7月22日前完成个人中心
李五：7月23日前完成订单API
王六：7月24日前完成集成测试
张三：跟进项目进度

## 五、总结

:::summary
- **上周完成**：登录注册、认证API、测试
- **本周重点**：个人中心、订单模块
- **待解决问题**：接口响应优化
- **下次会议**：2026年7月26日 14:00
:::
`

  const result = await generateNote({
    content,
    title: '项目周会纪要',
    scene: 'meeting'
  })
  
  const filePath = join(outputDir, '会议纪要', '项目周会纪要.html')
  if (!existsSync(join(outputDir, '会议纪要'))) {
    mkdirSync(join(outputDir, '会议纪要'), { recursive: true })
  }
  writeFileSync(filePath, result.html, 'utf-8')
  
  console.log(`   ✅ 生成成功: 项目周会纪要.html`)
  console.log(`   📁 位置: 会议纪要/`)
  console.log(`   📊 大小: ${(Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2)} KB`)
  console.log()
}

// 运行所有演示
async function runAllDemos() {
  try {
    await demo1()
    await demo2()
    await demo3()
    await demo4()
    await demo5()
    
    // 展示最终结果
    console.log('═'.repeat(60))
    console.log('🎉 【演示完成！】')
    console.log('═'.repeat(60))
    console.log()
    
    // 统计文件数量
    let totalFiles = 0
    const subdirs = readdirSync(outputDir).filter(f => {
      const stat = statSync(join(outputDir, f))
      return stat.isDirectory()
    })
    
    console.log('📁 【笔记目录结构】')
    console.log('─'.repeat(60))
    for (const subdir of subdirs) {
      const files = readdirSync(join(outputDir, subdir)).filter(f => f.endsWith('.html'))
      if (files.length > 0) {
        console.log(`   📂 ${subdir}/ (${files.length}个文件)`)
        files.forEach(f => console.log(`      └── ${f}`))
        totalFiles += files.length
      }
    }
    console.log()
    console.log(`   📊 总计: ${subdirs.length} 个分类, ${totalFiles} 个笔记文件`)
    console.log()
    
    console.log('═'.repeat(60))
    console.log('✨ 【multi-note-skill 功能展示完成】')
    console.log('═'.repeat(60))
    console.log()
    console.log('💡 使用方法:')
    console.log('   1. 用浏览器打开 D:\\blog\\notes 下的HTML文件')
    console.log('   2. 享受精美的学霸笔记本风格')
    console.log('   3. 体验逐渐生成的动画效果')
    console.log()
    console.log('🔗 项目地址: D:\\blog\\node_global\\multi-note-skill')
    console.log('📖 文档: SKILL.md')
    console.log('═'.repeat(60))
    
  } catch (error) {
    console.error('❌ 演示失败:', error.message)
  }
}

// 执行演示
runAllDemos().catch(console.error)
