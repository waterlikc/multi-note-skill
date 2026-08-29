# multi-note-skill 快速入门指南

## 5分钟上手

### 第1步：触发Skill

在对话中输入以下任意关键词：
- "生成笔记"
- "帮我做笔记"
- "创建学习笔记"
- "笔记生成器"

### 第2步：描述需求

告诉AI你的笔记主题和场景：

```
示例1：帮我生成Python并发编程的技术教学笔记
示例2：创建一篇关于量子计算的科普教育笔记
示例3：生成教育技术研讨会的会议笔记
```

### 第3步：等待生成

AI会自动：
1. 识别场景类型
2. 选择合适的模板
3. 规划笔记结构
4. 生成HTML笔记

### 第4步：查看结果

生成的笔记保存在 `D:\blog\notes\` 目录，直接用浏览器打开即可查看。

---

## 场景速查表

| 我想要... | 输入关键词 | 示例 |
|-----------|-----------|------|
| 技术教程笔记 | 技术教学、编程、代码 | "生成Python教程笔记" |
| 学习复习笔记 | 课堂学习、知识点、复习 | "创建物理复习笔记" |
| 科普知识笔记 | 科普、原理、入门 | "生成量子计算科普笔记" |
| 会议记录笔记 | 会议、研讨、决策 | "创建教学研讨会笔记" |
| 调研分析笔记 | 调研、数据、报告 | "生成AI认知调研笔记" |
| 小说分析笔记 | 小说、人物、情节 | "创建三体小说分析笔记" |
| 读书笔记 | 读书、书评、感悟 | "生成百年孤独读书笔记" |

---

## 模板选择指南

### Style A - 教学笔记本
- **外观**：螺旋装订、横线纸张、手写体
- **适合**：日常学习、教学笔记、科普文章
- **特点**：轻松活泼，适合个人使用

### Style B - 手账皮革本
- **外观**：皮革封面、翻页交互、分页显示
- **适合**：正式会议、项目报告、学术研讨
- **特点**：专业正式，适合展示分享

**选择建议**：
- 学习/教学/科普 → Style A
- 会议/报告/展示 → Style B

---

## 常用组件速查

### 强调标记
```html
<span class="highlight">黄色高亮</span>
<span class="highlight-pink">粉色高亮（警告）</span>
<span class="highlight-green">绿色高亮（正面）</span>
<span class="red-text">红色强调</span>
<span class="blue-text">蓝色术语</span>
```

### 流程图
```html
<div class="flow-box">
  <span class="flow-item">步骤1</span>
  <span class="flow-arrow">→</span>
  <span class="flow-item">步骤2</span>
</div>
```

### 对比框
```html
<div class="compare-box">
  <div class="compare-row">
    <span class="compare-label old">之前</span>
    <span>旧方案</span>
  </div>
  <div class="compare-row">
    <span class="compare-label new">之后</span>
    <span>新方案</span>
  </div>
</div>
```

### 步骤列表
```html
<div class="attack-flow">
  <div class="attack-step">
    <span class="step-num">1</span>
    <span>步骤描述</span>
  </div>
</div>
```

### 便签
```html
<div class="side-note">黄色便签内容</div>
<div class="side-note blue">蓝色便签内容</div>
```

---

## 常见问题

### Q: 笔记保存在哪里？
A: 默认保存在 `D:\blog\notes\` 目录。

### Q: 如何选择Style A还是Style B？
A: 日常学习用Style A，正式场合用Style B。

### Q: 可以自定义笔记结构吗？
A: 可以，告诉AI你想要的结构即可。

### Q: 支持哪些浏览器？
A: 支持所有现代浏览器（Chrome/Firefox/Safari/Edge）。

### Q: 如何导出为PDF？
A: 在浏览器中打开HTML文件，按 `Ctrl+P` 选择"另存为PDF"。

---

## 进阶用法

### 指定笔记结构
```
生成Python教程笔记，结构为：
1. 核心概念
2. 基础语法
3. 代码示例
4. 常见问题
5. 最佳实践
```

### 指定组件
```
生成对比笔记，使用对比框展示新旧方案差异
```

### 批量生成
```
帮我生成以下3个主题的笔记：
1. Python基础语法
2. Python面向对象
3. Python并发编程
```

---

## 获取帮助

- **详细文档**：查看 `SKILL.md`
- **组件参考**：查看 `references/components.md`
- **布局参考**：查看 `references/layouts.md`
- **质量检查**：查看 `references/checklist.md`
- **比赛文档**：查看 `docs/COMPETITION.md`
