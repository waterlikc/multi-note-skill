// 优化的场景识别系统 - Token消耗优化版
export class SceneDetector {
  constructor() {
    // 场景模式定义
    this.scenePatterns = {
      technical: {
        keywords: ['代码', '编程', 'API', '框架', '算法', '数据结构', '函数', '类', '接口', 'bug', '调试'],
        patterns: [/```[\s\S]*?```/g, /<code>[\s\S]*?<\/code>/g, /\w+\.\w+\(/g],
        style: 'technical'
      },
      classroom: {
        keywords: ['课堂', '老师', '学生', '考试', '作业', '知识点', '重点', '难点', '公式', '定理'],
        patterns: [/第.*章/g, /第.*节/g, /\*\*.*\*\*/g],
        style: 'classroom'
      },
      science: {
        keywords: ['科普', '原理', '机制', '现象', '实验', '发现', '研究', '科学', '技术', '应用'],
        patterns: [/如图.*所示/g, /例如.*?：/g, /换句话说/g],
        style: 'science'
      },
      meeting: {
        keywords: ['会议', '议程', '决议', '行动项', '讨论', '决定', '下一步', '负责人', '截止日期'],
        patterns: [/^\d+\./gm, /[-*]\s.*$/gm, /\[.*?\]/g],
        style: 'meeting'
      }
    }

    // 🔧 优化1: 预编译所有正则表达式
    this.compiledPatterns = this.precompilePatterns()

    // 🔧 优化2: 添加智能缓存机制
    this.cache = new Map()
    this.maxCacheSize = 100
    this.cacheHits = 0
    this.cacheMisses = 0

    // 样式映射
    this.styleMapping = {
      technical: 'style-a',
      classroom: 'style-a',
      science: 'style-a',
      meeting: 'style-b'
    }
  }

  // 🔧 优化3: 预编译所有正则表达式，避免重复创建
  precompilePatterns() {
    const compiled = {}
    for (const [scene, data] of Object.entries(this.scenePatterns)) {
      compiled[scene] = {
        keywordRegexes: data.keywords.map(keyword => 
          new RegExp(keyword, 'gi')
        ),
        patternRegexes: data.patterns.map(pattern => 
          new RegExp(pattern.source, pattern.flags)
        ),
        metadata: {
          keywordCount: data.keywords.length,
          patternCount: data.patterns.length,
          style: data.style
        }
      }
    }
    return compiled
  }

  // 带缓存的场景检测
  detect(content) {
    // 生成内容哈希作为缓存键
    const cacheKey = this.generateHash(content)

    // 🔧 优化4: 检查缓存，避免重复计算
    if (this.cache.has(cacheKey)) {
      this.cacheHits++
      return this.cache.get(cacheKey)
    }

    this.cacheMisses++

    // 使用预编译的正则表达式进行场景计算
    const scores = this.calculateAllScores(content)

    // 找到得分最高的场景
    const result = this.findTopScene(scores)

    // 🔧 优化5: 缓存结果
    this.cache.set(cacheKey, result)

    // 管理缓存大小，防止内存泄漏
    this.manageCacheSize()

    return result
  }

  // 计算所有场景的得分（优化版）
  calculateAllScores(content) {
    const scores = {}
    for (const [scene, compiledData] of Object.entries(this.compiledPatterns)) {
      scores[scene] = this.calculateScoreOptimized(content, compiledData)
    }
    return scores
  }

  // 🔧 优化6: 使用预编译正则的评分计算
  calculateScoreOptimized(content, compiledData) {
    let score = 0

    // 使用预编译的关键词正则表达式
    for (const regex of compiledData.keywordRegexes) {
      const matches = content.match(regex)
      if (matches) {
        score += matches.length * 10
      }
    }

    // 使用预编译的模式正则表达式
    for (const regex of compiledData.patternRegexes) {
      const matches = content.match(regex)
      if (matches) {
        score += matches.length * 15
      }
    }

    return score
  }

  // 找到得分最高的场景
  findTopScene(scores) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    
    // 如果最高分和其他场景差距很小，返回默认场景
    if (sorted.length > 1 && sorted[0][1] - sorted[1][1] < 5) {
      return 'technical' // 默认返回技术场景
    }
    
    return sorted[0][0]
  }

  // 🔧 优化7: 简单高效的内容哈希生成
  generateHash(content) {
    let hash = 0
    for (let i = 0; i < Math.min(content.length, 1000); i++) { // 只取前1000字符生成哈希
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36) // 使用36进制，更短的字符串
  }

  // 管理缓存大小
  manageCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      // 删除最旧的缓存项
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  // 获取推荐样式
  getRecommendedStyle(scene) {
    return this.styleMapping[scene] || 'style-a'
  }

  // 🔧 优化8: 批量场景检测（减少重复计算）
  detectBatch(contents) {
    return contents.map(content => this.detect(content))
  }

  // 获取缓存统计信息
  getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests * 100).toFixed(2) : '0.00'

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      totalRequests: totalRequests
    }
  }

  // 清空缓存
  clearCache() {
    this.cache.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  // 预热缓存（提前加载常用模式）
  warmupCache(commonContents = []) {
    for (const content of commonContents) {
      this.detect(content)
    }
    return this.getCacheStats()
  }

  // 获取场景详细信息
  getSceneInfo(scene) {
    const compiledData = this.compiledPatterns[scene]
    if (!compiledData) {
      return null
    }

    return {
      name: scene,
      style: compiledData.metadata.style,
      keywordCount: compiledData.metadata.keywordCount,
      patternCount: compiledData.metadata.patternCount,
      recommendedStyle: this.getRecommendedStyle(scene)
    }
  }

  // 获取所有支持的场景
  getSupportedScenes() {
    return Object.keys(this.scenePatterns)
  }
}