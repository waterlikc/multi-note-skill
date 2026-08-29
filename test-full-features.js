// 综合功能测试 - multi-note-skill 全功能验证
import { 
  generateNote, 
  getSkillInfo, 
  getSupportedFormats,
  checkMultimodalDependencies 
} from './index.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const outputDir = 'D:\\blog\\notes'
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

console.log('🚀 multi-note-skill 综合功能测试')
console.log('='.repeat(60))
console.log()

// 测试计数器
let passed = 0
let failed = 0

// 辅助函数：保存并验证
async function testAndSave(testName, input, filename) {
  console.log(`📌 ${testName}`)
  console.log('-'.repeat(40))
  
  try {
    const result = await generateNote(input)
    const filePath = join(outputDir, filename)
    writeFileSync(filePath, result.html, 'utf-8')
    
    console.log('✅ 生成成功!')
    console.log('   标题:', result.metadata.title)
    console.log('   场景:', result.metadata.scene)
    console.log('   文件:', filename)
    console.log('   大小:', (Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2), 'KB')
    console.log()
    
    passed++
    return result
  } catch (error) {
    console.error('❌ 失败:', error.message)
    console.log()
    failed++
    return null
  }
}

// 测试1: 技术笔记（代码+图文）
async function testTechnicalNote() {
  const content = `
# JavaScript数组方法详解

## 一、基础方法

### push() - 添加元素

在数组末尾添加一个或多个元素：

\`\`\`javascript
const arr = [1, 2, 3];
arr.push(4); // [1, 2, 3, 4]
\`\`\`

### pop() - 删除末尾元素

删除并返回数组的最后一个元素：

\`\`\`javascript
const arr = [1, 2, 3];
const last = arr.pop(); // last = 3, arr = [1, 2]
\`\`\`

## 二、遍历方法

### forEach() - 遍历数组

\`\`\`javascript
const fruits = ['苹果', '香蕉', '橙子'];
fruits.forEach((fruit, index) => {
    console.log(index + ': ' + fruit);
});
\`\`\`

### map() - 映射新数组

\`\`\`javascript
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2); // [2, 4, 6]
\`\`\`

## 三、查找方法

### find() - 查找元素

\`\`\`javascript
const users = [
    { name: '张三', age: 25 },
    { name: '李四', age: 30 }
];
const user = users.find(u => u.age > 25); // { name: '李四', age: 30 }
\`\`\`

### filter() - 过滤数组

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const even = numbers.filter(n => n % 2 === 0); // [2, 4]
\`\`\`

## 四、总结

| 方法 | 用途 | 返回值 |
|------|------|--------|
| push() | 添加元素 | 新长度 |
| pop() | 删除末尾 | 被删元素 |
| forEach() | 遍历 | undefined |
| map() | 映射 | 新数组 |
| find() | 查找 | 元素或undefined |
| filter() | 过滤 | 新数组 |
`

  return testAndSave(
    '测试1: 技术笔记（代码+表格）',
    { content, title: 'JavaScript数组方法详解', scene: 'technical' },
    'JavaScript数组方法详解-技术笔记.html'
  )
}

// 测试2: 课堂笔记
async function testClassroomNote() {
  const content = `
# 高中物理 - 牛顿运动定律

## 一、牛顿第一定律

**内容**：一切物体在没有受到外力作用的时候，总保持匀速直线运动状态或静止状态。

**要点**：
- 又称惯性定律
- 力不是维持运动的原因
- 力是改变运动状态的原因

## 二、牛顿第二定律

**公式**：F = ma

**说明**：
- F：合力（牛顿 N）
- m：质量（千克 kg）
- a：加速度（m/s²）

**应用举例**：

\`\`\`
已知：m = 10kg, F = 20N
求：a
解：a = F/m = 20/10 = 2 m/s²
\`\`\`

## 三、牛顿第三定律

**内容**：两个物体之间的作用力和反作用力，总是同时存在，大小相等，方向相反。

**特点**：
- 同时产生，同时消失
- 作用在不同物体上
- 不能抵消

## 四、易错点

1. **混淆平衡力与作用力反作用力**
   - 平衡力：同一物体
   - 作用力反作用力：不同物体

2. **忘记考虑所有力**
   - 重力、支持力、摩擦力、拉力等

3. **加速度方向判断错误**
   - 加速度方向与合力方向一致

---

**学习建议**：多画受力分析图，理解力的本质。
`

  return testAndSave(
    '测试2: 课堂笔记',
    { content, title: '牛顿运动定律课堂笔记', scene: 'classroom' },
    '牛顿运动定律-课堂笔记.html'
  )
}

