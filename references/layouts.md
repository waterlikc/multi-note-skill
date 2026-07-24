# 布局库

每种布局都是一个可复用的页面骨架。根据笔记内容选择合适的布局组合使用。

---

## L01 · 封面开场

标题 + 副标题 + 日期/编号，适合笔记开头。

```html
<div class="title write-in" style="animation-delay:0.1s">
  [笔记标题]
  <div class="title-underline"></div>
</div>

<div class="subtitle write-in" style="animation-delay:0.3s">
  [副标题描述]
</div>

<div class="date-badge write-in" style="animation-delay:0.4s">
  2026.07.16 | 编号 | 关键词
</div>
```

---

## L02 · 标准段落

小节标题 + 正文内容，最常用的布局。标题前可加 Lucide 图标。

```html
<div class="section">
  <div class="section-title write-in" style="animation-delay:Xs">
    <i class="lucide-book-open"></i> [小节标题]
    <div class="marker-underline"></div>
  </div>
  <div class="content write-in" style="animation-delay:Xs">
    [正文内容]
  </div>
</div>
```

---

## L03 · 流程图

展示步骤、因果关系、数据流。

```html
<div class="flow-box write-in" style="animation-delay:Xs">
  <span class="flow-item">步骤1</span>
  <span class="flow-arrow">&#10142;</span>
  <span class="flow-item">步骤2</span>
  <span class="flow-arrow">&#10142;</span>
  <span class="flow-item">步骤3</span>
</div>
```

---

## L04 · 对比框

新旧对比、方案对比、正反对比。

```html
<div class="compare-box write-in" style="animation-delay:Xs">
  <div class="compare-row">
    <span class="compare-label old">之前</span>
    <span>[旧方案描述]</span>
  </div>
  <div class="compare-row">
    <span class="compare-label new">现在</span>
    <span>[新方案描述]</span>
  </div>
</div>
```

---

## L05 · 步骤列表

有序步骤，带红色圆形编号。

```html
<div class="step-list write-in" style="animation-delay:Xs">
  <div class="step-item">
    <span class="step-num">1</span>
    <span>[步骤描述]</span>
  </div>
  <div class="step-item">
    <span class="step-num">2</span>
    <span>[步骤描述]</span>
  </div>
  <div class="step-item">
    <span class="step-num">3</span>
    <span>[步骤描述]</span>
  </div>
</div>
```

---

## L06 · 警告/重点框

斜纹背景 + 红色边框，突出关键信息。

```html
<div class="big-warning write-in" style="animation-delay:Xs">
  重要的警告或结论
</div>
```

---

## L07 · 问题框

蓝色边框 + 问号标记，提出关键问题。

```html
<div class="question-box write-in" style="animation-delay:Xs">
  这里提出一个值得思考的问题？
</div>
```

---

## L08 · 代码块

深色背景 + 语法高亮。

```html
<div class="code-block write-in" style="animation-delay:Xs">
  <span class="code-comment"># 注释</span>
  <span class="code-keyword">import</span> os
  <span class="code-string">"字符串"</span>
</div>
```

---

## L09 · 状态列表框

绿色左边框，列出安全/正面的状态。

```html
<div class="safe-box write-in" style="animation-delay:Xs">
  <div class="safe-row">
    <span class="safe-check">&#10003;</span>
    <span>[安全状态描述]</span>
  </div>
  <div class="safe-row">
    <span class="safe-check">&#10003;</span>
    <span>[安全状态描述]</span>
  </div>
</div>
```

---

## L10 · 方案/更新框

蓝色左边框，列出修复步骤或更新信息。

```html
<div class="fix-box write-in" style="animation-delay:Xs">
  <div class="fix-row">
    <span class="fix-icon">&#128295;</span>
    <span>[修复方案描述]</span>
  </div>
</div>
```

---

## L11 · 配置框

紫色左边框 + 等宽字体，展示配置文件内容。

```html
<div class="config-box write-in" style="animation-delay:Xs">
  <span class="config-tag">config.xml</span><br>
  &lt;key&gt;<span class="red-text">value</span>&lt;/key&gt;
</div>
```

---

## L12 · 网格列表

3列网格，展示多个并列项。

```html
<div class="os-grid write-in" style="animation-delay:Xs">
  <span class="os-item">项目1</span>
  <span class="os-item">项目2</span>
  <span class="os-item danger">项目3</span>
  <span class="os-item">项目4</span>
  <span class="os-item">项目5</span>
  <span class="os-item danger">项目6</span>
</div>
```

---

## L13 · 总结框

蓝色边框大框，用于收束总结。

