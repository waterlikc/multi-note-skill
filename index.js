import { SceneDetector } from './core/scene-detector.js'
import { TemplateManager } from './core/template-manager.js'
import { ExportManager } from './core/export-manager.js'
import { MultimodalProcessor } from './core/multimodal-processor.js'

const detector = new SceneDetector()
const templateManager = new TemplateManager()
const exportManager = new ExportManager()
const multimodalProcessor = new MultimodalProcessor()

// 🆕 多模态输入类型检测
function isMultimodalInput(content) {
    if (typeof content !== 'string') return false
    
    // URL检测
    if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(content)) return true
    if (content.includes('youtube.com') || content.includes('youtu.be')) return true
    if (content.includes('bilibili.com') || content.includes('b23.tv')) return true
    if (/\.(mp4|avi|mov|mkv|webm|mp3|wav|ogg|m4a)(\?.*)?$/i.test(content)) return true
    
    // 文件路径检测
    if (/^[a-zA-Z]:\\/.test(content) || /^\//.test(content)) {
        const ext = content.match(/\.[^.]+$/)?.[0]?.toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3', '.wav'].includes(ext)) return true
    }
    
    // Base64检测
    if (content.startsWith('data:image/') || content.startsWith('data:video/') || content.startsWith('data:audio/')) return true
    
    return false
}

// 🔧 优化: 预设配置
const presets = {
    tech: {
        scene: 'tech',
        style: 'style-a',
        structure: ['概念→语法→示例→实践→总结']
    },
    course: {
        scene: 'course',
        style: 'style-a',
        structure: ['框架→概念→重点→易错→总结']
    },
    science: {
        scene: 'science',
        style: 'style-a',
        structure: ['现象→原理→应用→思考→总结']
    },
    reading: {
        scene: 'reading',
        style: 'style-a',
        structure: ['概述→人物→主题→感悟→总结']
    },
    meeting: {
        scene: 'meeting',
        style: 'style-b',
        structure: ['议程→要点→讨论→决策→总结']
    },
    research: {
        scene: 'research',
        style: 'style-a',
        structure: ['背景→方法→发现→结论→建议']
    },
    project: {
        scene: 'project',
        style: 'style-b',
        structure: ['背景→进展→成果→问题→计划']
    }
}

export async function generateNote(input = {}, options = {}) {
    // input can be either { content: string, title, subtitle, date, style, scene }
    // 🆕 现在也支持 { content: 'image/video/audio URL', multimodal: true }
    // 🔧 优化: 支持预设配置 { content: '...', preset: 'tech' }
    const { content, title = 'Untitled', subtitle = '', date = new Date().toISOString().split('T')[0], style, preset } = input
    
    // 🔧 优化: 应用预设配置
    let finalStyle = style
    let finalScene = input.scene
    
    if (preset && presets[preset]) {
        const presetConfig = presets[preset]
        finalStyle = finalStyle || presetConfig.style
        finalScene = finalScene || presetConfig.scene
    }
    
    // 🔧 优化: 进度回调
    const onProgress = options.onProgress || (() => {})

    // 🔧 优化: 友好的错误提示
    if (!content || typeof content !== 'string') {
        throw new Error(
            '❌ 内容不能为空\n\n' +
            '💡 请提供以下任一输入：\n' +
            '   - 文本内容：{ content: "你的笔记内容" }\n' +
            '   - 图片URL：{ content: "https://example.com/image.png" }\n' +
            '   - 视频链接：{ content: "https://youtube.com/watch?v=xxx" }\n' +
            '   - 网页URL：{ content: "https://blog.example.com/article" }\n\n' +
            '📖 详细文档：SKILL.md'
        )
    }

    // 🆕 多模态处理
    let processedContent = content
    let multimodalMetadata = null

    onProgress({ step: 'detecting', progress: 10, message: '检测输入类型...' })

    if (isMultimodalInput(content) || input.multimodal) {
        try {
            onProgress({ step: 'multimodal', progress: 20, message: '处理多模态输入...' })
            
            const result = await multimodalProcessor.process(content, {
                aiVisionEnabled: input.aiVisionEnabled || false,
                visionApiCaller: input.visionApiCaller,
                whisperApiCaller: input.whisperApiCaller
            })
            
            if (result.success) {
                processedContent = result.content
                multimodalMetadata = {
                    inputType: result.inputType,
                    ...result.metadata
                }
            }
        } catch (error) {
            console.warn('多模态处理失败，使用原始内容:', error.message)
        }
    }

    onProgress({ step: 'analyzing', progress: 40, message: '分析内容结构...' })

    // scene detection if not provided
    let scene = finalScene
    if (!scene) {
        scene = detector.detect(processedContent)
    }

    onProgress({ step: 'template', progress: 60, message: '选择模板...' })

    // style recommendation
    const recommended = templateManager.getRecommendedTemplate(scene)
    const chosenStyle = finalStyle || recommended.id || 'style-a'

    const noteData = {
        title: title === 'Untitled' && multimodalMetadata ? 
            generateTitleFromMultimodal(multimodalMetadata) : title,
        subtitle,
        date,
        scene,
        style: chosenStyle,
        content: processedContent,
        // 🆕 多模态元数据
        multimodal: multimodalMetadata
    }

    onProgress({ step: 'generating', progress: 80, message: '生成笔记...' })

    // produce exports
    const html = exportManager.exportToHtml(noteData)
    const markdown = exportManager.exportToMarkdown(noteData)
    const json = exportManager.exportToJson(noteData)
    const pdfInfo = await exportManager.exportToPdf(noteData, html)

    onProgress({ step: 'complete', progress: 100, message: '完成！' })

    return {
        metadata: {
            title: noteData.title,
            subtitle: noteData.subtitle,
            date: noteData.date,
            scene: noteData.scene,
            style: noteData.style,
            // 🆕 多模态信息
            multimodal: multimodalMetadata
        },
        html,
        markdown,
        json,
        pdfInfo
    }
}

