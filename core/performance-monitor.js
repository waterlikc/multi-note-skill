// 性能测试和报告生成模块
export class PerformanceMonitor {
  constructor() {
    // 性能指标收集
    this.metrics = {
      tokenUsage: {
        total: 0,
        saved: 0,
        byOperation: {}
      },
      timing: {
        operations: {},
        totalDuration: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        byModule: {}
      },
      memory: {
        peakUsage: 0,
        currentUsage: 0,
        byModule: {}
      },
      quality: {
        accuracy: 0,
        userSatisfaction: 0,
        errorRate: 0
      }
    }

    // 操作历史
    this.operationHistory = []
    this.maxHistorySize = 100

    // 基准测试数据
    this.baselineMetrics = {
      sceneDetection: {
        avgTimeMs: 150,
        avgTokens: 520,
        avgCacheHitRate: 0
      },
      contentAnalysis: {
        avgTimeMs: 200,
        avgTokens: 800,
        avgCacheHitRate: 0
      },
      markdownConversion: {
        avgTimeMs: 120,
        avgTokens: 350,
        avgCacheHitRate: 0
      },
      fullPipeline: {
        avgTimeMs: 470,
        avgTokens: 1670,
        avgCacheHitRate: 0
      }
    }

    // 性能阈值
    this.performanceThresholds = {
      maxResponseTime: 2000, // 2秒
      maxTokenUsage: 3000, // 3000 tokens
      minCacheHitRate: 0.8, // 80%
      maxMemoryUsage: 50 * 1024 * 1024 // 50MB
    }
  }

  // 记录操作性能
  recordOperation(operationName, metrics) {
    const timestamp = new Date().toISOString()
    const operationRecord = {
      timestamp,
      operation: operationName,
      ...metrics
    }

    this.operationHistory.push(operationRecord)

    // 限制历史大小
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift()
    }

    // 更新聚合指标
    this.updateAggregatedMetrics(operationName, metrics)

