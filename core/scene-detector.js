// 场景识别系统 - 规范化版本（带缓存优化）
export class SceneDetector {
  constructor() {
    this.scenePatterns = {
      tech: {
        keywords: ['代码', '编程', 'API', '框架', '算法', '数据结构', '函数', '类', '接口', 'bug', '调试', 'Python', 'JavaScript', 'Java', 'React', 'Vue', 'Node', '开发', '技术', 'HTML', 'CSS', '数据库', 'SQL', 'Git', 'Docker'],
        patterns: [/```[\s\S]*?```/g, /<code>[\s\S]*?<\/code>/g, /\w+\.\w+\(/g, /import\s+\w+/g, /const\s+\w+/g, /function\s+\w+/g],
        style: 'tech',
        folder: '技术学习',
        structure: ['概念→语法→示例→实践→总结', '简介→安装→使用→高级→总结']
      },
      course: {
        keywords: ['课堂', '老师', '学生', '考试', '作业', '知识点', '重点', '难点', '公式', '定理', '课程', '学习', '笔记', '数学', '物理', '化学', '生物', '英语', '复习'],
        patterns: [/第.*章/g, /第.*节/g, /\*\*.*\*\*/g, /知识点/g, /重点/g],
        style: 'course',
        folder: '课堂学习',
        structure: ['框架→概念→重点→易错→总结', '大纲→知识点→例题→练习→总结']
      },
      science: {
        keywords: ['科普', '原理', '机制', '现象', '实验', '发现', '研究', '科学', '知识', '入门', '基础', '宇宙', '星球', '生命', '进化', '基因', '量子'],
        patterns: [/如图.*所示/g, /例如.*?：/g, /换句话说/g, /原理/g, /机制/g],
        style: 'science',
        folder: '科普知识',
        structure: ['现象→原理→应用→思考→总结', '简介→原理→实例→拓展→总结']
      },
      reading: {
        keywords: ['读书', '书评', '感悟', '作品', '文学', '小说', '散文', '诗歌', '阅读', '书籍', '故事', '人物', '情节', '作者', '章节'],
        patterns: [/《.*》/g, /作者/g, /故事/g, /人物/g, /主题/g],
        style: 'reading',
        folder: '读书笔记',
        structure: ['概述→人物→主题→感悟→总结', '简介→内容→分析→思考→总结']
      },
      meeting: {
        keywords: ['会议', '议程', '决议', '行动项', '讨论', '决定', '下一步', '负责人', '截止日期', '研讨', '周会', '例会', '汇报', '参会'],
        patterns: [/\[.*?\]/g, /负责人/g, /截止日期/g],
        style: 'meeting',
        folder: '会议纪要',
        structure: ['议程→要点→讨论→决策→总结', '背景→内容→结论→行动→总结']
      },
      research: {
        keywords: ['问卷', '数据', '统计', '结论', '调研', '分析', '报告', '研究', '调查', '样本', '指标', '趋势', '市场', '用户'],
        patterns: [/数据/g, /统计/g, /分析/g, /结论/g, /建议/g],
        style: 'research',
        folder: '调研分析',
        structure: ['背景→方法→发现→结论→建议', '目的→过程→结果→分析→建议']
      },
      project: {
        keywords: ['项目', '报告', '进展', '成果', '总结', '计划', '工作', '任务', '进度', '里程碑', '风险', '复盘', '回顾'],
        patterns: [/项目/g, /进度/g, /计划/g, /成果/g, /问题/g],
        style: 'project',
        folder: '项目报告',
        structure: ['背景→进展→成果→问题→计划', '目标→过程→结果→反思→计划']
      },
      outline: {
        keywords: ['课程', '大纲', '教学计划', '学期', '教案', '教学', '设计', '目标', '内容', '考核', '评价'],
        patterns: [/大纲/g, /教学/g, /课程/g, /计划/g, /目标/g],
        style: 'outline',
        folder: '课程大纲',
        structure: ['信息→目标→内容→进度→考核', '概述→目标→大纲→方法→评价']
      },
      creative: {
        keywords: ['创作', '写作', '小说', '故事', '文案', '剧本', '诗歌', '灵感', '构思', '情节', '角色', '设定'],
        patterns: [/创作/g, /写作/g, /故事/g, /人物/g, /情节/g],
        style: 'creative',
        folder: '创意写作',
        structure: ['构思→大纲→初稿→修改→定稿', '灵感→框架→内容→润色→完成']
      },
      life: {
        keywords: ['日记', '生活', '记录', '旅行', '美食', '健康', '运动', '心情', '今天', '感悟', '日常', '兴趣'],
        patterns: [/今天/g, /日记/g, /旅行/g, /美食/g, /心情/g],
        style: 'life',
        folder: '生活记录',
        structure: ['时间→地点→事件→感受→总结', '背景→经过→感悟→照片→总结']
      }
    }
    
    // 🔧 优化: 添加缓存机制
    this.cache = new Map()
    this.maxCacheSize = 200
    this.cacheHits = 0
    this.cacheMisses = 0
    
    // 预编译关键词正则
    this.compiledKeywords = this.precompileKeywords()
  }

  // 预编译关键词正则
  precompileKeywords() {
    const compiled = {}
    for (const [scene, data] of Object.entries(this.scenePatterns)) {
      compiled[scene] = data.keywords.map(keyword => 
        new RegExp(keyword, 'gi')
      )
    }
    return compiled
  }

  detect(content) {
    // 🔧 优化: 检查缓存
    const cacheKey = this.generateCacheKey(content)
    if (this.cache.has(cacheKey)) {
      this.cacheHits++
      return this.cache.get(cacheKey)
    }
    
    this.cacheMisses++
    
    const scores = {}
    
    for (const [scene, data] of Object.entries(this.scenePatterns)) {
      scores[scene] = this.calculateScore(content, data, scene)
    }
    
    // 返回得分最高的场景
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    const result = sorted[0][0]
    
    // 🔧 优化: 缓存结果
    this.cache.set(cacheKey, result)
    this.manageCacheSize()
    
    return result
  }

  calculateScore(content, sceneData, scene) {
    let score = 0
    
    // 🔧 优化: 使用预编译的关键词正则
    const keywordRegexes = this.compiledKeywords[scene]
    for (const regex of keywordRegexes) {
      const matches = content.match(regex)
      if (matches) {
        score += matches.length * 10
      }
    }
    
    // 模式匹配得分
    for (const pattern of sceneData.patterns) {
      const matches = content.match(pattern)
      if (matches) {
        score += matches.length * 15
      }
    }
    
    return score
  }

  // 生成缓存键
  generateCacheKey(content) {
    // 使用内容的前100个字符作为缓存键
    const key = content.substring(0, 100).replace(/\s+/g, '')
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  // 管理缓存大小
  manageCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      // 删除最旧的缓存项
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  // 获取缓存统计
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? ((this.cacheHits / total) * 100).toFixed(2) + '%' : '0%'
    }
  }

