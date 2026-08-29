// 多模态处理器 - 支持图片、视频、音频、博客URL输入
export class MultimodalProcessor {
  constructor(options = {}) {
    // 处理器配置
    this.config = {
      // OCR配置
      ocr: {
        enabled: true,
        language: options.ocrLanguage || 'chi_sim+eng', // 中文+英文
        ...options.ocr
      },
      // 视频处理配置
      video: {
        enabled: true,
        maxDuration: options.maxVideoDuration || 3600, // 最长1小时
        extractKeyframes: options.extractKeyframes !== false,
        ...options.video
      },
      // 音频处理配置
      audio: {
        enabled: true,
        maxDuration: options.maxAudioDuration || 7200, // 最长2小时
        ...options.audio
      },
      // 网页处理配置
      web: {
        enabled: true,
        maxContentLength: options.maxContentLength || 50000,
        ...options.web
      }
    }

    // 缓存机制
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 50

    // 处理统计
    this.stats = {
      imagesProcessed: 0,
      videosProcessed: 0,
      audioProcessed: 0,
      webPagesProcessed: 0,
      totalProcessingTime: 0
    }
  }

  // 主处理入口 - 自动识别输入类型并处理
  async process(input, options = {}) {
    const startTime = performance.now()
    const inputType = this.detectInputType(input)

    try {
      let result

      switch (inputType) {
        case 'image':
          result = await this.processImage(input, options)
          break
        case 'video':
          result = await this.processVideo(input, options)
          break
        case 'audio':
          result = await this.processAudio(input, options)
          break
        case 'url':
          result = await this.processUrl(input, options)
          break
        case 'text':
          result = this.processText(input, options)
          break
        default:
          throw new Error(`不支持的输入类型: ${inputType}`)
      }

      const processingTime = performance.now() - startTime
      this.stats.totalProcessingTime += processingTime

      return {
        success: true,
        inputType,
        content: result.content,
        metadata: {
          ...result.metadata,
          processingTime: processingTime.toFixed(2) + 'ms'
        }
      }
    } catch (error) {
      return {
        success: false,
        inputType,
        error: error.message,
        processingTime: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  // 批量处理多个输入
  async processBatch(inputs, options = {}) {
    const results = []
    const batchSize = options.batchSize || 3

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(input => this.process(input, options))
      )
      results.push(...batchResults)

      // 批次间延迟，避免资源过载
      if (i + batchSize < inputs.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }

  // 检测输入类型
  detectInputType(input) {
    if (typeof input !== 'string') {
      // 如果是File对象或Buffer
      if (input instanceof Buffer || input instanceof ArrayBuffer) {
        return this.detectBinaryType(input)
      }
      return 'unknown'
    }

    // URL检测
    if (this.isUrl(input)) {
      if (this.isImageUrl(input)) return 'image'
      if (this.isVideoUrl(input)) return 'video'
      if (this.isAudioUrl(input)) return 'audio'
      return 'url'
    }

    // 文件路径检测
    if (this.isFilePath(input)) {
      const ext = this.getFileExtension(input).toLowerCase()
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)) return 'image'
      if (['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'].includes(ext)) return 'video'
      if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(ext)) return 'audio'
    }

    // Base64检测
    if (input.startsWith('data:image/')) return 'image'
    if (input.startsWith('data:video/')) return 'video'
    if (input.startsWith('data:audio/')) return 'audio'

    // 默认为文本
    return 'text'
  }

  // 检测二进制数据类型
  detectBinaryType(data) {
    const bytes = new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer)
    
    // 检查魔数(magic numbers)
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image' // JPEG
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image' // PNG
    if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image' // GIF
    if (bytes[0] === 0x52 && bytes[1] === 0x49) return 'image' // WEBP (RIFF)
    
