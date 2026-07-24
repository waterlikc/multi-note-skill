# 多模态输入详细指南

## 概述

multi-note-skill 支持多种模态输入，自动识别并转换为结构化学习笔记。

---

## 支持的输入类型

| 类型 | 格式 | 来源 | 处理方式 |
|------|------|------|----------|
| **图片** | JPG, PNG, GIF, BMP, WebP, SVG | 本地文件、URL、Base64 | OCR文字识别 |
| **视频** | MP4, AVI, MOV, MKV, WebM | YouTube、Bilibili、本地文件 | 字幕提取 |
| **音频** | MP3, WAV, OGG, M4A, AAC, FLAC | 本地文件、URL | 语音转文字 |
| **网页** | HTML | 任何URL | 正文提取 |

---

## 图片输入

### 处理流程
```
输入图片 → OCR文字识别 → 提取文字内容 → 合并到笔记内容
         → AI图像理解 → 生成描述（可选）
```

### 支持的图片来源

#### 1. 本地文件路径
```
用户：把 D:\Screenshots\lecture.png 做成笔记
AI：OCR识别图片文字，生成笔记
```

#### 2. 图片URL
```
用户：把这个图片做成笔记 https://example.com/image.png
AI：下载图片，OCR识别，生成笔记
```

#### 3. Base64编码
```
用户：[发送Base64编码的图片]
AI：解码图片，OCR识别，生成笔记
```

### 图片处理示例

#### 示例1：课堂PPT截图
**输入**：包含PPT内容的截图

**处理流程**：
1. OCR识别PPT文字
2. 识别为课堂学习场景
3. 生成结构化笔记

**输出**：
```markdown
## 课堂内容
[PPT内容整理]

## 重点标记
[高亮关键概念]
```

#### 示例2：代码截图
**输入**：包含代码的截图

**处理流程**：
1. OCR识别代码文字
2. 识别为技术学习场景
3. 生成代码笔记

**输出**：
```html
<h2>代码示例</h2>
<pre><code class="language-python">
# OCR识别的代码
def hello_world():
    print("Hello, World!")
</code></pre>
```

---

## 视频输入

### 处理流程
```
输入视频 → 提取字幕/转录 → 文字内容 → 合并到笔记内容
         → 提取关键帧 → 图片分析（可选）
```

### 支持的视频源

#### 1. YouTube链接
```
用户：把这个视频做成笔记 https://www.youtube.com/watch?v=xxx
AI：提取视频字幕，整理成笔记
```

#### 2. Bilibili链接
```
用户：把这个B站视频做成笔记 https://www.bilibili.com/video/BVxxx
AI：提取视频字幕，整理成笔记
```

#### 3. 本地视频文件
```
用户：把 D:\Videos\lecture.mp4 做成笔记
AI：提取视频字幕，整理成笔记
```

### 视频处理示例

#### 示例1：教学视频
**输入**：YouTube教学视频链接

**处理流程**：
1. 提取视频字幕
2. 分析内容结构
3. 生成结构化笔记

**输出**：
```markdown
## 视频信息
- 平台：YouTube
- 标题：xxx
- 时长：xx分钟

## 主要内容
[字幕整理的笔记内容]

## 时间线
- 00:00 - 介绍
- 05:30 - 核心概念
- 12:45 - 实例演示
```

#### 示例2：Bilibili教程
**输入**：Bilibili教程视频链接

**处理流程**：
1. 提取视频字幕
2. 识别章节结构
3. 生成分段笔记

**输出**：
```markdown
## 章节1：基础概念
[对应时间段的字幕内容]

## 章节2：进阶内容
[对应时间段的字幕内容]
```

---

## 音频输入

### 处理流程
```
输入音频 → 语音转文字 → 转录内容 → 合并到笔记内容
```

### 支持的音频格式
- MP3, WAV, OGG, M4A, AAC, FLAC

### 支持的音频来源

#### 1. 本地文件路径
```
用户：把 D:\Audio\lecture.mp3 做成笔记
AI：语音转文字，整理成笔记
```

#### 2. 音频URL
```
用户：把这个音频做成笔记 https://example.com/audio.mp3
AI：下载音频，语音转文字，整理成笔记
```

### 音频处理示例

#### 示例：课堂录音
**输入**：课堂录音文件

**处理流程**：
1. 语音转文字
2. 分段整理
3. 生成笔记

**输出**：
```markdown
## 课堂内容
[转录文字整理]

## 重点标记
[关键概念提取]
```

---

## 网页输入

### 处理流程
```
输入URL → 获取网页内容 → 提取正文 → 合并到笔记内容
        → 提取图片 → 嵌入笔记（可选）
```

### 支持的网页类型
- 博客文章
- 技术文档
- 新闻报道
- 学术论文
- 教程文章

### 网页处理示例

#### 示例1：博客文章
**输入**：博客文章URL

**处理流程**：
1. 获取网页内容
2. 提取正文
3. 生成读书笔记

