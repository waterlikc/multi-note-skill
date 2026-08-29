// 复杂度分析器 - 评估内容复杂度
export class ComplexityAnalyzer {
  constructor(options = {}) {
    // 复杂度指标配置
    this.complexityIndicators = {
      // 词汇复杂度
      vocabulary: {
        // 高级词汇
        advanced: ['抽象', '假设', '推论', '归纳', '演绎', '悖论', '范式', '元认知', '后现代', '解构', '建构', '解构主义', '存在主义', '虚无主义', '辩证', '形而上学', '认识论', '本体论'],
        // 专业术语
        technical: ['API', 'SDK', '框架', '架构', '算法', '数据结构', '设计模式', '重构', '优化', '性能', '并发', '异步', '同步', '分布式', '微服务', '容器化', '云原生'],
        // 权重
        weights: {
          advanced: 3,
          technical: 2
        }
      },
      
      // 句子复杂度
      sentence: {
        // 复杂句型模式
        complexPatterns: [
          /虽然.*但是.*却/g, // 转折句
          /不仅.*而且.*还/g, // 递进句
          /因为.*所以.*因此/g, // 因果句
          /如果.*那么.*否则/g, // 条件句
          /只要.*就.*否则/g, // 条件句
          /与其.*不如.*宁可/g, // 选择句
        ],
        // 长句阈值（字符数）
        longSentenceThreshold: 50,
        // 权重
        weights: {
          complexPattern: 2,
          longSentence: 1
        }
      },
      
      // 结构复杂度
      structure: {
        // 复杂结构模式
        complexStructures: [
          { pattern: /```[\s\S]*?```/g, name: '代码块', weight: 3 },
          { pattern: /\|.*\|.*\|/g, name: '表格', weight: 2 },
          { pattern: /```mermaid[\s\S]*?```/g, name: '流程图', weight: 4 },
          { pattern: /```math[\s\S]*?```/g, name: '数学公式', weight: 4 },
          { pattern: /^\s*[-*]\s.*/gm, name: '列表', weight: 1 },
          { pattern: /^\s*\d+\.\s.*/gm, name: '有序列表', weight: 1 },
          { pattern: /^#+\s.*/gm, name: '标题层级', weight: 1 },
        ],
        // 权重
        weights: {
          codeBlock: 3,
          table: 2,
          diagram: 4,
          math: 4,
          list: 1,
          heading: 1
        }
      },
      
      // 概念复杂度
      concept: {
        // 复杂概念关键词
        complexConcepts: [
          '递归', '多态', '继承', '封装', '抽象', '接口', '泛型', '协程', '并发', '并行',
          '死锁', '竞态条件', '内存泄漏', '性能优化', '算法复杂度', '时间复杂度', '空间复杂度',
          '机器学习', '深度学习', '神经网络', '反向传播', '梯度下降', '损失函数', '激活函数',
          '量子力学', '相对论', '热力学', '电磁学', '光学', '原子物理', '核物理',
          '微积分', '线性代数', '概率论', '数理统计', '离散数学', '图论', '拓扑学'
        ],
        // 权重
        weights: {
          complexConcept: 2
        }
      },
      
      // 数学公式复杂度
      math: {
        // 数学符号
        symbols: ['∑', '∏', '∫', '∂', '∇', '∞', '∈', '∉', '⊂', '⊃', '∪', '∩', '∀', '∃', '→', '←', '↔', '⇒', '⇐', '⇔'],
        // 公式模式
        patterns: [
          /[a-zA-Z]\s*=\s*[a-zA-Z0-9+\-*/().^]+/g, // 简单公式
          /\$\$[\s\S]*?\$\$/g, // 块级公式
          /\$[^$]+\$/g, // 行内公式
          /\\frac\{[^}]+\}\{[^}]+\}/g, // 分数
          /\\sqrt\{[^}]+\}/g, // 根号
          /\\int_[^}]+\^[^}]+/g, // 积分
          /\\sum_[^}]+\^[^}]+/g, // 求和
        ],
        // 权重
        weights: {
          symbol: 1,
          formula: 2,
          complexFormula: 3
        }
      }
    }
    
    // 复杂度等级定义
    this.complexityLevels = {
      1: { name: '入门', description: '基础概念，适合初学者', color: '#4CAF50' },
      2: { name: '基础', description: '基本知识，适合新手', color: '#8BC34A' },
      3: { name: '初级', description: '简单应用，适合入门者', color: '#CDDC39' },
      4: { name: '中级', description: '综合应用，适合有一定基础者', color: '#FFEB3B' },
      5: { name: '中高级', description: '深入理解，适合有经验者', color: '#FFC107' },
      6: { name: '高级', description: '专业内容，适合学习者', color: '#FF9800' },
      7: { name: '专家级', description: '深度专业，适合专业人士', color: '#FF5722' },
      8: { name: '大师级', description: '前沿研究，适合研究者', color: '#F44336' },
      9: { name: '研究级', description: '学术前沿，适合学者', color: '#E91E63' },
      10: { name: '顶级', description: '顶尖内容，适合专家', color: '#9C27B0' }
    }
    
    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 100
  }

  // 主分析方法
  analyze(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return this.getDefaultResult()
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(content)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // 执行分析
    const result = this.performAnalysis(content, options)
    
    // 缓存结果
    this.cache.set(cacheKey, result)
    this.manageCacheSize()
    
    return result
  }

  // 执行分析
  performAnalysis(content, options = {}) {
    const scores = {
      vocabulary: 0,
      sentence: 0,
      structure: 0,
      concept: 0,
      math: 0
    }
    
    const details = {
      vocabulary: [],
      sentence: [],
      structure: [],
      concept: [],
      math: []
    }

    // 1. 词汇复杂度分析
    scores.vocabulary = this.analyzeVocabulary(content, details.vocabulary)
    
    // 2. 句子复杂度分析
    scores.sentence = this.analyzeSentence(content, details.sentence)
    
    // 3. 结构复杂度分析
    scores.structure = this.analyzeStructure(content, details.structure)
    
    // 4. 概念复杂度分析
    scores.concept = this.analyzeConcept(content, details.concept)
    
    // 5. 数学公式复杂度分析
    scores.math = this.analyzeMath(content, details.math)
    
    // 计算总分
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    
    // 归一化到1-10
    const normalizedScore = this.normalizeScore(totalScore, content.length)
    
    // 获取复杂度等级
    const level = this.getComplexityLevel(normalizedScore)
    
    // 生成建议
    const suggestions = this.generateSuggestions(scores, normalizedScore, details)
    
    return {
      score: normalizedScore,
      level: level,
      scores: scores,
      details: details,
      suggestions: suggestions,
      metadata: {
        contentLength: content.length,
        wordCount: this.countWords(content),
        analyzedAt: new Date().toISOString()
      }
    }
  }

  // 词汇复杂度分析
  analyzeVocabulary(content, details) {
    let score = 0
    const { advanced, technical, weights } = this.complexityIndicators.vocabulary
    
    // 检查高级词汇
    for (const word of advanced) {
      const regex = new RegExp(word, 'gi')
      const matches = content.match(regex)
      if (matches) {
        score += matches.length * weights.advanced
        details.push({ type: 'advanced', word, count: matches.length })
      }
    }
    
    // 检查专业术语
    for (const term of technical) {
      const regex = new RegExp(term, 'gi')
      const matches = content.match(regex)
      if (matches) {
        score += matches.length * weights.technical
        details.push({ type: 'technical', term, count: matches.length })
      }
    }
    
    return score
  }

  // 句子复杂度分析
  analyzeSentence(content, details) {
    let score = 0
    const { complexPatterns, longSentenceThreshold, weights } = this.complexityIndicators.sentence
    
    // 检查复杂句型
    for (const pattern of complexPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        score += matches.length * weights.complexPattern
        details.push({ type: 'complexPattern', pattern: pattern.source, count: matches.length })
      }
    }
    
    // 检查长句
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    const longSentences = sentences.filter(s => s.length > longSentenceThreshold)
    if (longSentences.length > 0) {
      score += longSentences.length * weights.longSentence
      details.push({ type: 'longSentence', count: longSentences.length, threshold: longSentenceThreshold })
    }
    
    return score
  }

  // 结构复杂度分析
  analyzeStructure(content, details) {
    let score = 0
    const { complexStructures } = this.complexityIndicators.structure
    
    for (const structure of complexStructures) {
      const matches = content.match(structure.pattern)
      if (matches) {
        score += matches.length * structure.weight
        details.push({ type: structure.name, count: matches.length, weight: structure.weight })
      }
    }
    
    return score
  }

  // 概念复杂度分析
  analyzeConcept(content, details) {
    let score = 0
    const { complexConcepts, weights } = this.complexityIndicators.concept
    
    for (const concept of complexConcepts) {
      const regex = new RegExp(concept, 'gi')
      const matches = content.match(regex)
      if (matches) {
        score += matches.length * weights.complexConcept
        details.push({ type: 'complexConcept', concept, count: matches.length })
      }
    }
    
    return score
  }

  // 数学公式复杂度分析
  analyzeMath(content, details) {
    let score = 0
    const { symbols, patterns, weights } = this.complexityIndicators.math
    
    // 检查数学符号
    for (const symbol of symbols) {
      const count = (content.match(new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      if (count > 0) {
        score += count * weights.symbol
        details.push({ type: 'symbol', symbol, count })
      }
    }
    
    // 检查公式模式
    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        score += matches.length * weights.formula
        details.push({ type: 'formula', pattern: pattern.source, count: matches.length })
      }
    }
    
    return score
  }

  // 归一化分数
  normalizeScore(totalScore, contentLength) {
    // 根据内容长度调整
    const lengthFactor = Math.min(contentLength / 1000, 2)
    
    // 归一化到1-10
    const normalized = Math.min(Math.max((totalScore / (lengthFactor + 1)) * 2, 1), 10)
    
    return Math.round(normalized * 10) / 10
  }

  // 获取复杂度等级
  getComplexityLevel(score) {
    const levelIndex = Math.min(Math.ceil(score), 10)
    return this.complexityLevels[levelIndex] || this.complexityLevels[1]
  }

  // 生成建议
  generateSuggestions(scores, totalScore, details) {
    const suggestions = []
    
    // 基于总分的建议
    if (totalScore >= 8) {
      suggestions.push({
        type: 'warning',
        message: '内容非常复杂，建议添加更多解释和示例'
      })
    } else if (totalScore >= 6) {
      suggestions.push({
        type: 'info',
        message: '内容较为复杂，建议适当简化或增加说明'
      })
    } else if (totalScore <= 3) {
      suggestions.push({
        type: 'tip',
        message: '内容较为简单，可以适当增加深度'
      })
    }
    
    // 基于具体指标的建议
    if (scores.vocabulary > 10) {
      suggestions.push({
        type: 'vocabulary',
        message: '专业术语较多，建议添加术语解释'
      })
    }
    
    if (scores.math > 5) {
      suggestions.push({
        type: 'math',
        message: '数学公式较多，建议逐步推导'
      })
    }
    
    if (scores.structure > 8) {
      suggestions.push({
        type: 'structure',
        message: '结构较为复杂，建议添加目录或导航'
      })
    }
    
    return suggestions
  }

  // 默认结果
  getDefaultResult() {
    return {
      score: 1,
      level: this.complexityLevels[1],
      scores: { vocabulary: 0, sentence: 0, structure: 0, concept: 0, math: 0 },
      details: { vocabulary: [], sentence: [], structure: [], concept: [], math: [] },
      suggestions: [],
      metadata: {
        contentLength: 0,
        wordCount: 0,
        analyzedAt: new Date().toISOString()
      }
    }
  }

  // 字数统计
  countWords(text) {
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (text.match(/[a-zA-Z]+/g) || []).length
    return chinese + english
  }

  // 生成缓存键
  generateCacheKey(content) {
    const hash = this.simpleHash(content.substring(0, 500))
    return `complexity_${hash}`
  }

  // 简单哈希
  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < Math.min(str.length, 100); i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
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

  // 获取复杂度等级列表
  getComplexityLevels() {
    return Object.entries(this.complexityLevels).map(([score, level]) => ({
      score: parseInt(score),
      ...level
    }))
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
export function createComplexityAnalyzer(options = {}) {
  return new ComplexityAnalyzer(options)
}

// 快速分析函数
export function analyzeComplexity(content, options = {}) {
  const analyzer = createComplexityAnalyzer(options)
  return analyzer.analyze(content, options)
}
