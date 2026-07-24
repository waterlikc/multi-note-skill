# 组件手册

## 文字样式

| 类名 | 效果 | 用途 |
|------|------|------|
| `.highlight` | 黄色高亮背景 | 关键术语、重点概念 |
| `.highlight-pink` | 粉色高亮背景 | 危险操作、警告内容 |
| `.highlight-green` | 绿色高亮背景 | 正面信息、安全状态 |
| `.highlight-orange` | 橙色高亮背景 | 注意事项、待办 |
| `.red-text` | 红色加粗 | 强调、警告、关键词 |
| `.blue-text` | 蓝色 | 信息、术语、链接 |
| `.green-text` | 绿色 | 安全、正面、确认 |
| `.purple-text` | 紫色 | 技术、代码、工具 |
| `.orange-text` | 橙色加粗 | 数据、统计、注意 |
| `.code-term` | 等宽字体 + 下划线 | 代码术语、命令、变量名 |
| `.underline-wavy` | 红色波浪下划线 | 重点强调 |
| `.double-underline` | 红色双下划线 | 最高强调 |
| `.check-mark` | 绿色加粗 ✓ | 正确、通过 |
| `.cross-mark` | 红色加粗 ✗ | 错误、失败 |
| `.star-mark` | 红色星号 ★ | 重要标记 |

## 标签

```html
<span class="badge">红色标签</span>
<span class="badge blue">蓝色标签</span>
<span class="badge green">绿色标签</span>
<span class="badge purple">紫色标签</span>
<span class="badge orange">橙色标签</span>
```

## 代码块

```html
<div class="code-block">
  <span class="code-comment"># 注释</span>
  <span class="code-keyword">import</span> os
  <span class="code-string">"字符串"</span>
</div>
```

## 装饰图标（Lucide SVG）

**禁止使用 emoji 作为图标。** 需要图标时，使用 Lucide SVG 图标库。

模板已引入 Lucide CSS：`https://unpkg.com/lucide-static@latest/font/lucide.min.css`

根据笔记主题选择合适的 Lucide 图标：

| 主题 | Lucide 图标 | CSS Class |
|------|------------|-----------|
| 安全/漏洞 | Shield Alert | `lucide-shield-alert` |
| Bug | Bug | `lucide-bug` |
| AI | Bot | `lucide-bot` |
| 锁/加密 | Lock | `lucide-lock` |
| 代码 | Code | `lucide-code` |
| 盾牌/防御 | Shield | `lucide-shield` |
| 警告 | Alert Triangle | `lucide-alert-triangle` |
| 灯泡/想法 | Lightbulb | `lucide-lightbulb` |
| 火/热点 | Flame | `lucide-flame` |
| 闪电/速度 | Zap | `lucide-zap` |
| 网络 | Network | `lucide-network` |
| 数据库 | Database | `lucide-database` |
| 文件 | File | `lucide-file` |
| 搜索 | Search | `lucide-search` |
| 设置 | Settings | `lucide-settings` |
| 用户 | User | `lucide-user` |
| 学习 | Book Open | `lucide-book-open` |
| 图表 | Bar Chart | `lucide-bar-chart` |
| 目标 | Target | `lucide-target` |
| 分享 | Share | `lucide-share-2` |
| 剪贴板 | Clipboard | `lucide-clipboard-list` |
| 鼠标 | Mouse Pointer | `lucide-mouse-pointer-click` |
| 饼图 | Pie Chart | `lucide-pie-chart` |
| 点赞 | Thumbs Up | `lucide-thumbs-up` |
| CPU | Cpu | `lucide-cpu` |
| Git | Git Branch | `lucide-git-branch` |
| 检查 | Check Circle | `lucide-check-circle` |

使用方式（放在 `.notebook` 内）：

```html
<div class="doodle" style="top:80px;right:80px;font-size:2rem;transform:rotate(15deg);opacity:0.15;">
  <i class="lucide-bot"></i>
</div>
```

> 图标大小通过 `font-size` 控制，颜色继承父元素的 `color`。

## 装饰元素控制

| 元素 | 默认显示 | 隐藏方式 |
|------|---------|---------|
| 胶带 `.tape` | 显示 | 删除对应 div |
| 回形针 `.paperclip` | 显示 | 删除对应 div |
| 咖啡渍 `.coffee-stain` | 显示 | 删除对应 div |
| 折角 `.folded-corner` | 显示 | 删除对应 div |
| 螺旋孔 `.spiral-holes` | 显示 | 删除对应 div |
| 涂鸦 `.doodle` | 隐藏 | 按需添加 |

**装饰元素限制**：
- 咖啡渍不超过 2 个
- 涂鸦不超过 3 个，opacity ≤ 0.15
- 胶带不超过 2 个

## 动画系统

所有内容元素使用 `.write-in` 类实现"书写出现"效果。

**动画延迟规则**：
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
  <div class="side-note write-in" style="animation-delay:0.7s">旁注</div>
</div>
<div class="section">
  <div class="section-title write-in" style="animation-delay:0.9s">第二节</div>
  <div class="content write-in" style="animation-delay:1.0s">内容</div>
</div>
```

## Style B 专用组件

Style B（手账皮革本）额外支持以下组件：

### 概念卡片

```html
<div class="concept-cards">
  <div class="concept-card">
    <div class="card-icon"><i class="lucide-xxx"></i></div>
    <div class="card-title">[概念]</div>
    <div class="card-desc">[描述]</div>
  </div>
</div>
```

### 数据统计卡片

```html
<div class="impact-grid">
  <div class="impact-card">
    <div class="impact-label">[标签]</div>
    <div class="impact-num">[数字]</div>
    <div class="impact-label">[来源]</div>
  </div>
</div>
```

### 翻页控制

Style B 使用 JavaScript 控制翻页：

```javascript
let currentPage = 0;
const totalPages = [总页数]; // 包括封面
const pages = document.querySelectorAll('.page');

function showPage(pageNum) {
  pages.forEach((page, index) => {
    page.classList.remove('active', 'flipped');
    if (index < pageNum) {
      page.classList.add('flipped');
    } else if (index === pageNum) {
      page.classList.add('active');
    }
  });
  currentPage = pageNum;
}

function nextPage() {
  if (currentPage < totalPages - 1) showPage(currentPage + 1);
}

function prevPage() {
  if (currentPage > 0) showPage(currentPage - 1);
}

// 封面点击翻页
document.querySelector('.page.cover').addEventListener('click', nextPage);

// 键盘翻页
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
  else if (e.key === 'ArrowLeft') prevPage();
});
```
