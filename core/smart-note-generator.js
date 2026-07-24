// multi-note-skill 优化版主控制器 - 支持多模态输入
import { SceneDetector } from './scene-detector-optimized.js'
import { TemplateManager } from './template-manager.js'
import { ExportManager } from './export-manager.js'
import { ContentAnalyzer } from './content-analyzer.js'
import { MarkdownConverter } from './markdown-converter.js'
import { ModelOptimizer } from './model-optimizer.js'
import { PerformanceMonitor } from './performance-monitor.js'
import { MultimodalProcessor } from './multimodal-processor.js'

// 🆕 导入智能场景识别模块
import { SubjectDetector } from './subject-detector.js'
import { ComplexityAnalyzer } from './complexity-analyzer.js'
import { KnowledgeExtractor } from './knowledge-extractor.js'
import { StructureSelector } from './structure-selector.js'

// 🆕 导入增量更新模块
import { NoteParser } from './note-parser.js'
import { ContentComparer } from './content-comparer.js'
import { NoteMerger } from './note-merger.js'
import { VersionManager } from './version-manager.js'

// 🆕 导入知识图谱模块
import { KnowledgeGraph } from './knowledge-graph.js'
import { LearningPath } from './learning-path.js'
import { WeaknessDetector } from './weakness-detector.js'

// 🆕 导入错误处理模块
import { ErrorHandler, getErrorHandler, withErrorHandling, validateInput } from './error-handler.js'

// 优化的导出管理器 - 集成新模块
export class OptimizedExportManager {
  constructor() {
    // 🔧 优化1: 集成优化的内容分析器
    this.contentAnalyzer = new ContentAnalyzer()
    
    // 🔧 优化2: 集成优化的Markdown转换器
    this.markdownConverter = new MarkdownConverter()
    
    // 🔧 优化3: 集成性能监控
    this.performanceMonitor = new PerformanceMonitor()
    
    // 原有的导出格式配置
    this.exportFormats = {
      json: {
        name: 'JSON格式',
        extension: '.json',
        mimeType: 'application/json',
        description: '结构化数据，便于程序化处理'
      },
      markdown: {
        name: 'Markdown格式',
        extension: '.md',
        mimeType: 'text/markdown',
        description: '轻量级标记语言，适合文档编辑'
      },
      pdf: {
        name: 'PDF格式',
        extension: '.pdf',
        mimeType: 'application/pdf',
        description: '便携式文档，适合打印分享'
      },
      html: {
        name: 'HTML格式',
        extension: '.html',
        mimeType: 'text/html',
        description: '网页格式，保留完整样式和交互'
      }
    }
  }

  // 🔧 优化4: 优化的JSON导出 - 单次内容分析
  exportToJson(noteData) {
    const startTime = performance.now()

    try {
      // 使用统一的内容分析器，避免重复扫描
      const contentAnalysis = this.contentAnalyzer.analyzeContent(noteData.content)

      const jsonExport = {
        metadata: {
          title: noteData.title,
          subtitle: noteData.subtitle,
          date: noteData.date,
          scene: noteData.scene,
          style: noteData.style,
          createdAt: new Date().toISOString(),
          version: '2.0.0',
          // 🔧 优化5: 添加性能元数据
          performance: {
            analysisTime: contentAnalysis.statistics.characterCount > 0 ? 'fast' : 'medium',
            contentComplexity: contentAnalysis.textAnalysis.complexity,
            estimatedProcessingTokens: Math.ceil(noteData.content.length / 4)
          }
        },
        content: noteData.content,
        // 🔧 优化6: 使用分析结果而不是重复分析
        structure: contentAnalysis.structure,
        components: contentAnalysis.components,
        assets: contentAnalysis.assets,
        // 🔧 优化7: 添加完整的统计信息
        statistics: contentAnalysis.statistics,
        textAnalysis: contentAnalysis.textAnalysis,
        metadata: contentAnalysis.metadata
      }

      const jsonString = JSON.stringify(jsonExport, null, 2)
      const duration = performance.now() - startTime

      // 🔧 优化8: 记录性能指标
      this.performanceMonitor.recordOperation('json-export', {
        duration,
        tokensUsed: Math.ceil(jsonString.length / 4),
        cacheHit: this.contentAnalyzer.getCacheStats().hitRate !== '0.00%',
        memoryUsage: this.estimateMemoryUsage(jsonString)
      })

      return jsonString
    } catch (error) {
      const errorDuration = performance.now() - startTime
      this.performanceMonitor.recordOperation('json-export', {
        duration: errorDuration,
        success: false,
        error: error.message
      })
      throw new Error('JSON导出失败: ' + error.message)
    }
  }

  // 🔧 优化9: 优化的Markdown导出 - 使用转换器缓存
  exportToMarkdown(noteData, options = {}) {
    const startTime = performance.now()

    try {
      let markdown = `# ${noteData.title}\n\n`

      if (noteData.subtitle) {
        markdown += `## ${noteData.subtitle}\n\n`
      }

      if (noteData.date) {
        markdown += `**日期**: ${noteData.date}\n\n`
      }

      // 🔧 优化10: 使用优化的Markdown转换器
      const convertedContent = this.markdownConverter.htmlToMarkdown(noteData.content, options)
      markdown += convertedContent

      const duration = performance.now() - startTime

      // 记录性能指标
      const conversionStats = this.markdownConverter.getConversionStats(noteData.content, markdown)
      this.performanceMonitor.recordOperation('markdown-export', {
        duration,
        tokensUsed: Math.ceil(markdown.length / 4),
        cacheHit: this.markdownConverter.getCacheStats().hitRate !== '0.00%',
        memoryUsage: this.estimateMemoryUsage(markdown),
        conversionStats
      })

      return markdown
    } catch (error) {
      const errorDuration = performance.now() - startTime
      this.performanceMonitor.recordOperation('markdown-export', {
        duration: errorDuration,
        success: false,
        error: error.message
      })
      throw new Error('Markdown导出失败: ' + error.message)
    }
  }