    return 'unknown'
  }

  // URL类型检测辅助方法
  isUrl(str) {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  isImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(url) ||
           url.includes('imgur.com') ||
           url.includes('images.unsplash.com')
  }

  isVideoUrl(url) {
    return /\.(mp4|avi|mov|mkv|webm|flv)(\?.*)?$/i.test(url) ||
           url.includes('youtube.com') ||
           url.includes('youtu.be') ||
           url.includes('vimeo.com') ||
           url.includes('bilibili.com')
  }

  isAudioUrl(url) {
    return /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(url) ||
           url.includes('soundcloud.com') ||
           url.includes('spotify.com')
  }

  isFilePath(str) {
    return /^[a-zA-Z]:\\/.test(str) || // Windows
           /^\//.test(str) || // Unix
           /^\.\//.test(str) // 相对路径
  }

  getFileExtension(path) {
    const match = path.match(/\.[^.]+$/)
    return match ? match[0] : ''
  }

  // ==================== 图片处理 ====================

  async processImage(input, options = {}) {
    this.stats.imagesProcessed++

    const cacheKey = this.generateCacheKey('image', input)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    let imageBuffer
    let ocrText = ''
    let imageDescription = ''

    // 获取图片数据
    if (this.isUrl(input)) {
      imageBuffer = await this.fetchImage(input)
    } else if (this.isFilePath(input)) {
      imageBuffer = await this.readImageFile(input)
    } else if (input.startsWith('data:image/')) {
      imageBuffer = this.base64ToBuffer(input)
    } else {
      throw new Error('无法识别的图片输入')
    }

    // OCR文字识别
    if (this.config.ocr.enabled) {
      ocrText = await this.performOCR(imageBuffer, options)
    }

    // AI图像理解（如果配置了API）
    if (options.aiVisionEnabled) {
      imageDescription = await this.performAIImageUnderstanding(imageBuffer, options)
    }

    const result = {
      content: this.formatImageContent(ocrText, imageDescription),
      metadata: {
        hasText: ocrText.length > 0,
        hasDescription: imageDescription.length > 0,
        textLength: ocrText.length,
        descriptionLength: imageDescription.length
      }
    }

    this.cache.set(cacheKey, result)
    this.manageCacheSize()

    return result
  }

  // 执行OCR识别
  async performOCR(imageBuffer, options = {}) {
    try {
      // 动态导入tesseract.js（如果可用）
      const Tesseract = await this.loadTesseract()
      if (!Tesseract) {
        return this.fallbackOCR(imageBuffer)
      }

      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        options.language || this.config.ocr.language,
        {
          logger: options.logger || (() => {})
        }
      )

      return this.cleanOCRText(text)
    } catch (error) {
      console.error('OCR处理失败:', error.message)
      return this.fallbackOCR(imageBuffer)
    }
  }

  // 加载Tesseract.js
  async loadTesseract() {
    try {
      const Tesseract = await import('tesseract.js')
      return Tesseract
    } catch {
      console.warn('tesseract.js未安装，使用备用OCR方案')
      return null
    }
  }

  // 备用OCR方案（简单的图片描述）
  fallbackOCR(imageBuffer) {
    return '[图片内容 - 需要安装tesseract.js以启用OCR功能]'
  }

  // 清理OCR文本
  cleanOCRText(text) {
    return text
      .replace(/\s+/g, ' ') // 合并空白字符
      .replace(/\n\s*\n/g, '\n\n') // 合并多余换行
      .trim()
  }

  // AI图像理解
  async performAIImageUnderstanding(imageBuffer, options = {}) {
    // 这里可以集成OpenAI Vision API或其他AI服务
    // 示例实现
    if (options.visionApiCaller) {
      const base64Image = imageBuffer.toString('base64')
      return await options.visionApiCaller(base64Image)
    }
    return ''
  }

  // 格式化图片内容为Markdown
  formatImageContent(ocrText, description) {
    let content = ''

    if (description) {
      content += `## 图片描述\n\n${description}\n\n`
    }

    if (ocrText) {
      content += `## 图片文字内容\n\n${ocrText}\n\n`
    }

    if (!content) {
      content = '[图片内容]\n\n'
    }

    return content
  }

  // 图片获取辅助方法
  async fetchImage(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`获取图片失败: ${response.status}`)
      }
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      throw new Error(`获取图片URL失败: ${error.message}`)
    }
  }

  async readImageFile(path) {
    try {
      const fs = await import('fs/promises')
      return await fs.readFile(path)
    } catch (error) {
      throw new Error(`读取图片文件失败: ${error.message}`)
    }
  }

  base64ToBuffer(base64String) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
    return Buffer.from(base64Data, 'base64')
  }

  // ==================== 视频处理 ====================

  async processVideo(input, options = {}) {
    this.stats.videosProcessed++

    const cacheKey = this.generateCacheKey('video', input)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    let subtitles = ''
    let videoInfo = {}

    // YouTube视频
    if (this.isYouTubeUrl(input)) {
      const result = await this.processYouTubeVideo(input, options)
      subtitles = result.subtitles
      videoInfo = result.info
    }
    // Bilibili视频
    else if (this.isBilibiliUrl(input)) {
      const result = await this.processBilibiliVideo(input, options)
      subtitles = result.subtitles
      videoInfo = result.info
    }
    // 本地视频文件
    else if (this.isFilePath(input)) {
      const result = await this.processLocalVideo(input, options)
      subtitles = result.subtitles
      videoInfo = result.info
    }
    // 其他视频URL
    else {
      throw new Error('暂不支持该视频源，请使用YouTube、Bilibili链接或本地文件')
    }

    const result = {
      content: this.formatVideoContent(subtitles, videoInfo),
      metadata: {
        source: this.getVideoSource(input),
        hasSubtitles: subtitles.length > 0,
        subtitleLength: subtitles.length,
        duration: videoInfo.duration || '未知'
      }
    }

    this.cache.set(cacheKey, result)
    this.manageCacheSize()

    return result
  }

  // YouTube视频处理
  async processYouTubeVideo(url, options = {}) {
    try {
      const videoId = this.extractYouTubeId(url)
      if (!videoId) {
        throw new Error('无法识别YouTube视频ID')
      }

      // 尝试使用youtube-transcript-api
      const subtitles = await this.fetchYouTubeTranscript(videoId, options)
      
      return {
        subtitles,
        info: {
          platform: 'YouTube',
          videoId,
          url
        }
      }
    } catch (error) {
      throw new Error(`YouTube视频处理失败: ${error.message}`)
    }
  }

  // 获取YouTube字幕
  async fetchYouTubeTranscript(videoId, options = {}) {
    try {
      // 动态导入youtube-transcript-api
      const { YoutubeTranscript } = await import('youtube-transcript')
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: options.language || 'zh'
      })

      return transcript
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    } catch (error) {
      // 尝试备用方案
      console.warn('YouTube字幕获取失败，尝试备用方案:', error.message)
      return await this.fetchYouTubeTranscriptFallback(videoId, options)
    }
  }

  // YouTube字幕备用方案
  async fetchYouTubeTranscriptFallback(videoId, options = {}) {
    // 可以使用其他API或爬虫方案
    return '[YouTube视频字幕 - 请确保安装youtube-transcript包]'
  }

  // Bilibili视频处理
  async processBilibiliVideo(url, options = {}) {
    try {
      const bvid = this.extractBilibiliId(url)
      if (!bvid) {
        throw new Error('无法识别Bilibili视频ID')
      }

      // Bilibili字幕获取
      const subtitles = await this.fetchBilibiliSubtitles(bvid, options)

      return {
        subtitles,
        info: {
          platform: 'Bilibili',
          bvid,
          url
        }
      }
    } catch (error) {
      throw new Error(`Bilibili视频处理失败: ${error.message}`)
    }
  }

  // 获取Bilibili字幕
  async fetchBilibiliSubtitles(bvid, options = {}) {
    try {
      // Bilibili字幕API
      const response = await fetch(
        `https://api.bilibili.com/x/player/v2?bvid=${bvid}`
      )
      const data = await response.json()

      if (data.data?.subtitle?.subtitles?.length > 0) {
        const subtitleUrl = data.data.subtitle.subtitles[0].subtitle_url
        const subtitleResponse = await fetch(subtitleUrl)
        const subtitleData = await subtitleResponse.json()

        return subtitleData.body
          .map(item => item.content)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      }

      return '[Bilibili视频未找到字幕]'
    } catch (error) {
      return '[Bilibili字幕获取失败]'
    }
  }

  // 本地视频处理
  async processLocalVideo(filePath, options = {}) {
    try {
      // 使用ffmpeg提取音频，然后转文字
      // 这里需要ffmpeg支持
      return {
        subtitles: '[本地视频处理需要ffmpeg支持]',
        info: {
          platform: 'local',
          filePath
        }
      }
    } catch (error) {
      throw new Error(`本地视频处理失败: ${error.message}`)
    }
  }

  // 格式化视频内容
  formatVideoContent(subtitles, videoInfo) {
    let content = ''

    content += `## 视频信息\n\n`
    content += `- **平台**: ${videoInfo.platform || '未知'}\n`
    if (videoInfo.url) {
      content += `- **链接**: ${videoInfo.url}\n`
    }
    content += '\n'

    if (subtitles && subtitles !== '[YouTube视频字幕 - 请确保安装youtube-transcript包]') {
      content += `## 视频字幕内容\n\n${subtitles}\n\n`
    } else {
      content += `## 视频内容\n\n${subtitles}\n\n`
    }

    return content
  }

  // 视频URL辅助方法
  isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  isBilibiliUrl(url) {
    return url.includes('bilibili.com') || url.includes('b23.tv')
  }

  extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  extractBilibiliId(url) {
    const match = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  getVideoSource(url) {
    if (this.isYouTubeUrl(url)) return 'YouTube'
    if (this.isBilibiliUrl(url)) return 'Bilibili'
    if (this.isFilePath(url)) return '本地文件'
    return '未知'
  }

  // ==================== 音频处理 ====================

  async processAudio(input, options = {}) {
    this.stats.audioProcessed++

    const cacheKey = this.generateCacheKey('audio', input)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    let transcription = ''
    let audioInfo = {}

    // 获取音频数据
    let audioBuffer
    if (this.isUrl(input)) {
      audioBuffer = await this.fetchAudio(input)
      audioInfo.source = 'URL'
    } else if (this.isFilePath(input)) {
      audioBuffer = await this.readAudioFile(input)
      audioInfo.source = '本地文件'
    } else {
      throw new Error('无法识别的音频输入')
    }

    // 语音转文字
    transcription = await this.performSpeechToText(audioBuffer, options)

    const result = {
      content: this.formatAudioContent(transcription, audioInfo),
      metadata: {
        source: audioInfo.source,
        hasTranscription: transcription.length > 0,
        transcriptionLength: transcription.length
      }
    }

    this.cache.set(cacheKey, result)
    this.manageCacheSize()

    return result
  }

  // 语音转文字
  async performSpeechToText(audioBuffer, options = {}) {
    try {
      // 尝试使用whisper.cpp或OpenAI Whisper API
      if (options.whisperApiCaller) {
        return await options.whisperApiCaller(audioBuffer)
      }

      // 尝试本地whisper
      const whisper = await this.loadWhisper()
      if (whisper) {
        return await whisper(audioBuffer, options)
      }

      return '[音频转文字 - 请配置whisper或提供API调用器]'
    } catch (error) {
      console.error('语音转文字失败:', error.message)
      return '[音频转文字失败]'
    }
  }

  // 加载Whisper
  async loadWhisper() {
    try {
      // 尝试导入whisper模块
      // const whisper = await import('whisper-node')
      // return whisper.transcribe
      return null
    } catch {
      return null
    }
  }

  // 格式化音频内容
  formatAudioContent(transcription, audioInfo) {
    let content = ''

    content += `## 音频信息\n\n`
    content += `- **来源**: ${audioInfo.source || '未知'}\n\n`

    content += `## 转录内容\n\n${transcription}\n\n`

    return content
  }

  // 音频获取辅助方法
  async fetchAudio(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`获取音频失败: ${response.status}`)
      }
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      throw new Error(`获取音频URL失败: ${error.message}`)
    }
  }

  async readAudioFile(path) {
    try {
      const fs = await import('fs/promises')
      return await fs.readFile(path)
    } catch (error) {
      throw new Error(`读取音频文件失败: ${error.message}`)
    }
  }

  // ==================== 网页/博客处理 ====================

  async processUrl(url, options = {}) {
    this.stats.webPagesProcessed++

    const cacheKey = this.generateCacheKey('url', url)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // 获取网页内容
    const webContent = await this.fetchWebContent(url, options)

    // 提取主要内容
    const extractedContent = this.extractMainContent(webContent, options)

    const result = {
      content: this.formatWebContent(extractedContent, url),
      metadata: {
        url,
        title: extractedContent.title,
        contentLength: extractedContent.content.length,
        hasImages: extractedContent.images.length > 0
      }
    }

    this.cache.set(cacheKey, result)
    this.manageCacheSize()

    return result
  }

  // 获取网页内容
  async fetchWebContent(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MultiNoteSkill/1.0)'
        }
      })

      if (!response.ok) {
        throw new Error(`获取网页失败: ${response.status}`)
      }

      return await response.text()
    } catch (error) {
      throw new Error(`网页获取失败: ${error.message}`)
    }
  }

  // 提取网页主要内容
  extractMainContent(html, options = {}) {
    // 简单的HTML解析（生产环境建议使用cheerio或jsdom）
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : '未知标题'

    // 移除脚本和样式
    let content = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')

    // 提取段落文本
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

    // 提取图片
    const images = []
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    while ((match = imgRegex.exec(content)) !== null) {
      images.push(match[1])
    }

    // 提取标题结构
    const headings = []
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]+>/g, '').trim()
      })
    }

    return {
      title,
      content: paragraphs.join('\n\n'),
      images,
      headings
    }
  }

  // 格式化网页内容
  formatWebContent(extracted, url) {
    let content = ''

    content += `## 网页信息\n\n`
    content += `- **标题**: ${extracted.title}\n`
    content += `- **来源**: ${url}\n\n`

    if (extracted.headings.length > 0) {
      content += `## 文章结构\n\n`
      extracted.headings.forEach(h => {
        const prefix = '#'.repeat(h.level)
        content += `${prefix} ${h.text}\n`
      })
      content += '\n'
    }

    content += `## 正文内容\n\n${extracted.content}\n\n`

    if (extracted.images.length > 0) {
      content += `## 相关图片\n\n`
      extracted.images.slice(0, 10).forEach((img, i) => {
        content += `![图片${i + 1}](${img})\n`
      })
      content += '\n'
    }

    return content
  }

  // ==================== 文本处理 ====================

  processText(input, options = {}) {
    return {
      content: input,
      metadata: {
        length: input.length,
        wordCount: this.countWords(input)
      }
    }
  }

  // ==================== 工具方法 ====================

  // 生成缓存键
  generateCacheKey(type, input) {
    const hash = this.simpleHash(typeof input === 'string' ? input : 'binary')
    return `${type}_${hash}`
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

  // 字数统计
  countWords(text) {
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (text.match(/[a-zA-Z]+/g) || []).length
    return chinese + english
  }

  // 获取处理统计
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate: this.cache.size > 0 ? 
        `${((this.stats.totalProcessingTime > 0 ? 1 : 0) * 100).toFixed(1)}%` : '0%'
    }
  }

  // 清空缓存
  clearCache() {
    this.cache.clear()
  }

  // 检查依赖是否可用
  async checkDependencies() {
    const deps = {
      tesseract: false,
      youtubeTranscript: false,
      whisper: false,
      cheerio: false
    }

    try {
      await import('tesseract.js')
      deps.tesseract = true
    } catch {}

    try {
      await import('youtube-transcript')
      deps.youtubeTranscript = true
    } catch {}

    try {
      await import('whisper-node')
      deps.whisper = true
    } catch {}

    try {
      await import('cheerio')
      deps.cheerio = true
    } catch {}

    return deps
  }
}

// 便捷工厂函数
export function createMultimodalProcessor(options = {}) {
  return new MultimodalProcessor(options)
}

// 快速处理函数
export async function processMultimodal(input, options = {}) {
  const processor = createMultimodalProcessor(options)
  return await processor.process(input, options)
}