// 🆕 从多模态元数据生成标题
function generateTitleFromMultimodal(metadata) {
    const typeMap = {
        'image': '图片笔记',
        'video': '视频笔记',
        'audio': '音频笔记',
        'url': '网页笔记'
    }
    
    const baseTitle = typeMap[metadata.inputType] || '学习笔记'
    const date = new Date().toLocaleDateString('zh-CN')
    return `${baseTitle} - ${date}`
}

// 🆕 笔记更新功能
export async function updateNote(options = {}) {
    const { existingNote, newContent, mergeStrategy = 'append' } = options
    
    if (!existingNote || !newContent) {
        throw new Error(
            '❌ 更新笔记需要提供：\n' +
            '   - existingNote: 已有笔记的HTML内容\n' +
            '   - newContent: 要添加的新内容（Markdown格式）\n' +
            '   - mergeStrategy: 合并策略 (append/merge/replace)'
        )
    }
    
    // 提取原有笔记的标题
    const existingTitle = extractTitleFromHtml(existingNote) || '更新后的笔记'
    
    // 根据策略合并内容
    let mergedContent
    switch (mergeStrategy) {
        case 'append':
            // 直接追加新内容
            mergedContent = newContent
            break
        case 'merge':
            // 智能合并
            const existingContent = extractContentFromHtml(existingNote)
            mergedContent = mergeContent(existingContent, newContent)
            break
        case 'replace':
            mergedContent = newContent
            break
        default:
            mergedContent = newContent
    }
    
    // 重新生成笔记
    return await generateNote({
        content: mergedContent,
        title: existingTitle
    })
}

// 🆕 合并多个笔记
export async function mergeNotes(options = {}) {
    const { notes, title = '合并笔记' } = options
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
        throw new Error(
            '❌ 合并笔记需要提供：\n' +
            '   - notes: 笔记数组 [{content: "..."}, {content: "..."}]\n' +
            '   - title: 合并后的标题'
        )
    }
    
    // 合并所有笔记内容
    const contents = notes.map(note => {
        if (typeof note === 'string') {
            // 如果是HTML，提取内容
            if (note.includes('<!DOCTYPE html>')) {
                return extractContentFromHtml(note)
            }
            return note
        }
        return note.content || ''
    })
    
    const mergedContent = contents.filter(c => c.trim()).join('\n\n---\n\n')
    
    // 生成合并后的笔记
    return await generateNote({
        content: mergedContent,
        title
    })
}