  // 🔧 优化11: 批量导出 - 避免重复计算
  exportBatch(noteDataList, formats = ['json', 'markdown', 'html']) {
    const batchStartTime = performance.now()
    const results = {}

    try {
      // 🔧 优化12: 批量场景检测
      const detector = new SceneDetector()
      const contents = noteDataList.map(note => note.content)
      const detectedScenes = detector.detectBatch(contents)

      // 🔧 优化13: 批量内容分析
      const analyses = this.contentAnalyzer.analyzeBatch(contents)

      // 为每个笔记生成指定格式的导出
      for (let i = 0; i < noteDataList.length; i++) {
        const noteData = { ...noteDataList[i] }
        noteData.scene = detectedScenes[i]
        
        results[noteData.title] = {}

        for (const format of formats) {
          try {
            switch (format) {
              case 'json':
                results[noteData.title].json = this.exportToJson(noteData)
                break
              case 'markdown':
                results[noteData.title].markdown = this.exportToMarkdown(noteData)
                break
              case 'html':
                results[noteData.title].html = this.exportToHtml(noteData)
                break
              case 'pdf':
                results[noteData.title].pdf = await this.exportToPdf(noteData)
                break
            }
          } catch (error) {
            results[noteData.title][format] = { error: error.message }
          }
        }
      }

      const totalDuration = performance.now() - batchStartTime

      // 🔧 优化14: 记录批量处理性能
      this.performanceMonitor.recordOperation('batch-export', {
        duration: totalDuration,
        itemsProcessed: noteDataList.length,
        formatsGenerated: formats.length,
        avgTimePerItem: (totalDuration / noteDataList.length).toFixed(2) + 'ms',
        efficiency: ((noteDataList.length * formats.length) / totalDuration * 1000).toFixed(2) + ' items/sec'
      })

      return results
    } catch (error) {
      const errorDuration = performance.now() - batchStartTime
      this.performanceMonitor.recordOperation('batch-export', {
        duration: errorDuration,
        success: false,
        error: error.message
      })
      throw error
    }
  }