**输出**：
```markdown
## 文章信息
- 标题：xxx
- 来源：https://...
- 作者：xxx

## 文章结构
[自动提取的标题结构]

## 正文内容
[整理后的文章内容]
```

#### 示例2：技术文档
**输入**：技术文档URL

**处理流程**：
1. 获取网页内容
2. 提取代码和说明
3. 生成技术笔记

**输出**：
```markdown
## 文档信息
- 标题：xxx
- 来源：https://...

## 主要内容
[文档内容整理]

## 代码示例
[提取的代码块]
```

---

## 混合输入

### 多模态组合
```
用户：我今天学了这些，帮我整理成笔记：
- 这张图片是课堂PPT
- 这个视频是配套讲解
- 我还有一些文字笔记
AI：整合多模态内容，生成完整笔记
```

### 处理流程
```
多模态输入 → 分别处理 → 内容整合 → 统一笔记
    │
    ├─ 图片 → OCR识别
    ├─ 视频 → 字幕提取
    ├─ 音频 → 语音转文字
    └─ 文字 → 直接使用
```

---

## 批量处理

### 批量输入
```
用户：帮我把这些都做成笔记：
1. image1.png
2. image2.jpg
3. https://www.youtube.com/watch?v=xxx
4. https://blog.example.com/article
AI：批量处理，生成多份笔记
```

### 处理代码示例
```javascript
import { processMultimodalBatch } from 'multi-note-skill'

const results = await processMultimodalBatch([
  'image1.png',
  'image2.jpg',
  'https://www.youtube.com/watch?v=xxx',
  'https://blog.example.com/article'
])

// results 包含每个多模态输入的处理结果
```

---

## 依赖说明

### 核心依赖（必需）
无需额外依赖，基础功能开箱即用。

### 多模态依赖（可选）

| 功能 | 依赖包 | 安装命令 |
|------|--------|----------|
| 图片OCR | tesseract.js | `npm install tesseract.js` |
| YouTube字幕 | youtube-transcript | `npm install youtube-transcript` |
| 网页解析 | cheerio | `npm install cheerio` |

### 安装多模态支持
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
//   tesseract: true,
//   youtubeTranscript: true,
//   whisper: false,
//   cheerio: true
// }
```

---

## API参考

### 单个多模态输入

#### 图片笔记
```javascript
import { generateNoteFromImage } from 'multi-note-skill'

const result = await generateNoteFromImage('D:\\Screenshots\\lecture.png', {
  title: '课堂PPT笔记'
})
```

#### 视频笔记
```javascript
import { generateNoteFromVideo } from 'multi-note-skill'

const result = await generateNoteFromVideo('https://www.youtube.com/watch?v=xxx', {
  title: '视频教程笔记'
})
```

#### 网页笔记
```javascript
import { generateNoteFromUrl } from 'multi-note-skill'

const result = await generateNoteFromUrl('https://blog.example.com/article', {
  title: '博客文章笔记'
})
```

#### 音频笔记
```javascript
import { generateNoteFromAudio } from 'multi-note-skill'

const result = await generateNoteFromAudio('D:\\Audio\\lecture.mp3', {
  title: '课堂录音笔记'
})
```

### 批量处理
```javascript
import { processMultimodalBatch } from 'multi-note-skill'

const results = await processMultimodalBatch([
  'image1.png',
  'image2.jpg',
  'https://www.youtube.com/watch?v=xxx',
  'https://blog.example.com/article'
])
```

---

## 常见问题

### Q: OCR识别不准确？
A: 确保图片清晰，文字对比度高。可尝试安装更完整的语言包：
```bash
npm install tesseract.js
# tesseract.js会自动下载语言数据
```

### Q: YouTube字幕获取失败？
A: 检查视频是否有字幕，部分视频可能没有字幕或字幕被禁用。

### Q: 网页内容提取不完整？
A: 某些网页可能需要JavaScript渲染，可以尝试使用Puppeteer等工具。

### Q: 如何处理多张图片？
A: 可以使用批量处理功能：
```javascript
import { processMultimodalBatch } from 'multi-note-skill'

const results = await processMultimodalBatch([
  'image1.jpg',
  'image2.png',
  'https://example.com/image3.jpg'
])
```

---

## 最佳实践

### 图片输入
- 确保图片清晰，文字对比度高
- 避免倾斜或模糊的图片
- 对于PPT截图，尽量完整截取

### 视频输入
- 选择有字幕的视频
- 对于长视频，考虑分段处理
- 优先选择教学类视频

### 网页输入
- 选择正文内容丰富的网页
- 避免需要登录的网页
- 对于长文章，考虑分段处理

### 音频输入
- 确保音频清晰，噪音少
- 对于长音频，考虑分段处理
- 优先选择有讲解的音频

---

## 更新日志

### v2.0.0 (2026-07-23)
- 新增多模态输入支持
- 新增图片OCR、视频字幕、音频转写、网页提取
- 新增批量处理功能
