// 版本管理器 - 管理笔记版本历史
export class VersionManager {
  constructor(options = {}) {
    // 配置
    this.config = {
      // 版本存储目录
      versionsDir: options.versionsDir || '.versions',
      // 最大版本数
      maxVersions: options.maxVersions || 50,
      // 自动版本号
      autoVersion: options.autoVersion !== false,
      // 版本命名格式
      versionFormat: options.versionFormat || 'v{version}_{timestamp}',
      ...options
    }

    // 版本存储
    this.versions = new Map() // filePath -> Version[]

    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 50
  }

  /**
   * 创建版本
   * @param {string} filePath - 笔记文件路径
   * @param {object} noteData - 笔记数据
   * @param {object} options - 配置选项
   * @returns {object} 版本信息
   */
  async createVersion(filePath, noteData, options = {}) {
    const startTime = performance.now()

    try {
      // 获取版本历史
      const versions = this.getVersionHistory(filePath)

      // 生成版本号
      const versionNumber = this.generateVersionNumber(versions)

      // 生成版本ID
      const versionId = this.generateVersionId(filePath, versionNumber)

      // 创建版本记录
      const version = {
        id: versionId,
        version: versionNumber,
        filePath,
        timestamp: new Date().toISOString(),
        // 内容摘要
        summary: this.generateSummary(noteData),
        // 内容统计
        statistics: this.calculateStatistics(noteData),
        // 变更说明
        changes: options.changes || '更新笔记内容',
        // 标签
        tags: options.tags || [],
        // 内容哈希
        contentHash: this.generateContentHash(noteData),
        // 元数据
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: options.createdBy || 'system',
          ...options.metadata
        }
      }

      // 保存版本内容
      if (options.saveContent !== false) {
        await this.saveVersionContent(versionId, noteData)
      }

      // 添加到版本历史
      versions.push(version)

      // 清理旧版本
      this.cleanupOldVersions(versions)

      // 更新存储
      this.versions.set(filePath, versions)

      // 记录性能
      const duration = performance.now() - startTime

      return {
        success: true,
        version,
        totalVersions: versions.length,
        duration: duration.toFixed(2) + 'ms'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  /**
   * 获取版本历史
   */
  getVersionHistory(filePath) {
    if (!this.versions.has(filePath)) {
      this.versions.set(filePath, [])
    }
    return this.versions.get(filePath)
  }

  /**
   * 获取指定版本
   */
  getVersion(filePath, versionId) {
    const versions = this.getVersionHistory(filePath)
    return versions.find(v => v.id === versionId || v.version === versionId)
  }

  /**
   * 获取最新版本
   */
  getLatestVersion(filePath) {
    const versions = this.getVersionHistory(filePath)
    return versions.length > 0 ? versions[versions.length - 1] : null
  }

  /**
   * 比较两个版本
   */
  compareVersions(filePath, versionId1, versionId2) {
    const versions = this.getVersionHistory(filePath)
    const version1 = versions.find(v => v.id === versionId1 || v.version === versionId1)
    const version2 = versions.find(v => v.id === versionId2 || v.version === versionId2)

    if (!version1 || !version2) {
      return {
        success: false,
        error: '版本不存在'
      }
    }

    return {
      success: true,
      version1: {
        id: version1.id,
        version: version1.version,
        timestamp: version1.timestamp,
        summary: version1.summary,
        statistics: version1.statistics
      },
      version2: {
        id: version2.id,
        version: version2.version,
        timestamp: version2.timestamp,
        summary: version2.summary,
        statistics: version2.statistics
      },
      differences: {
        timeDiff: new Date(version2.timestamp) - new Date(version1.timestamp),
        contentDiff: {
          lengthDiff: version2.statistics.totalLength - version1.statistics.totalLength,
          sectionDiff: version2.statistics.sectionCount - version1.statistics.sectionCount,
          wordCountDiff: version2.statistics.wordCount - version1.statistics.wordCount
        }
      }
    }
  }

  /**
   * 回退到指定版本
   */
  async revertToVersion(filePath, versionId, options = {}) {
    const startTime = performance.now()

    try {
      const version = this.getVersion(filePath, versionId)
      if (!version) {
        throw new Error('版本不存在')
      }

      // 获取版本内容
      const content = await this.loadVersionContent(versionId)
      if (!content) {
        throw new Error('版本内容不存在')
      }

      // 创建新版本（记录回退操作）
      const revertVersion = await this.createVersion(filePath, content, {
        changes: `回退到版本 ${version.version}`,
        tags: ['revert', `reverted-to-${version.version}`],
        metadata: {
          revertedFrom: this.getLatestVersion(filePath)?.version,
          revertedTo: version.version
        }
      })

      // 保存回退内容
      if (options.save !== false) {
        await this.saveFile(filePath, content)
      }

      return {
        success: true,
        revertedTo: version,
        newVersion: revertVersion.version,
        duration: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  /**
   * 删除版本
   */
  async deleteVersion(filePath, versionId) {
    const versions = this.getVersionHistory(filePath)
    const index = versions.findIndex(v => v.id === versionId || v.version === versionId)

    if (index === -1) {
      return {
        success: false,
        error: '版本不存在'
      }
    }

    const deletedVersion = versions.splice(index, 1)[0]

    // 删除版本内容
    await this.deleteVersionContent(versionId)

    return {
      success: true,
      deletedVersion,
      remainingVersions: versions.length
    }
  }

  /**
   * 清理旧版本
   */
  cleanupOldVersions(versions) {
    while (versions.length > this.config.maxVersions) {
      const oldVersion = versions.shift()
      this.deleteVersionContent(oldVersion.id).catch(() => {})
    }
  }

  /**
   * 生成版本号
   */
  generateVersionNumber(versions) {
    if (versions.length === 0) {
      return 'v1.0.0'
    }

    const lastVersion = versions[versions.length - 1].version
    const match = lastVersion.match(/v(\d+)\.(\d+)\.(\d+)/)

    if (match) {
      const major = parseInt(match[1])
      const minor = parseInt(match[2])
      const patch = parseInt(match[3]) + 1
      return `v${major}.${minor}.${patch}`
    }

    return `v1.0.${versions.length}`
  }

  /**
   * 生成版本ID
   */
  generateVersionId(filePath, versionNumber) {
    const hash = this.simpleHash(filePath + versionNumber + Date.now())
    return `${versionNumber}_${hash}`
  }

  /**
   * 生成摘要
   */
  generateSummary(noteData) {
    if (typeof noteData === 'string') {
      return noteData.substring(0, 100) + (noteData.length > 100 ? '...' : '')
    }

    if (noteData.title) {
      return noteData.title
    }

    if (noteData.sections && noteData.sections.length > 0) {
      return noteData.sections[0].title || '笔记内容'
    }

    return '笔记内容'
  }

  /**
   * 计算统计信息
   */
  calculateStatistics(noteData) {
    if (typeof noteData === 'string') {
      return {
        totalLength: noteData.length,
        wordCount: this.countWords(noteData),
        sectionCount: 0,
        lineCount: noteData.split('\n').length
      }
    }

    if (noteData.statistics) {
      return noteData.statistics
    }

    const content = noteData.textContent || noteData.content || ''
    return {
      totalLength: content.length,
      wordCount: this.countWords(content),
      sectionCount: noteData.sections ? noteData.sections.length : 0,
      lineCount: content.split('\n').length
    }
  }

  /**
   * 生成内容哈希
   */
  generateContentHash(noteData) {
    const content = typeof noteData === 'string' ? noteData : JSON.stringify(noteData)
    return this.simpleHash(content)
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
   * 保存版本内容
   */
  async saveVersionContent(versionId, noteData) {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      // 确保目录存在
      const versionsDir = this.config.versionsDir
      await fs.mkdir(versionsDir, { recursive: true })

      // 保存内容
      const filePath = path.join(versionsDir, `${versionId}.json`)
      const content = typeof noteData === 'string' ? { raw: noteData } : noteData
      await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8')

      return true
    } catch (error) {
      console.error('保存版本内容失败:', error.message)
      return false
    }
  }

  /**
   * 加载版本内容
   */
  async loadVersionContent(versionId) {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const filePath = path.join(this.config.versionsDir, `${versionId}.json`)
      const content = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(content)

      return data.raw || data
    } catch (error) {
      return null
    }
  }

  /**
   * 删除版本内容
   */
  async deleteVersionContent(versionId) {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const filePath = path.join(this.config.versionsDir, `${versionId}.json`)
      await fs.unlink(filePath).catch(() => {})

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 保存文件
   */
  async saveFile(filePath, content) {
    try {
      const fs = await import('fs/promises')
      await fs.writeFile(filePath, content, 'utf-8')
      return true
    } catch (error) {
      throw new Error(`保存文件失败: ${error.message}`)
    }
  }

  /**
   * 获取版本统计
   */
  getStatistics(filePath) {
    const versions = this.getVersionHistory(filePath)

    if (versions.length === 0) {
      return {
        totalVersions: 0,
        firstVersion: null,
        lastVersion: null,
        totalChanges: 0
      }
    }

    return {
      totalVersions: versions.length,
      firstVersion: versions[0].version,
      lastVersion: versions[versions.length - 1].version,
      firstTimestamp: versions[0].timestamp,
      lastTimestamp: versions[versions.length - 1].timestamp,
      totalChanges: versions.reduce((sum, v) => {
        const stats = v.statistics || {}
        return sum + (stats.wordCount || 0)
      }, 0),
      averageVersionSize: Math.round(
        versions.reduce((sum, v) => sum + (v.statistics?.totalLength || 0), 0) / versions.length
      )
    }
  }

  /**
   * 导出版本历史
   */
  exportVersionHistory(filePath) {
    const versions = this.getVersionHistory(filePath)
    return {
      filePath,
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        timestamp: v.timestamp,
        summary: v.summary,
        changes: v.changes,
        tags: v.tags,
        statistics: v.statistics
      })),
      exportedAt: new Date().toISOString()
    }
  }

  /**
   * 导入版本历史
   */
  importVersionHistory(filePath, history) {
    if (!history.versions || !Array.isArray(history.versions)) {
      return {
        success: false,
        error: '无效的版本历史格式'
      }
    }

    this.versions.set(filePath, history.versions)

    return {
      success: true,
      importedVersions: history.versions.length
    }
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
   * 清空缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 清空所有版本
   */
  clearAllVersions() {
    this.versions.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      versionCount: Array.from(this.versions.values()).reduce((sum, v) => sum + v.length, 0)
    }
  }
}

// 便捷工厂函数
export function createVersionManager(options = {}) {
  return new VersionManager(options)
}