```html
<div class="summary-box write-in" style="animation-delay:Xs">
  <div class="summary-title">总结标题</div>
  <div class="content">[总结内容]</div>
</div>
```

---

## L14 · 信任三角/关系图

三个并列项 + 箭头连接，展示关系或流程。

```html
<div class="trust-triangle write-in" style="animation-delay:Xs">
  <div class="trust-item">
    <span class="trust-label">标签1</span>
    <span class="trust-value">值1</span>
  </div>
  <span class="flow-arrow">&rarr;</span>
  <div class="trust-item">
    <span class="trust-label">标签2</span>
    <span class="trust-value">值2</span>
  </div>
  <span class="flow-arrow">&rarr;</span>
  <div class="trust-item">
    <span class="trust-label">标签3</span>
    <span class="trust-value">值3</span>
  </div>
</div>
```

---

## L15 · 分割线

视觉分隔，用于章节切换。

```html
<div class="divider write-in" style="animation-delay:Xs">
  <span class="divider-text">章节标题</span>
</div>
```

---

## L16 · 便签旁注

浮动便签，用于补充说明。需放在 `.section` 内部。

```html
<!-- 黄色便签（默认） -->
<div class="side-note write-in" style="animation-delay:Xs">
  旁注内容
</div>

<!-- 粉色便签（左侧） -->
<div class="side-note left write-in" style="animation-delay:Xs">
  左侧旁注
</div>

<!-- 蓝色便签 -->
<div class="side-note blue write-in" style="animation-delay:Xs">
  蓝色旁注
</div>

<!-- 绿色便签 -->
<div class="side-note green write-in" style="animation-delay:Xs">
  绿色旁注
</div>

<!-- 紫色便签 -->
<div class="side-note purple write-in" style="animation-delay:Xs">
  紫色旁注
</div>
```

---

## L17 · 版本/年份徽章

突出版本号或时间跨度。

```html
<div class="version-badge write-in" style="animation-delay:Xs">
  <span>影响版本</span>
  <span class="version-number">8.9.6</span>
  <span>及之前</span>
  <span class="red-text">所有版本</span>
</div>
```

---

## L18 · 紧急警告框

红色斜纹背景，最高紧急度。

```html
<div class="urgent-box write-in" style="animation-delay:Xs">
  紧急警告内容
</div>
```

---

## L19 · 概念卡片页（Style B专用）

多个并列概念卡片。

```html
<div class="page" data-page="X">
  <div class="content-wrapper">
    <div class="page-header">[页面标题]</div>
    <div class="concept-cards">
      <div class="concept-card">
        <div class="card-icon"><i class="lucide-xxx"></i></div>
        <div class="card-title">[概念1]</div>
        <div class="card-desc">[描述]</div>
      </div>
      <div class="concept-card">
        <div class="card-icon"><i class="lucide-xxx"></i></div>
        <div class="card-title">[概念2]</div>
        <div class="card-desc">[描述]</div>
      </div>
    </div>
  </div>
  <div class="page-number">X</div>
</div>
```

---

## L20 · 数据统计页（Style B专用）

网格卡片展示数据。

```html
<div class="page" data-page="X">
  <div class="content-wrapper">
    <div class="page-header">[页面标题]</div>
    <div class="impact-grid">
      <div class="impact-card">
        <div class="impact-label">[标签]</div>
        <div class="impact-num">[数字]</div>
        <div class="impact-label">[来源]</div>
      </div>
      <div class="impact-card">
        <div class="impact-label">[标签]</div>
        <div class="impact-num">[数字]</div>
        <div class="impact-label">[来源]</div>
      </div>
    </div>
  </div>
  <div class="page-number">X</div>
</div>
```

---

## 动画延迟规则

所有 `.write-in` 元素的 `animation-delay` 按以下规则递增：

- 标题：0.1s
- 副标题/日期：0.3s
- 第一个 section：0.5s 开始
- 每个 section 内部元素递增 0.1s
- section 之间递增 0.2-0.3s

示例：
```html
<div class="title write-in" style="animation-delay:0.1s">标题</div>
<div class="subtitle write-in" style="animation-delay:0.3s">副标题</div>
<div class="section">
  <div class="section-title write-in" style="animation-delay:0.5s">第一节</div>
  <div class="content write-in" style="animation-delay:0.6s">内容</div>
  <div class="side-note write-in" style="animation-delay:0.7s">便签</div>
</div>
<div class="section">
  <div class="section-title write-in" style="animation-delay:0.9s">第二节</div>
  <div class="content write-in" style="animation-delay:1.0s">内容</div>
</div>
```
