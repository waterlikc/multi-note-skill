# Markdown导出指南

## 概述

multi-note-skill支持将HTML笔记导出为Markdown格式，便于在GitHub、Notion、Obsidian等平台使用。

---

## 导出方法

### 方法一：HTML转Markdown工具

#### 使用Turndown.js
```javascript
const TurndownService = require('turndown');
const turndown = new TurndownService();

// 读取HTML文件
const html = fs.readFileSync('note.html', 'utf8');

// 转换为Markdown
const markdown = turndown.turndown(html);

// 保存Markdown文件
fs.writeFileSync('note.md', markdown);
```

#### 使用在线工具
- [HTML to Markdown](https://www.browserling.com/tools/html-to-markdown)
- [Turndown Demo](https://mixmark-io.github.io/turndown/)

---

### 方法二：手动转换模板

#### 标准Markdown模板
```markdown
# 笔记标题

**副标题描述**

**日期**: 2026-07-16 | **标签**: 标签1, 标签2

---

## 核心概念

正文内容，使用 `代码术语` 标记关键术语。

> **重点提示**: 这是一个重要信息

---

## 第一章节

### 1.1 小节标题

- 要点1
- 要点2
- 要点3

### 1.2 流程图

```
步骤1 → 步骤2 → 步骤3
```

---

## 对比分析

| 维度 | 方案A | 方案B |
|------|-------|-------|
| 效率 | 低 | 高 |
| 成本 | 高 | 低 |

---

## 总结

- [x] 完成项1
- [x] 完成项2
- [ ] 待完成项

---

**生成时间**: 2026-07-16
```

---

## 组件转换规则

### HTML → Markdown 映射

| HTML组件 | Markdown写法 |
|----------|-------------|
| `<h1>` | `# 标题` |
| `<h2>` | `## 标题` |
| `<h3>` | `### 标题` |
| `<p>` | 正文段落 |
| `<strong>` | `**粗体**` |
| `<em>` | `*斜体*` |
| `<code>` | `` `代码` `` |
| `<a href="">` | `[文本](链接)` |
| `<img src="">` | `![alt](图片)` |
| `<ul><li>` | `- 列表项` |
| `<ol><li>` | `1. 列表项` |
| `<blockquote>` | `> 引用` |
| `<table>` | 表格语法 |
| `<code class="block">` | ` ```代码块``` ` |

### 特殊组件转换

#### 流程图
```markdown
**流程**: 步骤1 → 步骤2 → 步骤3
```

#### 对比框
```markdown
| 维度 | 之前 | 之后 |
|------|------|------|
| 方案 | 旧方案 | 新方案 |
```

#### 状态列表
```markdown
- [x] 已完成项
- [ ] 待完成项
```

#### 问题框
```markdown
> **问题**: 这里是问题内容？
```

#### 总结框
```markdown
> **总结**
> - 要点1
> - 要点2
> - 要点3
```

---

## 自动转换脚本

### Node.js完整脚本
```javascript
const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

// 配置Turndown
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// 自定义规则：高亮文本
turndown.addRule('highlight', {
  filter: ['span'],
  replacement: function(content, node) {
    if (node.classList.contains('highlight')) {
      return `**${content}**`;
    }
    if (node.classList.contains('code-term')) {
      return `\`${content}\``;
    }
    return content;
  }
});

// 自定义规则：流程图
turndown.addRule('flow-box', {
  filter: function(node) {
    return node.classList && node.classList.contains('flow-box');
  },
  replacement: function(content) {
    return `\n**流程**: ${content.trim()}\n`;
  }
});

// 转换函数
function convertToMarkdown(htmlFile, mdFile) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  let markdown = turndown.turndown(html);
  
  // 后处理：清理多余空行
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(mdFile, markdown);
  console.log(`转换完成: ${htmlFile} → ${mdFile}`);
}

// 批量转换
const notesDir = './notes';
const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const htmlPath = path.join(notesDir, file);
  const mdPath = path.join(notesDir, file.replace('.html', '.md'));
  convertToMarkdown(htmlPath, mdPath);
});
```

---

## 导出质量检查

### Markdown文件检查清单

- [ ] 标题层级正确（H1/H2/H3）
- [ ] 列表格式正确
- [ ] 代码块正确标记
- [ ] 表格格式正确
- [ ] 链接和图片正确
- [ ] 无多余空行
- [ ] 特殊字符正确转义

---

## 平台适配

### GitHub
- 支持标准Markdown语法
- 支持代码块语法高亮
- 支持任务列表 `- [x]`
- 支持表格

### Notion
- 支持标准Markdown语法
- 支持代码块
- 支持表格
- 支持引用块

### Obsidian
- 支持标准Markdown语法
- 支持内部链接 `[[]]`
- 支持标签 `#标签`
- 支持代码块

---

## 常见问题

### Q: 转换后格式丢失？
A: 使用自定义规则处理特殊组件，如高亮、流程图等。

### Q: 如何批量转换？
A: 使用Node.js脚本遍历目录中的HTML文件。

### Q: 如何保持样式信息？
A: Markdown不支持样式，建议保留HTML版本作为展示版。

### Q: 代码块语法高亮？
A: 在代码块标记后指定语言，如 ` ```javascript `。
