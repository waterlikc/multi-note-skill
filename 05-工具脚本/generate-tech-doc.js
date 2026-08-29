const fs = require('fs');
const path = require('path');

// Read the markdown content
const mdPath = path.resolve(__dirname, '..', '01-技术文档（提交用）', '技术文档.md');
const htmlPath = path.resolve(__dirname, '..', '01-技术文档（提交用）', 'multi-note-skill-技术文档.html');
const cssPath = path.resolve(__dirname, '..', 'multi-note-skill', 'assets', 'styles.css');

const mdContent = fs.readFileSync(mdPath, 'utf-8');

// Simple markdown to html conversion
const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>multi-note-skill 技术文档</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
            background: #f9fafb;
        }
        h1, h2, h3 {
            color: #111827;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
        h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
        code {
            background: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-size: 0.9em;
        }
        pre {
            background: #1f2937;
            color: #f3f4f6;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
        }
        pre code {
            background: transparent;
            color: inherit;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 0.75rem;
            text-align: left;
        }
        th {
            background: #f3f4f6;
        }
        blockquote {
            border-left: 4px solid #3b82f6;
            margin: 0;
            padding: 1rem;
            background: #eff6ff;
            border-radius: 0 8px 8px 0;
        }
    </style>
</head>
<body>
    ${mdContent.replace(/\n/g, '<br>')}
</body>
</html>
`;

fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
console.log('HTML 技术文档已生成：', htmlPath);
