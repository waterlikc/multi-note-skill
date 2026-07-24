# PDF导出指南

## 方法一：浏览器打印（推荐）

### 步骤
1. 用浏览器打开HTML笔记文件
2. 按 `Ctrl + P`（Windows）或 `Cmd + P`（Mac）
3. 选择"另存为PDF"
4. 调整打印设置
5. 点击"保存"

### 打印设置建议

| 设置项 | 推荐值 | 说明 |
|--------|--------|------|
| 纸张大小 | A4 | 标准纸张大小 |
| 方向 | 纵向 | 大多数笔记适合纵向 |
| 边距 | 默认 | 保持页面布局 |
| 缩放 | 100% | 保持原始大小 |
| 背景图形 | 勾选 | 保留装饰元素 |

### 注意事项
- Style A的螺旋装订效果在PDF中会简化
- Style B的翻页交互在PDF中会变为静态页面
- 动画效果在PDF中不会显示

---

## 方法二：html2pdf.js（程序化导出）

### 安装
```bash
npm install html2pdf.js
```

### 使用示例
```javascript
const html2pdf = require('html2pdf.js');

// 读取HTML文件
const element = document.getElementById('notebook');

// 配置选项
const options = {
  margin: 10,
  filename: '笔记.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2 },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
};

// 生成PDF
html2pdf().set(options).from(element).save();
```

---

## 方法三：Puppeteer（Node.js）

### 安装
```bash
npm install puppeteer
```

### 使用示例
```javascript
const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF(htmlPath, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(`file://${path.resolve(htmlPath)}`, {
    waitUntil: 'networkidle0
  });
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true
  });
  
  await browser.close();
}

// 使用
generatePDF(
  'D:/blog/notes/技术教学-Python并发编程-笔记.html',
  'D:/blog/notes/技术教学-Python并发编程-笔记.pdf'
);
```

---

## 方法四：wkhtmltopdf（命令行）

### 安装
```bash
# Windows
choco install wkhtmltopdf

# macOS
brew install wkhtmltopdf

# Linux
sudo apt-get install wkhtmltopdf
```

### 使用示例
```bash
wkhtmltopdf --enable-local-file-access \
  --page-size A4 \
  --margin-top 10mm \
  --margin-bottom 10mm \
  --margin-left 10mm \
  --margin-right 10mm \
  input.html output.pdf
```

---

## PDF优化建议

### 字体嵌入
确保PDF中字体正确显示：
```css
@font-face {
  font-family: 'Kalam';
  src: url('https://fonts.googleapis.com/css2?family=Kalam&display=swap');
}
```

### 图片优化
```css
@media print {
  .coffee-stain, .paperclip, .tape {
    display: none; /* 隐藏装饰元素减少PDF大小 */
  }
}
```

### 页面分隔
```css
@media print {
  .section {
    page-break-inside: avoid; /* 避免段落被分页打断 */
  }
  
  .divider {
    page-break-before: always; /* 在分割线处分页 */
  }
}
```

---

## 批量导出脚本

### Node.js批量导出
```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const notesDir = 'D:/blog/notes';
const outputDir = 'D:/blog/notes/pdf';

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function batchConvert() {
  const browser = await puppeteer.launch();
  
  // 读取所有HTML文件
  const files = fs.readdirSync(notesDir)
    .filter(f => f.endsWith('.html'));
  
  for (const file of files) {
    const page = await browser.newPage();
    const htmlPath = path.join(notesDir, file);
    const pdfPath = path.join(outputDir, file.replace('.html', '.pdf'));
    
    console.log(`转换: ${file}`);
    
    await page.goto(`file://${path.resolve(htmlPath)}`, {
      waitUntil: 'networkidle0'
    });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true
    });
    
    await page.close();
  }
  
  await browser.close();
  console.log('批量转换完成！');
}

batchConvert().catch(console.error);
```

---

## 常见问题

### Q: PDF中字体显示异常？
A: 确保网络连接正常，Google Fonts可以正常加载。

### Q: PDF中背景色丢失？
A: 在打印设置中勾选"背景图形"选项。

### Q: PDF文件太大？
A: 隐藏装饰元素，或降低图片质量。

### Q: 如何批量导出？
A: 使用Node.js脚本或wkhtmltopdf命令行工具。