    return operationRecord
  }

  // 更新聚合指标
  updateAggregatedMetrics(operationName, metrics) {
    // Token使用统计
    if (metrics.tokensUsed) {
      this.metrics.tokenUsage.total += metrics.tokensUsed
      if (!this.metrics.tokenUsage.byOperation[operationName]) {
        this.metrics.tokenUsage.byOperation[operationName] = {
          total: 0,
          count: 0,
          average: 0
        }
      }
      this.metrics.tokenUsage.byOperation[operationName].total += metrics.tokensUsed
      this.metrics.tokenUsage.byOperation[operationName].count++
      this.metrics.tokenUsage.byOperation[operationName].average = 
        this.metrics.tokenUsage.byOperation[operationName].total / 
        this.metrics.tokenUsage.byOperation[operationName].count
    }

    if (metrics.tokensSaved) {
      this.metrics.tokenUsage.saved += metrics.tokensSaved
    }

    // 时间统计
    if (metrics.duration) {
      this.metrics.timing.totalDuration += metrics.duration
      if (!this.metrics.timing.operations[operationName]) {
        this.metrics.timing.operations[operationName] = {
          total: 0,
          count: 0,
          average: 0,
          min: Infinity,
          max: 0
        }
      }

      const opMetrics = this.metrics.timing.operations[operationName]
      opMetrics.total += metrics.duration
      opMetrics.count++
      opMetrics.average = opMetrics.total / opMetrics.count
      opMetrics.min = Math.min(opMetrics.min, metrics.duration)
      opMetrics.max = Math.max(opMetrics.max, metrics.duration)
    }

    // 缓存统计
    if (metrics.cacheHit !== undefined) {
      if (metrics.cacheHit) {
        this.metrics.cache.hits++
      } else {
        this.metrics.cache.misses++
      }

      if (!this.metrics.cache.byModule[operationName]) {
        this.metrics.cache.byModule[operationName] = { hits: 0, misses: 0 }
      }

      if (metrics.cacheHit) {
        this.metrics.cache.byModule[operationName].hits++
      } else {
        this.metrics.cache.byModule[operationName].misses++
      }
    }

    // 内存统计
    if (metrics.memoryUsage) {
      this.metrics.memory.currentUsage = metrics.memoryUsage
      this.metrics.memory.peakUsage = Math.max(
        this.metrics.memory.peakUsage,
        metrics.memoryUsage
      )

      if (!this.metrics.memory.byModule[operationName]) {
        this.metrics.memory.byModule[operationName] = {
          total: 0,
          count: 0,
          average: 0,
          peak: 0
        }
      }

      const memMetrics = this.metrics.memory.byModule[operationName]
      memMetrics.total += metrics.memoryUsage
      memMetrics.count++
      memMetrics.average = memMetrics.total / memMetrics.count
      memMetrics.peak = Math.max(memMetrics.peak, metrics.memoryUsage)
    }
  }

  // 测量场景检测性能
  async measureSceneDetection(detector, content, iterations = 10) {
    const results = []
    const tokensUsed = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      
      try {
        const scene = detector.detect(content)
        const duration = performance.now() - startTime

        // 估算token使用
        const estimatedTokens = this.estimateTokenUsage(content, 'scene-detection')
        tokensUsed.push(estimatedTokens)

        results.push({
          success: true,
          duration,
          scene,
          cacheHit: this.checkCacheHit(detector)
        })
      } catch (error) {
        results.push({
          success: false,
          duration: performance.now() - startTime,
          error: error.message
        })
      }
    }

    return this.analyzeResults('scene-detection', results, tokensUsed)
  }

  // 测量内容分析性能
  async measureContentAnalysis(analyzer, content, iterations = 10) {
    const results = []
    const tokensUsed = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      try {
        const analysis = analyzer.analyzeContent(content)
        const duration = performance.now() - startTime

        const estimatedTokens = this.estimateTokenUsage(content, 'content-analysis')
        tokensUsed.push(estimatedTokens)

        results.push({
          success: true,
          duration,
          analysis,
          cacheHit: this.checkCacheHit(analyzer)
        })
      } catch (error) {
        results.push({
          success: false,
          duration: performance.now() - startTime,
          error: error.message
        })
      }
    }

    return this.analyzeResults('content-analysis', results, tokensUsed)
  }

  // 测量Markdown转换性能
  async measureMarkdownConversion(converter, html, iterations = 10) {
    const results = []
    const tokensUsed = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      try {
        const markdown = converter.htmlToMarkdown(html)
        const duration = performance.now() - startTime

        const estimatedTokens = this.estimateTokenUsage(markdown, 'markdown-conversion')
        tokensUsed.push(estimatedTokens)

        // 计算token节省
        const originalTokens = this.estimateTokenUsage(html, 'markdown-conversion')
        const savedTokens = originalTokens - estimatedTokens

        results.push({
          success: true,
          duration,
          originalLength: html.length,
          convertedLength: markdown.length,
          cacheHit: this.checkCacheHit(converter),
          savedTokens: Math.max(0, savedTokens)
        })
      } catch (error) {
        results.push({
          success: false,
          duration: performance.now() - startTime,
          error: error.message
        })
      }
    }

    return this.analyzeResults('markdown-conversion', results, tokensUsed)
  }

  // 测量完整管道性能
  async measureFullPipeline(modules, content, iterations = 5) {
    const { detector, analyzer, converter } = modules
    const results = []
    const totalTokensUsed = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      const pipelineMetrics = {}

      try {
        // 场景检测
        const detectStart = performance.now()
        const scene = detector.detect(content)
        pipelineMetrics.sceneDetection = performance.now() - detectStart

        // 内容分析
        const analyzeStart = performance.now()
        const analysis = analyzer.analyzeContent(content)
        pipelineMetrics.contentAnalysis = performance.now() - analyzeStart

        // Markdown转换
        const convertStart = performance.now()
        const markdown = converter.htmlToMarkdown(content)
        pipelineMetrics.markdownConversion = performance.now() - convertStart

        const totalDuration = performance.now() - startTime

        // 估算总token使用
        const totalEstimatedTokens = 
          this.estimateTokenUsage(content, 'scene-detection') +
          this.estimateTokenUsage(content, 'content-analysis') +
          this.estimateTokenUsage(markdown, 'markdown-conversion')

        totalTokensUsed.push(totalEstimatedTokens)

        results.push({
          success: true,
          duration: totalDuration,
          pipelineMetrics,
          result: { scene, analysis, markdown }
        })

        // 记录缓存统计
        this.recordOperation('full-pipeline', {
          duration: totalDuration,
          tokensUsed: totalEstimatedTokens,
          cacheHit: this.checkCacheHit(detector) || this.checkCacheHit(analyzer) || this.checkCacheHit(converter)
        })

      } catch (error) {
        results.push({
          success: false,
          duration: performance.now() - startTime,
          error: error.message
        })
      }
    }

    return this.analyzeResults('full-pipeline', results, totalTokensUsed)
  }

  // 分析测试结果
  analyzeResults(operation, results, tokensUsed) {
    const successfulResults = results.filter(r => r.success)
    const failedResults = results.filter(r => !r.success)

    const analysis = {
      operation,
      totalIterations: results.length,
      successCount: successfulResults.length,
      failureCount: failedResults.length,
      successRate: (successfulResults.length / results.length * 100).toFixed(2) + '%',
      duration: {},
      tokens: {},
      cache: {}
    }

    if (successfulResults.length > 0) {
      // 时间分析
      const durations = successfulResults.map(r => r.duration)
      analysis.duration = {
        average: (durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2) + 'ms',
        min: Math.min(...durations).toFixed(2) + 'ms',
        max: Math.max(...durations).toFixed(2) + 'ms',
        median: this.calculateMedian(durations).toFixed(2) + 'ms',
        stdDev: this.calculateStdDev(durations).toFixed(2) + 'ms'
      }

      // Token分析
      if (tokensUsed.length > 0) {
        analysis.tokens = {
          average: (tokensUsed.reduce((sum, t) => sum + t, 0) / tokensUsed.length).toFixed(0),
          min: Math.min(...tokensUsed).toFixed(0),
          max: Math.max(...tokensUsed).toFixed(0),
          total: tokensUsed.reduce((sum, t) => sum + t, 0).toFixed(0)
        }

        // Token节省分析
        if (successfulResults[0].savedTokens !== undefined) {
          const savedTokens = successfulResults.map(r => r.savedTokens || 0)
          analysis.tokens.saved = {
            average: (savedTokens.reduce((sum, t) => sum + t, 0) / savedTokens.length).toFixed(0),
            total: savedTokens.reduce((sum, t) => sum + t, 0).toFixed(0),
            savingRate: ((savedTokens.reduce((sum, t) => sum + t, 0) / tokensUsed.reduce((sum, t) => sum + t, 0)) * 100).toFixed(1) + '%'
          }
        }
      }

      // 缓存分析
      const cacheHits = successfulResults.filter(r => r.cacheHit).length
      analysis.cache = {
        hitRate: (cacheHits / successfulResults.length * 100).toFixed(1) + '%',
        hits: cacheHits,
        misses: successfulResults.length - cacheHits
      }
    }

    // 错误分析
    if (failedResults.length > 0) {
      analysis.errors = failedResults.map(r => ({
        message: r.error,
        count: failedResults.filter(f => f.error === r.error).length
      }))
    }

    return analysis
  }

  // 估算Token使用
  estimateTokenUsage(content, operation) {
    // 基于操作类型和内容长度的简化估算
    const baseTokens = Math.ceil(content.length / 4)
    
    const operationMultipliers = {
      'scene-detection': 0.3, // 场景检测相对较少token
      'content-analysis': 0.5, // 内容分析中等token
      'markdown-conversion': 0.8, // 转换可能使用更多token
      'full-pipeline': 1.0 // 完整管道
    }

    return Math.ceil(baseTokens * (operationMultipliers[operation] || 1.0))
  }

  // 检查缓存命中
  checkCacheHit(module) {
    if (module.getCacheStats) {
      const stats = module.getCacheStats()
      return stats.hitRate !== '0.00%'
    }
    return false
  }

  // 计算中位数
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  // 计算标准差
  calculateStdDev(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squareDiffs = values.map(val => Math.pow(val - mean, 2))
    return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length)
  }

  // 生成性能报告
  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      detailedMetrics: this.metrics,
      operationAnalysis: this.analyzeOperationHistory(),
      baselineComparison: this.compareWithBaseline(),
      recommendations: this.generateRecommendations(),
      cacheEfficiency: this.analyzeCacheEfficiency(),
      costAnalysis: this.analyzeCostAnalysis()
    }

    return report
  }

  // 生成摘要
  generateSummary() {
    const totalOperations = this.operationHistory.length
    const successfulOperations = this.operationHistory.filter(op => op.success).length
    
    return {
      totalOperations,
      successRate: (successfulOperations / totalOperations * 100).toFixed(2) + '%',
      averageResponseTime: this.metrics.timing.totalDuration > 0 
        ? (this.metrics.timing.totalDuration / totalOperations).toFixed(2) + 'ms'
        : 'N/A',
      totalTokensUsed: this.metrics.tokenUsage.total,
      totalTokensSaved: this.metrics.tokenUsage.saved,
      tokenSavingRate: this.metrics.tokenUsage.total > 0
        ? (this.metrics.tokenUsage.saved / this.metrics.tokenUsage.total * 100).toFixed(1) + '%'
        : '0%',
      overallCacheHitRate: this.calculateOverallCacheHitRate(),
      memoryUsage: `${(this.metrics.memory.currentUsage / 1024 / 1024).toFixed(2)}MB`,
      status: this.evaluateOverallStatus()
    }
  }

  // 分析操作历史
  analyzeOperationHistory() {
    const operationAnalysis = {}

    for (const [operation, opMetrics] of Object.entries(this.metrics.timing.operations)) {
      const tokenMetrics = this.metrics.tokenUsage.byOperation[operation]
      const cacheMetrics = this.metrics.cache.byModule[operation]

      operationAnalysis[operation] = {
        count: opMetrics.count,
        avgDuration: opMetrics.average.toFixed(2) + 'ms',
        minDuration: opMetrics.min.toFixed(2) + 'ms',
        maxDuration: opMetrics.max.toFixed(2) + 'ms',
        avgTokens: tokenMetrics ? tokenMetrics.average.toFixed(0) : 'N/A',
        cacheHitRate: cacheMetrics ? ((cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)) * 100).toFixed(1) + '%' : 'N/A',
        efficiency: this.calculateOperationEfficiency(operation)
      }
    }

    return operationAnalysis
  }

  // 计算操作效率
  calculateOperationEfficiency(operation) {
    const timingMetrics = this.metrics.timing.operations[operation]
    const tokenMetrics = this.metrics.tokenUsage.byOperation[operation]
    const cacheMetrics = this.metrics.cache.byModule[operation]

    if (!timingMetrics || !tokenMetrics) return 'N/A'

    // 效率分数：时间越短、token越少、缓存命中率越高，分数越高
    const timeScore = Math.max(0, 100 - (timingMetrics.average / 10)) // 100ms为基准
    const tokenScore = Math.max(0, 100 - (tokenMetrics.average / 10)) // 100tokens为基准
    const cacheScore = cacheMetrics ? (cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)) * 100 : 50

    return ((timeScore + tokenScore + cacheScore) / 3).toFixed(1)
  }

  // 与基准比较
  compareWithBaseline() {
    const comparison = {}

    for (const [operation, currentMetrics] of Object.entries(this.metrics.timing.operations)) {
      const baseline = this.baselineMetrics[operation]
      if (!baseline) continue

      const improvement = {
        timeImprovement: ((baseline.avgTimeMs - currentMetrics.average) / baseline.avgTimeMs * 100).toFixed(1) + '%',
        tokenImprovement: 'N/A',
        cacheImprovement: 'N/A'
      }

      // Token改进
      const tokenMetrics = this.metrics.tokenUsage.byOperation[operation]
      if (tokenMetrics && baseline.avgTokens) {
        improvement.tokenImprovement = ((baseline.avgTokens - tokenMetrics.average) / baseline.avgTokens * 100).toFixed(1) + '%'
      }

      // 缓存改进
      const cacheMetrics = this.metrics.cache.byModule[operation]
      if (cacheMetrics) {
        const currentHitRate = cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)
        improvement.cacheImprovement = ((currentHitRate - baseline.avgCacheHitRate) / (baseline.avgCacheHitRate || 0.01) * 100).toFixed(1) + '%'
      }

      comparison[operation] = {
        current: {
          avgTime: currentMetrics.average.toFixed(2) + 'ms',
          avgTokens: tokenMetrics ? tokenMetrics.average.toFixed(0) : 'N/A',
          cacheHitRate: (cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses) * 100).toFixed(1) + '%'
        },
        baseline: {
          avgTime: baseline.avgTimeMs + 'ms',
          avgTokens: baseline.avgTokens,
          cacheHitRate: (baseline.avgCacheHitRate * 100).toFixed(1) + '%'
        },
        improvement
      }
    }

    return comparison
  }

  // 生成优化建议
  generateRecommendations() {
    const recommendations = []
    const summary = this.generateSummary()

    // 性能建议
    if (parseFloat(summary.averageResponseTime) > this.performanceThresholds.maxResponseTime) {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        message: `平均响应时间 ${summary.averageResponseTime} 超过阈值 ${this.performanceThresholds.maxResponseTime}ms`,
        suggestion: '建议启用更多缓存机制，或优化算法复杂度'
      })
    }

    // Token使用建议
    if (this.metrics.tokenUsage.total > this.performanceThresholds.maxTokenUsage * 10) {
      recommendations.push({
        type: 'token-usage',
        severity: 'medium',
        message: `Token使用量 ${this.metrics.tokenUsage.total} 较高`,
        suggestion: '建议进一步优化内容处理流程，减少重复计算'
      })
    }

    // 缓存效率建议
    if (parseFloat(summary.overallCacheHitRate) < this.performanceThresholds.minCacheHitRate * 100) {
      recommendations.push({
        type: 'cache-efficiency',
        severity: 'medium',
        message: `缓存命中率 ${summary.overallCacheHitRate} 低于目标 ${this.performanceThresholds.minCacheHitRate * 100}%`,
        suggestion: '建议增加缓存大小，或优化缓存键生成策略'
      })
    }

    // 内存使用建议
    if (this.metrics.memory.currentUsage > this.performanceThresholds.maxMemoryUsage) {
      recommendations.push({
        type: 'memory-usage',
        severity: 'high',
        message: `内存使用 ${summary.memoryUsage} 接近阈值`,
        suggestion: '建议实施内存优化策略，清理不必要的缓存'
      })
    }

    return recommendations
  }

  // 分析缓存效率
  analyzeCacheEfficiency() {
    const cacheStats = {
      overall: {
        hits: this.metrics.cache.hits,
        misses: this.metrics.cache.misses,
        hitRate: this.calculateOverallCacheHitRate(),
        totalRequests: this.metrics.cache.hits + this.metrics.cache.misses
      },
      byModule: {}
    }

    for (const [module, stats] of Object.entries(this.metrics.cache.byModule)) {
      cacheStats.byModule[module] = {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) + '%',
        efficiency: this.calculateModuleCacheEfficiency(module, stats)
      }
    }

    return cacheStats
  }

  // 计算模块缓存效率
  calculateModuleCacheEfficiency(module, stats) {
    const timingMetrics = this.metrics.timing.operations[module]
    if (!timingMetrics) return 'N/A'

    const totalRequests = stats.hits + stats.misses
    const avgTimeWithCache = timingMetrics.average * 0.1 // 假设缓存命中时时间减少90%
    const avgTimeWithoutCache = timingMetrics.average

    const theoreticalAvgTime = (stats.hits * avgTimeWithCache + stats.misses * avgTimeWithoutCache) / totalRequests
    const timeSaving = ((avgTimeWithoutCache - theoreticalAvgTime) / avgTimeWithoutCache) * 100

    return timeSaving.toFixed(1) + '%'
  }

  // 分析成本
  analyzeCostAnalysis() {
    const baseCostPer1kTokens = 0.004 // $0.004 per 1K tokens
    const totalCost = (this.metrics.tokenUsage.total / 1000) * baseCostPer1kTokens
    const savedCost = (this.metrics.tokenUsage.saved / 1000) * baseCostPer1kTokens

    return {
      totalCost: totalCost.toFixed(4) + ' USD',
      savedCost: savedCost.toFixed(4) + ' USD',
      savingRate: ((savedCost / totalCost) * 100).toFixed(1) + '%',
      costByOperation: this.analyzeCostByOperation(baseCostPer1kTokens)
    }
  }

  // 按操作分析成本
  analyzeCostByOperation(baseCost) {
    const costByOp = {}

    for (const [operation, tokenMetrics] of Object.entries(this.metrics.tokenUsage.byOperation)) {
      const operationCost = (tokenMetrics.total / 1000) * baseCost
      costByOp[operation] = {
        totalCost: operationCost.toFixed(4) + ' USD',
        avgCost: (operationCost / tokenMetrics.count).toFixed(6) + ' USD',
        count: tokenMetrics.count,
        percentage: ((tokenMetrics.total / this.metrics.tokenUsage.total) * 100).toFixed(1) + '%'
      }
    }

    return costByOp
  }

  // 计算整体缓存命中率
  calculateOverallCacheHitRate() {
    const totalRequests = this.metrics.cache.hits + this.metrics.cache.misses
    return totalRequests > 0 ? ((this.metrics.cache.hits / totalRequests) * 100).toFixed(1) + '%' : '0%'
  }

  // 评估整体状态
  evaluateOverallStatus() {
    const summary = this.generateSummary()
    const statusChecks = []

    // 检查成功率
    if (parseFloat(summary.successRate) >= 95) {
      statusChecks.push('✅ 高成功率')
    } else if (parseFloat(summary.successRate) >= 80) {
      statusChecks.push('⚠️ 中等成功率')
    } else {
      statusChecks.push('❌ 低成功率')
    }

    // 检查响应时间
    if (parseFloat(summary.averageResponseTime) < 500) {
      statusChecks.push('✅ 优秀响应时间')
    } else if (parseFloat(summary.averageResponseTime) < 1500) {
      statusChecks.push('⚠️ 中等响应时间')
    } else {
      statusChecks.push('❌ 慢响应时间')
    }

    // 检查缓存效率
    if (parseFloat(summary.overallCacheHitRate) >= 80) {
      statusChecks.push('✅ 优秀缓存效率')
    } else if (parseFloat(summary.overallCacheHitRate) >= 50) {
      statusChecks.push('⚠️ 中等缓存效率')
    } else {
      statusChecks.push('❌ 低缓存效率')
    }

    return statusChecks.join(' | ')
  }

  // 导出性能数据为JSON
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      operationHistory: this.operationHistory,
      performanceThresholds: this.performanceThresholds
    }
  }

  // 重置性能监控
  reset() {
    this.metrics = {
      tokenUsage: { total: 0, saved: 0, byOperation: {} },
      timing: { operations: {}, totalDuration: 0 },
      cache: { hits: 0, misses: 0, byModule: {} },
      memory: { peakUsage: 0, currentUsage: 0, byModule: {} },
      quality: { accuracy: 0, userSatisfaction: 0, errorRate: 0 }
    }
    this.operationHistory = []
  }

  // 创建性能基准测试套件
  createBenchmarkSuite(testContents) {
    return {
      testContents,
      benchmarks: {
        sceneDetection: async (detector) => {
          const results = []
          for (const content of testContents) {
            const result = await this.measureSceneDetection(detector, content, 5)
            results.push(result)
          }
          return results
        },
        contentAnalysis: async (analyzer) => {
          const results = []
          for (const content of testContents) {
            const result = await this.measureContentAnalysis(analyzer, content, 5)
            results.push(result)
          }
          return results
        },
        markdownConversion: async (converter) => {
          const results = []
          for (const content of testContents) {
            const result = await this.measureMarkdownConversion(converter, content, 5)
            results.push(result)
          }
          return results
        },
        fullPipeline: async (modules) => {
          const results = []
          for (const content of testContents) {
            const result = await this.measureFullPipeline(modules, content, 3)
            results.push(result)
          }
          return results
        }
      }
    }
  }
}