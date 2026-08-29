// 图文结合笔记测试
import { generateNote } from './index.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🖼️  图文结合笔记生成测试')
console.log('='.repeat(60))
console.log()

// 图文结合的笔记内容
const imageNoteContent = `
# Python编程学习笔记

## 一、Python简介

Python是一种广泛使用的高级编程语言，由**Guido van Rossum**于1991年创建。

![Python Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/200px-Python-logo-notext.svg.png "Python官方Logo")

Python的设计哲学强调**代码的可读性**和**简洁性**。

## 二、开发环境搭建

### 安装Python

首先需要从官网下载Python安装包：

![Python下载](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/150px-Python-logo-notext.svg.png "Python官网")

### 选择IDE

推荐使用以下开发工具：

- **PyCharm**：专业Python IDE
- **VS Code**：轻量级编辑器
- **Jupyter Notebook**：交互式开发

## 三、基础语法

### 变量与数据类型

Python支持多种数据类型：

![数据类型](https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Python_3._The_standard_type_hierarchy.png/400px-Python_3._The_standard_type_hierarchy.png "Python数据类型图解")

### 控制流程

条件语句和循环是编程的基础：

\`\`\`python
# 条件语句
if score >= 90:
    grade = 'A'
elif score >= 80:
    grade = 'B'
else:
    grade = 'C'

# 循环
for i in range(10):
    print(i)
\`\`\`

## 四、常用库

Python拥有丰富的第三方库生态系统：

| 库名 | 用途 | 特点 |
|------|------|------|
| NumPy | 数值计算 | 高效数组操作 |
| Pandas | 数据处理 | DataFrame结构 |
| Matplotlib | 数据可视化 | 绑定图表类型 |
| Requests | HTTP请求 | 简洁易用 |

## 五、学习路径

![Python应用领域](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/120px-Python-logo-notext.svg.png "Python应用领域")

1. 基础语法 → 2. 面向对象 → 3. 文件操作 → 4. 网络编程 → 5. Web开发

## 六、实战项目

### 项目1：计算器

简单的命令行计算器程序：

\`\`\`python
def calculator():
    num1 = float(input("输入第一个数字: "))
    operator = input("输入运算符(+,-,*,/): ")
    num2 = float(input("输入第二个数字: "))
    
    if operator == '+':
        print(f"结果: {num1 + num2}")
    elif operator == '-':
        print(f"结果: {num1 - num2}")
    elif operator == '*':
        print(f"结果: {num1 * num2}")
    elif operator == '/':
        if num2 != 0:
            print(f"结果: {num1 / num2}")
        else:
            print("错误：除数不能为0")
\`\`\`

## 七、学习建议

![编程学习](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/100px-Python-logo-notext.svg.png "编程学习")

- **多动手实践**：理论结合实践
- **阅读源码**：学习优秀代码
- **参与社区**：加入Python社区
- **持续学习**：跟进最新发展

---

**总结**：Python是一门强大而灵活的编程语言，适合初学者入门，也能满足专业开发需求。
`

// 运行测试
async function runTest() {
  console.log('📝 生成图文结合笔记...')
  console.log('-'.repeat(40))

  try {
    const result = await generateNote({
      content: imageNoteContent,
      title: 'Python编程学习笔记',
      scene: 'technical'
    })

    console.log('✅ 生成成功!')
    console.log('   标题:', result.metadata.title)
    console.log('   场景:', result.metadata.scene)
    console.log('   日期:', result.metadata.date)
    console.log()

    // 保存HTML文件
    const outputDir = 'D:\\blog\\notes'
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const filename = 'Python编程学习笔记-图文版.html'
    const filePath = join(outputDir, filename)
    
    writeFileSync(filePath, result.html, 'utf-8')
    
    console.log('💾 文件保存成功!')
    console.log('   路径:', filePath)
    console.log()

    // 显示文件大小
    const stats = Buffer.byteLength(result.html, 'utf-8')
    console.log('📊 文件统计:')
    console.log('   大小:', (stats / 1024).toFixed(2), 'KB')
    console.log()

    console.log('🎨 笔记特色:')
    console.log('   ✓ 学霸笔记本风格')
    console.log('   ✓ 图文结合排版')
    console.log('   ✓ 图片带图注说明')
    console.log('   ✓ 宝丽来照片效果')
    console.log('   ✓ 逐渐生成动画效果')
    console.log()

    console.log('📷 支持的图片格式:')
    console.log('   • ![alt](url) - 标准图片')
    console.log('   • ![alt](url "caption") - 带图注图片')
    console.log('   • image-grid: url1, url2, url3 - 图片网格')
    console.log()

    console.log('='.repeat(60))
    console.log('✨ 测试完成！请用浏览器打开HTML文件查看效果')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    console.error(error.stack)
  }
}

// 运行测试
runTest().catch(console.error)
