/**
 * 演示示例4：学霸笔记风格
 * 展示如何生成学霸风格的精美笔记
 */

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

// 示例内容
const sampleContents = [
  {
    name: 'Python 面向对象编程',
    content: `
      Python 面向对象编程（OOP）
      
      类的定义
      使用 class 关键字定义类：
      
      class Dog:
          def __init__(self, name, age):
              self.name = name
              self.age = age
          
          def bark(self):
              return f"{self.name} says Woof!"
      
      继承
      继承允许创建类的层次结构：
      
      class Puppy(Dog):
          def play(self):
              return f"{self.name} is playing!"
      
      封装
      使用下划线约定表示私有属性：
      
      class Account:
          def __init__(self, balance):
              self._balance = balance  # 受保护
              self.__id = 123          # 私有
      
      多态
      不同类可以实现相同的方法：
      
      class Cat:
          def speak(self):
              return "Meow"
      
      class Dog:
          def speak(self):
              return "Woof"
      
      最佳实践
      1. 单一职责原则
      2. 使用组合优于继承
      3. 保持接口简单
    `
  },
  {
    name: '数据结构与算法',
    content: `
      常见数据结构
      
      数组（Array）
      - 连续内存存储
      - 随机访问 O(1)
      - 插入删除 O(n)
      
      链表（Linked List）
      - 非连续内存
      - 顺序访问 O(n)
      - 插入删除 O(1)
      
      哈希表（Hash Table）
      - 键值对存储
      - 查找 O(1)
      - 冲突处理
      
      树（Tree）
      - 二叉树
      - 二叉搜索树
      - 平衡树（AVL、红黑树）
      
      图（Graph）
      - 邻接矩阵
      - 邻接表
      - BFS、DFS遍历
      
      常见算法
      排序：快排、归并、堆排
      查找：二分查找
      动态规划：背包问题、最长公共子序列
    `
  }
]

async function demoStudyNotes() {
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('📚 演示示例4：学霸笔记风格'))
  console.log(colors.cyan(divider + '\n'))

  const subjectDetector = new SubjectDetector()
  const complexityAnalyzer = new ComplexityAnalyzer()
  const knowledgeExtractor = new KnowledgeExtractor()
  const structureSelector = new StructureSelector()

  for (const sample of sampleContents) {
    console.log(colors.blue(`\n📖 内容: ${sample.name}`))
    console.log('─'.repeat(50))

    // 1. 分析内容
    const content = sample.content

    // 学科识别
    const subjectResult = subjectDetector.detect(content)
    console.log(colors.green(`✓ 学科: ${subjectResult.subjectName} ${subjectResult.icon}`))

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
    console.log(colors.green(`✓ 结构: ${structureResult.structure.name}`))
    console.log(`  模板: ${structureResult.recommendedTemplate.name}`)

    // 2. 生成学霸笔记预览
    console.log(colors.yellow('\n📝 学霸笔记预览:'))
    console.log('═'.repeat(50))

    // 标题
    console.log(colors.bold(`\n${sample.name}`))
    console.log(`${subjectResult.subjectName} | ${complexityResult.level.name}难度`)
    console.log('─'.repeat(50))

    // 章节结构
    console.log(colors.cyan('\n📋 目录结构:'))
    structureResult.structure.sections.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section}`)
    })

    // 核心知识点
    console.log(colors.cyan('\n⭐ 核心知识点:'))
    const importantPoints = knowledgeResult.knowledgePoints
      .filter(p => p.importance === 'high')
      .slice(0, 5)
    
    if (importantPoints.length > 0) {
      importantPoints.forEach((point, i) => {
        console.log(`  ${i + 1}. ${point.text}`)
      })
    } else {
      console.log('  （暂无高重要性知识点）')
    }

    // 学习建议
    console.log(colors.cyan('\n💡 学习建议:'))
    if (complexityResult.score >= 7) {
      console.log('  ⚠️ 内容较难，建议先掌握基础知识')
    } else if (complexityResult.score <= 3) {
      console.log('  ✅ 内容较简单，适合入门学习')
    } else {
      console.log('  📚 难度适中，建议结合实践学习')
    }

    // 知识点统计
    console.log(colors.cyan('\n📊 知识点统计:'))
    const byType = {}
    knowledgeResult.knowledgePoints.forEach(p => {
      byType[p.type] = (byType[p.type] || 0) + 1
    })
    Object.entries(byType).forEach(([type, count]) => {
      const icon = knowledgeExtractor.getTypeIcon(type)
      const name = knowledgeExtractor.getTypeName(type)
      console.log(`  ${icon} ${name}: ${count} 个`)
    })
  }

  // 展示学霸笔记特点
  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('🎓 学霸笔记特点'))
  console.log(colors.cyan(divider + '\n'))

  const features = [
    { icon: '📝', name: '结构清晰', desc: '按照学科特点组织内容' },
    { icon: '⭐', name: '重点突出', desc: '高亮核心知识点' },
    { icon: '💡', name: '学习建议', desc: '根据难度提供学习指导' },
    { icon: '📊', name: '统计分析', desc: '知识点类型分布' },
    { icon: '🎯', name: '目标明确', desc: '明确学习目标和路径' }
  ]

  features.forEach(feature => {
    console.log(`  ${feature.icon} ${feature.name}: ${feature.desc}`)
  })

  console.log(colors.cyan('\n' + divider))
  console.log(colors.bold('✅ 学霸笔记演示完成'))
  console.log(colors.cyan(divider + '\n'))
}

// 运行演示
demoStudyNotes().catch(console.error)