  getRecommendedStyle(scene) {
    const styleMapping = {
      tech: 'style-a',
      course: 'style-a',
      science: 'style-a',
      reading: 'style-a',
      meeting: 'style-b',
      research: 'style-a',
      project: 'style-b',
      outline: 'style-a',
      creative: 'style-a',
      life: 'style-a'
    }
    
    return styleMapping[scene] || 'style-a'
  }

  getFolder(scene) {
    const folderMapping = {
      tech: '技术学习',
      course: '课堂学习',
      science: '科普知识',
      reading: '读书笔记',
      meeting: '会议纪要',
      research: '调研分析',
      project: '项目报告',
      outline: '课程大纲',
      creative: '创意写作',
      life: '生活记录'
    }
    
    return folderMapping[scene] || '其他'
  }

  getStructure(scene) {
    const structureMapping = {
      tech: ['概念→语法→示例→实践→总结', '简介→安装→使用→高级→总结'],
      course: ['框架→概念→重点→易错→总结', '大纲→知识点→例题→练习→总结'],
      science: ['现象→原理→应用→思考→总结', '简介→原理→实例→拓展→总结'],
      reading: ['概述→人物→主题→感悟→总结', '简介→内容→分析→思考→总结'],
      meeting: ['议程→要点→讨论→决策→总结', '背景→内容→结论→行动→总结'],
      research: ['背景→方法→发现→结论→建议', '目的→过程→结果→分析→建议'],
      project: ['背景→进展→成果→问题→计划', '目标→过程→结果→反思→计划'],
      outline: ['信息→目标→内容→进度→考核', '概述→目标→大纲→方法→评价'],
      creative: ['构思→大纲→初稿→修改→定稿', '灵感→框架→内容→润色→完成'],
      life: ['时间→地点→事件→感受→总结', '背景→经过→感悟→照片→总结']
    }
    
    return structureMapping[scene] || ['概述→内容→总结']
  }

  // 获取场景的完整信息
  getSceneInfo(scene) {
    return {
      id: scene,
      name: this.getSceneName(scene),
      folder: this.getFolder(scene),
      style: this.getRecommendedStyle(scene),
      structure: this.getStructure(scene),
      keywords: this.scenePatterns[scene]?.keywords || []
    }
  }

  getSceneName(scene) {
    const nameMapping = {
      tech: '技术学习',
      course: '课堂学习',
      science: '科普知识',
      reading: '读书笔记',
      meeting: '会议纪要',
      research: '调研分析',
      project: '项目报告',
      outline: '课程大纲',
      creative: '创意写作',
      life: '生活记录'
    }
    
    return nameMapping[scene] || '其他'
  }
}