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

  // 导出为PDF格式（轻量方案：浏览器打印导出）
  async exportToPdf(noteData, htmlContent) {
    return new Promise((resolve, reject) => {
      try {
        const options = {
          filename: `${noteData.title}.pdf`,
          pageSize: 'A4',
          orientation: 'portrait',
          printBackground: true
        }

        resolve({
          success: true,
          method: 'browser-print',
          message: '请用浏览器打开生成的HTML文件，按 Ctrl+P（macOS: Cmd+P）选择“另存为PDF”',
          filename: options.filename,
          options
        })
      } catch (error) {
        reject(new Error('PDF导出失败: ' + error.message))
      }
    })
  }

  // 根据 noteData.style 选择模板文件
  selectTemplateFile(style) {
    const mapping = {
      'style-a': 'template-a.html',
      'style-b': 'template-b.html',
      'style-c': 'template-c.html'
    }
    return mapping[style] || 'template-a.html'
  }

  // 场景标签映射（供各模板复用）
  getSceneLabel(scene) {
    const map = {
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
    return map[scene] || ''
  }

  // 导出为HTML格式 - 按样式分发
  exportToHtml(noteData) {
    const style = noteData.style || 'style-a'
    if (style === 'style-b') return this.exportToStyleB(noteData)
    if (style === 'style-c') return this.exportToStyleC(noteData)
    return this.exportToStyleA(noteData)
  }

  // Style A - 学霸笔记本（原有占位符替换渲染）
  exportToStyleA(noteData) {
    try {
      let template = this.templates['template-a.html']
      if (!template) {
        throw new Error('模板加载失败，请检查 assets/template-a.html 文件')
      }

      const notebookContent = this.markdownToNotebookHtml(noteData.content)
      const sceneLabel = this.getSceneLabel(noteData.scene)
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

  // Style B - 手账皮革本（封面 + 分页翻页）
  exportToStyleB(noteData) {
    const template = this.templates['template-b.html']
    if (!template) {
      throw new Error('模板加载失败，请检查 assets/template-b.html 文件')
    }

    const headHtml = template
      .slice(0, template.indexOf('</head>') + 7)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${this.escapeHtml(noteData.title)}</title>`)

    const sections = this.splitMarkdownSections(noteData.content)
    const pagesHtml = sections.map((section, index) => {
      const pageNumber = index + 1
      const bodyHtml = this.buildStyleBPageBody(section.lines)
      return `            <div class="page" data-page="${pageNumber}">
                <div class="content-wrapper">
                    <div class="page-header">${this.escapeHtml(section.title)}</div>
${bodyHtml}
                </div>
                <div class="page-number">${pageNumber}</div>
            </div>`
    }).join('\n')

    const subtitle = noteData.subtitle || noteData.date || ''
    const coverHtml = `            <div class="page cover active" data-page="0">
                <div class="cover-decoration"><i class="ri-book-open-line"></i></div>
                <div class="cover-title">${this.escapeHtml(noteData.title)}</div>
                <div class="cover-subtitle">${this.escapeHtml(subtitle)}</div>
                <div class="cover-hint">点击翻页开始阅读 ↓</div>
            </div>`

    const ringsHtml = Array.from({ length: 8 }, () => '<div class="ring"></div>').join('\n            ')

    const script = `
        let currentPage = 0;
        const pages = document.querySelectorAll('.page');
        function showPage(n) {
          pages.forEach(function (p, i) {
            p.classList.remove('active', 'flipped');
            if (i < n) p.classList.add('flipped');
            else if (i === n) p.classList.add('active');
          });
          currentPage = n;
        }
        function nextPage() { if (currentPage < pages.length - 1) showPage(currentPage + 1); }
        function prevPage() { if (currentPage > 0) showPage(currentPage - 1); }
        const cover = document.querySelector('.page.cover');
        if (cover) cover.addEventListener('click', nextPage);
        document.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
          else if (e.key === 'ArrowLeft') prevPage();
        });
        showPage(0);
    `

    return `${headHtml}
<body>
    <div class="notebook">
        <div class="rings">
            ${ringsHtml}
        </div>

        <div class="pages-container" id="pagesContainer">
${coverHtml}
${pagesHtml}
        </div>
    </div>

    <script>${script}</script>
</body>
</html>`
  }

  // Style C - 简约现代（渐变头部 + 卡片内容）
  exportToStyleC(noteData) {
    const template = this.templates['template-c.html']
    if (!template) {
      throw new Error('模板加载失败，请检查 assets/template-c.html 文件')
    }

    const headHtml = template
      .slice(0, template.indexOf('</head>') + 7)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${this.escapeHtml(noteData.title)}</title>`)

    const sceneLabel = this.getSceneLabel(noteData.scene) || '学习笔记'
    const sections = this.splitMarkdownSections(noteData.content)
    const sectionsHtml = sections.map((section, index) => {
      const delay = (0.1 + index * 0.1).toFixed(1)
      const bodyHtml = this.buildStyleCBody(section.lines)
      return `            <div class="section fade-in" style="animation-delay:${delay}s">
                <div class="section-header">
                    <div class="section-icon"><i class="lucide-book-open"></i></div>
                    <h2 class="section-title">${this.escapeHtml(section.title)}</h2>
                </div>
${bodyHtml}
            </div>`
    }).join('\n')

    const headerHtml = `        <div class="header">
            <div class="header-tag">${this.escapeHtml(sceneLabel)}</div>
            <h1 class="header-title">${this.escapeHtml(noteData.title)}</h1>
            <p class="header-subtitle">${this.escapeHtml(noteData.subtitle || '')}</p>
            <div class="header-meta">
                <span><i class="lucide-calendar"></i> ${this.escapeHtml(noteData.date || '')}</span>
                <span><i class="lucide-user"></i> multi-note-skill</span>
                <span><i class="lucide-tag"></i> ${this.escapeHtml(sceneLabel)}</span>
            </div>
        </div>`

    const footerHtml = `        <div class="footer">
            multi-note-skill · Style C 简约现代模板 · ${new Date().getFullYear()}
        </div>`

    return `${headHtml}
<body>
    <div class="container">
        <div class="notebook">
${headerHtml}

            <div class="content">
${sectionsHtml}
            </div>

${footerHtml}
        </div>
    </div>
</body>
</html>`
  }

  // 将Markdown按标题分节
  splitMarkdownSections(markdown) {
    const lines = String(markdown || '').split('\n')
    const sections = []
    let current = null
    let pending = []
    let docTitleSeen = false
    let inCodeFence = false

    const flushPending = () => {
      if (pending.some(line => line.trim())) {
        sections.push({ title: '概览', lines: pending })
      }
      pending = []
    }

    for (const line of lines) {
      const trimmed = line.trim()

      // 代码围栏内的内容不解析标题/表格，避免 `# 安装` 之类被误当成章节
      if (trimmed.startsWith('```')) {
        inCodeFence = !inCodeFence
        if (current) current.lines.push(line)
        else pending.push(line)
        continue
      }
      if (inCodeFence) {
        if (current) current.lines.push(line)
        else pending.push(line)
        continue
      }

      const heading = trimmed.match(/^(#{1,3})\s+(.*)$/)
      if (heading) {
        const level = heading[1].length
        const title = heading[2].trim()
        // 首个一级标题视为文档主标题，不单独成一个空泛章节页；
        // 其正文作为引言并入第一个正式章节，避免 Style B/C 第一页过于稀疏。
        if (level === 1 && !docTitleSeen && !current) {
          docTitleSeen = true
          continue
        }
        if (current) sections.push(current)
        current = { title, lines: [] }
        if (pending.some(l => l.trim())) {
          current.lines = pending.slice()
          pending = []
        }
      } else if (current) {
        current.lines.push(line)
      } else {
        pending.push(line)
      }
    }

    if (current) sections.push(current)
    else flushPending()

    for (const section of sections) {
      while (section.lines.length && !section.lines[section.lines.length - 1].trim()) {
        section.lines.pop()
      }
    }

    return sections.filter(section => section.lines.some(line => line.trim()))
  }

  // 解析 Markdown 表格块（含表头/分隔行）为 HTML <table>
  parseMarkdownTable(blockLines) {
    const rows = []
    for (const raw of blockLines) {
      const line = raw.trim()
      if (!line.includes('|')) break
      const cells = line
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split('|')
        .map(c => c.trim())
      const isSeparator = cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c))
      if (isSeparator) continue
      rows.push(cells)
    }
    if (rows.length === 0) return null

    const colCount = Math.max(...rows.map(r => r.length))
    const header = rows[0]
    const body = rows.slice(1)

    const headRow = `<tr>${Array.from({ length: colCount }, (_, i) => `<th>${this.inlineMarkdownPlain(header[i] || '')}</th>`).join('')}</tr>`
    const bodyRows = body.map(r => `<tr>${Array.from({ length: colCount }, (_, i) => `<td>${this.inlineMarkdownPlain(r[i] || '')}</td>`).join('')}</tr>`).join('')

    return { html: `<table><thead>${headRow}</thead><tbody>${bodyRows}</tbody></table>` }
  }

  // 渲染 ::: 提示框（Style B/C 也支持，与 Style A 的 processCustomBlock 对齐）
  renderCallout(style, type, lines, label) {
    const content = this.inlineMarkdownPlain(lines.join(' ').trim())
    const titleMap = {
      warning: '⚠️ 注意',
      danger: '⚠️ 危险',
      error: '❌ 错误',
      tip: '💡 提示',
      info: '📌 信息',
      summary: '📋 总结',
      question: '❓ 思考',
      note: '📝 备注'
    }
    const title = label || titleMap[type] || '备注'

    if (style === 'style-c') {
      if (type === 'summary') {
        return `<div class="summary"><div class="summary-title">${title}</div><div class="summary-item">${content}</div></div>`
      }
      return `<div class="note"><strong>${title}：</strong>${content}</div>`
    }

    // style-b
    const cls = (type === 'warning' || type === 'danger' || type === 'error') ? 'key-point-box' : 'sticky-note'
    return `<div class="${cls}"><div class="box-title">${title}</div><div class="box-content">${content}</div></div>`
  }

  // Style B 正文渲染
  buildStyleBPageBody(lines) {
    const html = []
    let paragraph = []
    let list = null
    let code = null

    const flushParagraph = () => {
      if (paragraph.length) {
        html.push(`<p class="handwriting">${this.inlineMarkdownPlain(paragraph.join(' ').trim())}</p>`)
        paragraph = []
      }
    }

    const flushList = () => {
      if (list && list.items.length) {
        const tag = list.type
        html.push(`<${tag} class="handwriting">${list.items.map(item => `<li>${this.inlineMarkdownPlain(item)}</li>`).join('')}</${tag}>`)
        list = null
      }
    }

    const flushCode = () => {
      if (code) {
        html.push(`<div class="diagram-container"><div class="diagram-title">代码示例</div><pre style="background:#2d2d2d;color:#f8f8f2;padding:16px;border-radius:10px;overflow-x:auto;font-family:'Courier New',monospace;font-size:0.9rem">${this.escapeHtml(code.lines.join('\n'))}</pre></div>`)
        code = null
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        flushParagraph()
        flushList()
        if (code) { flushCode() } else { code = { lines: [] } }
        continue
      }

      if (code) {
        code.lines.push(line)
        continue
      }

      // 表格检测
      if (trimmed.includes('|')) {
        flushParagraph()
        flushList()
        const tableLines = []
        let j = i
        while (j < lines.length && lines[j].trim().includes('|')) {
          tableLines.push(lines[j])
          j++
        }
        const table = this.parseMarkdownTable(tableLines)
        if (table) {
          html.push(`<div class="handwriting table-wrap">${table.html}</div>`)
          i = j - 1
          continue
        }
      }

      // ::: 提示框
      const calloutB = trimmed.match(/^:::(\w+)(?:\s+(.*))?$/)
      if (calloutB) {
        flushParagraph()
        flushList()
        const type = calloutB[1].toLowerCase()
        const body = []
        if (calloutB[2]) body.push(calloutB[2])
        let j = i + 1
        while (j < lines.length && !/^:::|^:::\w+/.test(lines[j].trim())) {
          body.push(lines[j])
          j++
        }
        html.push(this.renderCallout('style-b', type, body, ''))
        i = j
        continue
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        flushParagraph()
        if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] } }
        list.items.push(trimmed.replace(/^[-*+]\s+/, ''))
        continue
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        flushParagraph()
        if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] } }
        list.items.push(trimmed.replace(/^\d+\.\s+/, ''))
        continue
      }

      if (trimmed === '') {
        flushParagraph()
        flushList()
        continue
      }

      const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)$/)
      if (imageMatch) {
        flushParagraph()
        flushList()
        html.push(`<p class="handwriting">${this.createImageTag(imageMatch[2], imageMatch[1], imageMatch[3] || imageMatch[1])}</p>`)
        continue
      }

      list = null
      paragraph.push(trimmed)
    }

    flushParagraph()
    flushList()
    flushCode()

    return html.join('\n')
  }

  // Style C 正文渲染
  buildStyleCBody(lines) {
    const html = []
    let paragraph = []
    let list = null
    let code = null

    const flushParagraph = () => {
      if (paragraph.length) {
        html.push(`<p>${this.inlineMarkdownPlain(paragraph.join(' ').trim())}</p>`)
        paragraph = []
      }
    }

    const flushList = () => {
      if (list && list.items.length) {
        const tag = list.type
        html.push(`<${tag}>${list.items.map(item => `<li>${this.inlineMarkdownPlain(item)}</li>`).join('')}</${tag}>`)
        list = null
      }
    }

    const flushCode = () => {
      if (code) {
        html.push(`<pre class="code-block">${this.escapeHtml(code.lines.join('\n'))}</pre>`)
        code = null
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        flushParagraph()
        flushList()
        if (code) { flushCode() } else { code = { lines: [] } }
        continue
      }

      if (code) {
        code.lines.push(line)
        continue
      }

      // 表格检测
      if (trimmed.includes('|')) {
        flushParagraph()
        flushList()
        const tableLines = []
        let j = i
        while (j < lines.length && lines[j].trim().includes('|')) {
          tableLines.push(lines[j])
          j++
        }
        const table = this.parseMarkdownTable(tableLines)
        if (table) {
          html.push(`<div class="table-wrap">${table.html}</div>`)
          i = j - 1
          continue
        }
      }

      // ::: 提示框
      const calloutC = trimmed.match(/^:::(\w+)(?:\s+(.*))?$/)
      if (calloutC) {
        flushParagraph()
        flushList()
        const type = calloutC[1].toLowerCase()
        const body = []
        if (calloutC[2]) body.push(calloutC[2])
        let j = i + 1
        while (j < lines.length && !/^:::|^:::\w+/.test(lines[j].trim())) {
          body.push(lines[j])
          j++
        }
        html.push(this.renderCallout('style-c', type, body, ''))
        i = j
        continue
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        flushParagraph()
        if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] } }
        list.items.push(trimmed.replace(/^[-*+]\s+/, ''))
        continue
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        flushParagraph()
        if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] } }
        list.items.push(trimmed.replace(/^\d+\.\s+/, ''))
        continue
      }

      if (trimmed === '') {
        flushParagraph()
        flushList()
        continue
      }

      const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)$/)
      if (imageMatch) {
        flushParagraph()
        flushList()
        html.push(`<p>${this.createImageTag(imageMatch[2], imageMatch[1], imageMatch[3] || imageMatch[1])}</p>`)
        continue
      }

      list = null
      paragraph.push(trimmed)
    }

    flushParagraph()
    flushList()
    flushCode()

    return html.join('\n')
  }

  // 通用内联Markdown转HTML（适配Style B/C，使用通用标签）
  inlineMarkdownPlain(text) {
    if (!text) return ''
    let html = text

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    html = html.replace(/==([^=]+)==/g, '<span class="highlight">$1</span>')
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

    return html
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
      
      // 处理表格
      if (trimmedLine.includes('|')) {
        flushParagraph()
        flushList()
        const tableLines = []
        let j = i
        while (j < lines.length && lines[j].trim().includes('|')) {
          tableLines.push(lines[j])
          j++
        }
        const table = this.parseMarkdownTable(tableLines)
        if (table) {
          const tableHtml = `<div class="content write-in" style="animation-delay:${getDelay(animationIndex)}s"><div class="table-wrap">${table.html}</div></div>`
          if (currentSection) {
            currentSection.content += '\n' + tableHtml
          } else {
            htmlParts.push(tableHtml)
          }
          animationIndex++
          i = j - 1
          continue
        }
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