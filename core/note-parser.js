// 笔记解析器 - 解析已有笔记结构和内容
export class NoteParser {
  constructor(options = {}) {
    // 配置
    this.config = {
      // 编码
      encoding: options.encoding || 'utf-8',
      // 最大文件大小
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      ...options
    }

    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 50
  }

  /**
   * 主解析方法 - 解析笔记文件或内容
   * @param {string} input - 文件路径或HTML内容
   * @param {object} options - 配置选项
   * @returns {object} 解析结果
   */
  async parse(input, options = {}) {
    const startTime = performance.now()

    try {
      // 获取内容
      let content = input
      let filePath = null

      if (this.isFilePath(input)) {
        filePath = input
        content = await this.readFile(input)
      }

      // 检查缓存
      const cacheKey = this.generateCacheKey(content)
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // 解析内容
      const result = this.parseContent(content, options)

      // 添加元数据
      result.metadata = {
        ...result.metadata,
        filePath,
        parseTime: (performance.now() - startTime).toFixed(2) + 'ms',
        parsedAt: new Date().toISOString()
      }

      // 缓存结果
      this.cache.set(cacheKey, result)
      this.manageCacheSize()

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message,
        parseTime: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  /**
   * 解析HTML内容
   */
  parseContent(html, options = {}) {
    // 提取基本信息
    const title = this.extractTitle(html)
    const subtitle = this.extractSubtitle(html)
    const date = this.extractDate(html)
    const template = this.extractTemplate(html)

    // 提取结构
    const sections = this.extractSections(html)
    const headings = this.extractHeadings(html)

    // 提取内容
    const textContent = this.extractTextContent(html)
    const codeBlocks = this.extractCodeBlocks(html)
    const lists = this.extractLists(html)
    const tables = this.extractTables(html)

    // 提取知识点
    const knowledgePoints = this.extractKnowledgePoints(html)

    // 提取样式信息
    const styles = this.extractStyles(html)

    // 提取组件
    const components = this.extractComponents(html)

    return {
      success: true,
      // 基本信息
      title,
      subtitle,
      date,
      template,
      // 结构信息
      sections,
      headings,
      // 内容信息
      textContent,
      codeBlocks,
      lists,
      tables,
      // 知识点
      knowledgePoints,
      // 样式和组件
      styles,
      components,
      // 统计信息
      statistics: this.calculateStatistics(html, sections, codeBlocks, lists, tables),
      // 原始HTML
      rawHtml: html,
      metadata: {
        contentLength: html.length,
        sectionCount: sections.length,
        headingCount: headings.length
      }
    }
  }

  /**
   * 提取标题
   */
  extractTitle(html) {
    // 尝试从<title>标签提取
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    if (titleMatch) {
      return titleMatch[1].trim()
    }

    // 尝试从第一个h1提取
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
    if (h1Match) {
      return h1Match[1].replace(/<[^>]+>/g, '').trim()
    }

    // 尝试从class="title"提取
    const titleClassMatch = html.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/div>/is)
    if (titleClassMatch) {
      return titleClassMatch[1].replace(/<[^>]+>/g, '').trim()
    }

    return '未知标题'
  }

  /**
   * 提取副标题
   */
  extractSubtitle(html) {
    // 尝试从class="subtitle"提取
    const subtitleMatch = html.match(/<div[^>]*class="[^"]*subtitle[^"]*"[^>]*>(.*?)<\/div>/is)
    if (subtitleMatch) {
      return subtitleMatch[1].replace(/<[^>]+>/g, '').trim()
    }

    // 尝试从第一个h2提取
    const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i)
    if (h2Match) {
      return h2Match[1].replace(/<[^>]+>/g, '').trim()
    }

    return null
  }

  /**
   * 提取日期
   */
  extractDate(html) {
    // 尝试从class="date"提取
    const dateMatch = html.match(/<div[^>]*class="[^"]*date[^"]*"[^>]*>(.*?)<\/div>/is)
    if (dateMatch) {
      return dateMatch[1].replace(/<[^>]+>/g, '').trim()
    }

    // 尝试匹配日期格式
    const dateFormatMatch = html.match(/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?/)
    if (dateFormatMatch) {
      return dateFormatMatch[0]
    }

    return null
  }

  /**
   * 提取模板类型
   */
  extractTemplate(html) {
    // 检查模板特征
    if (html.includes('spiral-bound') || html.includes('横线纸张')) {
      return 'styleA'
    }
    if (html.includes('leather-cover') || html.includes('翻页')) {
      return 'styleB'
    }
    if (html.includes('gradient-header') || html.includes('卡片式')) {
      return 'styleC'
    }

    return 'unknown'
  }

