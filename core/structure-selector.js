// 结构选择器 - 根据学科和复杂度选择最佳笔记结构
export class StructureSelector {
  constructor(options = {}) {
    // 笔记结构模板库
    this.structureTemplates = {
      // ==================== 通用结构 ====================
      general: {
        name: '通用结构',
        description: '适用于大多数场景的通用笔记结构',
        icon: '📝',
        structures: {
          basic: {
            name: '基础结构',
            sections: ['概述', '主要内容', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准结构',
            sections: ['概述', '核心概念', '详细内容', '示例', '总结'],
            complexity: [3, 4, 5, 6]
          },
          advanced: {
            name: '高级结构',
            sections: ['概述', '背景知识', '核心理论', '深入分析', '实践应用', '扩展阅读', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      // ==================== 理科结构 ====================
      mathematics: {
        name: '数学',
        icon: '📐',
        structures: {
          basic: {
            name: '基础数学',
            sections: ['概念定义', '公式定理', '例题解析', '练习题', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准数学',
            sections: ['知识框架', '概念详解', '公式推导', '典型例题', '易错点', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '高级数学',
            sections: ['理论背景', '公理体系', '定理证明', '推导过程', '应用实例', '拓展延伸', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      physics: {
        name: '物理',
        icon: '⚛️',
        structures: {
          basic: {
            name: '基础物理',
            sections: ['现象描述', '基本概念', '物理定律', '实验验证', '生活应用', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准物理',
            sections: ['物理图景', '概念体系', '定律公式', '实验分析', '典型问题', '易错点', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '高级物理',
            sections: ['理论背景', '物理模型', '数学推导', '实验设计', '前沿应用', '思考题', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      chemistry: {
        name: '化学',
        icon: '🧪',
        structures: {
          basic: {
            name: '基础化学',
            sections: ['物质性质', '基本概念', '化学反应', '实验现象', '生活应用', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准化学',
            sections: ['知识框架', '概念辨析', '反应原理', '实验探究', '计算题型', '易错点', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '高级化学',
            sections: ['理论基础', '反应机理', '结构分析', '实验设计', '工业应用', '前沿研究', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      biology: {
        name: '生物',
        icon: '🧬',
        structures: {
          basic: {
            name: '基础生物',
            sections: ['生命现象', '基本概念', '结构功能', '生理过程', '生态关系', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准生物',
            sections: ['知识框架', '概念体系', '结构层次', '生命活动', '遗传变异', '实验探究', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '高级生物',
            sections: ['分子机制', '细胞生物学', '遗传学', '进化生物学', '生态学', '生物技术', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      // ==================== 工科结构 ====================
      programming: {
        name: '编程',
        icon: '💻',
        structures: {
          basic: {
            name: '基础编程',
            sections: ['概念介绍', '语法规则', '代码示例', '练习题', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准编程',
            sections: ['概念详解', '语法特性', '代码示例', '最佳实践', '常见问题', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '高级编程',
            sections: ['设计思想', '架构模式', '核心原理', '源码分析', '性能优化', '实战案例', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      python: {
        name: 'Python',
        icon: '🐍',
        structures: {
          basic: {
            name: 'Python基础',
            sections: ['简介', '环境搭建', '基础语法', '代码示例', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: 'Python进阶',
            sections: ['核心概念', '语法特性', '标准库', '代码示例', '最佳实践', '常见问题', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: 'Python高级',
            sections: ['高级特性', '设计模式', '源码分析', '性能优化', '框架原理', '实战项目', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      javascript: {
        name: 'JavaScript',
        icon: '📜',
        structures: {
          basic: {
            name: 'JS基础',
            sections: ['简介', '基础语法', 'DOM操作', '代码示例', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: 'JS进阶',
            sections: ['核心概念', '异步编程', 'ES6+特性', '代码示例', '最佳实践', '常见问题', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: 'JS高级',
            sections: ['底层原理', '设计模式', '框架原理', '性能优化', '工程化', '实战项目', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      web: {
        name: 'Web开发',
        icon: '🌐',
        structures: {
          basic: {
            name: 'Web基础',
            sections: ['HTML基础', 'CSS基础', 'JavaScript基础', '代码示例', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: 'Web进阶',
            sections: ['前端框架', '响应式设计', '性能优化', '代码示例', '最佳实践', '常见问题', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: 'Web高级',
            sections: ['架构设计', '工程化', '框架原理', '性能优化', '安全', '实战项目', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      database: {
        name: '数据库',
        icon: '🗄️',
        structures: {
          basic: {
            name: '数据库基础',
            sections: ['基本概念', 'SQL语法', '表设计', '代码示例', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '数据库进阶',
            sections: ['设计原理', 'SQL高级', '索引优化', '事务处理', '常见问题', '最佳实践', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '数据库高级',
            sections: ['架构设计', '分布式数据库', '性能调优', '源码分析', '实战案例', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      devops: {
        name: '运维部署',
        icon: '⚙️',
        structures: {
          basic: {
            name: '运维基础',
            sections: ['基本概念', '常用命令', '配置方法', '操作示例', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '运维进阶',
            sections: ['架构设计', '自动化工具', '监控告警', '操作示例', '最佳实践', '常见问题', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '运维高级',
            sections: ['云原生架构', '容器编排', 'CI/CD', '性能优化', '安全加固', '实战案例', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      ai: {
        name: '人工智能',
        icon: '🤖',
        structures: {
          basic: {
            name: 'AI基础',
            sections: ['基本概念', '算法原理', '代码示例', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: 'AI进阶',
            sections: ['理论基础', '模型详解', '代码实现', '实验分析', '常见问题', '最佳实践', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: 'AI高级',
            sections: ['前沿理论', '模型架构', '源码分析', '实验设计', '论文解读', '实战项目', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      // ==================== 文科结构 ====================
      chinese: {
        name: '语文',
        icon: '📖',
        structures: {
          basic: {
            name: '语文基础',
            sections: ['字词积累', '内容理解', '写作手法', '主题思想', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '语文进阶',
            sections: ['背景知识', '文本分析', '艺术特色', '主题探讨', '拓展阅读', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '语文高级',
            sections: ['文学流派', '深度解读', '比较分析', '学术观点', '创作启示', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      english: {
        name: '英语',
        icon: '🔤',
        structures: {
          basic: {
            name: '英语基础',
            sections: ['词汇学习', '语法规则', '例句分析', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '英语进阶',
            sections: ['词汇拓展', '语法详解', '阅读理解', '写作技巧', '常见错误', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '英语高级',
            sections: ['高级词汇', '复杂语法', '学术写作', '翻译技巧', '文化背景', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      history: {
        name: '历史',
        icon: '📜',
        structures: {
          basic: {
            name: '历史基础',
            sections: ['时间背景', '事件经过', '重要人物', '历史意义', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '历史进阶',
            sections: ['时代背景', '事件分析', '人物评价', '因果关系', '历史启示', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '历史高级',
            sections: ['历史背景', '史料分析', '学术观点', '比较研究', '现实意义', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      geography: {
        name: '地理',
        icon: '🌍',
        structures: {
          basic: {
            name: '地理基础',
            sections: ['位置范围', '自然特征', '人文特征', '典型例题', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '地理进阶',
            sections: ['区域分析', '自然地理', '人文地理', '人地关系', '典型问题', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '地理高级',
            sections: ['综合分析', '地理原理', '模型构建', '案例研究', '前沿问题', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      politics: {
        name: '政治',
        icon: '⚖️',
        structures: {
          basic: {
            name: '政治基础',
            sections: ['基本概念', '原理阐述', '现实联系', '练习', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '政治进阶',
            sections: ['理论框架', '原理详解', '案例分析', '时政联系', '典型题型', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '政治高级',
            sections: ['理论体系', '深度分析', '比较研究', '学术观点', '实践应用', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      // ==================== 其他结构 ====================
      reading: {
        name: '读书笔记',
        icon: '📚',
        structures: {
          basic: {
            name: '基础读书笔记',
            sections: ['书籍信息', '内容概述', '精彩摘录', '个人感悟', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准读书笔记',
            sections: ['书籍信息', '作者介绍', '核心观点', '内容分析', '精彩摘录', '个人思考', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '深度读书笔记',
            sections: ['背景研究', '理论框架', '深度解读', '批判性分析', '实践应用', '延伸阅读', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      meeting: {
        name: '会议纪要',
        icon: '📋',
        structures: {
          basic: {
            name: '基础会议纪要',
            sections: ['会议信息', '会议议程', '讨论要点', '决议事项', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准会议纪要',
            sections: ['会议信息', '参会人员', '议程内容', '讨论要点', '决议事项', '行动项', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '详细会议纪要',
            sections: ['会议背景', '参会人员', '详细议程', '深入讨论', '决议事项', '行动项', '风险评估', '下一步计划'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      research: {
        name: '调研分析',
        icon: '📊',
        structures: {
          basic: {
            name: '基础调研报告',
            sections: ['调研背景', '调研方法', '调研结果', '结论建议', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准调研报告',
            sections: ['调研背景', '调研方法', '数据分析', '主要发现', '结论建议', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '详细调研报告',
            sections: ['研究背景', '文献综述', '研究方法', '数据分析', '深度讨论', '结论建议', '研究局限', '未来方向'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      project: {
        name: '项目报告',
        icon: '📈',
        structures: {
          basic: {
            name: '基础项目报告',
            sections: ['项目概述', '进展情况', '成果展示', '问题与挑战', '下一步计划'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准项目报告',
            sections: ['项目背景', '目标设定', '进展详情', '成果展示', '问题分析', '经验总结', '下一步计划'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '详细项目报告',
            sections: ['项目背景', '战略目标', '详细进展', '成果分析', '风险评估', '资源分析', '经验教训', '优化建议', '未来规划'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      // 多模态输入专用结构
      video: {
        name: '视频笔记',
        icon: '🎬',
        structures: {
          basic: {
            name: '基础视频笔记',
            sections: ['视频信息', '内容概述', '重点内容', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准视频笔记',
            sections: ['视频信息', '内容大纲', '分段详解', '重点标记', '时间线', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '详细视频笔记',
            sections: ['视频信息', '内容大纲', '逐段详解', '重点分析', '知识图谱', '拓展资源', '思考题', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      image: {
        name: '图片笔记',
        icon: '🖼️',
        structures: {
          basic: {
            name: '基础图片笔记',
            sections: ['图片信息', '内容提取', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准图片笔记',
            sections: ['图片信息', '文字内容', '结构分析', '重点标记', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '详细图片笔记',
            sections: ['图片信息', '内容提取', '深度分析', '知识关联', '拓展思考', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      web: {
        name: '网页笔记',
        icon: '🌐',
        structures: {
          basic: {
            name: '基础网页笔记',
            sections: ['网页信息', '内容摘要', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准网页笔记',
            sections: ['网页信息', '文章结构', '核心内容', '重点摘录', '个人思考', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '详细网页笔记',
            sections: ['网页信息', '背景分析', '深度解读', '批判性分析', '知识关联', '实践应用', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      },
      
      audio: {
        name: '音频笔记',
        icon: '🎧',
        structures: {
          basic: {
            name: '基础音频笔记',
            sections: ['音频信息', '内容概述', '重点内容', '总结'],
            complexity: [1, 2, 3]
          },
          standard: {
            name: '标准音频笔记',
            sections: ['音频信息', '内容大纲', '分段详解', '重点标记', '时间线', '总结'],
            complexity: [4, 5, 6]
          },
          advanced: {
            name: '详细音频笔记',
            sections: ['音频信息', '内容大纲', '逐段详解', '重点分析', '知识图谱', '拓展资源', '思考题', '总结'],
            complexity: [7, 8, 9, 10]
          }
        }
      }
    }
    
    // 模板样式推荐
    this.templateRecommendations = {
      // Style A - 教学笔记本
      styleA: {
        name: 'Style A - 教学笔记本',
        description: '螺旋装订、横线纸张、手写体',
        suitableFor: ['课堂学习', '科普教育', '技术教学', '读书笔记'],
        subjects: ['mathematics', 'physics', 'chemistry', 'biology', 'chinese', 'english', 'history', 'geography', 'politics', 'reading']
      },
      // Style B - 手账皮革本
      styleB: {
        name: 'Style B - 手账皮革本',
        description: '皮革封面、翻页交互、分页式',
        suitableFor: ['学术会议', '调研分析', '正式报告', '项目报告'],
        subjects: ['meeting', 'research', 'project']
      },
      // Style C - 简约现代
      styleC: {
        name: 'Style C - 简约现代',
        description: '渐变头部、卡片式布局',
        suitableFor: ['技术文档', '专业报告', '编程教程'],
        subjects: ['programming', 'python', 'javascript', 'web', 'database', 'devops', 'ai']
      }
    }
    
    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 100
  }

  // 主选择方法
  select(subject, complexity, options = {}) {
    // 获取学科结构
    const subjectStructures = this.structureTemplates[subject] || this.structureTemplates.general
    
    // 根据复杂度选择结构
    const structure = this.selectByComplexity(subjectStructures, complexity)
    
    // 获取推荐模板
    const recommendedTemplate = this.recommendTemplate(subject, complexity)
    
    // 生成自定义结构（如果需要）
    const customStructure = options.customStructure || null
    
    return {
      subject: subject,
      subjectName: subjectStructures.name,
      subjectIcon: subjectStructures.icon,
      structure: structure,
      complexity: complexity,
      recommendedTemplate: recommendedTemplate,
      customStructure: customStructure,
      metadata: {
        selectedAt: new Date().toISOString(),
        structureName: structure.name,
        sectionCount: structure.sections.length
      }
    }
  }

  // 根据复杂度选择结构
  selectByComplexity(subjectStructures, complexity) {
    const structures = subjectStructures.structures
    
    // 根据复杂度范围选择
    for (const [level, structure] of Object.entries(structures)) {
      if (structure.complexity.includes(complexity)) {
        return structure
      }
    }
    
    // 默认返回标准结构
    return structures.standard || structures.basic
  }

  // 推荐模板
  recommendTemplate(subject, complexity) {
    // 根据学科推荐
    for (const [templateId, template] of Object.entries(this.templateRecommendations)) {
      if (template.subjects.includes(subject)) {
        return {
          id: templateId,
          ...template
        }
      }
    }
    
    // 根据复杂度推荐
    if (complexity >= 7) {
      return {
        id: 'styleB',
        ...this.templateRecommendations.styleB
      }
    }
    
    // 默认推荐Style A
    return {
      id: 'styleA',
      ...this.templateRecommendations.styleA
    }
  }

  // 获取学科结构
  getSubjectStructures(subject) {
    return this.structureTemplates[subject] || this.structureTemplates.general
  }

  // 获取所有学科
  getAllSubjects() {
    return Object.entries(this.structureTemplates).map(([id, template]) => ({
      id,
      name: template.name,
      icon: template.icon,
      structureCount: Object.keys(template.structures).length
    }))
  }

  // 获取复杂度级别
  getComplexityLevels() {
    return [
      { level: 1, name: '入门', description: '基础概念，适合初学者' },
      { level: 2, name: '基础', description: '基本知识，适合新手' },
      { level: 3, name: '初级', description: '简单应用，适合入门者' },
      { level: 4, name: '中级', description: '综合应用，适合有一定基础者' },
      { level: 5, name: '中高级', description: '深入理解，适合有经验者' },
      { level: 6, name: '高级', description: '专业内容，适合学习者' },
      { level: 7, name: '专家级', description: '深度专业，适合专业人士' },
      { level: 8, name: '大师级', description: '前沿研究，适合研究者' },
      { level: 9, name: '研究级', description: '学术前沿，适合学者' },
      { level: 10, name: '顶级', description: '顶尖内容，适合专家' }
    ]
  }

  // 获取模板推荐
  getTemplateRecommendations() {
    return Object.entries(this.templateRecommendations).map(([id, template]) => ({
      id,
      ...template
    }))
  }

  // 自定义结构
  customizeStructure(baseStructure, customizations) {
    return {
      ...baseStructure,
      sections: customizations.sections || baseStructure.sections,
      name: customizations.name || baseStructure.name
    }
  }

  // 合并结构
  mergeStructures(structure1, structure2) {
    const mergedSections = [...new Set([...structure1.sections, ...structure2.sections])]
    
    return {
      name: `${structure1.name} + ${structure2.name}`,
      sections: mergedSections,
      complexity: [
        Math.min(structure1.complexity[0], structure2.complexity[0]),
        Math.max(structure1.complexity[structure1.complexity.length - 1], structure2.complexity[structure2.complexity.length - 1])
      ]
    }
  }

  // 生成缓存键
  generateCacheKey(subject, complexity) {
    return `structure_${subject}_${complexity}`
  }

  // 管理缓存大小
  manageCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  // 清空缓存
  clearCache() {
    this.cache.clear()
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    }
  }
}

// 便捷工厂函数
export function createStructureSelector(options = {}) {
  return new StructureSelector(options)
}

// 快速选择函数
export function selectStructure(subject, complexity, options = {}) {
  const selector = createStructureSelector(options)
  return selector.select(subject, complexity, options)
}
