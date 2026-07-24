// 智能模型参数优化器
export class ModelOptimizer {
  constructor() {
    // 模型配置预设
    this.modelConfigs = {
      fast: {
        name: 'fast',
        description: '快速响应模式',
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        bestOf: 1,
        stopSequences: ['\n\n\n'],
        estimatedCostPer1kTokens: 0.002,
        estimatedResponseTime: '1-2s'
      },
      balanced: {
        name: 'balanced',
        description: '平衡模式',
        maxTokens: 2000,
        temperature: 0.8,
        topP: 0.95,
        frequencyPenalty: 0.3,
        presencePenalty: 0.2,
        bestOf: 2,
        stopSequences: ['\n\n\n'],
        estimatedCostPer1kTokens: 0.004,
        estimatedResponseTime: '2-4s'
      },
      quality: {
        name: 'quality',
        description: '高质量模式',
        maxTokens: 4000,
        temperature: 0.9,
        topP: 1.0,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1,
        bestOf: 3,
        stopSequences: [],
        estimatedCostPer1kTokens: 0.008,
        estimatedResponseTime: '4-8s'
      },
      ultra: {
        name: 'ultra',
        description: '超高精度模式',
        maxTokens: 8000,
        temperature: 0.95,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        bestOf: 5,
        stopSequences: [],
        estimatedCostPer1kTokens: 0.016,
        estimatedResponseTime: '8-15s'
      }
    }

    // 场景复杂度因子
    this.sceneComplexityFactors = {
      technical: {
        baseComplexity: 1.5,
        description: '技术内容通常较复杂',
        keywordWeight: 1.2,
        patternWeight: 1.3
      },
      classroom: {
        baseComplexity: 1.0,
        description: '课堂内容中等复杂',
        keywordWeight: 1.0,
        patternWeight: 1.0
      },
      science: {
        baseComplexity: 1.2,
        description: '科普内容中等偏上',
        keywordWeight: 1.1,
        patternWeight: 1.1
      },
      meeting: {
        baseComplexity: 0.8,
        description: '会议内容相对简单',
        keywordWeight: 0.9,
        patternWeight: 0.8
      }
    }

    // 内容特征权重
    this.featureWeights = {
      codeBlockCount: 0.3,
      headingCount: 0.1,
      linkCount: 0.15,
      imageCount: 0.2,
      tableCount: 0.25,
      listCount: 0.05,
      complexityIndicator: 0.4,
      technicalTermDensity: 0.35
    }

    // 优化历史记录
    this.optimizationHistory = []
    this.performanceMetrics = {
      totalOptimizations: 0,
      averageTokenSaving: 0,
      averageTimeSaving: 0,
      cacheHitRate: 0
    }

    // 自适应学习参数
    this.learningParams = {
      learningRate: 0.1,
      momentum: 0.9,
      decayFactor: 0.95,
      minSamples: 10
    }
  }

  // 🔧 智能选择模型配置
  selectConfig(content, scene, userPreferences = {}) {
    // 分析内容复杂度
    const complexityAnalysis = this.analyzeContentComplexity(content, scene)
    
    // 获取基础配置选择
    let baseConfig = this.getBaseConfig(complexityAnalysis, content.length)

    // 应用用户偏好
    const optimizedConfig = this.applyUserPreferences(baseConfig, userPreferences, complexityAnalysis)

    // 记录优化历史
    this.recordOptimization(content, scene, optimizedConfig, complexityAnalysis)

    return {
      config: optimizedConfig,
      complexityAnalysis: complexityAnalysis,
      estimatedPerformance: this.estimatePerformance(optimizedConfig, content.length),
      optimizationRationale: this.explainOptimizationChoice(optimizedConfig, complexityAnalysis)
    }
  }