  /**
   * 提取章节
   */
  extractSections(html) {
    const sections = []

    // 提取所有section
    const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi
    let match

    while ((match = sectionRegex.exec(html)) !== null) {
      const sectionHtml = match[1]
      const title = this.extractSectionTitle(sectionHtml)
      const content = this.stripHtml(sectionHtml)

      sections.push({
        title,
        content,
        html: sectionHtml,
        wordCount: this.countWords(content)
      })
    }

    // 如果没有section，尝试从h2分段
    if (sections.length === 0) {
      const h2Regex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi
      while ((match = h2Regex.exec(html)) !== null) {
        const title = match[1].replace(/<[^>]+>/g, '').trim()
        const content = this.stripHtml(match[2])

        sections.push({
          title,
          content,
          html: match[2],
          wordCount: this.countWords(content)
        })
      }
    }

    return sections
  }

  /**
   * 提取章节标题
   */
  extractSectionTitle(sectionHtml) {
    // 尝试从h2/h3提取
    const headingMatch = sectionHtml.match(/<h[23][^>]*>(.*?)<\/h[23]>/i)
    if (headingMatch) {
      return headingMatch[1].replace(/<[^>]+>/g, '').trim()
    }

    // 尝试从class="section-title"提取
    const titleClassMatch = sectionHtml.match(/<div[^>]*class="[^"]*section-title[^"]*"[^>]*>(.*?)<\/div>/is)
    if (titleClassMatch) {
      return titleClassMatch[1].replace(/<[^>]+>/g, '').trim()
    }

    return '未命名章节'
  }