// 测试3: 图文结合笔记
async function testImageNote() {
  const content = `
# 中国地理知识笔记

## 一、中国地形

中国地形复杂多样，山区面积广大。

![中国地图](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/China_edcp_location_map.svg/400px-China_edcp_location_map.svg.png "中国地理位置图")

**主要地形区**：
- 青藏高原：世界屋脊
- 内蒙古高原：地势平坦
- 黄土高原：沟壑纵横
- 云贵高原：地势崎岖

## 二、中国气候

中国气候类型多样：

| 气候类型 | 分布地区 | 特点 |
|----------|----------|------|
| 温带季风气候 | 华北、东北 | 四季分明 |
| 亚热带季风气候 | 华中、华东 | 温暖湿润 |
| 热带季风气候 | 华南 | 高温多雨 |
| 温带大陆性气候 | 西北 | 干旱少雨 |

## 三、主要河流

### 长江

- 全长：6300公里
- 中国第一长河
- 流域面积：180万平方公里

### 黄河

- 全长：5464公里
- 中国第二长河
- 含沙量最大

## 四、学习要点

1. 掌握主要地形区的位置和特点
2. 理解气候类型的分布规律
3. 记忆主要河流的基本特征
`

  return testAndSave(
    '测试3: 图文结合笔记',
    { content, title: '中国地理知识笔记', scene: 'classroom' },
    '中国地理知识-图文笔记.html'
  )
}

// 测试4: 会议纪要
async function testMeetingNote() {
  const content = `
# 项目周会纪要

**时间**：2026年7月19日 14:00-15:30
**地点**：3楼会议室A
**参会人**：张三（PM）、李四（前端）、李五（后端）、王六（测试）

## 一、上周工作汇报

### 前端组（李四）
- ✅ 完成用户登录页面
- ✅ 完成注册流程优化
- 🔄 个人中心页面开发中（80%）

### 后端组（李五）
- ✅ 完成用户认证API
- ✅ 完成数据导出功能
- 🔄 性能优化进行中

### 测试组（王六）
- ✅ 完成登录模块测试
- ✅ 提交3个Bug
- 🔄 回归测试进行中

## 二、问题讨论

### 问题1：接口响应慢
**现象**：用户列表接口响应时间超过3秒
**原因**：数据库查询未优化
**方案**：
1. 添加索引
2. 分页查询
3. 缓存热门数据

### 问题2：移动端适配
**现象**：部分页面在手机端显示异常
**方案**：
1. 采用响应式设计
2. 增加移动端专项测试

## 三、本周计划

| 任务 | 负责人 | 截止日期 | 优先级 |
|------|--------|----------|--------|
| 个人中心开发 | 李四 | 7月22日 | 高 |
| 订单模块API | 李五 | 7月23日 | 高 |
| 集成测试 | 王六 | 7月24日 | 中 |
| 文档更新 | 张三 | 7月25日 | 低 |

## 四、行动项

1. **李四**：7月22日前完成个人中心页面
2. **李五**：7月23日前完成订单API并部署测试环境
3. **王六**：7月24日前完成集成测试并输出报告
4. **张三**：跟进项目进度，协调资源

---

**下次会议**：2026年7月26日 14:00
`

  return testAndSave(
    '测试4: 会议纪要',
    { content, title: '项目周会纪要', scene: 'meeting' },
    '项目周会-会议纪要.html'
  )
}

// 测试5: 科普笔记
async function testScienceNote() {
  const content = `
# 太阳系科普笔记

## 一、太阳系概述

太阳系是以太阳为中心，受太阳引力约束在一起的天体系统。

**组成**：
- 太阳（恒星）
- 8颗行星
- 矮行星
- 小行星
- 彗星
- 流星体

## 二、八大行星

### 类地行星（岩石行星）

| 行星 | 距日距离 | 公转周期 | 特点 |
|------|----------|----------|------|
| 水星 | 0.39 AU | 88天 | 最近、温差最大 |
| 金星 | 0.72 AU | 225天 | 最热、逆向自转 |
| 地球 | 1.00 AU | 365天 | 有生命 |
| 火星 | 1.52 AU | 687天 | 红色星球 |

### 类木行星（气态巨行星）

| 行星 | 距日距离 | 公转周期 | 特点 |
|------|----------|----------|------|
| 木星 | 5.20 AU | 11.86年 | 最大、大红斑 |
| 土星 | 9.54 AU | 29.46年 | 美丽光环 |
| 天王星 | 19.19 AU | 84.01年 | 侧躺自转 |
| 海王星 | 30.07 AU | 164.8年 | 最远、风速最快 |

## 三、太阳

**基本数据**：
- 年龄：约46亿年
- 类型：黄矮星
- 表面温度：约5500°C
- 核心温度：约1500万°C

**结构**：
1. 核心 - 核聚变反应
2. 辐射区 - 能量传递
3. 对流区 - 对流运动
4. 光球层 - 可见表面
5. 色球层 - 红色层
6. 日冕 - 最外层

## 四、有趣的事实

1. **木星大红斑**：比地球还大的风暴，已持续数百年
2. **土星光环**：主要由冰块和岩石碎片组成
3. **金星一天比一年长**：自转周期243天，公转周期225天
4. **火星上的奥林帕斯山**：太阳系最高的火山，高21公里

---

**思考**：宇宙如此浩瀚，人类只是沧海一粟。
`

  return testAndSave(
    '测试5: 科普笔记',
    { content, title: '太阳系科普笔记', scene: 'science' },
    '太阳系-科普笔记.html'
  )
}

