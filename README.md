<div align="center">

# multi-note-skill

> *多场景智能笔记生成器 - 支持图片、视频、音频、网页URL多模态输入*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Version: 1.1.0](https://img.shields.io/badge/Version-1.1.0-brightgreen)](SKILL.md)

根据用户内容自动识别场景，支持多模态输入，生成精美HTML笔记，支持打印复习。

[快速开始](#快速开始) · [🆕 多模态支持](#多模态支持) · [场景支持](#场景支持) · [模板样式](#模板样式) · [组件系统](#组件系统)

</div>

---

## 快速开始

### 基础使用

```
用户：帮我生成笔记，主题是"Python并发编程"
AI：[自动识别为技术教学场景，生成精美HTML笔记]
```

### 🆕 多模态输入

```
用户：[发送图片] 帮我整理这张PPT的笔记
AI：[OCR识别图片文字，生成结构化笔记]

用户：把这个视频做成笔记 https://www.youtube.com/watch?v=xxx
AI：[提取视频字幕，整理成笔记]

用户：帮我整理这篇博客 https://blog.example.com/article
AI：[提取网页内容，生成读书笔记]
```

### 指定场景

```
用户：生成课堂笔记，标题"高中物理电磁学"
AI：[识别为课堂学习场景，生成学习笔记]
```

### 指定模板

```
用户：用Style B模板生成会议笔记
AI：[使用皮革手账本样式，生成翻页式笔记]
```

---

## 🆕 多模态支持

### 支持的输入类型

| 类型 | 格式 | 来源 |
|------|------|------|
| **图片** | JPG, PNG, GIF, BMP, WebP, SVG | 本地文件、URL、Base64 |
| **视频** | MP4, AVI, MOV, MKV, WebM | YouTube、Bilibili、本地文件 |
| **音频** | MP3, WAV, OGG, M4A, AAC, FLAC | 本地文件、URL |
| **网页** | HTML | 任何URL |

### 使用示例

#### 图片 → 笔记
```javascript
import { generateNoteFromImage } from 'multi-note-skill'

const result = await generateNoteFromImage('D:\\Screenshots\\lecture.png', {
  title: '课堂PPT笔记'
})
```

#### 视频 → 笔记
```javascript
import { generateNoteFromVideo } from 'multi-note-skill'

const result = await generateNoteFromVideo('https://www.youtube.com/watch?v=xxx', {
  title: '视频教程笔记'
})
```

#### 网页 → 笔记
```javascript
import { generateNoteFromUrl } from 'multi-note-skill'

const result = await generateNoteFromUrl('https://blog.example.com/article', {
  title: '博客文章笔记'
})
```

#### 批量处理
```javascript
import { processMultimodalBatch } from 'multi-note-skill'

const results = await processMultimodalBatch([
  'image1.png',
  'image2.jpg',
  'https://www.youtube.com/watch?v=xxx'
])
```

### 安装多模态依赖

```bash
# 安装所有多模态依赖
npm install tesseract.js youtube-transcript cheerio

# 或者单独安装
npm install tesseract.js        # 图片OCR
npm install youtube-transcript  # YouTube字幕
npm install cheerio             # 网页解析
```

### 检查依赖状态
```javascript
import { checkMultimodalDependencies } from 'multi-note-skill'

const deps = await checkMultimodalDependencies()
console.log(deps)
// {
//   tesseract: true,      // 图片OCR
//   youtubeTranscript: true, // YouTube字幕
//   whisper: false,       // 音频转文字（可选）
//   cheerio: true         // 网页解析
// }
```

---

## 场景支持

| 场景 | 触发特征 | 默认结构 |
|------|----------|----------|
| 技术教学 | 代码、编程、API、框架 | 概念→语法→示例→实践→总结 |
| 课堂学习 | 知识点、定义、定理、公式 | 框架→概念→重点→易错→总结 |
| 科普教育 | 原理、现象、实验、科学 | 现象→原理→应用→思考→总结 |
| 学术会议 | 议题、观点、决策、研讨 | 议程→要点→讨论→决策→总结 |
| 调研分析 | 问卷、数据、统计、结论 | 背景→方法→发现→结论→建议 |
| 🆕 图片笔记 | 截图、PPT、白板、手写 | 内容提取→整理→总结 |
| 🆕 视频笔记 | 教程、讲座、演示 | 概要→分段→重点→总结 |
| 🆕 网页笔记 | 博客、文章、文档 | 摘要→结构→内容→思考 |

---

## 模板样式

### Style A - 教学笔记本

- 螺旋装订效果
- 横线纸张背景
- 手写体字体
- 适合：课堂学习、科普教育、技术教学

### Style B - 手账皮革本

- 皮革封面效果
- 翻页交互（键盘←→ / 点击）
- 分页式内容
- 适合：学术会议、调研分析、正式报告

### Style C - 简约现代

- 渐变头部
- 卡片式布局
- 适合：技术文档、专业报告

---

## 组件系统

### 文字样式
`highlight` · `highlight-pink` · `highlight-green` · `highlight-orange` · `red-text` · `blue-text` · `code-term` · `badge`

### 布局组件
`flow-box` · `compare-box` · `step-list` · `os-grid` · `trust-triangle`

### 信息框
`question-box` · `summary-box` · `big-warning` · `urgent-box` · `safe-box` · `fix-box` · `config-box`

### 辅助元素
`side-note` · `divider` · `version-badge` · `code-block` · `doodle`

---

## 文件结构

```
multi-note-skill/
├── SKILL.md                         # 技能配置文件（含多模态说明）
├── README.md                        # 项目说明
├── package.json                     # 依赖配置
├── index.js                         # 公共入口（多模态API）
├── core/
│   ├── smart-note-generator.js      # 主控制器（集成多模态）
│   ├── multimodal-processor.js      # 🆕 多模态处理器
│   ├── scene-detector.js            # 场景检测器
│   ├── content-analyzer.js          # 内容分析器
│   ├── template-manager.js          # 模板管理器
│   └── ...                          # 其他核心模块
├── assets/
│   ├── template-a.html              # Style A 模板
│   ├── template-b.html              # Style B 模板
│   └── template-c.html              # Style C 模板
├── references/
│   ├── layouts.md                   # 布局库
│   ├── components.md                # 组件手册
│   └── checklist.md                 # 质量检查清单
└── examples/
    ├── multimodal-demo.mjs          # 🆕 多模态示例
    └── ...                          # 其他示例
```

---

## 质量检查

生成笔记后检查：

**P0 必须通过**：
- `<title>` 已替换为笔记标题
- HTML文件可正常打开
- 没有使用emoji作为图标

**P1 强烈建议**：
- 动画延迟递增
- 便签不遮挡正文
- 装饰元素适度

**🆕 P2 多模态相关**：
- OCR识别文字已清理格式
- 视频字幕已分段整理
- 图片链接可正常访问
- 网页内容已提取正文

详见 [references/checklist.md](references/checklist.md)

---

## 依赖说明

### 核心依赖（必需）
无需额外依赖，基础功能开箱即用。

### 🆕 多模态依赖（可选）

| 功能 | 依赖包 | 安装命令 |
|------|--------|----------|
| 图片OCR | tesseract.js | `npm install tesseract.js` |
| YouTube字幕 | youtube-transcript | `npm install youtube-transcript` |
| 网页解析 | cheerio | `npm install cheerio` |

---

## 开源协议

[MIT License](LICENSE)