  // 分析内容复杂度
  analyzeContentComplexity(content, scene) {
    const analysis = {
      sceneComplexity: this.sceneComplexityFactors[scene]?.baseComplexity || 1.0,
      contentLength: content.length,
      features: {},
      complexityScore: 0,
      recommendedConfig: 'balanced'
    }

    // 提取内容特征
    analysis.features.codeBlockCount = (content.match(/```/g) || []).length / 2
    analysis.features.headingCount = (content.match(/^#+/gm) || []).length
    analysis.features.linkCount = (content.match(/https?:\/\/[^\s\)]+/g) || []).length
    analysis.features.imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
    analysis.features.tableCount = (content.match(/\|.*\|/g) || []).length
    analysis.features.listCount = (content.match(/^[-*+]\s+/gm) || []).length + 
                             (content.match(/^\d+\.\s+/gm) || []).length

    // 分析技术术语密度
    analysis.features.technicalTermDensity = this.estimateTechnicalTermDensity(content)

    // 计算复杂度分数
    analysis.complexityScore = this.calculateComplexityScore(analysis, scene)

    // 推荐配置
    analysis.recommendedConfig = this.mapComplexityToConfig(analysis.complexityScore)

    return analysis
  }

  // 计算复杂度分数
  calculateComplexityScore(analysis, scene) {
    let score = 0

    // 场景基础复杂度
    score += analysis.sceneComplexity * 10

    // 内容长度影响
    if (analysis.contentLength > 5000) score += 15
    else if (analysis.contentLength > 2000) score += 10
    else if (analysis.contentLength > 500) score += 5

    // 特征加权计算
    score += analysis.features.codeBlockCount * this.featureWeights.codeBlockCount * 10
    score += analysis.features.headingCount * this.featureWeights.headingCount * 2
    score += analysis.features.linkCount * this.featureWeights.linkCount * 3
    score += analysis.features.imageCount * this.featureWeights.imageCount * 5
    score += analysis.features.tableCount * this.featureWeights.tableCount * 8
    score += analysis.features.listCount * this.featureWeights.listCount * 1
    score += analysis.features.technicalTermDensity * this.featureWeights.technicalTermDensity * 20

    return Math.min(Math.round(score), 100) // 限制在0-100之间
  }

  // 估算技术术语密度
  estimateTechnicalTermDensity(content) {
    const technicalPatterns = [
      /\b[A-Z][a-zA-Z]*\b/g, // 驼峰命名
      /\b[a-z]+[A-Z][a-zA-Z]*\b/g, // 驼峰命名
      /\b\w+\.\w+\(\)/g, // 函数调用
      /\b\w+\.\w+\.\w+/g, // 对象属性
      /\b(const|let|var|function|class|import|export)\b/g, // 编程关键字
      /\b(if|else|for|while|switch|case|break|continue)\b/g, // 控制结构
      /\b(true|false|null|undefined|NaN|Infinity)\b/g, // 特殊值
      /\b=>\b/g, // 箭头函数
      /{[^}]*}/g, // 对象字面量
      /\[[^\]]*\]/g, // 数组字面量
    ]

    let technicalMatchCount = 0
    for (const pattern of technicalPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        technicalMatchCount += matches.length
      }
    }

    // 归一化为0-1之间的密度值
    const totalWords = content.split(/\s+/).length || 1
    return Math.min(technicalMatchCount / totalWords, 1)
  }

  // 将复杂度分数映射到配置
  mapComplexityToConfig(complexityScore) {
    if (complexityScore < 20) return 'fast'
    if (complexityScore < 40) return 'balanced'
    if (complexityScore < 70) return 'quality'
    return 'ultra'
  }

  // 获取基础配置
  getBaseConfig(complexityAnalysis, contentLength) {
    const baseConfigName = complexityAnalysis.recommendedConfig
    return { ...this.modelConfigs[baseConfigName] }
  }

  // 应用用户偏好
  applyUserPreferences(baseConfig, preferences, complexityAnalysis) {
    const optimizedConfig = { ...baseConfig }

    // 用户明确指定的优先级
    if (preferences.priority === 'speed') {
      optimizedConfig.maxTokens = Math.min(optimizedConfig.maxTokens, 1500)
      optimizedConfig.temperature = Math.max(optimizedConfig.temperature - 0.1, 0.5)
      optimizedConfig.bestOf = 1
    } else if (preferences.priority === 'quality') {
      optimizedConfig.maxTokens = Math.max(optimizedConfig.maxTokens, 3000)
      optimizedConfig.temperature = Math.min(optimizedConfig.temperature + 0.1, 1.0)
      optimizedConfig.bestOf = Math.max(optimizedConfig.bestOf, 2)
    } else if (preferences.priority === 'cost') {
      optimizedConfig.maxTokens = Math.min(optimizedConfig.maxTokens, 1000)
      optimizedConfig.bestOf = 1
      optimizedConfig.frequencyPenalty = Math.max(optimizedConfig.frequencyPenalty, 0.5)
    }

    // 成本预算限制
    if (preferences.maxCost && preferences.maxCost > 0) {
      const maxTokensForBudget = Math.floor(preferences.maxCost / optimizedConfig.estimatedCostPer1kTokens * 1000)
      optimizedConfig.maxTokens = Math.min(optimizedConfig.maxTokens, maxTokensForBudget)
    }

    // 响应时间要求
    if (preferences.maxResponseTime) {
      const timeToConfigMap = {
        '1-2s': 'fast',
        '2-4s': 'balanced',
        '4-8s': 'quality',
        '8-15s': 'ultra'
      }
      
      const requiredConfig = timeToConfigMap[preferences.maxResponseTime]
      if (requiredConfig && this.isHigherPriority(requiredConfig, optimizedConfig.name)) {
        const timeOptimizedConfig = { ...this.modelConfigs[requiredConfig] }
        Object.assign(optimizedConfig, timeOptimizedConfig)
      }
    }

    // 自定义参数覆盖
    if (preferences.customParams) {
      Object.assign(optimizedConfig, preferences.customParams)
    }

    // 确保参数在合理范围内
    return this.validateAndClampConfig(optimizedConfig)
  }

  // 比较配置优先级
  isHigherPriority(configA, configB) {
    const priorityOrder = ['fast', 'balanced', 'quality', 'ultra']
    const indexA = priorityOrder.indexOf(configA)
    const indexB = priorityOrder.indexOf(configB)
    return indexA < indexB // 索引越小优先级越高
  }

  // 验证并限制配置参数
  validateAndClampConfig(config) {
    const validated = { ...config }

    // 温度限制
    validated.temperature = Math.max(0, Math.min(1, validated.temperature))

    // topP限制
    validated.topP = Math.max(0, Math.min(1, validated.topP))

    // 频率惩罚限制
    validated.frequencyPenalty = Math.max(0, Math.min(2, validated.frequencyPenalty))

    // 存在惩罚限制
    validated.presencePenalty = Math.max(0, Math.min(2, validated.presencePenalty))

    // bestOf限制
    validated.bestOf = Math.max(1, Math.min(10, validated.bestOf))

    // maxTokens限制
    validated.maxTokens = Math.max(100, Math.min(16000, validated.maxTokens))

    return validated
  }

  // 估算性能指标
  estimatePerformance(config, contentLength) {
    const estimatedTokens = Math.ceil(contentLength / 4) // 粗略估算
    const outputTokens = Math.min(config.maxTokens, estimatedTokens * 2)
    const totalTokens = estimatedTokens + outputTokens

    return {
      estimatedInputTokens: estimatedTokens,
      estimatedOutputTokens: outputTokens,
      estimatedTotalTokens: totalTokens,
      estimatedCost: (totalTokens / 1000 * config.estimatedCostPer1kTokens).toFixed(4),
      estimatedResponseTime: config.estimatedResponseTime,
      costPer1kTokens: config.estimatedCostPer1kTokens,
      qualityLevel: config.name,
      tokenEfficiency: (1 / (totalTokens / 1000)).toFixed(2)
    }
  }

  // 解释优化选择原因
  explainOptimizationChoice(config, complexityAnalysis) {
    const reasons = []

    // 基于复杂度的选择
    reasons.push(`基于内容复杂度分数 ${complexityAnalysis.complexityScore}/100`)
    reasons.push(`场景复杂度因子: ${complexityAnalysis.sceneComplexity.toFixed(2)}`)
    reasons.push(`内容长度: ${complexityAnalysis.contentLength} 字符`)

    // 特征影响
    if (complexityAnalysis.features.codeBlockCount > 0) {
      reasons.push(`检测到 ${complexityAnalysis.features.codeBlockCount} 个代码块，增加复杂度权重`)
    }

    if (complexityAnalysis.features.tableCount > 0) {
      reasons.push(`检测到 ${complexityAnalysis.features.tableCount} 个表格，需要更高质量处理`)
    }

    if (complexityAnalysis.features.technicalTermDensity > 0.3) {
      reasons.push(`技术术语密度较高 (${(complexityAnalysis.features.technicalTermDensity * 100).toFixed(1)}%)，推荐使用 ${config.name} 模式`)
    }

    // 配置选择理由
    reasons.push(`推荐配置: ${config.name} (${config.description})`)
    reasons.push(`预计响应时间: ${config.estimatedResponseTime}`)
    reasons.push(`成本估算: $${config.estimatedCostPer1kTokens}/1K tokens`)

    return reasons
  }

  // 记录优化历史
  recordOptimization(content, scene, config, complexityAnalysis) {
    this.optimizationHistory.push({
      timestamp: new Date().toISOString(),
      scene,
      configName: config.name,
      contentLength: content.length,
      complexityScore: complexityAnalysis.complexityScore,
      features: complexityAnalysis.features,
      estimatedTokens: this.estimatePerformance(config, content.length).estimatedTotalTokens
    })

    // 限制历史记录大小
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory.shift()
    }

    // 更新性能指标
    this.updatePerformanceMetrics()
  }

  // 更新性能指标
  updatePerformanceMetrics() {
    this.performanceMetrics.totalOptimizations = this.optimizationHistory.length

    if (this.optimizationHistory.length > 0) {
      // 计算平均token节省
      const totalEstimatedTokens = this.optimizationHistory.reduce(
        (sum, record) => sum + record.estimatedTokens, 0
      )
      this.performanceMetrics.averageEstimatedTokens = Math.round(
        totalEstimatedTokens / this.optimizationHistory.length
      )

      // 计算配置分布
      const configDistribution = {}
      this.optimizationHistory.forEach(record => {
        configDistribution[record.configName] = (configDistribution[record.configName] || 0) + 1
      })
      this.performanceMetrics.configDistribution = configDistribution
    }
  }

  // 获取性能统计
  getPerformanceStats() {
    return {
      totalOptimizations: this.performanceMetrics.totalOptimizations,
      averageEstimatedTokens: this.performanceMetrics.averageEstimatedTokens || 0,
      configDistribution: this.performanceMetrics.configDistribution || {},
      recentOptimizations: this.optimizationHistory.slice(-10),
      availableConfigs: Object.keys(this.modelConfigs),
      learningParams: this.learningParams
    }
  }

  // 自适应学习 - 根据历史优化结果调整参数
  adaptiveLearning() {
    if (this.optimizationHistory.length < this.learningParams.minSamples) {
      return { message: '样本数量不足，无法进行自适应学习', canLearn: false }
    }

    // 分析最近的优化趋势
    const recentHistory = this.optimizationHistory.slice(-20)
    const avgComplexity = recentHistory.reduce((sum, r) => sum + r.complexityScore, 0) / recentHistory.length

    // 调整复杂度阈值
    const adjustedThresholds = this.adjustComplexityThresholds(avgComplexity)

    // 更新学习参数
    this.learningParams.learningRate *= this.learningParams.decayFactor

    return {
      message: '自适应学习完成',
      canLearn: true,
      adjustedThresholds,
      newLearningParams: this.learningParams,
      avgComplexity: avgComplexity.toFixed(2)
    }
  }

  // 调整复杂度阈值
  adjustComplexityThresholds(avgComplexity) {
    // 根据历史平均复杂度调整阈值
    const adjustmentFactor = avgComplexity / 50 // 假设50是中等复杂度

    return {
      fast: Math.round(20 * adjustmentFactor),
      balanced: Math.round(40 * adjustmentFactor),
      quality: Math.round(70 * adjustmentFactor),
      ultra: Math.round(85 * adjustmentFactor)
    }
  }

  // 批量优化
  optimizeBatch(contentsAndScenes, userPreferences = {}) {
    return contentsAndScenes.map(({ content, scene }) => 
      this.selectConfig(content, scene, userPreferences)
    )
  }

  // 重置学习参数
  resetLearning() {
    this.optimizationHistory = []
    this.performanceMetrics = {
      totalOptimizations: 0,
      averageTokenSaving: 0,
      averageTimeSaving: 0,
      cacheHitRate: 0
    }
    this.learningParams = {
      learningRate: 0.1,
      momentum: 0.9,
      decayFactor: 0.95,
      minSamples: 10
    }
  }

  // 导出优化报告
  generateOptimizationReport() {
    return {
      summary: this.getPerformanceStats(),
      learningStatus: this.adaptiveLearning(),
      recommendations: this.generateRecommendations(),
      costAnalysis: this.analyzeCostTrends(),
      qualityVsCostTradeoffs: this.analyzeQualityCostTradeoffs()
    }
  }

  // 生成优化建议
  generateRecommendations() {
    const recommendations = []
    const stats = this.getPerformanceStats()

    // 基于配置分布的建议
    if (stats.configDistribution) {
      const mostUsedConfig = Object.entries(stats.configDistribution)
        .sort((a, b) => b[1] - a[1])[0]

      if (mostUsedConfig) {
        recommendations.push({
          type: 'usage-pattern',
          message: `最常用配置是 ${mostUsedConfig[0]}，使用频率 ${((mostUsedConfig[1] / stats.totalOptimizations) * 100).toFixed(1)}%`,
          suggestion: '考虑针对此场景优化默认配置'
        })
      }
    }

    // 基于复杂度趋势的建议
    if (stats.recentOptimizations && stats.recentOptimizations.length > 5) {
      const recentAvgComplexity = stats.recentOptimizations
        .reduce((sum, r) => sum + r.complexityScore, 0) / stats.recentOptimizations.length

      if (recentAvgComplexity > 60) {
        recommendations.push({
          type: 'complexity-trend',
          message: '近期内容复杂度偏高',
          suggestion: '建议考虑升级到更高质量的模型配置'
        })
      } else if (recentAvgComplexity < 30) {
        recommendations.push({
          type: 'complexity-trend',
          message: '近期内容复杂度偏低',
          suggestion: '可以优化成本控制，使用更快速的配置'
        })
      }
    }

    return recommendations
  }

  // 分析成本趋势
  analyzeCostTrends() {
    if (this.optimizationHistory.length < 5) {
      return { message: '数据不足，无法分析成本趋势' }
    }

    const costs = this.optimizationHistory.map(record => {
      const config = this.modelConfigs[record.configName]
      return record.estimatedTokens / 1000 * config.estimatedCostPer1kTokens
    })

    return {
      totalEstimatedCost: costs.reduce((sum, cost) => sum + cost, 0).toFixed(4),
      averageCostPerOptimization: (costs.reduce((sum, cost) => sum + cost, 0) / costs.length).toFixed(4),
      costTrend: this.calculateTrend(costs),
      costComparison: this.compareCostsByConfig()
    }
  }

  // 计算趋势
  calculateTrend(values) {
    if (values.length < 2) return 'insufficient-data'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }

  // 按配置比较成本
  compareCostsByConfig() {
    const configCosts = {}

    this.optimizationHistory.forEach(record => {
      const config = this.modelConfigs[record.configName]
      if (!configCosts[record.configName]) {
        configCosts[record.configName] = {
          count: 0,
          totalCost: 0,
          avgCost: 0
        }
      }

      const cost = record.estimatedTokens / 1000 * config.estimatedCostPer1kTokens
      configCosts[record.configName].count++
      configCosts[record.configName].totalCost += cost
      configCosts[record.configName].avgCost = 
        (configCosts[record.configName].totalCost / configCosts[record.configName].count).toFixed(4)
    })

    return configCosts
  }

  // 分析质量-成本权衡
  analyzeQualityCostTradeoffs() {
    const tradeoffs = []

    for (const [configName, config] of Object.entries(this.modelConfigs)) {
      tradeoffs.push({
        config: configName,
        quality: this.getQualityScore(configName),
        cost: config.estimatedCostPer1kTokens,
        speed: this.getSpeedScore(configName),
        efficiency: (this.getQualityScore(configName) / config.estimatedCostPer1kTokens).toFixed(2),
        recommendation: this.getTradeoffRecommendation(configName)
      })
    }

    return tradeoffs.sort((a, b) => b.efficiency - a.efficiency)
  }

  // 获取质量分数
  getQualityScore(configName) {
    const qualityScores = {
      fast: 60,
      balanced: 75,
      quality: 90,
      ultra: 95
    }
    return qualityScores[configName] || 70
  }

  // 获取速度分数
  getSpeedScore(configName) {
    const speedScores = {
      fast: 95,
      balanced: 80,
      quality: 60,
      ultra: 40
    }
    return speedScores[configName] || 70
  }

  // 获取权衡建议
  getTradeoffRecommendation(configName) {
    const recommendations = {
      fast: '适用于简单任务和快速响应需求',
      balanced: '适用于大多数场景的最佳平衡',
      quality: '适用于复杂任务和高质量要求',
      ultra: '适用于最高精度要求，成本较高'
    }
    return recommendations[configName] || '通用配置'
  }
}