// 测试6: 读书笔记
async function testReadingNote() {
  const content = `
# 《小王子》读书笔记

**作者**：安托万·德·圣-埃克苏佩里
**出版年份**：1943年
**类型**：寓言/童话

## 一、内容概述

小王子从自己的星球出发，访问了多个星球，最后来到地球。通过他的旅程，作者探讨了爱、责任、友谊和人生的意义。

## 二、主要人物

### 小王子
- 来自B612小行星
- 纯真、善良、好奇心强
- 有一朵骄傲的玫瑰花

### 飞行员
- 故事的叙述者
- 在撒哈拉沙漠遇见小王子
- 代表成年人中的"孩子"

### 玫瑰花
- 小王子星球上唯一的花
- 骄傲但脆弱
- 代表爱情

### 狐狸
- 教会小王子"驯养"的意义
- 代表友谊和智慧

## 三、经典语录

1. **"用心去看才能看清楚，用眼睛看不清本质的东西"**
   - 启示：要用心感受事物的本质

2. **"你为你的玫瑰花花费的时间，使你的玫瑰花变得重要"**
   - 启示：付出让事物变得珍贵

3. **"大人都是这样，他们需要解释"**
   - 启示：成年人过于理性，失去想象力

## 四、核心主题

### 1. 爱与责任
"如果你驯养了我，我们就彼此需要了。对我来说，你就是世界上独一无二的。对你来说，我也是世界上独一无二的。"

### 2. 童心与成长
- 大人忘记自己曾经是孩子
- 保持好奇心和想象力的重要性

### 3. 友谊
- 狐狸与小王子的友谊
- 建立联系需要时间和耐心

## 五、个人感悟

这本书用简单的语言讲述了深刻的道理：

1. **珍惜眼前人**：小王子最终明白了玫瑰花的重要性
2. **用心感受**：生活中很多美好需要用心去发现
3. **保持童心**：在成长中不要失去纯真和好奇

---

**推荐指数**：⭐⭐⭐⭐⭐

**适合人群**：所有年龄段，尤其是迷失在成人世界的"孩子们"
`

  return testAndSave(
    '测试6: 读书笔记',
    { content, title: '《小王子》读书笔记', scene: 'reading' },
    '小王子-读书笔记.html'
  )
}

// 测试7: 检查多模态依赖
async function testMultimodalDependencies() {
  console.log('📌 测试7: 多模态依赖检查')
  console.log('-'.repeat(40))
  
  try {
    const deps = await checkMultimodalDependencies()
    console.log('依赖状态:')
    console.log('  tesseract.js (OCR):', deps.tesseract ? '✅ 已安装' : '⚠️  未安装')
    console.log('  youtube-transcript:', deps.youtubeTranscript ? '✅ 已安装' : '⚠️  未安装')
    console.log('  whisper:', deps.whisper ? '✅ 已安装' : '⚠️  未安装')
    console.log('  cheerio:', deps.cheerio ? '✅ 已安装' : '⚠️  未安装')
    console.log()
    console.log('💡 安装命令:')
    if (!deps.tesseract) console.log('  npm install tesseract.js')
    if (!deps.youtubeTranscript) console.log('  npm install youtube-transcript')
    console.log()
    
    passed++
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    console.log()
    failed++
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
  console.log('📁 输出目录:', outputDir)
  console.log()
  
  // 运行测试
  await testTechnicalNote()
  await testClassroomNote()
  await testImageNote()
  await testMeetingNote()
  await testScienceNote()
  await testReadingNote()
  await testMultimodalDependencies()
  
  // 测试结果
  console.log('='.repeat(60))
  console.log('📊 测试结果')
  console.log('='.repeat(60))
  console.log(`✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`📝 总计: ${passed + failed}`)
  console.log()
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！')
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息')
  }
  
  console.log()
  console.log('📁 生成的笔记文件位于:', outputDir)
  console.log('   可以用浏览器打开查看效果')
  console.log('='.repeat(60))
}

// 执行测试
runAllTests().catch(console.error)
