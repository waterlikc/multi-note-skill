// 结构化导出系统 - 优化版
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class ExportManager {
  constructor() {
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
    
    // 🔧 优化1: 预加载模板到内存
    this.templates = this.preloadTemplates()
    
    // 🔧 优化2: 预编译正则表达式
    this.regexCache = this.precompileRegexes()
  }

  // 预加载所有模板文件
  preloadTemplates() {
    const templates = {}
    const templateFiles = ['template-a.html', 'template-b.html', 'template-c.html']
    
    for (const file of templateFiles) {
      try {
        const templatePath = join(__dirname, '..', 'assets', file)
        templates[file] = readFileSync(templatePath, 'utf-8')
      } catch (error) {
        console.warn(`模板加载失败: ${file}`, error.message)
      }
    }
    
    return templates
  }

  // 预编译常用正则表达式
  precompileRegexes() {
    return {
      // 标题正则
      headings: {
        h1: /^# (.*$)/gm,
        h2: /^## (.*$)/gm,
        h3: /^### (.*$)/gm
      },
      // 格式正则
      formatting: {
        bold: /\*\*(.*?)\*\*/g,
        italic: /\*(.*?)\*/g,
        code: /`([^`]+)`/g,
        highlight: /==(.*?)==/g
      },
      // 组件正则
      components: {
        image: /!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,
        link: /\[([^\]]+)\]\(([^)]+)\)/g,
        codeBlock: /```(\w*)\n([\s\S]*?)```/g
      },
      // 自定义块正则
      customBlock: /^:::(\w+)(?:\s+(.*))?$/,
      // 列表正则
      lists: {
        unordered: /^\s*[-*+]\s+(.*$)/gm,
        ordered: /^\s*\d+\.\s+(.*$)/gm
      }
    }
  }

  // 导出为JSON格式
  exportToJson(noteData) {
    try {
      const jsonExport = {
        metadata: {
          title: noteData.title,
          subtitle: noteData.subtitle,
          date: noteData.date,
          scene: noteData.scene,
          style: noteData.style,
          createdAt: new Date().toISOString(),
          version: '2.0.0'
        },
        content: noteData.content,
        structure: this.analyzeStructure(noteData.content),
        components: this.extractComponents(noteData.content),
        assets: this.listAssets(noteData.content)
      }
      
      return JSON.stringify(jsonExport, null, 2)
    } catch (error) {
      throw new Error('JSON导出失败: ' + error.message)
    }
  }

  // 导出为Markdown格式
  exportToMarkdown(noteData) {
    try {
      let markdown = `# ${noteData.title}\n\n`
      
      if (noteData.subtitle) {
        markdown += `## ${noteData.subtitle}\n\n`
      }
      
      if (noteData.date) {
        markdown += `**日期**: ${noteData.date}\n\n`
      }
      
      // 转换HTML内容为Markdown
      markdown += this.htmlToMarkdown(noteData.content)
      
      return markdown
    } catch (error) {
      throw new Error('Markdown导出失败: ' + error.message)
    }
  }

  // 导出为PDF格式 (需要html2pdf.js库)
  async exportToPdf(noteData, htmlContent) {
    return new Promise((resolve, reject) => {
      try {
        // 这里需要集成html2pdf.js库
        // 由于是客户端导出，需要浏览器环境
        const options = {
          margin: 10,
          filename: `${noteData.title}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }
        
        // 模拟PDF导出 - 实际使用时需要html2pdf.js
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

  // 导出为HTML格式 - 使用学霸笔记模板（优化版）
  exportToHtml(noteData) {
    try {
      // 🔧 优化: 使用预加载的模板
      let template = this.templates['template-a.html']
      
      if (!template) {
        throw new Error('模板加载失败，请检查 assets/template-a.html 文件')
      }
      
      // 将Markdown内容转换为笔记本样式的HTML
      const notebookContent = this.markdownToNotebookHtml(noteData.content)
      
      // 场景标签映射
      const sceneLabels = {
        tech: '技术学习',
        course: '课堂学习',
        science: '科普知识',
        reading: '读书笔记',
        meeting: '会议纪要',
        research: '调研分析',
        project: '项目报告',
        outline: '课程大纲',
        creative: '创意写作',
        life: '生活记录',
        // 兼容旧版本
        technical: '技术学习',
        classroom: '课堂学习'
      }
      
      const sceneLabel = sceneLabels[noteData.scene] || ''
      const subtitleText = noteData.subtitle 
        ? `${noteData.subtitle} | ${noteData.date}`
        : noteData.date

      // 替换标题（保持完整结构）
      template = template.replace(
        /<!-- ===== 笔记标题 ===== -->[\s\S]*?<\/div>\s*<!-- ===== 副标题\/日期 ===== -->/,
        `<!-- ===== 笔记标题 ===== -->
    <div class="title write-in" style="animation-delay:0.1s">
      ${this.escapeHtml(noteData.title)}
      <div class="title-underline"></div>
    </div>

    <!-- ===== 副标题/日期 ===== -->`
      )

      // 替换副标题（保持完整结构）
      template = template.replace(
        /<!-- ===== 副标题\/日期 ===== -->[\s\S]*?<\/div>\s*<!-- ===== 内容段落示例 ===== -->/,
        `<!-- ===== 副标题/日期 ===== -->
    <div class="subtitle write-in" style="animation-delay:0.3s">
      ${this.escapeHtml(subtitleText)} ${sceneLabel ? `| ${sceneLabel}` : ''}
    </div>

    <!-- ===== 内容段落示例 ===== -->`
      )

      // 替换内容示例（替换整个section）
      template = template.replace(
        /<!-- ===== 内容段落示例 ===== -->[\s\S]*?<!-- ===== 流程图示例 ===== -->/,
        `<!-- ===== 内容段落示例 ===== -->
${notebookContent}

    <!-- ===== 流程图示例 ===== -->`
      )

      // 更新页面标题
      template = template.replace(
        '<title>[必填] 替换为笔记标题</title>',
        `<title>${this.escapeHtml(noteData.title)}</title>`
      )
      
      return template
    } catch (error) {
      throw new Error('HTML导出失败: ' + error.message)
    }
  }

  // 获取模板（使用预加载的模板）
  getTemplate(templatePath) {
    const fileName = templatePath.split('\\').pop().split('/').pop()
    return this.templates[fileName] || null
  }

  // Markdown转笔记本样式HTML（带write-in动画）
  markdownToNotebookHtml(markdown) {
    if (!markdown) return ''
    
    const lines = markdown.split('\n')
    const htmlParts = []
    let animationIndex = 0
    let inCodeBlock = false
    let codeBlockContent = ''
    let codeBlockLang = ''
    let inList = false
    let listItems = []
    let listType = 'ul'
    let paragraphBuffer = []
    let currentSection = null
    
    const getDelay = (index) => {
      // 从0.5s开始，每个元素递增0.15s
      return (0.5 + index * 0.15).toFixed(2)
    }
    
    const flushParagraph = () => {
      if (paragraphBuffer.length > 0) {
        const content = paragraphBuffer.join(' ').trim()
        if (content) {
          // 检查是否包含图片
          const imageRegex = /!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g
          let lastIndex = 0
          let match
          let hasImages = false
          const parts = []
          
          while ((match = imageRegex.exec(content)) !== null) {
            hasImages = true
            // 添加图片前的文本
            if (match.index > lastIndex) {
              const textBefore = content.slice(lastIndex, match.index)
              if (textBefore.trim()) {
                parts.push(this.inlineMarkdownToHtml(textBefore))
              }
            }
            
            // 添加图片（带错误处理）
            const alt = match[1] || ''
            const url = match[2]
            const caption = match[3] || alt
            
            parts.push(`<div class="note-image polaroid write-in" style="animation-delay:${getDelay(animationIndex)}s">
              ${this.createImageTag(url, alt, caption)}
            </div>`)
            animationIndex++
            
            lastIndex = match.index + match[0].length
          }
          
          if (hasImages) {
            // 添加图片后的文本
            if (lastIndex < content.length) {
              const textAfter = content.slice(lastIndex)
              if (textAfter.trim()) {
                parts.push(this.inlineMarkdownToHtml(textAfter))
              }
            }
            
            const contentHtml = parts.join('\n')
            if (currentSection) {
              currentSection.content += '\n' + contentHtml
            } else {
              htmlParts.push(contentHtml)
            }
          } else {
            // 没有图片，正常处理
            const contentHtml = `<div class="content write-in" style="animation-delay:${getDelay(animationIndex)}s">
              ${this.inlineMarkdownToHtml(content)}
            </div>`
            
            if (currentSection) {
              currentSection.content += '\n' + contentHtml
            } else {
              htmlParts.push(contentHtml)
            }
          }
          animationIndex++
        }
        paragraphBuffer = []
      }
    }
    
    const flushList = () => {
      if (listItems.length > 0) {
        const listHtml = `<div class="content write-in" style="animation-delay:${getDelay(animationIndex)}s">
          <${listType}>
            ${listItems.map(item => `<li>${this.inlineMarkdownToHtml(item)}</li>`).join('\n')}
          </${listType}>
        </div>`
        
        if (currentSection) {
          currentSection.content += '\n' + listHtml
        } else {
          htmlParts.push(listHtml)
        }
        animationIndex++
        listItems = []
        inList = false
      }
    }
    
    const flushSection = () => {
      if (currentSection) {
        htmlParts.push(`<div class="section">
          <div class="section-title write-in" style="animation-delay:${currentSection.delay}s">
            ${currentSection.title}
            <div class="marker-underline"></div>
          </div>
          ${currentSection.content}
        </div>`)
        currentSection = null
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()
      
      // 处理代码块
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // 结束代码块
          const codeHtml = `<div class="code-block write-in" style="animation-delay:${getDelay(animationIndex)}s">
            <pre><code>${this.escapeHtml(codeBlockContent.trim())}</code></pre>
          </div>`
          
          if (currentSection) {
            currentSection.content += '\n' + codeHtml
          } else {
            htmlParts.push(codeHtml)
          }
          animationIndex++
          inCodeBlock = false
          codeBlockContent = ''
          codeBlockLang = ''
        } else {
          // 开始代码块
          flushParagraph()
          flushList()
          inCodeBlock = true
          codeBlockLang = trimmedLine.slice(3).trim()
        }
        continue
      }
      
      if (inCodeBlock) {
        codeBlockContent += line + '\n'
        continue
      }
      
      // 处理自定义块语法 :::type
      const customBlockMatch = trimmedLine.match(/^:::(\w+)(?:\s+(.*))?$/)
      if (customBlockMatch) {
        flushParagraph()
        flushList()
        
        const blockType = customBlockMatch[1].toLowerCase()
        const blockContent = customBlockMatch[2] || ''
        
        // 如果是开始标记，收集内容直到结束标记或空行
        if (blockContent === '') {
          let blockLines = []
          i++
          while (i < lines.length) {
            const currentLine = lines[i].trim()
            // 遇到结束标记、新的:::块、或空行（对于某些块类型）时停止
            if (currentLine === ':::' || currentLine.match(/^:::(\w+)/)) {
              break
            }
            // 对于grid、steps、compare、flow等块，遇到空行也停止
            if (currentLine === '' && ['grid', 'steps', 'compare', 'flow'].includes(blockType)) {
              break
            }
            blockLines.push(lines[i])
            i++
          }
          const fullContent = blockLines.join('\n')
          const blockHtml = this.processCustomBlock(blockType, fullContent, getDelay, animationIndex)
          
          if (currentSection) {
            currentSection.content += '\n' + blockHtml
          } else {
            htmlParts.push(blockHtml)
          }
        } else {
          // 单行内容
          const blockHtml = this.processCustomBlock(blockType, blockContent, getDelay, animationIndex)
          
          if (currentSection) {
            currentSection.content += '\n' + blockHtml
          } else {
            htmlParts.push(blockHtml)
          }
        }
        animationIndex++
        continue
      }
      
      // 处理独立图片行（支持多种格式）
      const imageMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)$/)
      const imageGridMatch = trimmedLine.match(/^image-grid:\s*(.+)$/)
      
      if (imageMatch) {
        // 单张图片
        flushParagraph()
        flushList()
        
        const alt = imageMatch[1] || ''
        const url = imageMatch[2]
        const caption = imageMatch[3] || alt
        
        const imageHtml = `<div class="note-image polaroid write-in" style="animation-delay:${getDelay(animationIndex)}s">
          ${this.createImageTag(url, alt, caption)}
        </div>`
        
        if (currentSection) {
          currentSection.content += '\n' + imageHtml
        } else {
          htmlParts.push(imageHtml)
        }
        animationIndex++
        continue
      }
      
      if (imageGridMatch) {
        // 图片网格（格式：image-grid: url1, url2, url3）
        flushParagraph()
        flushList()
        
        const urls = imageGridMatch[1].split(',').map(u => u.trim())
        const gridHtml = `<div class="image-grid write-in" style="animation-delay:${getDelay(animationIndex)}s">
          ${urls.map((url, idx) => `<div class="note-image">
            ${this.createImageTag(url, `图片${idx + 1}`, '')}
          </div>`).join('\n')}
        </div>`
        
        if (currentSection) {
          currentSection.content += '\n' + gridHtml
        } else {
          htmlParts.push(gridHtml)
        }
        animationIndex++
        continue
      }
      
      // 处理标题
      if (trimmedLine.startsWith('#')) {
        flushParagraph()
        flushList()
        
        const match = trimmedLine.match(/^(#{1,3})\s+(.*)$/)
        if (match) {
          const level = match[1].length
          const title = match[2]
          
          if (level === 1) {
            // 主标题 - 使用divider样式
            flushSection()
            htmlParts.push(`<div class="divider write-in" style="animation-delay:${getDelay(animationIndex)}s">
              <span class="divider-text">${this.inlineMarkdownToHtml(title)}</span>
            </div>`)
            animationIndex++
          } else if (level === 2) {
            // 二级标题 - 开始新的section
            flushSection()
            currentSection = {
              title: this.inlineMarkdownToHtml(title),
              delay: getDelay(animationIndex),
              content: ''
            }
            animationIndex++
          } else {
            // 三级标题 - 作为内容中的强调标题
            const contentHtml = `<div class="content write-in" style="animation-delay:${getDelay(animationIndex)}s">
              <strong class="red-text">${this.inlineMarkdownToHtml(title)}</strong>
            </div>`
            
            if (currentSection) {
              currentSection.content += '\n' + contentHtml
            } else {
              htmlParts.push(contentHtml)
            }
            animationIndex++
          }
        }
        continue
      }
      
      // 处理列表
      if (trimmedLine.match(/^[-*+]\s+/)) {
        flushParagraph()
        if (!inList) {
          inList = true
          listType = 'ul'
        }
        listItems.push(trimmedLine.replace(/^[-*+]\s+/, ''))
        continue
      }
      
      if (trimmedLine.match(/^\d+\.\s+/)) {
        flushParagraph()
        if (!inList) {
          inList = true
          listType = 'ol'
        }
        listItems.push(trimmedLine.replace(/^\d+\.\s+/, ''))
        continue
      }
      
      // 遇到非列表行，刷新列表
      if (inList && trimmedLine === '') {
        flushList()
        continue
      }
      
      // 处理分割线
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        flushParagraph()
        flushList()
        flushSection()
        htmlParts.push(`<hr class="write-in" style="animation-delay:${getDelay(animationIndex)}s">`)
        animationIndex++
        continue
      }
      
      // 处理空行
      if (trimmedLine === '') {
        flushParagraph()
        continue
      }
      
      // 普通段落
      inList = false
      paragraphBuffer.push(trimmedLine)
    }
    
    // 刷新剩余内容
    flushParagraph()
    flushList()
    flushSection()
    
    return htmlParts.join('\n')
  }

  // 处理:::type语法块
  processCustomBlock(type, content, getDelay, animationIndex) {
    const delay = getDelay(animationIndex)
    const escapedContent = this.escapeHtml(content.trim())
    const inlineContent = this.inlineMarkdownToHtml(content.trim())
    
    switch (type) {
      case 'question':
        return `<div class="question-box write-in" style="animation-delay:${delay}s">
          ${inlineContent}
        </div>`
      
      case 'warning':
        return `<div class="big-warning write-in" style="animation-delay:${delay}s">
          ${inlineContent}
        </div>`
      
      case 'tip':
      case 'info':
        return `<div class="side-note write-in" style="animation-delay:${delay}s">
          <strong>${type === 'tip' ? '提示' : '信息'}：</strong>${inlineContent}
        </div>`
      
      case 'success':
      case 'check':
        return `<div class="safe-box write-in" style="animation-delay:${delay}s">
          <div class="safe-row">
            <span class="safe-check">&#10003;</span>
            <span>${inlineContent}</span>
          </div>
        </div>`
      
      case 'error':
      case 'danger':
        return `<div class="safe-box write-in" style="animation-delay:${delay}s">
          <div class="safe-row">
            <span class="cross-mark">&#10007;</span>
            <span>${inlineContent}</span>
          </div>
        </div>`
      
      case 'summary':
        return `<div class="summary-box write-in" style="animation-delay:${delay}s">
          <div class="summary-title">总结</div>
          <div class="content">${inlineContent}</div>
        </div>`
      
      case 'compare':
        // 解析对比表格内容
        const compareRows = content.trim().split('\n').filter(line => line.includes('|'))
        if (compareRows.length > 0) {
          let compareHtml = `<div class="compare-box write-in" style="animation-delay:${delay}s">`
          compareRows.forEach(row => {
            const cells = row.split('|').filter(c => c.trim())
            if (cells.length >= 2) {
              const label = cells[0].trim()
              const value = cells[1].trim()
              const labelClass = label.includes('旧') || label.includes('之前') ? 'old' : 
                                label.includes('新') || label.includes('之后') ? 'new' : ''
              compareHtml += `<div class="compare-row">
                <span class="compare-label ${labelClass}">${this.escapeHtml(label)}</span>
                <span>${this.escapeHtml(value)}</span>
              </div>`
            }
          })
          compareHtml += `</div>`
          return compareHtml
        }
        return `<div class="content write-in" style="animation-delay:${delay}s">${inlineContent}</div>`
      
      case 'steps':
        // 解析步骤内容
        const steps = content.trim().split('\n').filter(line => line.match(/^\d+\./))
        if (steps.length > 0) {
          let stepsHtml = `<div class="attack-flow write-in" style="animation-delay:${delay}s">`
          steps.forEach((step, index) => {
            const stepText = step.replace(/^\d+\.\s*/, '')
            stepsHtml += `<div class="attack-step">
              <span class="step-num">${index + 1}</span>
              <span>${this.inlineMarkdownToHtml(stepText)}</span>
            </div>`
          })
          stepsHtml += `</div>`
          return stepsHtml
        }
        return `<div class="content write-in" style="animation-delay:${delay}s">${inlineContent}</div>`
      
      case 'flow':
        // 解析流程内容
        const flowItems = content.trim().split('->').map(item => item.trim())
        if (flowItems.length > 1) {
          let flowHtml = `<div class="flow-box write-in" style="animation-delay:${delay}s">`
          flowItems.forEach((item, index) => {
            flowHtml += `<span class="flow-item">${this.escapeHtml(item)}</span>`
            if (index < flowItems.length - 1) {
              flowHtml += `<span class="flow-arrow">&#10142;</span>`
            }
          })
          flowHtml += `</div>`
          return flowHtml
        }
        return `<div class="content write-in" style="animation-delay:${delay}s">${inlineContent}</div>`
      
      case 'grid':
        // 解析网格内容
        const gridItems = content.trim().split('\n').filter(line => line.trim())
        if (gridItems.length > 0) {
          let gridHtml = `<div class="os-grid write-in" style="animation-delay:${delay}s">`
          gridItems.forEach(item => {
            const isDanger = item.includes('!') || item.includes('警告') || item.includes('危险')
            gridHtml += `<span class="os-item ${isDanger ? 'danger' : ''}">${this.escapeHtml(item.replace('!', '').trim())}</span>`
          })
          gridHtml += `</div>`
          return gridHtml
        }
        return `<div class="content write-in" style="animation-delay:${delay}s">${inlineContent}</div>`
      
      case 'badge':
        // 解析徽章内容
        const badges = content.trim().split('|').map(b => b.trim()).filter(b => b)
        if (badges.length > 0) {
          let badgeHtml = `<div class="date-badge write-in" style="animation-delay:${delay}s">`
          const colors = ['', 'blue', 'green', 'purple', 'orange']
          badges.forEach((badge, index) => {
            const colorClass = colors[index % colors.length]
            badgeHtml += `<span class="badge ${colorClass}">${this.escapeHtml(badge)}</span>`
          })
          badgeHtml += `</div>`
          return badgeHtml
        }
        return `<div class="content write-in" style="animation-delay:${delay}s">${inlineContent}</div>`
      
      default:
        // 默认作为普通内容处理
        return `<div class="content write-in" style="animation-delay:${delay}s">${inlineContent}</div>`
    }
  }

  // 创建带错误处理的图片标签
  createImageTag(url, alt, caption) {
    const escapedAlt = this.escapeHtml(alt || '图片')
    const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f5f5f5' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${escapedAlt}%3C/text%3E%3C/svg%3E`
    
    let imgTag = `<img src="${url}" alt="${escapedAlt}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackSvg}';this.classList.add('image-error')">`
    
    if (caption) {
      imgTag += `\n<span class="image-caption">${this.escapeHtml(caption)}</span>`
    }
    
    return imgTag
  }

  // 内联Markdown转HTML（处理粗体、斜体、行内代码、链接等）- 优化版
  inlineMarkdownToHtml(text) {
    if (!text) return ''
    
    let html = text
    
    // 🔧 优化: 使用预编译的正则表达式
    const { formatting, components } = this.regexCache
    
    // 行内代码
    html = html.replace(formatting.code, '<span class="code-term">$1</span>')
    
    // 粗体
    html = html.replace(formatting.bold, '<strong>$1</strong>')
    
    // 斜体
    html = html.replace(formatting.italic, '<em>$1</em>')
    
    // 高亮标记
    html = html.replace(formatting.highlight, '<span class="highlight">$1</span>')
    
    // 链接
    html = html.replace(components.link, '<a href="$2">$1</a>')
    
    return html
  }

  // HTML转Markdown (简化版)
  htmlToMarkdown(html) {
    let markdown = html
    
    // 标题转换
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    
    // 粗体斜体
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    
    // 代码块
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```')
    
    // 链接
    markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // 列表
    markdown = markdown.replace(/<ul[^>]*>/gi, '')
    markdown = markdown.replace(/<\/ul>/gi, '')
    markdown = markdown.replace(/<ol[^>]*>/gi, '')
    markdown = markdown.replace(/<\/ol>/gi, '')
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    
    // 段落
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    
    // 清理多余空白
    markdown = markdown.replace(/\n{3,}/g, '\n\n')
    
    return markdown
  }

  // 分析内容结构
  analyzeStructure(content) {
    const structure = {
      sections: [],
      components: [],
      wordCount: content.split(/\s+/).length,
      characterCount: content.length
    }
    
    // 提取章节
    const sectionRegex = /#{1,3}\s+(.*)/g
    let match
    while ((match = sectionRegex.exec(content)) !== null) {
      structure.sections.push(match[1].trim())
    }
    
    return structure
  }

  // 提取组件信息
  extractComponents(content) {
    const components = []
    const componentTypes = [
      'code-block', 'flow-box', 'compare-box', 'side-note',
      'big-warning', 'question-box', 'safe-box', 'config-box',
      'concept-cards', 'attack-chain', 'sticky-note'
    ]
    
    for (const type of componentTypes) {
      const regex = new RegExp(`\\*\\*.*${type}.*\\*\\*`, 'gi')
      const matches = content.match(regex)
      if (matches) {
        components.push({
          type: type,
          count: matches.length
        })
      }
    }
    
    // 统计代码块
    const codeBlockRegex = /```[\s\S]*?```/g
    const codeBlocks = content.match(codeBlockRegex)
    if (codeBlocks) {
      components.push({
        type: 'code-block',
        count: codeBlocks.length
      })
    }
    
    return components
  }

  // 列出资源文件
  listAssets(content) {
    const assets = []
    
    // 提取图片链接（简化版）
    const urlRegex = /https?:\/\/[^\s\)]+/g
    let match
    while ((match = urlRegex.exec(content)) !== null) {
      assets.push({
        type: 'link',
        url: match[0]
      })
    }
    
    return assets
  }

  // 获取支持的导出格式
  getSupportedFormats() {
    return Object.keys(this.exportFormats)
  }

  // 获取格式信息
  getFormatInfo(format) {
    return this.exportFormats[format]
  }

  // HTML转义
  escapeHtml(text) {
    if (!text) return ''
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }
}

// 自定义导出错误类
export class ExportError extends Error {
  constructor(message, originalError = null) {
    super(message)
    this.name = 'ExportError'
    this.originalError = originalError
    this.timestamp = new Date().toISOString()
  }
}