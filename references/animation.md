# 动画延迟规则详细指南

## 概述

所有 `.write-in` 元素必须设置 `animation-delay`，确保元素按顺序入场，提升阅读体验。

---

## 基础规则

### 元素入场顺序

1. **标题**：0.1s
2. **副标题/日期**：0.3s
3. **第一个section**：0.5s
4. **section内部元素**：递增0.1s
5. **section之间**：递增0.2-0.3s

### 基本公式

```css
/* 标题 */
.title { animation-delay: 0.1s; }

/* 副标题 */
.subtitle { animation-delay: 0.3s; }

/* 第一个section */
.section:first-child { animation-delay: 0.5s; }

/* section内部元素 */
.section > *:nth-child(1) { animation-delay: 0.5s; }
.section > *:nth-child(2) { animation-delay: 0.6s; }
.section > *:nth-child(3) { animation-delay: 0.7s; }

/* 第二个section */
.section:nth-child(2) { animation-delay: 0.8s; }
```

---

## 详细规则

### 1. 页面级元素

```html
<!-- 标题 -->
<div class="title write-in" style="animation-delay:0.1s">
  Python并发编程
</div>

<!-- 副标题 -->
<div class="subtitle write-in" style="animation-delay:0.3s">
  技术学习笔记
</div>

<!-- 日期 -->
<div class="date write-in" style="animation-delay:0.3s">
  2026-07-23
</div>
```

### 2. Section级元素

```html
<!-- 第一个section -->
<div class="section">
  <div class="section-title write-in" style="animation-delay:0.5s">
    核心概念
  </div>
  <div class="content write-in" style="animation-delay:0.6s">
    并发编程是指...
  </div>
  <div class="content write-in" style="animation-delay:0.7s">
    常见的并发模型包括...
  </div>
</div>

<!-- 第二个section -->
<div class="section">
  <div class="section-title write-in" style="animation-delay:0.8s">
    代码示例
  </div>
  <div class="content write-in" style="animation-delay:0.9s">
    下面是一个简单的例子...
  </div>
</div>
```

### 3. 组件级元素

```html
<!-- 流程图 -->
<div class="flow-box write-in" style="animation-delay:0.6s">
  <span class="flow-item">步骤1</span>
  <span class="flow-arrow">→</span>
  <span class="flow-item">步骤2</span>
</div>

<!-- 对比框 -->
<div class="compare-box write-in" style="animation-delay:0.7s">
  <div class="compare-row">
    <span class="compare-label old">之前</span>
    <span>旧方案</span>
  </div>
  <div class="compare-row">
    <span class="compare-label new">之后</span>
    <span>新方案</span>
  </div>
</div>

<!-- 代码块 -->
<pre class="write-in" style="animation-delay:0.8s"><code>
# 代码示例
</code></pre>
```

---

## 完整示例

### 示例1：技术笔记

```html
<div class="notebook">
  <!-- 标题 -->
  <div class="title write-in" style="animation-delay:0.1s">
    Python并发编程
  </div>
  
  <!-- 副标题 -->
  <div class="subtitle write-in" style="animation-delay:0.3s">
    技术学习笔记
  </div>
  
  <!-- 第一个section -->
  <div class="section">
    <div class="section-title write-in" style="animation-delay:0.5s">
      核心概念
    </div>
    <div class="content write-in" style="animation-delay:0.6s">
      并发编程是指多个任务同时执行...
    </div>
    <div class="content write-in" style="animation-delay:0.7s">
      常见的并发模型包括多线程、多进程、异步IO...
    </div>
  </div>
  
  <!-- 第二个section -->
  <div class="section">
    <div class="section-title write-in" style="animation-delay:0.8s">
      代码示例
    </div>
    <div class="content write-in" style="animation-delay:0.9s">
      使用asyncio实现异步编程：
    </div>
    <pre class="write-in" style="animation-delay:1.0s"><code>
import asyncio

async def main():
    print('Hello')
    await asyncio.sleep(1)
    print('World')

asyncio.run(main())
    </code></pre>
  </div>
  
  <!-- 第三个section -->
  <div class="section">
    <div class="section-title write-in" style="animation-delay:1.1s">
      最佳实践
    </div>
    <div class="content write-in" style="animation-delay:1.2s">
      1. 避免共享状态
    </div>
    <div class="content write-in" style="animation-delay:1.3s">
      2. 使用锁保护临界区
    </div>
    <div class="content write-in" style="animation-delay:1.4s">
      3. 优先使用异步IO
    </div>
  </div>
</div>
```

### 示例2：课堂笔记

