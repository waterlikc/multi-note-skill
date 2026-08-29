// 知识点提取器 - 从内容中提取关键知识点
export class KnowledgeExtractor {
  constructor(options = {}) {
    // 知识点模式配置
    this.knowledgePatterns = {
      // 定义类知识点
      definition: {
        patterns: [
          /(?:是指|指的是|意思是|定义为|定义是|所谓|即|就是)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(.+?)(?:是指|指的是|意思是|定义为|定义是|所谓|即|就是)[：:]?\s*(.+?)(?:[。！？.!?]|$)/g,
          /(.+?)\s*(?:是|为|等于)\s*(.+?)(?:[。！？.!?]|$)/g,
        ],
        weight: 3,
        type: 'definition'
      },
      
      // 概念类知识点
      concept: {
        patterns: [
          /(?:概念|术语|名词|关键词)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:核心概念|基本概念|重要概念|关键概念)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:原理|机制|理论|学说)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
        ],
        weight: 2,
        type: 'concept'
      },
      
      // 原理类知识点
      principle: {
        patterns: [
          /(?:原理|定律|定理|法则|规则|准则)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:基本原理|核心原理|重要原理)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:根据|依据|按照|遵循)\s*(.+?)\s*(?:可知|可得|得出)/g,
        ],
        weight: 3,
        type: 'principle'
      },
      
      // 方法类知识点
      method: {
        patterns: [
          /(?:方法|步骤|流程|过程|方式|手段)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:如何|怎么|怎样)\s*(.+?)(?:[？?]|$)/g,
          /(?:首先|然后|接着|最后|其次)\s*(.+?)(?:[，,。]|$)/g,
        ],
        weight: 2,
        type: 'method'
      },
      
      // 公式类知识点
      formula: {
        patterns: [
          /(?:公式|方程|表达式|算式)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /([a-zA-Z]\s*=\s*[a-zA-Z0-9+\-*/().^]+)/g,
          /(?:计算公式|推导公式|基本公式)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
        ],
        weight: 3,
        type: 'formula'
      },
      
      // 示例类知识点
      example: {
        patterns: [
          /(?:例如|比如|譬如|举例|示例|实例|案例)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:举个例子|举个实例|举个案例)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:具体来说|具体而言|详细来说)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
        ],
        weight: 1,
        type: 'example'
      },
      
      // 注意事项类知识点
      notice: {
        patterns: [
          /(?:注意|留意|小心|当心|警惕|警告|提示)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:需要注意|需要留意|需要小心|需要警惕)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:易错点|易错|常见错误|典型错误|错误示范)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
        ],
        weight: 2,
        type: 'notice'
      },
      
      // 重点类知识点
      important: {
        patterns: [
          /(?:重点|关键|核心|重要|主要|首要)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:重中之重|关键点|核心要点|重要事项)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:必须|务必|一定要|切记)\s*(.+?)(?:[。！？.!?]|$)/g,
        ],
        weight: 3,
        type: 'important'
      },
      
      // 总结类知识点
      summary: {
        patterns: [
          /(?:总结|小结|综上所述|总之|归纳|概括)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:简而言之|概括来说|总的来说|总体而言)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:核心思想|中心思想|主要观点|关键结论)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
        ],
        weight: 2,
        type: 'summary'
      },
      
      // 对比类知识点
      comparison: {
        patterns: [
          /(?:区别|差异|不同|对比|比较)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:优缺点|优劣|利弊|长短处)[：:]\s*(.+?)(?:[。！？.!?]|$)/g,
          /(?:vs|versus|相对于|相比|与.*相比)\s*(.+?)(?:[，,。]|$)/g,
        ],
        weight: 2,
        type: 'comparison'
      }
    }
    
    // 知识点重要性指标
    this.importanceIndicators = {
      high: ['核心', '关键', '重要', '主要', '首要', '必须', '务必', '基础', '根本', '本质'],
      medium: ['一般', '通常', '常见', '普通', '基本', '常用'],
      low: ['补充', '扩展', '了解', '参考', '选修', '可选']
    }
    
    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 100
  }

  // 主提取方法
  extract(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return { knowledgePoints: [], statistics: this.getDefaultStatistics() }
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(content)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // 执行提取
    const result = this.performExtraction(content, options)
    
    // 缓存结果
    this.cache.set(cacheKey, result)
    this.manageCacheSize()
    
    return result
  }

  // 执行提取
  performExtraction(content, options = {}) {
    const knowledgePoints = []
    const seen = new Set()
    
    // 提取各类知识点
    for (const [patternName, patternConfig] of Object.entries(this.knowledgePatterns)) {
      for (const pattern of patternConfig.patterns) {
        const regex = new RegExp(pattern.source, pattern.flags)
        let match
        
        while ((match = regex.exec(content)) !== null) {
          const text = (match[2] && match[2].trim()) || match[1] || match[0]
          const cleanedText = this.cleanText(text)
          
          // 去重
          if (cleanedText.length > 5 && !seen.has(cleanedText)) {
            seen.add(cleanedText)
            
            // 判断重要性
            const importance = this.determineImportance(cleanedText)
            
            knowledgePoints.push({
              text: cleanedText,
              type: patternConfig.type,
              importance: importance,
              weight: patternConfig.weight,
              position: match.index,
              context: this.getContext(content, match.index, 50)
            })
          }
        }
      }
    }
    
    // 排序知识点（按重要性和权重）
    knowledgePoints.sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 }
      const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance]
      if (importanceDiff !== 0) return importanceDiff
      return b.weight - a.weight
    })
    
    // 统计信息
    const statistics = this.calculateStatistics(knowledgePoints)
    
    return {
      knowledgePoints: knowledgePoints.slice(0, options.maxPoints || 50),
      statistics,
      metadata: {
        totalFound: knowledgePoints.length,
        contentLength: content.length,
        extractedAt: new Date().toISOString()
      }
    }
  }

  // 清理文本
  cleanText(text) {
    return text
      .replace(/^\s*[：:，,。、]\s*/, '') // 移除开头的标点
      .replace(/\s*[：:，,。、]\s*$/, '') // 移除结尾的标点
      .replace(/\s+/g, ' ') // 合并空白
      .trim()
  }

  // 获取上下文
  getContext(content, position, range) {
    const start = Math.max(0, position - range)
    const end = Math.min(content.length, position + range)
    return content.substring(start, end)
  }

  // 判断重要性
  determineImportance(text) {
    const textLower = text.toLowerCase()
    
    for (const indicator of this.importanceIndicators.high) {
      if (textLower.includes(indicator)) {
        return 'high'
      }
    }
    
    for (const indicator of this.importanceIndicators.low) {
      if (textLower.includes(indicator)) {
        return 'low'
      }
    }
    
    return 'medium'
  }

  // 计算统计信息
  calculateStatistics(knowledgePoints) {
    const byType = {}
    const byImportance = { high: 0, medium: 0, low: 0 }
    
    for (const point of knowledgePoints) {
      // 按类型统计
      byType[point.type] = (byType[point.type] || 0) + 1
      
      // 按重要性统计
      byImportance[point.importance]++
    }
    
    return {
      total: knowledgePoints.length,
      byType,
      byImportance,
      averageWeight: knowledgePoints.length > 0 
        ? (knowledgePoints.reduce((sum, p) => sum + p.weight, 0) / knowledgePoints.length).toFixed(2)
        : 0
    }
  }

  // 默认统计
  getDefaultStatistics() {
    return {
      total: 0,
      byType: {},
      byImportance: { high: 0, medium: 0, low: 0 },
      averageWeight: 0
    }
  }

  // 按类型获取知识点
  getByType(knowledgePoints, type) {
    return knowledgePoints.filter(p => p.type === type)
  }

  // 按重要性获取知识点
  getByImportance(knowledgePoints, importance) {
    return knowledgePoints.filter(p => p.importance === importance)
  }

  // 获取核心知识点
  getCorePoints(knowledgePoints, limit = 10) {
    return knowledgePoints
      .filter(p => p.importance === 'high')
      .slice(0, limit)
  }

  // 生成知识点摘要
  generateSummary(knowledgePoints, maxPoints = 5) {
    const corePoints = this.getCorePoints(knowledgePoints, maxPoints)
    
    if (corePoints.length === 0) {
      return '未找到核心知识点'
    }
    
    return corePoints
      .map((point, index) => `${index + 1}. ${point.text}`)
      .join('\n')
  }

  // 生成知识点卡片
  generateCards(knowledgePoints) {
    const cards = []
    const byType = {}
    
    // 按类型分组
    for (const point of knowledgePoints) {
      if (!byType[point.type]) {
        byType[point.type] = []
      }
      byType[point.type].push(point)
    }
    
    // 生成卡片
    for (const [type, points] of Object.entries(byType)) {
      cards.push({
        type,
        typeName: this.getTypeName(type),
        icon: this.getTypeIcon(type),
        points: points.slice(0, 5)
      })
    }
    
    return cards
  }

  // 获取类型名称
  getTypeName(type) {
    const names = {
      definition: '定义',
      concept: '概念',
      principle: '原理',
      method: '方法',
      formula: '公式',
      example: '示例',
      notice: '注意事项',
      important: '重点',
      summary: '总结',
      comparison: '对比'
    }
    return names[type] || type
  }

  // 获取类型图标
  getTypeIcon(type) {
    const icons = {
      definition: '📖',
      concept: '💡',
      principle: '⚙️',
      method: '🔧',
      formula: '📐',
      example: '📝',
      notice: '⚠️',
      important: '⭐',
      summary: '📋',
      comparison: '🔄'
    }
    return icons[type] || '📌'
  }

  // 生成缓存键
  generateCacheKey(content) {
    const hash = this.simpleHash(content.substring(0, 500))
    return `knowledge_${hash}`
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

  // 获取缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    }
  }
}

// 便捷工厂函数
export function createKnowledgeExtractor(options = {}) {
  return new KnowledgeExtractor(options)
}

// 快速提取函数
export function extractKnowledge(content, options = {}) {
  const extractor = createKnowledgeExtractor(options)
  return extractor.extract(content, options)
}
