// 优化的Markdown转换器 - Token消耗优化版
export class MarkdownConverter {
  constructor() {
    // 🔧 优化1: 预定义转换规则，按优先级排序
    this.conversionRules = [
      // 高优先级：代码块（避免内部内容被错误转换）
      { 
        regex: /```([\s\S]*?)```/g, 
        replacement: '```\n$1\n```', 
        priority: 1,
        name: 'code-block'
      },
      // 中优先级：标题转换
      { 
        regex: /<h1[^>]*>(.*?)<\/h1>/gi, 
        replacement: '# $1\n\n', 
        priority: 2,
        name: 'heading-1'
      },
      { 
        regex: /<h2[^>]*>(.*?)<\/h2>/gi, 
        replacement: '## $1\n\n', 
        priority: 2,
        name: 'heading-2'
      },
      { 
        regex: /<h3[^>]*>(.*?)<\/h3>/gi, 
        replacement: '### $1\n\n', 
        priority: 2,
        name: 'heading-3'
      },
      { 
        regex: /<h4[^>]*>(.*?)<\/h4>/gi, 
        replacement: '#### $1\n\n', 
        priority: 2,
        name: 'heading-4'
      },
      { 
        regex: /<h5[^>]*>(.*?)<\/h5>/gi, 
        replacement: '##### $1\n\n', 
        priority: 2,
        name: 'heading-5'
      },
      { 
        regex: /<h6[^>]*>(.*?)<\/h6>/gi, 
        replacement: '###### $1\n\n', 
        priority: 2,
        name: 'heading-6'
      },
      // 中优先级：文本格式
      { 
        regex: /<strong[^>]*>(.*?)<\/strong>/gi, 
        replacement: '**$1**', 
        priority: 3,
        name: 'bold'
      },
      { 
        regex: /<b[^>]*>(.*?)<\/b>/gi, 
        replacement: '**$1**', 
        priority: 3,
        name: 'bold-alt'
      },
      { 
        regex: /<em[^>]*>(.*?)<\/em>/gi, 
        replacement: '*$1*', 
        priority: 3,
        name: 'italic'
      },
      { 
        regex: /<i[^>]*>(.*?)<\/i>/gi, 
        replacement: '*$1*', 
        priority: 3,
        name: 'italic-alt'
      },
      // 低优先级：行内元素
      { 
        regex: /<code[^>]*>(.*?)<\/code>/gi, 
        replacement: '`$1`', 
        priority: 4,
        name: 'inline-code'
      },
      { 
        regex: /<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, 
        replacement: '[$2]($1)', 
        priority: 5,
        name: 'link'
      },
      { 
        regex: /<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi, 
        replacement: '![$2]($1)', 
        priority: 5,
        name: 'image'
      },
      { 
        regex: /<img[^>]*src=["'](.*?)["'][^>]*>/gi, 
        replacement: '![]($1)', 
        priority: 5,
        name: 'image-no-alt'
      },
      // 更低优先级：块级元素
      { 
        regex: /<p[^>]*>(.*?)<\/p>/gi, 
        replacement: '$1\n\n', 
        priority: 6,
        name: 'paragraph'
      },
      { 
        regex: /<div[^>]*>(.*?)<\/div>/gis, 
        replacement: '$1\n', 
        priority: 6,
        name: 'div'
      },
      { 
        regex: /<span[^>]*>(.*?)<\/span>/gis, 
        replacement: '$1', 
        priority: 7,
        name: 'span'
      },
      // 列表处理
      { 
        regex: /<ul[^>]*>/gi, 
        replacement: '', 
        priority: 8,
        name: 'ul-start'
      },
      { 
        regex: /<\/ul>/gi, 
        replacement: '\n', 
        priority: 8,
        name: 'ul-end'
      },
      { 
        regex: /<ol[^>]*>/gi, 
        replacement: '', 
        priority: 8,
        name: 'ol-start'
      },
      { 
        regex: /<\/ol>/gi, 
        replacement: '\n', 
        priority: 8,
        name: 'ol-end'
      },
      { 
        regex: /<li[^>]*>(.*?)<\/li>/gi, 
        replacement: '- $1\n', 
        priority: 8,
        name: 'list-item'
      },
      // 其他HTML标签清理
      { 
        regex: /<[^>]+>/g, 
        replacement: '', 
        priority: 9,
        name: 'cleanup-tags'
      }
    ]

    // 缓存机制
    this.conversionCache = new Map()
    this.maxCacheSize = 30
    this.cacheHits = 0
    this.cacheMisses = 0

    // 特殊处理规则
    this.specialRules = {
      // 处理表格
      table: {
        regex: /<table[^>]*>([\s\S]*?)<\/table>/gi,
        processor: this.convertTable.bind(this)
      },
      // 处理引用块
      blockquote: {
        regex: /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
        processor: this.convertBlockquote.bind(this)
      },
      // 处理水平线
      hr: {
        regex: /<hr[^>]*>/gi,
        replacement: '---'
      },
      // 处理换行
      br: {
        regex: /<br\s*\/?>/gi,
        replacement: '\n'
      },
      // 处理删除线
      del: {
        regex: /<del[^>]*>(.*?)<\/del>/gi,
        replacement: '~~$1~~'
      },
      strikethrough: {
        regex: /<s[^>]*>(.*?)<\/s>/gi,
        replacement: '~~$1~~'
      }
    }
  }

  // 🔧 优化2: 主转换方法，带缓存
  htmlToMarkdown(html, options = {}) {
    const cacheKey = this.generateHash(html)

    // 检查缓存
    if (this.conversionCache.has(cacheKey)) {
      this.cacheHits++
      return this.conversionCache.get(cacheKey)
    }

    this.cacheMisses++

    // 执行转换
    let markdown = this.performConversion(html, options)

    // 缓存结果
    this.conversionCache.set(cacheKey, markdown)

    // 管理缓存大小
    this.manageCacheSize()

    return markdown
  }

  // 执行转换（优化版）
  performConversion(html, options = {}) {
    let markdown = html

    // 🔧 优化3: 先处理特殊规则，避免被通用规则覆盖
    markdown = this.processSpecialRules(markdown)

    // 🔧 优化4: 按优先级执行通用转换规则
    const sortedRules = [...this.conversionRules].sort((a, b) => a.priority - b.priority)
    for (const rule of sortedRules) {
      markdown = markdown.replace(rule.regex, rule.replacement)
    }

    // 🔧 优化5: 统一清理空白字符
    markdown = this.cleanupWhitespace(markdown, options)

    return markdown
  }

  // 处理特殊规则
  processSpecialRules(html) {
    let markdown = html

    // 处理表格
    markdown = markdown.replace(this.specialRules.table.regex, this.specialRules.table.processor)

    // 处理引用块
    markdown = markdown.replace(this.specialRules.blockquote.regex, this.specialRules.blockquote.processor)

    // 处理其他特殊标签
    markdown = markdown.replace(this.specialRules.hr.regex, this.specialRules.hr.replacement)
    markdown = markdown.replace(this.specialRules.br.regex, this.specialRules.br.replacement)
    markdown = markdown.replace(this.specialRules.del.regex, this.specialRules.del.replacement)
    markdown = markdown.replace(this.specialRules.strikethrough.regex, this.specialRules.strikethrough.replacement)

    return markdown
  }

  // 转换表格
  convertTable(match, tableContent) {
    // 提取表格行
    const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []
    const markdownRows = rows.map(row => {
      // 提取单元格
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []
      const cellContents = cells.map(cell => {
        // 移除HTML标签，只保留内容
        return cell.replace(/<[^>]+>/g, '').trim()
      })
      return `| ${cellContents.join(' | ')} |`
    })

    // 生成表格分隔线
    const separator = `| ${cells => Array(cells.length).fill('---').join(' | ')} |`

    return [markdownRows[0], separator, ...markdownRows.slice(1)].join('\n') + '\n\n'
  }

  // 转换引用块
  convertBlockquote(match, blockContent) {
    const lines = blockContent.split('\n').filter(line => line.trim())
    const quotedLines = lines.map(line => `> ${line.replace(/<[^>]+>/g, '').trim()}`)
    return quotedLines.join('\n') + '\n\n'
  }

  // 🔧 优化6: 统一清理空白字符
  cleanupWhitespace(text, options = {}) {
    const defaultOptions = {
      preserveMultipleBreaks: false,
      trimLines: true,
      normalizeSpaces: true
    }
    
    const finalOptions = { ...defaultOptions, ...options }

    let cleaned = text

    // 清理多余空白
    if (!finalOptions.preserveMultipleBreaks) {
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n') // 多个换行压缩为两个
    } else {
      cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n') // 最多保留三个换行
    }

    // 清理行首行尾空格
    if (finalOptions.trimLines) {
      cleaned = cleaned.replace(/^ +/gm, '').replace(/ +$/gm, '')
    }

    // 规范化空格
    if (finalOptions.normalizeSpaces) {
      cleaned = cleaned.replace(/[ \t]+/g, ' ') // 多个空格压缩为一个
    }

    // 移除首尾空白
    cleaned = cleaned.trim()

    return cleaned
  }

  // 🔧 优化7: 批量转换
  convertBatch(htmlArray, options = {}) {
    return htmlArray.map(html => this.htmlToMarkdown(html, options))
  }

  // 转换为简化Markdown（移除复杂格式）
  toSimplifiedMarkdown(html) {
    const simplifiedOptions = {
      preserveMultipleBreaks: false,
      trimLines: true,
      normalizeSpaces: true
    }
    
    let markdown = this.htmlToMarkdown(html, simplifiedOptions)

    // 移除复杂格式
    markdown = markdown.replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体
    markdown = markdown.replace(/\*([^*]+)\*/g, '$1') // 移除斜体
    markdown = markdown.replace(/`([^`]+)`/g, '$1') // 移除行内代码
    markdown = markdown.replace(/```\n?([\s\S]*?)\n?```/g, '$1') // 移除代码块格式

    return this.cleanupWhitespace(markdown)
  }

  // 转换为纯文本
  toPlainText(html) {
    let markdown = this.toSimplifiedMarkdown(html)

    // 移除Markdown特殊字符
    markdown = markdown.replace(/[#*_`~\[\]()]/g, '')

    return this.cleanupWhitespace(markdown)
  }

  // 生成转换哈希
  generateHash(content) {
    let hash = 0
    const sampleLength = Math.min(content.length, 500)
    for (let i = 0; i < sampleLength; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  // 管理缓存大小
  manageCacheSize() {
    if (this.conversionCache.size > this.maxCacheSize) {
      const firstKey = this.conversionCache.keys().next().value
      this.conversionCache.delete(firstKey)
    }
  }

  // 获取缓存统计
  getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests * 100).toFixed(2) : '0.00'

    return {
      size: this.conversionCache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      totalRequests: totalRequests,
      rulesCount: this.conversionRules.length,
      specialRulesCount: Object.keys(this.specialRules).length
    }
  }

  // 清空缓存
  clearCache() {
    this.conversionCache.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  // 预热缓存
  warmupCache(commonHtmlContents = []) {
    for (const html of commonHtmlContents) {
      this.htmlToMarkdown(html)
    }
    return this.getCacheStats()
  }

  // 获取转换统计信息
  getConversionStats(originalHtml, convertedMarkdown) {
    return {
      originalLength: originalHtml.length,
      convertedLength: convertedMarkdown.length,
      compressionRatio: ((1 - convertedMarkdown.length / originalHtml.length) * 100).toFixed(2) + '%',
      tagsRemoved: (originalHtml.match(/<[^>]+>/g) || []).length,
      markdownElements: (convertedMarkdown.match(/[#*_`\[\]]/g) || []).length,
      estimatedTokenSaving: this.estimateTokenSaving(originalHtml, convertedMarkdown)
    }
  }

  // 估算Token节省
  estimateTokenSaving(originalHtml, convertedMarkdown) {
    // 估算原HTML的token消耗（粗略估算）
    const htmlTokens = Math.ceil(originalHtml.length / 4) // 假设平均4字符一个token
    
    // 估算Markdown的token消耗
    const mdTokens = Math.ceil(convertedMarkdown.length / 4)
    
    const savedTokens = htmlTokens - mdTokens
    const savingPercentage = ((savedTokens / htmlTokens) * 100).toFixed(1)
    
    return {
      savedTokens,
      savingPercentage: `${savingPercentage}%`,
      htmlTokens,
      mdTokens
    }
  }

  // 自定义转换规则
  addCustomRule(rule) {
    if (!rule.regex || !rule.replacement) {
      throw new Error('Custom rule must have regex and replacement')
    }
    
    this.conversionRules.push({
      ...rule,
      priority: rule.priority || 5
    })
    
    // 重新排序规则
    this.conversionRules.sort((a, b) => a.priority - b.priority)
  }

  // 移除自定义规则
  removeCustomRule(ruleName) {
    const index = this.conversionRules.findIndex(rule => rule.name === ruleName)
    if (index !== -1) {
      this.conversionRules.splice(index, 1)
    }
  }

  // 重置为默认规则
  resetToDefaultRules() {
    // 重新初始化会重置规则
    const currentCacheHits = this.cacheHits
    const currentCacheMisses = this.cacheMisses
    
    // 保存缓存统计
    this.clearCache()
    this.cacheHits = currentCacheHits
    this.cacheMisses = currentCacheMisses
  }

  // 验证Markdown语法
  validateMarkdown(markdown) {
    const issues = []

    // 检查不匹配的代码块
    const codeBlocks = markdown.match(/```/g)
    if (codeBlocks && codeBlocks.length % 2 !== 0) {
      issues.push({
        type: 'unclosed-code-block',
        message: '存在未闭合的代码块'
      })
    }

    // 检查不匹配的链接
    const links = markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g)
    if (links) {
      for (const link of links) {
        if (!link.includes('](')) {
          issues.push({
            type: 'malformed-link',
            message: `链接格式错误: ${link}`
          })
        }
      }
    }

    // 检查过深的嵌套
    const maxNesting = 6
    const headingMatches = markdown.match(/^#+/gm) || []
    for (const match of headingMatches) {
      if (match.length > maxNesting) {
        issues.push({
          type: 'deep-nesting',
          message: `标题层级过深: ${match.length}级`
        })
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      issueCount: issues.length
    }
  }
}