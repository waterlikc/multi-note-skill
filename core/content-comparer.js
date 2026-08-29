// 内容对比器 - 比较新旧内容，找出差异
export class ContentComparer {
  constructor(options = {}) {
    // 配置
    this.config = {
      // 相似度阈值
      similarityThreshold: options.similarityThreshold || 0.7,
      // 最小匹配长度
      minMatchLength: options.minMatchLength || 10,
      // 忽略空白
      ignoreWhitespace: options.ignoreWhitespace !== false,
      // 忽略大小写
      ignoreCase: options.ignoreCase || false,
      ...options
    }

    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 50
  }

  /**
   * 主对比方法
   * @param {object} oldNote - 旧笔记解析结果
   * @param {string|object} newContent - 新内容或解析结果
   * @param {object} options - 配置选项
   * @returns {object} 对比结果
   */
  compare(oldNote, newContent, options = {}) {
    const startTime = performance.now()

    try {
      // 准备内容
      const oldContent = this.extractContent(oldNote)
      const newContentStr = typeof newContent === 'string' ? newContent : this.extractContent(newContent)

      // 执行对比
      const result = this.performComparison(oldContent, newContentStr, options)

      // 添加元数据
      result.metadata = {
        ...result.metadata,
        compareTime: (performance.now() - startTime).toFixed(2) + 'ms',
        comparedAt: new Date().toISOString()
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message,
        compareTime: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  /**
   * 提取内容
   */
  extractContent(note) {
    if (typeof note === 'string') {
      return note
    }

    // 从解析结果中提取文本内容
    if (note.textContent) {
      return note.textContent
    }

    // 从章节中提取
    if (note.sections && note.sections.length > 0) {
      return note.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')
    }

    // 从原始HTML中提取
    if (note.rawHtml) {
      return this.stripHtml(note.rawHtml)
    }

    return ''
  }

  /**
   * 执行对比
   */
  performComparison(oldContent, newContent, options) {
    // 规范化内容
    const normalizedOld = this.normalizeContent(oldContent)
    const normalizedNew = this.normalizeContent(newContent)

    // 分段对比
    const oldSections = this.splitIntoSections(normalizedOld)
    const newSections = this.splitIntoSections(normalizedNew)

    // 找出新增内容
    const added = this.findAddedContent(oldSections, newSections)

    // 找出删除内容
    const removed = this.findRemovedContent(oldSections, newSections)

    // 找出修改内容
    const modified = this.findModifiedContent(oldSections, newSections)

    // 找出重复内容
    const duplicates = this.findDuplicateContent(oldSections, newSections)

    // 计算相似度
    const similarity = this.calculateSimilarity(normalizedOld, normalizedNew)

    // 生成差异摘要
    const summary = this.generateSummary(added, removed, modified, duplicates, similarity)

    return {
      success: true,
      // 差异内容
      added,
      removed,
      modified,
      duplicates,
      // 相似度
      similarity,
      // 摘要
      summary,
      // 建议
      suggestions: this.generateSuggestions(added, removed, modified, duplicates, similarity),
      // 统计
      statistics: {
        oldLength: oldContent.length,
        newLength: newContent.length,
        oldSectionCount: oldSections.length,
        newSectionCount: newSections.length,
        addedCount: added.length,
        removedCount: removed.length,
        modifiedCount: modified.length,
        duplicateCount: duplicates.length
      },
      metadata: {
        oldSections: oldSections.length,
        newSections: newSections.length
      }
    }
  }

  /**
   * 规范化内容
   */
  normalizeContent(content) {
    let normalized = content

    if (this.config.ignoreWhitespace) {
      normalized = normalized.replace(/\s+/g, ' ').trim()
    }

    if (this.config.ignoreCase) {
      normalized = normalized.toLowerCase()
    }

    return normalized
  }

  /**
   * 分段
   */
  splitIntoSections(content) {
    // 按段落分段
    const sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 0)

    // 如果段落太少，按句子分段
    if (sections.length < 3) {
      return content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    }

    return sections
  }

  /**
   * 找出新增内容
   */
  findAddedContent(oldSections, newSections) {
    const added = []

    for (const newSection of newSections) {
      const isDuplicate = oldSections.some(oldSection => 
        this.calculateSimilarity(oldSection, newSection) > this.config.similarityThreshold
      )

      if (!isDuplicate && newSection.length >= this.config.minMatchLength) {
        added.push({
          content: newSection,
          length: newSection.length,
          position: newSections.indexOf(newSection)
        })
      }
    }

    return added
  }

  /**
   * 找出删除内容
   */
  findRemovedContent(oldSections, newSections) {
    const removed = []

    for (const oldSection of oldSections) {
      const isDuplicate = newSections.some(newSection => 
        this.calculateSimilarity(oldSection, newSection) > this.config.similarityThreshold
      )

      if (!isDuplicate && oldSection.length >= this.config.minMatchLength) {
        removed.push({
          content: oldSection,
          length: oldSection.length,
          position: oldSections.indexOf(oldSection)
        })
      }
    }

    return removed
  }

  /**
   * 找出修改内容
   */
  findModifiedContent(oldSections, newSections) {
    const modified = []

    for (const oldSection of oldSections) {
      let bestMatch = null
      let bestSimilarity = 0

      for (const newSection of newSections) {
        const similarity = this.calculateSimilarity(oldSection, newSection)
        if (similarity > bestSimilarity && similarity < this.config.similarityThreshold) {
          bestMatch = newSection
          bestSimilarity = similarity
        }
      }

      if (bestMatch && bestSimilarity > 0.3) {
        modified.push({
          oldContent: oldSection,
          newContent: bestMatch,
          similarity: bestSimilarity,
          oldPosition: oldSections.indexOf(oldSection),
          newPosition: newSections.indexOf(bestMatch)
        })
      }
    }

    return modified
  }

  /**
   * 找出重复内容
   */
  findDuplicateContent(oldSections, newSections) {
    const duplicates = []

    for (const oldSection of oldSections) {
      for (const newSection of newSections) {
        const similarity = this.calculateSimilarity(oldSection, newSection)
        if (similarity > this.config.similarityThreshold) {
          duplicates.push({
            oldContent: oldSection,
            newContent: newSection,
            similarity,
            oldPosition: oldSections.indexOf(oldSection),
            newPosition: newSections.indexOf(newSection)
          })
        }
      }
    }

    return duplicates
  }

  /**
   * 计算相似度（Levenshtein距离）
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1
    if (str1.length === 0 || str2.length === 0) return 0

    const len1 = str1.length
    const len2 = str2.length

    // 使用动态规划计算编辑距离
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null))

    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // 删除
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j - 1] + cost // 替换
        )
      }
    }

    const maxLen = Math.max(len1, len2)
    const distance = matrix[len1][len2]
    const similarity = 1 - distance / maxLen

    return Math.round(similarity * 100) / 100
  }

  /**
   * 生成摘要
   */
  generateSummary(added, removed, modified, duplicates, similarity) {
    const parts = []

    if (added.length > 0) {
      parts.push(`新增 ${added.length} 段内容`)
    }

    if (removed.length > 0) {
      parts.push(`删除 ${removed.length} 段内容`)
    }

    if (modified.length > 0) {
      parts.push(`修改 ${modified.length} 段内容`)
    }

    if (duplicates.length > 0) {
      parts.push(`重复 ${duplicates.length} 段内容`)
    }

    parts.push(`相似度 ${(similarity * 100).toFixed(1)}%`)

    return parts.join('，')
  }

  /**
   * 生成建议
   */
  generateSuggestions(added, removed, modified, duplicates, similarity) {
    const suggestions = []

    if (added.length > 0) {
      suggestions.push({
        type: 'add',
        message: `有 ${added.length} 段新内容可以添加到笔记中`,
        priority: 'high'
      })
    }

    if (removed.length > 0) {
      suggestions.push({
        type: 'remove',
        message: `有 ${removed.length} 段内容在新版本中被删除`,
        priority: 'medium'
      })
    }

    if (modified.length > 0) {
      suggestions.push({
        type: 'modify',
        message: `有 ${modified.length} 段内容被修改`,
        priority: 'medium'
      })
    }

    if (duplicates.length > 0) {
      suggestions.push({
        type: 'duplicate',
        message: `有 ${duplicates.length} 段重复内容，建议去重`,
        priority: 'low'
      })
    }

    if (similarity > 0.9) {
      suggestions.push({
        type: 'similar',
        message: '新旧内容非常相似，可能不需要更新',
        priority: 'low'
      })
    } else if (similarity < 0.3) {
      suggestions.push({
        type: 'different',
        message: '新旧内容差异较大，建议创建新笔记',
        priority: 'high'
      })
    }

    return suggestions
  }

  /**
   * 去除HTML标签
   */
  stripHtml(html) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(oldContent, newContent) {
    const hash1 = this.simpleHash(oldContent.substring(0, 100))
    const hash2 = this.simpleHash(newContent.substring(0, 100))
    return `compare_${hash1}_${hash2}`
  }

  /**
   * 简单哈希
   */
  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < Math.min(str.length, 100); i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * 管理缓存大小
   */
  manageCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    }
  }
}

// 便捷工厂函数
export function createContentComparer(options = {}) {
  return new ContentComparer(options)
}

// 快速对比函数
export function compareContent(oldNote, newContent, options = {}) {
  const comparer = createContentComparer(options)
  return comparer.compare(oldNote, newContent, options)
}