  /**
   * 提取标题层级
   */
  extractHeadings(html) {
    const headings = []
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi
    let match

    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]+>/g, '').trim(),
        position: match.index
      })
    }

    return headings
  }

  /**
   * 提取文本内容
   */
  extractTextContent(html) {
    // 移除脚本和样式
    let content = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')

    // 提取段落
    const paragraphs = []
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let match

    while ((match = paragraphRegex.exec(content)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()

      if (text.length > 10) {
        paragraphs.push(text)
      }
    }

    return paragraphs.join('\n\n')
  }

  /**
   * 提取代码块
   */
  extractCodeBlocks(html) {
    const codeBlocks = []
    const codeRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi
    let match

    while ((match = codeRegex.exec(html)) !== null) {
      const code = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()

      // 提取语言
      const langMatch = match[0].match(/class="[^"]*language-(\w+)[^"]*"/i)
      const language = langMatch ? langMatch[1] : 'unknown'

      codeBlocks.push({
        code,
        language,
        length: code.length
      })
    }

    return codeBlocks
  }

  /**
   * 提取列表
   */
  extractLists(html) {
    const lists = []

    // 无序列表
    const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi
    let match

    while ((match = ulRegex.exec(html)) !== null) {
      const items = this.extractListItems(match[1])
      if (items.length > 0) {
        lists.push({ type: 'unordered', items })
      }
    }

    // 有序列表
    const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi
    while ((match = olRegex.exec(html)) !== null) {
      const items = this.extractListItems(match[1])
      if (items.length > 0) {
        lists.push({ type: 'ordered', items })
      }
    }

    return lists
  }

  /**
   * 提取列表项
   */
  extractListItems(listHtml) {
    const items = []
    const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let match

    while ((match = itemRegex.exec(listHtml)) !== null) {
      items.push(match[1].replace(/<[^>]+>/g, '').trim())
    }

    return items
  }

  /**
   * 提取表格
   */
  extractTables(html) {
    const tables = []
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
    let match

    while ((match = tableRegex.exec(html)) !== null) {
      const tableHtml = match[1]
      const headers = this.extractTableHeaders(tableHtml)
      const rows = this.extractTableRows(tableHtml)

      if (headers.length > 0 || rows.length > 0) {
        tables.push({ headers, rows })
      }
    }

    return tables
  }

  /**
   * 提取表头
   */
  extractTableHeaders(tableHtml) {
    const headers = []
    const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi
    let match

    while ((match = thRegex.exec(tableHtml)) !== null) {
      headers.push(match[1].replace(/<[^>]+>/g, '').trim())
    }

    return headers
  }

  /**
   * 提取表格行
   */
  extractTableRows(tableHtml) {
    const rows = []
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let match

    while ((match = rowRegex.exec(tableHtml)) !== null) {
      const cells = []
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
      let cellMatch

      while ((cellMatch = cellRegex.exec(match[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim())
      }

      if (cells.length > 0) {
        rows.push(cells)
      }
    }

    return rows
  }

  /**
   * 提取知识点
   */
  extractKnowledgePoints(html) {
    const points = []

    // 提取高亮内容
    const highlightRegex = /<span[^>]*class="[^"]*highlight[^"]*"[^>]*>(.*?)<\/span>/gi
    let match

    while ((match = highlightRegex.exec(html)) !== null) {
      points.push({
        type: 'highlight',
        text: match[1].replace(/<[^>]+>/g, '').trim()
      })
    }

    // 提取重点内容
    const importantRegex = /<span[^>]*class="[^"]*red-text[^"]*"[^>]*>(.*?)<\/span>/gi
    while ((match = importantRegex.exec(html)) !== null) {
      points.push({
        type: 'important',
        text: match[1].replace(/<[^>]+>/g, '').trim()
      })
    }

    // 提取代码术语
    const codeTermRegex = /<span[^>]*class="[^"]*code-term[^"]*"[^>]*>(.*?)<\/span>/gi
    while ((match = codeTermRegex.exec(html)) !== null) {
      points.push({
        type: 'code',
        text: match[1].replace(/<[^>]+>/g, '').trim()
      })
    }

    return points
  }

  /**
   * 提取样式信息
   */
  extractStyles(html) {
    const styles = {
      hasAnimation: html.includes('animation-delay'),
      hasCustomFont: html.includes('@font-face') || html.includes('font-family'),
      hasGradient: html.includes('linear-gradient') || html.includes('radial-gradient'),
      hasShadow: html.includes('box-shadow'),
      hasBorder: html.includes('border'),
      colorScheme: this.extractColorScheme(html)
    }

    return styles
  }

  /**
   * 提取配色方案
   */
  extractColorScheme(html) {
    const colors = []
    const colorRegex = /#([0-9a-fA-F]{3,8})/g
    let match

    while ((match = colorRegex.exec(html)) !== null) {
      if (!colors.includes(match[0])) {
        colors.push(match[0])
      }
    }

    return colors.slice(0, 10) // 最多返回10个颜色
  }

  /**
   * 提取组件
   */
  extractComponents(html) {
    const components = {
      flowBoxes: (html.match(/class="[^"]*flow-box[^"]*"/g) || []).length,
      compareBoxes: (html.match(/class="[^"]*compare-box[^"]*"/g) || []).length,
      questionBoxes: (html.match(/class="[^"]*question-box[^"]*"/g) || []).length,
      summaryBoxes: (html.match(/class="[^"]*summary-box[^"]*"/g) || []).length,
      sideNotes: (html.match(/class="[^"]*side-note[^"]*"/g) || []).length,
      dividers: (html.match(/class="[^"]*divider[^"]*"/g) || []).length,
      codeBlocks: (html.match(/<pre[^>]*><code[^>]*>/g) || []).length
    }

    return components
  }

  /**
   * 计算统计信息
   */
  calculateStatistics(html, sections, codeBlocks, lists, tables) {
    const textContent = this.stripHtml(html)

    return {
      // 内容统计
      totalLength: html.length,
      textLength: textContent.length,
      wordCount: this.countWords(textContent),
      lineCount: textContent.split('\n').length,

      // 结构统计
      sectionCount: sections.length,
      headingCount: sections.length,

      // 组件统计
      codeBlockCount: codeBlocks.length,
      listCount: lists.length,
      tableCount: tables.length,

      // 代码统计
      totalCodeLength: codeBlocks.reduce((sum, block) => sum + block.length, 0),
      codeLanguages: [...new Set(codeBlocks.map(b => b.language))],

      // 复杂度指标
      averageSectionLength: sections.length > 0 
        ? Math.round(sections.reduce((sum, s) => sum + s.wordCount, 0) / sections.length)
        : 0
    }
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
   * 字数统计
   */
  countWords(text) {
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (text.match(/[a-zA-Z]+/g) || []).length
    return chinese + english
  }

  /**
   * 判断是否为文件路径
   */
  isFilePath(str) {
    return /^[a-zA-Z]:\\/.test(str) || // Windows
           /^\//.test(str) || // Unix
           /^\.\//.test(str) // 相对路径
  }

  /**
   * 读取文件
   */
  async readFile(filePath) {
    try {
      const fs = await import('fs/promises')
      const content = await fs.readFile(filePath, this.config.encoding)
      return content
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`)
    }
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(content) {
    const hash = this.simpleHash(content.substring(0, 500))
    return `note_${hash}`
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
export function createNoteParser(options = {}) {
  return new NoteParser(options)
}

// 快速解析函数
export async function parseNote(input, options = {}) {
  const parser = createNoteParser(options)
  return await parser.parse(input, options)
}
