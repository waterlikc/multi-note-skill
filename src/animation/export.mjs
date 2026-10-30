import { existsSync } from 'node:fs';
import { join } from 'node:path';

// 用负 animation-delay + paused 把 CSS 动画冻结在 t 秒；同一个 CSS 时间轴，不复制渲染逻辑。
export function buildFrameHtml(rendered, time, width = 960) {
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
    '<style>:root{--ink:#12324a;--paper:#f6f9fa;--line:#b7d2dc;--accent:#0e7c8a;--muted:#5b7283}' +
    'html,body{margin:0;background:#e9e5e1}body{padding:0}' +
    '.anim-figure{margin:0!important;border:0!important;padding:14px 16px!important;width:' + width + 'px!important;box-sizing:border-box}' +
    '.anim-figure *{animation-delay:-' + Number(time).toFixed(3) + 's!important;animation-play-state:paused!important}' +
    rendered.css + '</style></head><body>' + rendered.html + '</body></html>';
}

export function findBrowser() {
  const explicit = process.env.CHROME_PATH || process.env.EDGE_PATH;
  if (explicit && existsSync(explicit)) return explicit;
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  return candidates.find(path => existsSync(path)) ?? null;
}

export function framePath(dir, index) {
  return join(dir, 'frame-' + String(index).padStart(4, '0') + '.png');
}
