// 薄弱点识别器 - 识别学习薄弱环节
export class WeaknessDetector {
  constructor(options = {}) {
    // 知识图谱引用
    this.knowledgeGraph = options.knowledgeGraph || null
    
    // 配置
    this.config = {
      // 掌握程度阈值
      masteryThreshold: options.masteryThreshold || 0.6,
      // 薄弱程度阈值
      weaknessThreshold: options.weaknessThreshold || 0.4,
      // 最大薄弱点数
      maxWeaknesses: options.maxWeaknesses || 20,
      // 遗忘曲线衰减因子
      decayFactor: options.decayFactor || 0.95,
      ...options
    }
    
    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 50
  }

  /**
   * 检测薄弱点
   * @param {object} params - 参数
   * @param {string} params.studentId - 学生ID
   * @param {string} params.subject - 学科
   * @param {object} params.learningRecords - 学习记录
   * @param {object} params.options - 配置选项
   * @returns {object} 薄弱点分析结果
   */
  detectWeaknesses(params) {
    const startTime = performance.now()
    const { studentId, subject, learningRecords, options = {} } = params

    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(params)
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // 获取所有知识点
      const allNodes = this.getAllNodes(subject)
      if (allNodes.length === 0) {
        return {
          success: false,
          error: '未找到知识点'
        }
      }

      // 分析每个知识点的掌握程度
      const nodeAnalysis = this.analyzeNodeMastery(allNodes, learningRecords)

      // 识别薄弱点
      const weaknesses = this.identifyWeaknesses(nodeAnalysis, options)

      // 分析薄弱原因
      const weaknessAnalysis = this.analyzeWeaknessReasons(weaknesses, nodeAnalysis)

      // 生成改进建议
      const suggestions = this.generateSuggestions(weaknesses, weaknessAnalysis, options)

      // 生成薄弱点报告
      const report = this.generateReport(weaknesses, weaknessAnalysis, nodeAnalysis)

      const result = {
        success: true,
        // 薄弱点列表
        weaknesses,
        // 薄弱分析
        analysis: weaknessAnalysis,
        // 改进建议
        suggestions,
        // 报告
        report,
        // 统计信息
        statistics: {
          totalNodes: allNodes.length,
          weaknessCount: weaknesses.length,
          averageMastery: this.calculateAverageMastery(nodeAnalysis),
          weaknessRate: allNodes.length > 0 ? (weaknesses.length / allNodes.length * 100).toFixed(1) + '%' : '0%'
        },
        metadata: {
          studentId,
          subject,
          analyzedAt: new Date().toISOString(),
          duration: (performance.now() - startTime).toFixed(2) + 'ms'
        }
      }

      // 缓存结果
      this.cache.set(cacheKey, result)
      this.manageCacheSize()

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  /**
   * 获取所有知识点
   */
  getAllNodes(subject) {
    if (!this.knowledgeGraph) {
      return []
    }

    const nodes = []
    for (const [id, node] of this.knowledgeGraph.nodes) {
      if (!subject || node.subject === subject) {
        nodes.push(node)
      }
    }

    return nodes
  }

  /**
   * 分析知识点掌握程度
   */
  analyzeNodeMastery(nodes, learningRecords) {
    const analysis = new Map()

    for (const node of nodes) {
      const record = learningRecords?.[node.id] || {}
      const mastery = this.calculateMastery(node, record)
      const lastStudied = record.lastStudied || null
      const studyCount = record.studyCount || 0
      const forgettingFactor = this.calculateForgettingFactor(lastStudied)

      analysis.set(node.id, {
        node,
        mastery,
        lastStudied,
        studyCount,
        forgettingFactor,
        effectiveMastery: mastery * forgettingFactor
      })
    }

    return analysis
  }

  /**
   * 计算掌握程度
   */
  calculateMastery(node, record) {
    // 如果有明确的掌握程度，直接使用
    if (record.mastery !== undefined) {
      return record.mastery
    }

    // 基于学习次数和正确率计算
    const studyCount = record.studyCount || 0
    const correctRate = record.correctRate || 0
    const practiceCount = record.practiceCount || 0

    // 学习次数因子（最多0.3）
    const studyFactor = Math.min(studyCount / 10, 0.3)
    
    // 正确率因子（最多0.5）
    const correctFactor = correctRate * 0.5
    
    // 练习次数因子（最多0.2）
    const practiceFactor = Math.min(practiceCount / 5, 0.2)

    return Math.min(studyFactor + correctFactor + practiceFactor, 1)
  }

  /**
   * 计算遗忘因子
   */
  calculateForgettingFactor(lastStudied) {
    if (!lastStudied) {
      return 0.5 // 未学习过，默认50%
    }

    const now = new Date()
    const studiedDate = new Date(lastStudied)
    const daysSinceStudied = (now - studiedDate) / (1000 * 60 * 60 * 24)

    // 使用遗忘曲线公式：R = e^(-t/S)
    // R: 记忆保持率, t: 时间, S: 记忆强度
    const memoryStrength = 7 // 假设记忆强度为7天
    const retentionRate = Math.exp(-daysSinceStudied / memoryStrength)

    return Math.max(retentionRate, 0.1) // 最低10%
  }

  /**
   * 识别薄弱点
   */
  identifyWeaknesses(nodeAnalysis, options) {
    const weaknesses = []
    const threshold = options.weaknessThreshold || this.config.weaknessThreshold

    for (const [nodeId, analysis] of nodeAnalysis) {
      if (analysis.effectiveMastery < threshold) {
        weaknesses.push({
          nodeId,
          nodeName: analysis.node.name,
          subject: analysis.node.subject,
          chapter: analysis.node.chapter,
          difficulty: analysis.node.difficulty,
          mastery: analysis.mastery,
          effectiveMastery: analysis.effectiveMastery,
          lastStudied: analysis.lastStudied,
          studyCount: analysis.studyCount,
          forgettingFactor: analysis.forgettingFactor,
          // 薄弱程度（0-1，越低越薄弱）
          weaknessLevel: 1 - analysis.effectiveMastery
        })
      }
    }

    // 按薄弱程度排序
    weaknesses.sort((a, b) => a.effectiveMastery - b.effectiveMastery)

    // 限制数量
    return weaknesses.slice(0, this.config.maxWeaknesses)
  }

  /**
   * 分析薄弱原因
   */
  analyzeWeaknessReasons(weaknesses, nodeAnalysis) {
    const analysis = {
      // 未学习的知识点
      notStudied: [],
      // 学习次数不足
      insufficientStudy: [],
      // 正确率低
      lowCorrectRate: [],
      // 遗忘严重
      forgotten: [],
      // 难度过高
      tooDifficult: [],
      // 前置知识缺失
      missingPrerequisites: []
    }

    for (const weakness of weaknesses) {
      const nodeInfo = nodeAnalysis.get(weakness.nodeId)
      if (!nodeInfo) continue

      // 未学习
      if (!weakness.lastStudied) {
        analysis.notStudied.push(weakness)
        continue
      }

      // 学习次数不足
      if (weakness.studyCount < 3) {
        analysis.insufficientStudy.push(weakness)
      }

      // 正确率低
      if (nodeInfo.record?.correctRate < 0.5) {
        analysis.lowCorrectRate.push(weakness)
      }

      // 遗忘严重
      if (weakness.forgettingFactor < 0.5) {
        analysis.forgotten.push(weakness)
      }

      // 难度过高
      if (weakness.difficulty > 7) {
        analysis.tooDifficult.push(weakness)
      }

      // 前置知识缺失
      const prerequisites = this.getPrerequisites(weakness.nodeId)
      const missingPrereqs = prerequisites.filter(prereq => {
        const prereqAnalysis = nodeAnalysis.get(prereq.id)
        return !prereqAnalysis || prereqAnalysis.effectiveMastery < this.config.masteryThreshold
      })
      if (missingPrereqs.length > 0) {
        analysis.missingPrerequisites.push({
          ...weakness,
          missingPrerequisites: missingPrereqs
        })
      }
    }

    return analysis
  }

  /**
   * 获取前置知识点
   */
  getPrerequisites(nodeId) {
    if (!this.knowledgeGraph) {
      return []
    }

    const prerequisites = []
    const edges = this.knowledgeGraph.getEdges(nodeId) || []

    for (const edge of edges) {
      if (edge.type === 'prerequisite' && edge.to === nodeId) {
        const prereqNode = this.knowledgeGraph.getNode(edge.from)
        if (prereqNode) {
          prerequisites.push(prereqNode)
        }
      }
    }

    return prerequisites
  }

  /**
   * 生成改进建议
   */
  generateSuggestions(weaknesses, weaknessAnalysis, options) {
    const suggestions = []

    // 未学习知识点建议
    if (weaknessAnalysis.notStudied.length > 0) {
      suggestions.push({
        type: 'not-studied',
        count: weaknessAnalysis.notStudied.length,
        message: `有 ${weaknessAnalysis.notStudied.length} 个知识点尚未学习`,
        action: '建议安排时间学习这些知识点',
        priority: 'high',
        nodes: weaknessAnalysis.notStudied.slice(0, 5).map(w => w.nodeName)
      })
    }

    // 学习次数不足建议
    if (weaknessAnalysis.insufficientStudy.length > 0) {
      suggestions.push({
        type: 'insufficient-study',
        count: weaknessAnalysis.insufficientStudy.length,
        message: `有 ${weaknessAnalysis.insufficientStudy.length} 个知识点学习次数不足`,
        action: '建议增加学习次数，加强记忆',
        priority: 'medium',
        nodes: weaknessAnalysis.insufficientStudy.slice(0, 5).map(w => w.nodeName)
      })
    }

    // 正确率低建议
    if (weaknessAnalysis.lowCorrectRate.length > 0) {
      suggestions.push({
        type: 'low-correct-rate',
        count: weaknessAnalysis.lowCorrectRate.length,
        message: `有 ${weaknessAnalysis.lowCorrectRate.length} 个知识点正确率较低`,
        action: '建议重新学习并多做练习',
        priority: 'high',
        nodes: weaknessAnalysis.lowCorrectRate.slice(0, 5).map(w => w.nodeName)
      })
    }

    // 遗忘严重建议
    if (weaknessAnalysis.forgotten.length > 0) {
      suggestions.push({
        type: 'forgotten',
        count: weaknessAnalysis.forgotten.length,
        message: `有 ${weaknessAnalysis.forgotten.length} 个知识点遗忘严重`,
        action: '建议及时复习，巩固记忆',
        priority: 'high',
        nodes: weaknessAnalysis.forgotten.slice(0, 5).map(w => w.nodeName)
      })
    }

    // 难度过高建议
    if (weaknessAnalysis.tooDifficult.length > 0) {
      suggestions.push({
        type: 'too-difficult',
        count: weaknessAnalysis.tooDifficult.length,
        message: `有 ${weaknessAnalysis.tooDifficult.length} 个知识点难度较高`,
        action: '建议先学习基础知识，再学习这些知识点',
        priority: 'medium',
        nodes: weaknessAnalysis.tooDifficult.slice(0, 5).map(w => w.nodeName)
      })
    }

    // 前置知识缺失建议
    if (weaknessAnalysis.missingPrerequisites.length > 0) {
      suggestions.push({
        type: 'missing-prerequisites',
        count: weaknessAnalysis.missingPrerequisites.length,
        message: `有 ${weaknessAnalysis.missingPrerequisites.length} 个知识点的前置知识缺失`,
        action: '建议先学习前置知识',
        priority: 'high',
        nodes: weaknessAnalysis.missingPrerequisites.slice(0, 5).map(w => w.nodeName)
      })
    }

    return suggestions
  }

  /**
   * 生成薄弱点报告
   */
  generateReport(weaknesses, weaknessAnalysis, nodeAnalysis) {
    const totalNodes = nodeAnalysis.size
    const weaknessCount = weaknesses.length
    const averageMastery = this.calculateAverageMastery(nodeAnalysis)

    // 薄弱程度分布
    const weaknessDistribution = {
      severe: weaknesses.filter(w => w.effectiveMastery < 0.2).length,
      moderate: weaknesses.filter(w => w.effectiveMastery >= 0.2 && w.effectiveMastery < 0.4).length,
      mild: weaknesses.filter(w => w.effectiveMastery >= 0.4 && w.effectiveMastery < 0.6).length
    }

    // 按章节统计
    const byChapter = {}
    for (const weakness of weaknesses) {
      const chapter = weakness.chapter || '未分类'
      if (!byChapter[chapter]) {
        byChapter[chapter] = []
      }
      byChapter[chapter].push(weakness)
    }

    // 按难度统计
    const byDifficulty = {
      easy: weaknesses.filter(w => w.difficulty <= 3).length,
      medium: weaknesses.filter(w => w.difficulty > 3 && w.difficulty <= 7).length,
      hard: weaknesses.filter(w => w.difficulty > 7).length
    }

    return {
      summary: {
        totalNodes,
        weaknessCount,
        weaknessRate: totalNodes > 0 ? (weaknessCount / totalNodes * 100).toFixed(1) + '%' : '0%',
        averageMastery: averageMastery.toFixed(2)
      },
      distribution: weaknessDistribution,
      byChapter,
      byDifficulty,
      topWeaknesses: weaknesses.slice(0, 10),
      recommendations: this.generateRecommendations(weaknesses, weaknessAnalysis)
    }
  }

  /**
   * 生成推荐
   */
  generateRecommendations(weaknesses, weaknessAnalysis) {
    const recommendations = []

    // 优先复习严重薄弱的知识点
    const severeWeaknesses = weaknesses.filter(w => w.effectiveMastery < 0.2)
    if (severeWeaknesses.length > 0) {
      recommendations.push({
        priority: 1,
        action: '优先复习严重薄弱的知识点',
        nodes: severeWeaknesses.slice(0, 5).map(w => w.nodeName),
        estimatedTime: severeWeaknesses.length * 30 // 每个知识点30分钟
      })
    }

    // 补充前置知识
    if (weaknessAnalysis.missingPrerequisites.length > 0) {
      recommendations.push({
        priority: 2,
        action: '补充缺失的前置知识',
        nodes: weaknessAnalysis.missingPrerequisites.slice(0, 5).map(w => w.nodeName),
        estimatedTime: weaknessAnalysis.missingPrerequisites.length * 20
      })
    }

    // 复习遗忘的知识点
    if (weaknessAnalysis.forgotten.length > 0) {
      recommendations.push({
        priority: 3,
        action: '复习遗忘的知识点',
        nodes: weaknessAnalysis.forgotten.slice(0, 5).map(w => w.nodeName),
        estimatedTime: weaknessAnalysis.forgotten.length * 15
      })
    }

    return recommendations
  }

  /**
   * 计算平均掌握程度
   */
  calculateAverageMastery(nodeAnalysis) {
    if (nodeAnalysis.size === 0) {
      return 0
    }

    let totalMastery = 0
    for (const analysis of nodeAnalysis.values()) {
      totalMastery += analysis.effectiveMastery
    }

    return totalMastery / nodeAnalysis.size
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(params) {
    const { studentId, subject } = params
    const hash = this.simpleHash(`${studentId}_${subject}`)
    return `weakness_${hash}`
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
export function createWeaknessDetector(options = {}) {
  return new WeaknessDetector(options)
}

// 快速检测薄弱点
export function detectWeaknesses(params) {
  const detector = createWeaknessDetector(params.options)
  return detector.detectWeaknesses(params)
}