```html
<div class="notebook">
  <!-- 标题 -->
  <div class="title write-in" style="animation-delay:0.1s">
    高中物理：电磁学
  </div>
  
  <!-- 副标题 -->
  <div class="subtitle write-in" style="animation-delay:0.3s">
    课堂笔记
  </div>
  
  <!-- 第一个section：知识点框架 -->
  <div class="section">
    <div class="section-title write-in" style="animation-delay:0.5s">
      知识框架
    </div>
    <div class="flow-box write-in" style="animation-delay:0.6s">
      <span class="flow-item">电场</span>
      <span class="flow-arrow">→</span>
      <span class="flow-item">磁场</span>
      <span class="flow-arrow">→</span>
      <span class="flow-item">电磁感应</span>
    </div>
  </div>
  
  <!-- 第二个section：核心概念 -->
  <div class="section">
    <div class="section-title write-in" style="animation-delay:0.8s">
      核心概念
    </div>
    <div class="content write-in" style="animation-delay:0.9s">
      <span class="highlight">电场强度</span>：电场中某点的电场强度...
    </div>
    <div class="content write-in" style="animation-delay:1.0s">
      <span class="highlight">磁通量</span>：穿过某一面积的磁感线条数...
    </div>
  </div>
  
  <!-- 第三个section：公式 -->
  <div class="section">
    <div class="section-title write-in" style="animation-delay:1.1s">
      重要公式
    </div>
    <div class="content write-in" style="animation-delay:1.2s">
      库仑定律：<span class="code-term">F = kQ₁Q₂/r²</span>
    </div>
    <div class="content write-in" style="animation-delay:1.3s">
      安培力：<span class="code-term">F = BIL sinθ</span>
    </div>
  </div>
  
  <!-- 第四个section：易错点 -->
  <div class="section">
    <div class="section-title write-in" style="animation-delay:1.4s">
      易错点
    </div>
    <div class="content write-in" style="animation-delay:1.5s">
      <span class="highlight-pink">注意</span>：电场强度是矢量，有方向！
    </div>
  </div>
</div>
```

---

## 常见错误

### 错误1：缺少animation-delay

```html
<!-- 错误 -->
<div class="title write-in">
  标题
</div>

<!-- 正确 -->
<div class="title write-in" style="animation-delay:0.1s">
  标题
</div>
```

### 错误2：延迟顺序混乱

```html
<!-- 错误：section标题比section内容先出现 -->
<div class="section-title write-in" style="animation-delay:0.6s">标题</div>
<div class="content write-in" style="animation-delay:0.5s">内容</div>

<!-- 正确 -->
<div class="section-title write-in" style="animation-delay:0.5s">标题</div>
<div class="content write-in" style="animation-delay:0.6s">内容</div>
```

### 错误3：延迟间隔过大

```html
<!-- 错误：间隔过大，用户等待时间过长 -->
<div class="title write-in" style="animation-delay:0.1s">标题</div>
<div class="subtitle write-in" style="animation-delay:2.0s">副标题</div>

<!-- 正确：合理间隔 -->
<div class="title write-in" style="animation-delay:0.1s">标题</div>
<div class="subtitle write-in" style="animation-delay:0.3s">副标题</div>
```

---

## 快速参考表

| 元素类型 | 建议延迟 | 说明 |
|----------|----------|------|
| 标题 | 0.1s | 最先出现 |
| 副标题/日期 | 0.3s | 标题后出现 |
| 第一个section标题 | 0.5s | 正文开始 |
| section内容第1项 | 0.6s | 标题后0.1s |
| section内容第2项 | 0.7s | 递增0.1s |
| section内容第3项 | 0.8s | 递增0.1s |
| 第二个section标题 | 0.8s | section间0.3s |
| 第二个section内容 | 0.9s | 递增0.1s |
| 第三个section标题 | 1.1s | section间0.3s |

---

## 性能优化

### 1. 使用CSS变量

```css
:root {
  --delay-base: 0.1s;
  --delay-increment: 0.1s;
  --delay-section: 0.3s;
}

.title { animation-delay: var(--delay-base); }
.subtitle { animation-delay: calc(var(--delay-base) * 3); }
```

### 2. 使用JavaScript动态计算

```javascript
function calculateDelay(element) {
  const baseDelay = 0.1;
  const sectionDelay = 0.3;
  const itemDelay = 0.1;
  
  // 计算section索引
  const sectionIndex = getElementSectionIndex(element);
  // 计算元素在section内的索引
  const itemIndex = getElementItemIndex(element);
  
  return baseDelay + (sectionIndex * sectionDelay) + (itemIndex * itemDelay);
}
```

---

## 更新日志

### v2.0.0 (2026-07-23)
- 创建动画延迟详细指南
- 添加完整示例和常见错误
- 添加快速参考表