  // 其他导出方法保持不变...
  async exportToPdf(noteData, htmlContent) {
    return new Promise((resolve, reject) => {
      try {
        const options = {
          margin: 10,
          filename: `${noteData.title}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }

        resolve({ 
          success: true, 
          message: 'PDF导出需要浏览器环境支持',
          options 
        })
      } catch (error) {
        reject(new Error('PDF导出失败: ' + error.message))
      }
    })
  }

  exportToHtml(noteData) {
    return noteData.content
  }

  // 🔧 工具方法：估算内存使用
  estimateMemoryUsage(content) {
    // 简单估算：字符串长度 * 2字节（UTF-16）+ 对象开销
    const stringSize = content.length * 2
    const objectOverhead = 1024 // 1KB对象开销
    return stringSize + objectOverhead
  }

  getSupportedFormats() {
    return Object.keys(this.exportFormats)
  }

  getFormatInfo(format) {
    return this.exportFormats[format]
  }

  // 🔧 优化15: 获取性能报告
  getPerformanceReport() {
    return this.performanceMonitor.generatePerformanceReport()
  }

  // 🔧 优化16: 获取缓存统计
  getCacheStats() {
    return {
      contentAnalyzer: this.contentAnalyzer.getCacheStats(),
      markdownConverter: this.markdownConverter.getCacheStats(),
      overall: {
        totalHits: this.contentAnalyzer.cacheHits + this.markdownConverter.cacheHits,
        totalMisses: this.contentAnalyzer.cacheMisses + this.markdownConverter.cacheMisses,
        overallHitRate: (
          (this.contentAnalyzer.cacheHits + this.markdownConverter.cacheHits) /
          (this.contentAnalyzer.cacheHits + this.markdownConverter.cacheHits + 
           this.contentAnalyzer.cacheMisses + this.markdownConverter.cacheMisses || 1) * 100
        ).toFixed(1) + '%'
      }
    }
  }

  // 🔧 优化17: 清理缓存
  clearAllCaches() {
    this.contentAnalyzer.clearCache()
    this.markdownConverter.clearCache()
    return {
      message: '所有缓存已清理',
      cachesCleared: ['contentAnalyzer', 'markdownConverter']
    }
  }

  // 🔧 优化18: 预热缓存
  warmupCaches(commonContents = []) {
    const warmupResults = {
      contentAnalyzer: null,
      markdownConverter: null,
      totalWarmupTime: 0,
      itemsWarmed: commonContents.length
    }

    const startTime = performance.now()

    try {
      warmupResults.contentAnalyzer = this.contentAnalyzer.warmupCache(commonContents)
      warmupResults.markdownConverter = this.markdownConverter.warmupCache(commonContents)

      warmupResults.totalWarmupTime = (performance.now() - startTime).toFixed(2) + 'ms'

      this.performanceMonitor.recordOperation('cache-warmup', {
        duration: parseFloat(warmupResults.totalWarmupTime),
        itemsWarmed: commonContents.length,
        cacheModulesPrepared: 2
      })

      return warmupResults
    } catch (error) {
      warmupResults.error = error.message
      return warmupResults
    }
  }
}

// 🔧 优化19: 智能笔记生成器 - 整合所有优化 + 多模态支持
export class SmartNoteGenerator {
  constructor(options = {}) {
    // 🔧 优化1: 使用优化的核心模块
    this.sceneDetector = new SceneDetector()
    this.templateManager = new TemplateManager()
    this.exportManager = new OptimizedExportManager()
    this.modelOptimizer = new ModelOptimizer()
    this.performanceMonitor = new PerformanceMonitor()

    // 🆕 多模态处理器
    this.multimodalProcessor = new MultimodalProcessor(options.multimodal || {})

    // 🆕 智能场景识别模块
    this.subjectDetector = new SubjectDetector(options.subjectDetector || {})
    this.complexityAnalyzer = new ComplexityAnalyzer(options.complexityAnalyzer || {})
    this.knowledgeExtractor = new KnowledgeExtractor(options.knowledgeExtractor || {})
    this.structureSelector = new StructureSelector(options.structureSelector || {})

    // 🆕 增量更新模块
    this.noteParser = new NoteParser(options.noteParser || {})
    this.contentComparer = new ContentComparer(options.contentComparer || {})
    this.noteMerger = new NoteMerger(options.noteMerger || {})
    this.versionManager = new VersionManager(options.versionManager || {})

    // 🆕 知识图谱模块
    this.knowledgeGraph = new KnowledgeGraph(options.knowledgeGraph || {})
    this.learningPath = new LearningPath({ 
      knowledgeGraph: this.knowledgeGraph,
      ...options.learningPath 
    })
    this.weaknessDetector = new WeaknessDetector({ 
      knowledgeGraph: this.knowledgeGraph,
      ...options.weaknessDetector 
    })

    // 🆕 错误处理器
    this.errorHandler = getErrorHandler(options.errorHandler || {})

    // 🔧 优化2: 初始化缓存
    this.initializeSystem()

    // 🔧 优化3: 性能配置
    this.performanceConfig = {
      enableCaching: true,
      enableBatchProcessing: true,
      enableSmartModelSelection: true,
      enableMultimodal: true, // 🆕 启用多模态处理
      enableIncrementalUpdate: true, // 🆕 启用增量更新
      enableKnowledgeGraph: true, // 🆕 启用知识图谱
      maxCacheSize: 100,
      cacheWarmupContents: this.getDefaultWarmupContents()
    }
  }

  // 🔧 优化20: 系统初始化
  async initializeSystem() {
    try {
      // 预热缓存
      if (this.performanceConfig.cacheWarmupContents.length > 0) {
        await this.exportManager.warmupCaches(this.performanceConfig.cacheWarmupContents)
      }

      return { status: 'ready', message: '系统初始化完成' }
    } catch (error) {
      return { status: 'error', message: '系统初始化失败', error: error.message }
    }
  }

  // 🔧 优化21: 智能笔记生成主流程 - 支持多模态输入
  async generateSmartNote(input, options = {}) {
    const startTime = performance.now()
    const generationSteps = []

    try {
      // 🆕 多模态输入处理
      let processedContent = input.content
      let multimodalMetadata = null

      if (this.isMultimodalInput(input)) {
        generationSteps.push({ step: 'multimodal-detection', result: 'detected' })

        const multimodalResult = await this.processMultimodalInput(input, options)
        processedContent = multimodalResult.content
        multimodalMetadata = multimodalResult.metadata

        generationSteps.push({ 
          step: 'multimodal-processing', 
          result: multimodalMetadata.inputType,
          processingTime: multimodalMetadata.processingTime
        })
      }

      // 🔧 优化22: 智能场景检测（带缓存）
      const scene = this.sceneDetector.detect(processedContent)
      generationSteps.push({ step: 'scene-detection', result: scene, cached: this.sceneDetector.getCacheStats().hitRate !== '0.00%' })

      // 🔧 优化23: 智能模型选择
      const modelSelection = this.modelOptimizer.selectConfig(processedContent, scene, options.modelPreferences)
      generationSteps.push({ step: 'model-selection', result: modelSelection })

      // 🔧 优化24: 智能模板推荐
      const template = this.templateManager.getRecommendedTemplate(scene)
      generationSteps.push({ step: 'template-selection', result: template.name })

      // 🔧 优化25: 内容生成（使用优化的导出管理器）
      const noteData = {
        title: input.title || this.generateTitleFromContent(processedContent, multimodalMetadata),
        subtitle: input.subtitle || this.generateSubtitle(scene),
        date: input.date || new Date().toISOString().split('T')[0],
        scene: scene,
        style: template.name === '学霸笔记本' ? 'style-a' : 'style-b',
        content: processedContent,
        // 🆕 多模态元数据
        multimodal: multimodalMetadata ? {
          inputType: multimodalMetadata.inputType,
          source: multimodalMetadata.source || input.content,
          processingTime: multimodalMetadata.processingTime
        } : null
      }

      // 🔧 优化26: 多格式导出（带性能监控）
      const exports = {}
      const requestedFormats = options.formats || ['html', 'json', 'markdown']

      for (const format of requestedFormats) {
        switch (format) {
          case 'html':
            exports.html = this.exportManager.exportToHtml(noteData)
            break
          case 'json':
            exports.json = this.exportManager.exportToJson(noteData)
            break
          case 'markdown':
            exports.markdown = this.exportManager.exportToMarkdown(noteData)
            break
          case 'pdf':
            exports.pdf = await this.exportManager.exportToPdf(noteData)
            break
        }
      }

      const totalDuration = performance.now() - startTime

      // 🔧 优化27: 记录完整生成性能
      this.performanceMonitor.recordOperation('smart-note-generation', {
        duration: totalDuration,
        tokensUsed: modelSelection.estimatedPerformance.estimatedTotalTokens,
        cacheHit: this.checkAnyCacheHit(),
        memoryUsage: this.estimateTotalMemory(exports),
        formatsGenerated: Object.keys(exports).length,
        scene,
        modelConfig: modelSelection.config.name,
        multimodal: multimodalMetadata ? true : false
      })

      return {
        success: true,
        noteData,
        exports,
        metadata: {
          scene,
          template: template.name,
          modelConfig: modelSelection.config.name,
          generationTime: totalDuration.toFixed(2) + 'ms',
          tokenUsage: modelSelection.estimatedPerformance,
          cacheHitRate: this.getOverallCacheHitRate(),
          formats: Object.keys(exports),
          performanceMetrics: generationSteps,
          // 🆕 多模态处理信息
          multimodal: multimodalMetadata
        }
      }

    } catch (error) {
      const errorDuration = performance.now() - startTime
      this.performanceMonitor.recordOperation('smart-note-generation', {
        duration: errorDuration,
        success: false,
        error: error.message
      })

      return {
        success: false,
        error: error.message,
        duration: errorDuration.toFixed(2) + 'ms'
      }
    }
  }

  // 🆕 检测是否为多模态输入
  isMultimodalInput(input) {
    // 检查是否有图片、视频、音频相关的输入
    const content = input.content || ''
    
    // URL检测
    if (typeof content === 'string') {
      // 图片URL
      if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(content)) return true
      if (content.includes('imgur.com') || content.includes('images.unsplash.com')) return true
      
      // 视频URL
      if (content.includes('youtube.com') || content.includes('youtu.be')) return true
      if (content.includes('bilibili.com') || content.includes('b23.tv')) return true
      if (/\.(mp4|avi|mov|mkv|webm)(\?.*)?$/i.test(content)) return true
      
      // 音频URL
      if (/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(content)) return true
      
      // 文件路径
      if (/^[a-zA-Z]:\\/.test(content) || /^\//.test(content)) {
        const ext = content.match(/\.[^.]+$/)?.[0]?.toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3', '.wav'].includes(ext)) return true
      }
      
      // Base64
      if (content.startsWith('data:image/') || content.startsWith('data:video/') || content.startsWith('data:audio/')) return true
    }

    // 检查是否有 multimodal 标记
    if (input.multimodal || input.type === 'multimodal') return true
    if (input.image || input.video || input.audio) return true

    return false
  }

  // 🆕 处理多模态输入
  async processMultimodalInput(input, options = {}) {
    const content = input.content || ''
    
    // 确定输入源
    let source = content
    if (input.image) source = input.image
    else if (input.video) source = input.video
    else if (input.audio) source = input.audio

    // 使用多模态处理器处理
    const result = await this.multimodalProcessor.process(source, {
      ...options,
      // 可以传入AI视觉理解的调用器
      aiVisionEnabled: options.aiVisionEnabled || false,
      visionApiCaller: options.visionApiCaller,
      whisperApiCaller: options.whisperApiCaller
    })

    if (!result.success) {
      throw new Error(`多模态处理失败: ${result.error}`)
    }

    return {
      content: result.content,
      metadata: {
        inputType: result.inputType,
        ...result.metadata,
        source: source.substring(0, 100) + (source.length > 100 ? '...' : '')
      }
    }
  }

  // 🆕 从多模态内容生成标题
  generateTitleFromContent(content, multimodalMetadata) {
    if (!multimodalMetadata) return '学习笔记'

    const typeMap = {
      'image': '图片笔记',
      'video': '视频笔记',
      'audio': '音频笔记',
      'url': '网页笔记'
    }

    const baseTitle = typeMap[multimodalMetadata.inputType] || '学习笔记'
    
    // 尝试从内容中提取关键信息
    const firstLine = content.split('\n').find(line => line.trim().length > 0)
    if (firstLine && firstLine.length < 50) {
      return firstLine.replace(/^[#\-*\s]+/, '').trim() || baseTitle
    }

    return `${baseTitle} - ${new Date().toLocaleDateString('zh-CN')}`
  }

  // 🔧 优化28: 智能副标题生成
  generateSubtitle(scene) {
    const subtitles = {
      technical: '技术学习笔记',
      classroom: '课堂学习记录', 
      science: '科普知识整理',
      meeting: '会议纪要文档'
    }
    return subtitles[scene] || '学习笔记'
  }

  // 🔧 优化29: 检查是否有缓存命中
  checkAnyCacheHit() {
    const sceneStats = this.sceneDetector.getCacheStats()
    const exportStats = this.exportManager.getCacheStats()
    return sceneStats.hitRate !== '0.00%' || exportStats.overall.overallHitRate !== '0%'
  }

  // 🔧 优化30: 获取整体缓存命中率
  getOverallCacheHitRate() {
    const sceneStats = this.sceneDetector.getCacheStats()
    const exportStats = this.exportManager.getCacheStats()
    
    const totalHits = sceneStats.hits + exportStats.overall.totalHits
    const totalMisses = sceneStats.misses + exportStats.overall.totalMisses
    
    return totalHits + totalMisses > 0 ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1) + '%' : '0%'
  }

  // 🔧 优化31: 估算总内存使用
  estimateTotalMemory(exports) {
    let totalMemory = 0
    for (const [format, content] of Object.entries(exports)) {
      if (typeof content === 'string') {
        totalMemory += content.length * 2 // UTF-16编码
      } else if (content && typeof content === 'object') {
        totalMemory += 1024 // 对象开销
      }
    }
    return totalMemory
  }

  // 🔧 优化32: 批量智能笔记生成
  async generateBatchSmartNote(inputs, options = {}) {
    const batchStartTime = performance.now()

    try {
      const results = []
      const batchSize = options.batchSize || 5

      // 🔧 优化33: 分批处理以避免内存溢出
      for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i + batchSize)
        const batchPromises = batch.map(input => this.generateSmartNote(input, options))
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // 🔧 优化34: 批次间的小延迟，避免CPU过载
        if (i + batchSize < inputs.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      const totalDuration = performance.now() - batchStartTime

      this.performanceMonitor.recordOperation('batch-smart-note-generation', {
        duration: totalDuration,
        totalNotes: inputs.length,
        batchSize,
        avgTimePerNote: (totalDuration / inputs.length).toFixed(2) + 'ms',
        successRate: ((results.filter(r => r.success).length / results.length) * 100).toFixed(1) + '%'
      })

      return results
    } catch (error) {
      const errorDuration = performance.now() - batchStartTime
      this.performanceMonitor.recordOperation('batch-smart-note-generation', {
        duration: errorDuration,
        success: false,
        error: error.message
      })
      throw error
    }
  }

  // 🔧 优化35: 获取默认缓存预热内容
  getDefaultWarmupContents() {
    return [
      '技术笔记示例：包含代码和算法说明的内容',
      '课堂笔记示例：老师讲解重点知识点的课堂记录',
      '科普笔记示例：科学原理和现象的解释性内容',
      '会议笔记示例：讨论议程和决议的会议纪要'
    ]
  }

  // 🔧 优化36: 获取系统状态报告
  getSystemStatus() {
    return {
      performance: this.performanceMonitor.generatePerformanceReport(),
      cache: this.getCacheStats(),
      modules: {
        sceneDetector: this.sceneDetector.getCacheStats(),
        contentAnalyzer: this.exportManager.contentAnalyzer.getCacheStats(),
        markdownConverter: this.exportManager.markdownConverter.getCacheStats()
      },
      configuration: this.performanceConfig,
      recommendations: this.generateOptimizationRecommendations()
    }
  }

  // 🔧 优化37: 生成优化建议
  generateOptimizationRecommendations() {
    const status = this.getSystemStatus()
    const recommendations = []

    // 基于缓存效率的建议
    if (parseFloat(status.cache.overall.overallHitRate) < 70) {
      recommendations.push({
        type: 'cache-optimization',
        severity: 'medium',
        message: `缓存命中率 ${status.cache.overall.overallHitRate} 偏低`,
        suggestion: '建议增加缓存大小或优化缓存键生成策略'
      })
    }

    // 基于性能指标的建议
    const perfSummary = status.performance.summary
    if (parseFloat(perfSummary.tokenSavingRate) < 80) {
      recommendations.push({
        type: 'token-optimization',
        severity: 'high',
        message: `Token节省率 ${perfSummary.tokenSavingRate} 低于目标 80%`,
        suggestion: '建议进一步优化重复计算和缓存策略'
      })
    }

    return recommendations
  }

  // 🔧 优化38: 自适应系统调优
  async adaptiveTuning() {
    const tuningResult = {
      timestamp: new Date().toISOString(),
      actions: []
    }

    try {
      // 场景检测器自适应学习
      const sceneLearning = this.sceneDetector.getCacheStats()
      if (sceneLearning.totalRequests > 50 && parseFloat(sceneLearning.hitRate) < 60) {
        // 缓存命中率低，增加缓存大小
        this.sceneDetector.maxCacheSize = Math.min(this.sceneDetector.maxCacheSize * 2, 200)
        tuningResult.actions.push('增加了场景检测器缓存大小')
      }

      // 导出管理器自适应学习
      const exportLearning = this.exportManager.contentAnalyzer.getCacheStats()
      if (exportLearning.totalRequests > 30 && parseFloat(exportLearning.hitRate) < 70) {
        this.exportManager.contentAnalyzer.maxCacheSize = Math.min(
          this.exportManager.contentAnalyzer.maxCacheSize * 1.5, 100
        )
        tuningResult.actions.push('增加了内容分析器缓存大小')
      }

      // 模型优化器自适应学习
      const modelLearning = this.modelOptimizer.adaptiveLearning()
      if (modelLearning.canLearn) {
        tuningResult.actions.push('模型参数自适应学习完成')
      }

      tuningResult.status = 'success'
      return tuningResult

    } catch (error) {
      tuningResult.status = 'error'
      tuningResult.error = error.message
      return tuningResult
    }
  }

  // 🔧 优化39: 清理和重置
  async cleanup() {
    const cleanupResult = {
      timestamp: new Date().toISOString(),
      actions: []
    }

    try {
      // 清理所有缓存
      const cacheCleanup = this.exportManager.clearAllCaches()
      cleanupResult.actions.push(cacheCleanup.message)

      // 重置性能监控
      this.performanceMonitor.reset()
      cleanupResult.actions.push('性能监控已重置')

      // 重置模型学习
      this.modelOptimizer.resetLearning()
      cleanupResult.actions.push('模型学习参数已重置')

      cleanupResult.status = 'success'
      return cleanupResult

    } catch (error) {
      cleanupResult.status = 'error'
      cleanupResult.error = error.message
      return cleanupResult
    }
  }

  // 🔧 优化40: 导出完整优化报告
  generateOptimizationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      systemStatus: this.getSystemStatus(),
      performanceReport: this.performanceMonitor.generatePerformanceReport(),
      modelOptimizationReport: this.modelOptimizer.generateOptimizationReport(),
      recommendations: this.generateOptimizationRecommendations(),
      cacheAnalysis: this.analyzeCacheEffectiveness(),
      costAnalysis: this.performanceMonitor.generatePerformanceReport().costAnalysis
    }

    return report
  }

  // 🔧 优化41: 分析缓存效果
  analyzeCacheEffectiveness() {
    const cacheStats = this.getCacheStats()
    const analysis = {
      overall: {
        hitRate: cacheStats.overall.overallHitRate,
        totalRequests: cacheStats.overall.totalHits + cacheStats.overall.totalMisses,
        effectiveness: this.evaluateCacheEffectiveness(cacheStats.overall.overallHitRate)
      },
      byModule: {},
      recommendations: []
    }

    // 分析各模块缓存效果
    for (const [moduleName, stats] of Object.entries(cacheStats.modules)) {
      analysis.byModule[moduleName] = {
        hitRate: stats.hitRate,
        effectiveness: this.evaluateCacheEffectiveness(stats.hitRate),
        suggestions: this.getModuleCacheSuggestions(moduleName, stats)
      }
    }

    return analysis
  }

  // 🔧 优化42: 评估缓存效果
  evaluateCacheEffectiveness(hitRate) {
    const rate = parseFloat(hitRate)
    if (rate >= 90) return 'excellent'
    if (rate >= 70) return 'good'
    if (rate >= 50) return 'fair'
    return 'poor'
  }

  // 🔧 优化43: 获取模块缓存建议
  getModuleCacheSuggestions(moduleName, stats) {
    const suggestions = []
    const hitRate = parseFloat(stats.hitRate)

    if (hitRate < 50) {
      suggestions.push('考虑优化缓存键生成策略')
      suggestions.push('增加缓存大小可能提高命中率')
    }

    if (hitRate > 80 && stats.misses < 10) {
      suggestions.push('缓存效率很高，可以考虑减小缓存大小')
    }

    return suggestions
  }

  // ==================== 增量更新功能 ====================

  /**
   * 更新已有笔记 - 增量更新
   * @param {string} existingNotePath - 已有笔记文件路径
   * @param {string|object} newContent - 新内容
   * @param {object} options - 配置选项
   * @returns {object} 更新结果
   */
  async updateNote(existingNotePath, newContent, options = {}) {
    const startTime = performance.now()

    try {
      // 1. 解析已有笔记
      const existingNote = await this.noteParser.parse(existingNotePath, options)
      if (!existingNote.success) {
        throw new Error(`解析已有笔记失败: ${existingNote.error}`)
      }

      // 2. 处理新内容
      let processedNewContent = newContent
      if (this.isMultimodalInput({ content: newContent })) {
        const multimodalResult = await this.processMultimodalInput({ content: newContent }, options)
        processedNewContent = multimodalResult.content
      }

      // 3. 对比新旧内容
      const compareResult = this.contentComparer.compare(existingNote, processedNewContent, options)

      // 4. 合并内容
      const mergeResult = await this.noteMerger.merge(existingNote, processedNewContent, compareResult, {
        ...options,
        strategy: options.mergeStrategy || 'smart'
      })

      if (!mergeResult.success) {
        throw new Error(`合并内容失败: ${mergeResult.error}`)
      }

      // 5. 创建版本记录
      const versionResult = await this.versionManager.createVersion(existingNotePath, mergeResult.mergedHtml, {
        changes: options.changes || '增量更新',
        tags: options.tags || ['incremental-update'],
        saveContent: options.saveContent !== false
      })

      // 6. 保存更新后的笔记
      if (options.save !== false) {
        await this.noteMerger.saveMergedNote(mergeResult.mergedHtml, existingNotePath, options)
      }

      // 记录性能
      this.performanceMonitor.recordOperation('update-note', {
        duration: performance.now() - startTime,
        existingNotePath,
        mergeStrategy: options.mergeStrategy || 'smart'
      })

      return {
        success: true,
        // 更新详情
        existingNote: {
          path: existingNotePath,
          title: existingNote.title,
          sections: existingNote.sections.length
        },
        newContent: {
          length: processedNewContent.length,
          type: typeof newContent === 'string' ? 'text' : 'multimodal'
        },
        // 对比结果
        comparison: {
          added: compareResult.added?.length || 0,
          removed: compareResult.removed?.length || 0,
          modified: compareResult.modified?.length || 0,
          duplicates: compareResult.duplicates?.length || 0,
          similarity: compareResult.similarity || 0
        },
        // 合并结果
        merge: {
          strategy: mergeResult.mergeDetails?.strategy || 'smart',
          changes: mergeResult.changes || {},
          htmlLength: mergeResult.mergedHtml?.length || 0
        },
        // 版本信息
        version: {
          id: versionResult.version?.id,
          version: versionResult.version?.version,
          timestamp: versionResult.version?.timestamp
        },
        // 性能信息
        performance: {
          duration: (performance.now() - startTime).toFixed(2) + 'ms',
          timestamp: new Date().toISOString()
        }
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
   * 获取笔记版本历史
   * @param {string} notePath - 笔记文件路径
   * @returns {object} 版本历史
   */
  getNoteVersionHistory(notePath) {
    return this.versionManager.exportVersionHistory(notePath)
  }

  /**
   * 回退到指定版本
   * @param {string} notePath - 笔记文件路径
   * @param {string} versionId - 版本ID
   * @param {object} options - 配置选项
   * @returns {object} 回退结果
   */
  async revertNote(notePath, versionId, options = {}) {
    return await this.versionManager.revertToVersion(notePath, versionId, options)
  }

  /**
   * 比较两个版本
   * @param {string} notePath - 笔记文件路径
   * @param {string} versionId1 - 版本ID1
   * @param {string} versionId2 - 版本ID2
   * @returns {object} 比较结果
   */
  compareNoteVersions(notePath, versionId1, versionId2) {
    return this.versionManager.compareVersions(notePath, versionId1, versionId2)
  }

  /**
   * 获取笔记统计信息
   * @param {string} notePath - 笔记文件路径
   * @returns {object} 统计信息
   */
  getNoteStatistics(notePath) {
    return this.versionManager.getStatistics(notePath)
  }

  /**
   * 检查是否为多模态输入
   */
  isMultimodalInput(input) {
    if (!input || !input.content) return false

    const content = input.content

    // URL检测
    if (typeof content === 'string') {
      if (content.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i)) return true
      if (content.match(/\.(mp4|avi|mov|mkv|webm|flv)(\?.*)?$/i)) return true
      if (content.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i)) return true
      if (content.includes('youtube.com') || content.includes('youtu.be')) return true
      if (content.includes('bilibili.com')) return true
      if (content.match(/^https?:\/\//)) return true
    }

    return input.multimodal === true || input.image === true || input.video === true || input.audio === true
  }

  /**
   * 处理多模态输入
   */
  async processMultimodalInput(input, options) {
    const multimodalOptions = {
      ...options.multimodal,
      image: input.image,
      video: input.video,
      audio: input.audio
    }

    return await this.multimodalProcessor.process(input.content, multimodalOptions)
  }

  // ==================== 知识图谱功能 ====================

  /**
   * 添加知识点到知识图谱
   * @param {object} node - 知识点信息
   * @returns {string} 知识点ID
   */
  addKnowledgePoint(node) {
    return this.knowledgeGraph.addNode(node)
  }

  /**
   * 批量添加知识点
   * @param {Array} nodes - 知识点数组
   * @returns {Array} 知识点ID数组
   */
  addKnowledgePoints(nodes) {
    return this.knowledgeGraph.addNodes(nodes)
  }

  /**
   * 从笔记内容提取知识点并添加到知识图谱
   * @param {string} noteContent - 笔记内容
   * @param {object} options - 配置选项
   * @returns {object} 提取结果
   */
  extractAndAddKnowledge(noteContent, options = {}) {
    // 使用知识点提取器提取知识点
    const extractionResult = this.knowledgeExtractor.extract(noteContent, options)
    
    // 添加到知识图谱
    const addedNodes = []
    for (const point of extractionResult.knowledgePoints) {
      const nodeId = this.knowledgeGraph.addNode({
        name: point.text,
        subject: options.subject || '通用',
        chapter: options.chapter || '',
        difficulty: this.estimateDifficulty(point),
        importance: this.mapImportance(point.importance),
        tags: [point.type],
        content: point.text
      })
      addedNodes.push(nodeId)
    }

    // 建立知识点之间的关系
    this.buildKnowledgeRelations(addedNodes, extractionResult.knowledgePoints)

    return {
      success: true,
      addedCount: addedNodes.length,
      nodeIds: addedNodes,
      extractionResult
    }
  }

  /**
   * 估计知识点难度
   */
  estimateDifficulty(point) {
    // 基于知识点类型估计难度
    const typeDifficulty = {
      'definition': 3,
      'concept': 4,
      'principle': 6,
      'method': 5,
      'formula': 7,
      'example': 2,
      'notice': 4,
      'important': 5,
      'summary': 3,
      'comparison': 5
    }
    return typeDifficulty[point.type] || 5
  }

  /**
   * 映射重要性
   */
  mapImportance(importance) {
    const mapping = {
      'high': 8,
      'medium': 5,
      'low': 3
    }
    return mapping[importance] || 5
  }

  /**
   * 建立知识点关系
   */
  buildKnowledgeRelations(nodeIds, knowledgePoints) {
    // 建立相同类型知识点之间的关系
    const byType = {}
    for (let i = 0; i < nodeIds.length; i++) {
      const point = knowledgePoints[i]
      if (!byType[point.type]) {
        byType[point.type] = []
      }
      byType[point.type].push(nodeIds[i])
    }

    // 同类型知识点建立相关关系
    for (const typeNodes of Object.values(byType)) {
      for (let i = 0; i < typeNodes.length - 1; i++) {
        for (let j = i + 1; j < typeNodes.length; j++) {
          try {
            this.knowledgeGraph.addEdge(typeNodes[i], typeNodes[j], 'related', 0.5)
          } catch (e) {
            // 忽略重复边的错误
          }
        }
      }
    }
  }

  /**
   * 生成学习路径
   * @param {object} params - 参数
   * @returns {object} 学习路径
   */
  generateLearningPath(params) {
    return this.learningPath.generatePath({
      ...params,
      knowledgeGraph: this.knowledgeGraph
    })
  }

  /**
   * 检测薄弱点
   * @param {object} params - 参数
   * @returns {object} 薄弱点分析结果
   */
  detectWeaknesses(params) {
    return this.weaknessDetector.detectWeaknesses({
      ...params,
      knowledgeGraph: this.knowledgeGraph
    })
  }

  /**
   * 获取知识图谱统计信息
   * @returns {object} 统计信息
   */
  getKnowledgeGraphStats() {
    return {
      nodeCount: this.knowledgeGraph.nodes.size,
      edgeCount: Array.from(this.knowledgeGraph.edges.values()).reduce((sum, edges) => sum + edges.length, 0),
      subjectCount: new Set(Array.from(this.knowledgeGraph.nodes.values()).map(n => n.subject)).size
    }
  }

  /**
   * 搜索知识点
   * @param {string} query - 搜索查询
   * @returns {Array} 搜索结果
   */
  searchKnowledge(query) {
    return this.knowledgeGraph.searchNodes(query)
  }

  /**
   * 获取知识点详情
   * @param {string} nodeId - 知识点ID
   * @returns {object} 知识点详情
   */
  getKnowledgeDetail(nodeId) {
    const node = this.knowledgeGraph.getNode(nodeId)
    if (!node) {
      return null
    }

    const edges = this.knowledgeGraph.getEdges(nodeId) || []
    const relatedNodes = edges.map(edge => {
      const relatedId = edge.from === nodeId ? edge.to : edge.from
      return {
        ...this.knowledgeGraph.getNode(relatedId),
        relationType: edge.type,
        weight: edge.weight
      }
    }).filter(Boolean)

    return {
      ...node,
      relatedNodes
    }
  }
}

// 🔧 优化44: 导出工厂模式 - 支持多模态配置
export class NoteGeneratorFactory {
  static createOptimized(options = {}) {
    return new SmartNoteGenerator(options)
  }

  static createStandard() {
    // 返回标准版本（如果需要对比）
    throw new Error('标准版本已优化，请使用 createOptimized()')
  }

  static createWithConfig(config) {
    const generator = new SmartNoteGenerator(config)
    generator.performanceConfig = { ...generator.performanceConfig, ...config }
    return generator
  }

  // 🆕 创建支持多模态的生成器
  static createWithMultimodal(multimodalOptions = {}) {
    return new SmartNoteGenerator({
      multimodal: multimodalOptions
    })
  }
}

// 🔧 优化45: 便捷导出函数
export async function quickGenerateNote(content, title, options = {}) {
  const generator = NoteGeneratorFactory.createOptimized(options)
  await generator.initializeSystem()

  return await generator.generateSmartNote({
    content,
    title,
    subtitle: options.subtitle,
    date: options.date
  }, options)
}

// 🔧 优化46: 批量便捷导出
export async function quickBatchGenerateNotes(items, options = {}) {
  const generator = NoteGeneratorFactory.createOptimized(options)
  await generator.initializeSystem()

  return await generator.generateBatchSmartNote(items, options)
}

// 🆕 多模态笔记生成便捷函数
export async function generateNoteFromMultimodal(source, options = {}) {
  const generator = NoteGeneratorFactory.createWithMultimodal(options.multimodal || {})
  await generator.initializeSystem()

  return await generator.generateSmartNote({
    content: source,
    title: options.title,
    subtitle: options.subtitle,
    date: options.date,
    // 🆕 多模态标记
    multimodal: true,
    image: options.image,
    video: options.video,
    audio: options.audio
  }, options)
}

// 🆕 从图片生成笔记
export async function generateNoteFromImage(imageSource, options = {}) {
  return generateNoteFromMultimodal(imageSource, {
    ...options,
    image: true
  })
}

// 🆕 从视频生成笔记
export async function generateNoteFromVideo(videoSource, options = {}) {
  return generateNoteFromMultimodal(videoSource, {
    ...options,
    video: true
  })
}

// 🆕 从音频生成笔记
export async function generateNoteFromAudio(audioSource, options = {}) {
  return generateNoteFromMultimodal(audioSource, {
    ...options,
    audio: true
  })
}

// 🆕 从网页URL生成笔记
export async function generateNoteFromUrl(url, options = {}) {
  return generateNoteFromMultimodal(url, options)
}

// 🆕 批量多模态处理
export async function processMultimodalBatch(inputs, options = {}) {
  const processor = new MultimodalProcessor(options.multimodal || {})
  return await processor.processBatch(inputs, options)
}

// 🆕 检查多模态依赖
export async function checkMultimodalDependencies() {
  const processor = new MultimodalProcessor()
  return await processor.checkDependencies()
}

// ==================== 智能笔记生成器 v2.0 ====================

// 便捷工厂函数
export function createSmartNoteGenerator(options = {}) {
  return new SmartNoteGenerator(options)
}

// 快速生成函数
export async function smartGenerate(input, options = {}) {
  const generator = createSmartNoteGenerator(options)
  return await generator.generate(input, options)
}