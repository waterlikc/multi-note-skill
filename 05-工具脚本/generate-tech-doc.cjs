const fs = require('fs');
const path = require('path');

const mdPath = path.resolve(__dirname, '..', '01-技术文档（提交用）', '技术文档.md');
const htmlPath = path.resolve(__dirname, '..', '01-技术文档（提交用）', 'multi-note-skill-技术文档.html');

const mdContent = fs.readFileSync(mdPath, 'utf-8');

const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>multi-note-skill 技术文档</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #24292e;
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
        }
        h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
        h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
        code { background-color: #f6f8fa; padding: 0.2em 0.4em; font-size: 85%; border-radius: 3px; }
        pre { background-color: #f6f8fa; padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; border-radius: 6px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
        tr:nth-child(2n) { background-color: #f6f8fa; }
        blockquote { border-left: 0.25em solid #dfe2e5; color: #6a737d; padding: 0 1em; margin-top: 0; margin-bottom: 16px; }
    </style>
</head>
<body>
${mdContent.replace(/\n/g, '<br>')}
</body>
</html>
`;

fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
console.log('技术文档 HTML 已生成:', htmlPath);
