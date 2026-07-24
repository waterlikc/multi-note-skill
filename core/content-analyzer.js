// 统一内容分析模块 - 单次扫描多信息提取
export class ContentAnalyzer {
  constructor() {
    // 缓存机制
    this.analysisCache = new Map()
    this.maxCacheSize = 50
    this.cacheHits = 0
    this.cacheMisses = 0

    // 预编译分析正则表达式
    this.compiledRegexes = this.precompileAnalysisRegexes()

    // 组件类型定义
    this.componentTypes = [
      'code-block', 'flow-box', 'compare-box', 'side-note',
      'big-warning', 'question-box', 'safe-box', 'config-box',
      'concept-cards', 'attack-chain', 'sticky-note'
    ]
  }

  // 预编译所有分析正则表达式
  precompileAnalysisRegexes() {
    return {
      // 标题提取
      headings: /^(#{1,3})\s+(.*)$/gm,
      
      // 章节提取
      sections: /#{1,3}\s+(.*)/g,
      
      // 代码块提取
      codeBlocks: /```[\s\S]*?```/g,
      
      // 行内代码
      inlineCode: /`([^`]+)`/g,
      
      // 链接提取
      links: /https?:\/\/[^\s\)]+/g,
      
      // 图片提取
      images: /!\[.*?\]\(.*?\)/g,
      
      // 组件标记提取
      componentMarkers: new RegExp(
        this.componentTypes.map(type => `\\*\\*.*${type}.*\\*\\*`).join('|'), 
        'gi'
      ),

      // 列表项提取
      listItems: /^[-*+]\s+(.*)$/gm,

      // 数字列表提取
      numberListItems: /^\d+\.\s+(.*)$/gm,

      // 表格提取
      tables: /\|.*\|/g,

      // 引用块提取
      blockquotes: /^>\s+(.*)$/gm,

      // 分割线提取
      horizontalRules: /^[-*_]{3,}\s*$/gm,

      // 粗体文本提取
      boldText: /\*\*([^*]+)\*\*/g,

      // 斜体文本提取
      italicText: /\*([^*]+)\*/g,

      // 删除线文本提取
      strikethroughText: /~~([^~]+)~~/g
    }
  }

  // 🔧 优化1: 一次性分析所有信息，避免重复扫描
  analyzeContent(content) {
    const cacheKey = this.generateHash(content)

    // 检查缓存
    if (this.analysisCache.has(cacheKey)) {
      this.cacheHits++
      return this.analysisCache.get(cacheKey)
    }

    this.cacheMisses++

    // 单次扫描提取所有信息
    const analysis = this.performSingleScanAnalysis(content)

    // 缓存结果
    this.analysisCache.set(cacheKey, analysis)

    // 管理缓存大小
    this.manageCacheSize()

    return analysis
  }

  // 执行单次扫描分析
  performSingleScanAnalysis(content) {
    return {
      structure: this.extractStructure(content),
      components: this.extractComponents(content),
      assets: this.extractAssets(content),
      statistics: this.calculateStatistics(content),
      metadata: this.extractMetadata(content),
      textAnalysis: this.analyzeTextProperties(content)
    }
  }

  // 提取文档结构
  extractStructure(content) {
    const structure = {
      headings: [],
      sections: [],
      depth: 0,
      hasCodeBlocks: false,
      hasTables: false,
      hasLists: false
    }

    // 提取标题信息
    let headingMatch
    const headingRegex = this.compiledRegexes.headings
    while ((headingMatch = headingRegex.exec(content)) !== null) {
      const level = headingMatch[1].length
      const title = headingMatch[2].trim()
      const position = headingMatch.index

      structure.headings.push({
        level,
        title,
        position
      })

      structure.sections.push(title)
      structure.depth = Math.max(structure.depth, level)
    }

    // 检查特殊元素存在性
    structure.hasCodeBlocks = this.compiledRegexes.codeBlocks.test(content)
    structure.hasTables = this.compiledRegexes.tables.test(content)
    structure.hasLists = this.compiledRegexes.listItems.test(content) || 
                      this.compiledRegexes.numberListItems.test(content)

    return structure
  }

  // 提取组件信息
  extractComponents(content) {
    const components = []

    // 检查组件标记
    const markerMatches = content.match(this.compiledRegexes.componentMarkers)
    if (markerMatches) {
      const componentCount = {}
      for (const type of this.componentTypes) {
        const typeRegex = new RegExp(type, 'gi')
        const typeMatches = content.match(typeRegex)
        if (typeMatches) {
          componentCount[type] = typeMatches.length
        }
      }

      for (const [type, count] of Object.entries(componentCount)) {
        components.push({
          type,
          count,
          category: this.categorizeComponent(type)
        })
      }
    }

    // 统计代码块
    const codeBlocks = content.match(this.compiledRegexes.codeBlocks)
    if (codeBlocks) {
      // 检查是否已有code-block统计
      const existingCodeBlock = components.find(c => c.type === 'code-block')
      if (existingCodeBlock) {
        existingCodeBlock.count = codeBlocks.length
      } else {
        components.push({
          type: 'code-block',
          count: codeBlocks.length,
          category: 'code'
        })
      }
    }

    // 统计列表项
    const listItems = content.match(this.compiledRegexes.listItems)
    const numberListItems = content.match(this.compiledRegexes.numberListItems)
    if (listItems || numberListItems) {
      const listCount = (listItems?.length || 0) + (numberListItems?.length || 0)
      components.push({
        type: 'list-items',
        count: listCount,
        category: 'structure'
      })
    }

    return components.sort((a, b) => b.count - a.count)
  }

  // 组件分类
  categorizeComponent(type) {
    const categories = {
      'code-block': 'code',
      'flow-box': 'diagram',
      'compare-box': 'comparison',
      'side-note': 'annotation',
      'big-warning': 'alert',
      'question-box': 'interaction',
      'safe-box': 'status',
      'config-box': 'configuration',
      'concept-cards': 'knowledge',
      'attack-chain': 'process',
      'sticky-note': 'annotation'
    }
    return categories[type] || 'general'
  }

  // 提取资源信息
  extractAssets(content) {
    const assets = []

    // 提取链接
    let linkMatch
    const linkRegex = this.compiledRegexes.links
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      assets.push({
        type: 'link',
        url: linkMatch[0],
        position: linkMatch.index
      })
    }

    // 提取图片
    let imageMatch
    const imageRegex = this.compiledRegexes.images
    while ((imageMatch = imageRegex.exec(content)) !== null) {
      const altText = imageMatch[0].match(/!\[([^\]]*)\]/)?.[1] || ''
      const imageUrl = imageMatch[0].match(/\(([^)]+)\)/)?.[1] || ''
      assets.push({
        type: 'image',
        url: imageUrl,
        altText,
        position: imageMatch.index
      })
    }

    return assets
  }

  // 计算统计信息
  calculateStatistics(content) {
    return {
      characterCount: content.length,
      wordCount: this.countWords(content),
      lineCount: content.split('\n').length,
      paragraphCount: content.split(/\n\n+/).filter(p => p.trim()).length,
      sentenceCount: this.countSentences(content),
      averageWordLength: this.calculateAverageWordLength(content),
      readingTime: this.estimateReadingTime(content)
    }
  }

  // 智能字数统计
  countWords(content) {
    // 中文字符
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    // 英文单词
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
    // 数字
    const numbers = (content.match(/\d+/g) || []).length
    // 其他字符（符号等）
    const otherChars = content.length - chineseChars - englishWords - numbers

    return chineseChars + englishWords + numbers + Math.floor(otherChars / 5)
  }

  // 句子统计
  countSentences(content) {
    const sentenceEndings = /[.!?。！？]+/g
    const matches = content.match(sentenceEndings)
    return matches ? matches.length : 0
  }

  // 计算平均词长
  calculateAverageWordLength(content) {
    const words = content.match(/[a-zA-Z\u4e00-\u9fa5]+/g) || []
    if (words.length === 0) return 0

    const totalLength = words.reduce((sum, word) => sum + word.length, 0)
    return (totalLength / words.length).toFixed(2)
  }

  // 估算阅读时间
  estimateReadingTime(content) {
    const wordCount = this.countWords(content)
    const wordsPerMinute = 200 // 平均阅读速度
    const minutes = Math.ceil(wordCount / wordsPerMinute)

    if (minutes < 1) {
      return '少于1分钟'
    } else if (minutes < 60) {
      return `${minutes}分钟`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}小时${remainingMinutes}分钟`
    }
  }

  // 提取元数据
  extractMetadata(content) {
    const metadata = {}

    // 尝试提取标题（第一个#标题）
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim()
    }

    // 尝试提取作者信息
    const authorMatch = content.match(/作者[:：]\s*(.+)/i)
    if (authorMatch) {
      metadata.author = authorMatch[1].trim()
    }

    // 尝试提取日期信息
    const dateMatch = content.match(/日期[:：]\s*(.+)/i)
    if (dateMatch) {
      metadata.date = dateMatch[1].trim()
    }

    // 尝试提取标签信息
    const tagMatch = content.match(/标签[:：]\s*(.+)/i)
    if (tagMatch) {
      metadata.tags = tagMatch[1].split(/[,，]/).map(tag => tag.trim())
    }

    return metadata
  }

  // 分析文本属性
  analyzeTextProperties(content) {
    return {
      hasChinese: /[\u4e00-\u9fa5]/.test(content),
      hasEnglish: /[a-zA-Z]/.test(content),
      hasNumbers: /\d/.test(content),
      hasCode: /```[\s\S]*?```/.test(content),
      hasLinks: /https?:\/\/[^\s\)]+/.test(content),
      hasTables: /\|.*\|/.test(content),
      languageDistribution: this.analyzeLanguageDistribution(content),
      complexity: this.assessComplexity(content)
    }
  }

  // 分析语言分布
  analyzeLanguageDistribution(content) {
    const chinese = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (content.match(/[a-zA-Z]/g) || []).length
    const numbers = (content.match(/\d/g) || []).length
    const total = content.length || 1

    return {
      chinese: ((chinese / total) * 100).toFixed(1) + '%',
      english: ((english / total) * 100).toFixed(1) + '%',
      numbers: ((numbers / total) * 100).toFixed(1) + '%',
      other: ((1 - (chinese + english + numbers) / total) * 100).toFixed(1) + '%'
    }
  }

  // 评估内容复杂度
  assessComplexity(content) {
    let complexityScore = 0

    // 代码块增加复杂度
    const codeBlocks = (content.match(/```/g) || []).length / 2
    complexityScore += codeBlocks * 3

    // 表格增加复杂度
    const tables = (content.match(/\|/g) || []).length
    complexityScore += tables * 2

    // 链接增加复杂度
    const links = (content.match(/https?:\/\/[^\s\)]+/g) || []).length
    complexityScore += links * 1

    // 标题层级增加复杂度
    const headings = (content.match(/^#+/gm) || []).length
    complexityScore += headings * 0.5

    // 根据分数返回复杂度级别
    if (complexityScore < 5) return 'low'
    if (complexityScore < 15) return 'medium'
    if (complexityScore < 30) return 'high'
    return 'very-high'
  }

  // 生成内容哈希
  generateHash(content) {
    let hash = 0
    const sampleLength = Math.min(content.length, 500) // 只采样前500字符
    for (let i = 0; i < sampleLength; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  // 管理缓存大小
  manageCacheSize() {
    if (this.analysisCache.size > this.maxCacheSize) {
      const firstKey = this.analysisCache.keys().next().value
      this.analysisCache.delete(firstKey)
    }
  }

  // 获取缓存统计
  getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests * 100).toFixed(2) : '0.00'

    return {
      size: this.analysisCache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      totalRequests: totalRequests
    }
  }

  // 清空缓存
  clearCache() {
    this.analysisCache.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  // 🔧 优化2: 批量内容分析
  analyzeBatch(contents) {
    return contents.map(content => this.analyzeContent(content))
  }

  // 获取分析摘要
  getAnalysisSummary(analysis) {
    return {
      title: analysis.metadata.title || '未命名文档',
      wordCount: analysis.statistics.wordCount,
      readingTime: analysis.statistics.readingTime,
      complexity: analysis.textAnalysis.complexity,
      mainComponents: analysis.components.slice(0, 3).map(c => ({
        type: c.type,
        count: c.count
      })),
      language: analysis.textAnalysis.hasChinese ? '中文' : '英文'
    }
  }
}