// 辅助函数：从HTML中提取内容
function extractContentFromHtml(html) {
    // 尝试提取 <!-- ===== 内容段落示例 ===== --> 之后的内容
    const contentStart = html.indexOf('<!-- ===== 内容段落示例 ===== -->')
    if (contentStart !== -1) {
        // 提取从内容开始到 <!-- ===== 流程图示例 ===== --> 或脚本标签之前的内容
        let content = html.substring(contentStart)
        
        // 移除结束标记
        const endIndex = content.indexOf('<!-- ===== 流程图示例 ===== -->')
        if (endIndex !== -1) {
            content = content.substring(0, endIndex)
        }
        
        // 移除脚本标签
        const scriptIndex = content.indexOf('<script>')
        if (scriptIndex !== -1) {
            content = content.substring(0, scriptIndex)
        }
        
        // 清理HTML标签，保留文本内容
        content = content
            .replace(/<!--.*?-->/gs, '') // 移除注释
            .replace(/<style[\s\S]*?<\/style>/gi, '') // 移除样式
            .replace(/<script[\s\S]*?<\/script>/gi, '') // 移除脚本
            .replace(/<div class="divider[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '') // 移除分割线
            .replace(/<div class="date-badge[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '') // 移除日期徽章
            .replace(/<div class="section">/gi, '\n') // 章节分隔
            .replace(/<\/div>/gi, '')
            .replace(/<div[^>]*>/gi, '')
            .replace(/<span[^>]*>/gi, '')
            .replace(/<\/span>/gi, '')
            .replace(/<strong>/gi, '**')
            .replace(/<\/strong>/gi, '**')
            .replace(/<em>/gi, '*')
            .replace(/<\/em>/gi, '*')
            .replace(/<pre><code>/gi, '\n```\n')
            .replace(/<\/code><\/pre>/gi, '\n```\n')
            .replace(/<li>/gi, '- ')
            .replace(/<\/li>/gi, '\n')
            .replace(/<[^>]+>/g, '') // 移除其他标签
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
        
        return content
    }
    
    // 备用方案：提取所有文本内容
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

// 辅助函数：从HTML中提取标题
function extractTitleFromHtml(html) {
    const titleMatch = html.match(/<div class="title[^"]*"[^>]*>([\s\S]*?)<\/div>/)
    if (titleMatch) {
        return titleMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
    }
    return null
}

// 辅助函数：智能合并内容
function mergeContent(existing, newContent) {
    // 检查是否有重复内容
    const existingLines = existing.split('\n').filter(line => line.trim())
    const newLines = newContent.split('\n').filter(line => line.trim())
    
    // 简单的去重逻辑
    const uniqueNewLines = newLines.filter(line => {
        return !existingLines.some(existingLine => 
            existingLine.includes(line) || line.includes(existingLine)
        )
    })
    
    return existing + '\n\n---\n\n' + uniqueNewLines.join('\n')
}

// 🆕 从图片生成笔记
export async function generateNoteFromImage(imageSource, options = {}) {
    return generateNote({
        content: imageSource,
        title: options.title,
        subtitle: options.subtitle,
        date: options.date,
        multimodal: true,
        image: true
    }, options)
}

// 🆕 从视频生成笔记
export async function generateNoteFromVideo(videoSource, options = {}) {
    return generateNote({
        content: videoSource,
        title: options.title,
        subtitle: options.subtitle,
        date: options.date,
        multimodal: true,
        video: true
    }, options)
}

// 🆕 从音频生成笔记
export async function generateNoteFromAudio(audioSource, options = {}) {
    return generateNote({
        content: audioSource,
        title: options.title,
        subtitle: options.subtitle,
        date: options.date,
        multimodal: true,
        audio: true
    }, options)
}

// 🆕 从网页URL生成笔记
export async function generateNoteFromUrl(url, options = {}) {
    return generateNote({
        content: url,
        title: options.title,
        subtitle: options.subtitle,
        date: options.date,
        multimodal: true
    }, options)
}

// 🆕 批量多模态处理
export async function processMultimodalBatch(inputs, options = {}) {
    return await multimodalProcessor.processBatch(inputs, options)
}

// 🆕 检查多模态依赖
export async function checkMultimodalDependencies() {
    return await multimodalProcessor.checkDependencies()
}

export function getSupportedFormats() {
    return exportManager.getSupportedFormats()
}

// 🆕 获取支持的多模态输入类型
export function getSupportedMultimodalTypes() {
    return {
        image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
        video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'],
        audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
        url: ['YouTube', 'Bilibili', 'any webpage']
    }
}

// 🆕 获取预设配置列表
export function getAvailablePresets() {
    return Object.keys(presets).map(key => ({
        id: key,
        scene: presets[key].scene,
        style: presets[key].style
    }))
}

// 🆕 获取场景检测器缓存统计
export function getSceneDetectorStats() {
    return detector.getCacheStats()
}

export function getSkillInfo() {
    return {
        name: 'multi-note-skill',
        version: '2.0.0',
        description: 'Multi-scene note generation skill with multimodal support',
        entry: 'index.js',
        // 🆕 新增功能列表
        features: [
            '多场景笔记生成',
            '图片OCR文字识别',
            '视频字幕提取',
            '音频转文字',
            '网页内容提取',
            '精美HTML模板',
            '笔记更新功能',
            '笔记合并功能',
            '进度显示',
            '预设配置'
        ]
    }
}
