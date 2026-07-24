// 笔记合并器 - 将新内容合并到已有笔记
export class NoteMerger {
  constructor(options = {}) {
    // 配置
    this.config = {
      // 合并策略
      strategy: options.strategy || 'smart', // smart, append, prepend, replace
      // 去重策略
      deduplication: options.deduplication || 'auto', // auto, manual, skip
      // 相似度阈值
      similarityThreshold: options.similarityThreshold || 0.7,
      // 保留格式
      preserveFormat: options.preserveFormat !== false,
      // 备份原文件
      backupOriginal: options.backupOriginal !== false,
      ...options
    }

    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 50
  }

  /**
   * 主合并方法
   * @param {object} oldNote - 旧笔记解析结果
   * @param {string|object} newContent - 新内容或解析结果
   * @param {object} compareResult - 对比结果
   * @param {object} options - 配置选项
   * @returns {object} 合并结果
   */
  async merge(oldNote, newContent, compareResult, options = {}) {
    const startTime = performance.now()

    try {
      // 准备内容
      const oldHtml = oldNote.rawHtml || ''
      const newContentStr = typeof newContent === 'string' ? newContent : this.extractContent(newContent)

      // 执行合并
      const result = this.performMerge(oldHtml, newContentStr, compareResult, options)

      // 添加元数据
      result.metadata = {
        ...result.metadata,
        mergeTime: (performance.now() - startTime).toFixed(2) + 'ms',
        mergedAt: new Date().toISOString(),
        strategy: options.strategy || this.config.strategy
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message,
        mergeTime: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  /**
   * 执行合并
   */
  performMerge(oldHtml, newContent, compareResult, options) {
    const strategy = options.strategy || this.config.strategy

    // 根据策略选择合并方法
    let mergedHtml
    let mergeDetails

    switch (strategy) {
      case 'append':
        mergedHtml = this.appendToOld(oldHtml, newContent)
        mergeDetails = { strategy: 'append', description: '追加到末尾' }
        break

      case 'prepend':
        mergedHtml = this.prependToOld(oldHtml, newContent)
        mergeDetails = { strategy: 'prepend', description: '添加到开头' }
        break

      case 'replace':
        mergedHtml = this.replaceOld(oldHtml, newContent)
        mergeDetails = { strategy: 'replace', description: '替换原内容' }
        break

      case 'smart':
      default:
        mergedHtml = this.smartMerge(oldHtml, newContent, compareResult)
        mergeDetails = { strategy: 'smart', description: '智能合并' }
        break
    }

    // 更新标题和日期
    mergedHtml = this.updateMetadata(mergedHtml)

    // 统计变化
    const changes = this.countChanges(oldHtml, mergedHtml)

    return {
      success: true,
      mergedHtml,
      changes,
      mergeDetails,
      statistics: {
        oldLength: oldHtml.length,
        newLength: newContent.length,
        mergedLength: mergedHtml.length,
        addedLength: mergedHtml.length - oldHtml.length
      },
      metadata: {
        originalTitle: this.extractTitle(oldHtml),
        mergedTitle: this.extractTitle(mergedHtml)
      }
    }
  }

  /**
   * 智能合并
   */
  smartMerge(oldHtml, newContent, compareResult) {
    // 如果没有对比结果，使用追加策略
    if (!compareResult || !compareResult.success) {
      return this.appendToOld(oldHtml, newContent)
    }

    const { added, removed, modified, duplicates } = compareResult

    let mergedHtml = oldHtml

    // 1. 处理重复内容（跳过）
    // 重复内容已经存在，不需要添加

    // 2. 处理新增内容
    if (added.length > 0) {
      mergedHtml = this.addNewContent(mergedHtml, added)
    }

    // 3. 处理修改内容
    if (modified.length > 0) {
      mergedHtml = this.applyModifications(mergedHtml, modified)
    }

    // 4. 处理删除内容（可选）
    if (removed.length > 0 && this.config.deduplication === 'manual') {
      // 标记删除内容，但不实际删除
      mergedHtml = this.markRemovedContent(mergedHtml, removed)
    }

    return mergedHtml
  }

  /**
   * 追加到末尾
   */
  appendToOld(oldHtml, newContent) {
    // 找到插入点（在</body>之前或末尾）
    const insertPoint = oldHtml.lastIndexOf('</body>')
    
    if (insertPoint !== -1) {
      // 在</body>之前插入
      const beforeBody = oldHtml.substring(0, insertPoint)
      const afterBody = oldHtml.substring(insertPoint)
      
      return `${beforeBody}\n<div class="merged-content">\n<h2>📝 新增内容</h2>\n${this.formatNewContent(newContent)}\n</div>\n${afterBody}`
    }

    // 直接追加到末尾
    return `${oldHtml}\n<div class="merged-content">\n<h2>📝 新增内容</h2>\n${this.formatNewContent(newContent)}\n</div>`
  }

  /**
   * 添加到开头
   */
  prependToOld(oldHtml, newContent) {
    // 找到插入点（在<body>之后或开头）
    const insertPoint = oldHtml.indexOf('<body')
    
    if (insertPoint !== -1) {
      // 找到<body>标签的结束位置
      const bodyEnd = oldHtml.indexOf('>', insertPoint) + 1
      const afterBody = oldHtml.substring(bodyEnd)
      
      return `${oldHtml.substring(0, bodyEnd)}\n<div class="merged-content">\n<h2>📝 新增内容</h2>\n${this.formatNewContent(newContent)}\n</div>\n${afterBody}`
    }

    // 直接添加到开头
    return `<div class="merged-content">\n<h2>📝 新增内容</h2>\n${this.formatNewContent(newContent)}\n</div>\n${oldHtml}`
  }

  /**
   * 替换原内容
   */
  replaceOld(oldHtml, newContent) {
    // 保留原HTML结构，替换内容
    const headMatch = oldHtml.match(/<head[\s\S]*?<\/head>/i)
    const head = headMatch ? headMatch[0] : ''
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
${head}
<body>
<div class="notebook">
${this.formatNewContent(newContent)}
</div>
</body>
</html>`
  }

  /**
   * 添加新内容
   */
  addNewContent(html, addedItems) {
    let result = html

    // 按位置排序
    const sortedItems = [...addedItems].sort((a, b) => a.position - b.position)

    for (const item of sortedItems) {
      // 找到合适的插入点
      const insertPoint = this.findInsertPoint(result, item)
      
      // 插入内容
      const formattedContent = this.formatNewContent(item.content)
      result = result.substring(0, insertPoint) + 
               `\n<div class="new-content">\n${formattedContent}\n</div>\n` + 
               result.substring(insertPoint)
    }

    return result
  }

  /**
   * 应用修改
   */
  applyModifications(html, modifiedItems) {
    let result = html

    for (const item of modifiedItems) {
      // 找到旧内容的位置
      const oldContentRegex = this.escapeRegex(item.oldContent)
      const regex = new RegExp(oldContentRegex, 'gi')
      
      // 替换为新内容
      result = result.replace(regex, this.formatNewContent(item.newContent))
    }

    return result
  }

  /**
   * 标记删除内容
   */
  markRemovedContent(html, removedItems) {
    let result = html

    for (const item of removedItems) {
      // 找到内容位置
      const contentRegex = this.escapeRegex(item.content)
      const regex = new RegExp(contentRegex, 'gi')
      
      // 标记为待删除
      result = result.replace(regex, 
        `<div class="removed-content" title="此内容在新版本中被删除">${item.content}</div>`
      )
    }

    return result
  }

  /**
   * 找到插入点
   */
  findInsertPoint(html, item) {
    // 如果有位置信息，尝试找到对应位置
    if (item.position !== undefined) {
      // 找到第n个section的位置
      const sectionRegex = /<section[^>]*>/gi
      let count = 0
      let match

      while ((match = sectionRegex.exec(html)) !== null) {
        if (count === item.position) {
          return match.index
        }
        count++
      }
    }

    // 默认在</body>之前插入
    const bodyEnd = html.lastIndexOf('</body>')
    if (bodyEnd !== -1) {
      return bodyEnd
    }

    // 在末尾插入
    return html.length
  }

  /**
   * 格式化新内容
   */
  formatNewContent(content) {
    if (!content) return ''

    // 如果已经是HTML格式，直接返回
    if (content.includes('<div') || content.includes('<p>') || content.includes('<h')) {
      return content
    }

    // 转换为HTML
    let formatted = content

    // 处理标题
    formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>')

    // 处理粗体和斜体
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')

    // 处理代码块
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>')

    // 处理列表
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>')
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')

    // 处理段落
    formatted = formatted.replace(/\n\n/g, '</p><p>')

    return `<p>${formatted}</p>`
  }

  /**
   * 更新元数据
   */
  updateMetadata(html) {
    let result = html

    // 更新日期
    const dateRegex = /<div[^>]*class="[^"]*date[^"]*"[^>]*>.*?<\/div>/is
    const newDate = new Date().toLocaleDateString('zh-CN')
    result = result.replace(dateRegex, `<div class="date">${newDate}</div>`)

    // 如果没有日期，添加日期
    if (!result.includes('class="date"')) {
      const bodyMatch = result.match(/<body[^>]*>/i)
      if (bodyMatch) {
        const insertPoint = result.indexOf(bodyMatch[0]) + bodyMatch[0].length
        result = result.substring(0, insertPoint) + 
                 `\n<div class="date">${newDate}</div>\n` + 
                 result.substring(insertPoint)
      }
    }

    return result
  }

  /**
   * 统计变化
   */
  countChanges(oldHtml, newHtml) {
    const oldLength = oldHtml.length
    const newLength = newHtml.length

    return {
      addedBytes: newLength - oldLength,
      addedPercentage: oldLength > 0 ? ((newLength - oldLength) / oldLength * 100).toFixed(1) + '%' : '100%',
      addedSections: (newHtml.match(/class="new-content"/g) || []).length,
      removedSections: (newHtml.match(/class="removed-content"/g) || []).length
    }
  }

  /**
   * 提取内容
   */
  extractContent(note) {
    if (typeof note === 'string') {
      return note
    }

    if (note.textContent) {
      return note.textContent
    }

    if (note.sections && note.sections.length > 0) {
      return note.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')
    }

    return ''
  }

  /**
   * 提取标题
   */
  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    if (titleMatch) {
      return titleMatch[1].trim()
    }

    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
    if (h1Match) {
      return h1Match[1].replace(/<[^>]+>/g, '').trim()
    }

    return '未知标题'
  }

  /**
   * 转义正则表达式特殊字符
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 保存合并结果
   */
  async saveMergedNote(mergedHtml, filePath, options = {}) {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      // 备份原文件
      if (this.config.backupOriginal) {
        const backupPath = filePath.replace('.html', `.backup.${Date.now()}.html`)
        try {
          await fs.copyFile(filePath, backupPath)
        } catch (error) {
          // 原文件不存在，跳过备份
        }
      }

      // 保存合并结果
      await fs.writeFile(filePath, mergedHtml, 'utf-8')

      return {
        success: true,
        filePath,
        size: mergedHtml.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(oldHtml, newContent) {
    const hash1 = this.simpleHash(oldHtml.substring(0, 100))
    const hash2 = this.simpleHash(newContent.substring(0, 100))
    return `merge_${hash1}_${hash2}`
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
export function createNoteMerger(options = {}) {
  return new NoteMerger(options)
}

// 快速合并函数
export async function mergeNote(oldNote, newContent, compareResult, options = {}) {
  const merger = createNoteMerger(options)
  return await merger.merge(oldNote, newContent, compareResult, options)
}
