// 视频链接：先探测公开字幕/转写，再把时间戳变成来源；拿不到就明确停下。
import { toSources } from './subtitles.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const DEFAULT_TIMEOUT = 12000;

export function detectVideo(value) {
  if (typeof value !== 'string') return null;
  let url; try { url = new URL(value.trim()); } catch { return null; }
  if (!/^https?:$/.test(url.protocol)) return null;
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? { platform: 'youtube', id } : null;
  }
  if (host.endsWith('youtube.com')) {
    const id = url.searchParams.get('v') || (url.pathname.match(/\/(?:shorts|embed)\/([\w-]+)/) || [])[1];
    return id ? { platform: 'youtube', id } : null;
  }
  if (host.endsWith('bilibili.com')) {
    const m = url.pathname.match(/\/video\/(BV[0-9A-Za-z]+|av\d+)/i);
    return m ? { platform: 'bilibili', id: m[1] } : null;
  }
  if (host.endsWith('vimeo.com')) {
    const m = url.pathname.match(/\/(\d+)/);
    return m ? { platform: 'vimeo', id: m[1] } : null;
  }
  return null;
}

const clock = ms => {
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
  return h ? h + ':' + mm + ':' + ss : mm + ':' + ss;
};

function needs(info, extra = {}) {
  return {
    status: 'needs_transcript',
    platform: info.platform,
    videoId: info.id,
    reason: extra.reason || ('只拿到 ' + info.platform + ' 视频链接（' + info.id + '），没有可读的字幕或转写'),
    next: extra.next || '请粘贴带时间戳的字幕；平台有视频理解/ASR 时先用它转写。不按标题或简介编摘要。',
    ...extra
  };
}

function errorResult(info, error) {
  return {
    ...needs(info),
    status: 'error',
    reason: '读取视频信息失败：' + (error && error.message ? error.message : String(error)),
    next: '检查网络或平台权限；也可以直接粘贴字幕/转写。没有正文就不生成笔记。'
  };
}

async function request(url, { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT, headers = {} } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('当前环境没有 fetch');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': UA,
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.7',
        ...headers
      }
    });
    if (!response || response.ok === false) throw new Error('HTTP ' + (response ? response.status : '无响应'));
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function getText(url, options) {
  const response = await request(url, options);
  return response.text();
}

async function getJson(url, options) {
  const text = await getText(url, options);
  try { return JSON.parse(text); } catch { throw new Error('返回内容不是 JSON'); }
}

const absolute = value => value ? (value.startsWith('//') ? 'https:' + value : value) : value;

function transcriptOf(cues) {
  return cues.map(cue => '[' + clock(cue.start) + '] ' + cue.text).join('\n');
}

function finish(info, { title, duration, page, cues, url = info.url, labelPrefix = '视频字幕', extra = {} }) {
  const sources = toSources(cues, { maxChars: 600, labelPrefix });
  return {
    status: 'ready',
    platform: info.platform,
    videoId: info.id,
    title: title || info.id,
    url,
    duration: duration || null,
    ...(page ? { page } : {}),
    cues,
    sources,
    transcript: transcriptOf(cues),
    next: '把 sources 写入 note.json；章节 sourceIds 指向对应 S 编号，label 已带时间戳。',
    ...extra
  };
}

async function fetchBilibili(value, info, options) {
  const parsed = new URL(value);
  const viewUrl = new URL('https://api.bilibili.com/x/web-interface/view');
  if (/^BV/i.test(info.id)) viewUrl.searchParams.set('bvid', info.id);
  else viewUrl.searchParams.set('aid', info.id.replace(/^av/i, ''));
  const view = await getJson(viewUrl.toString(), { ...options, headers: { referer: 'https://www.bilibili.com/' } });
  if (view.code !== 0 || !view.data) throw new Error(view.message || 'B 站没有返回视频信息');
  const data = view.data;
  const pages = Array.isArray(data.pages) && data.pages.length ? data.pages : [{ cid: data.cid, page: 1, part: data.title, duration: data.duration }];
  const wanted = Math.max(1, Number(parsed.searchParams.get('p')) || 1);
  const page = pages[Math.min(wanted, pages.length) - 1] || pages[0];
  const title = pages.length > 1 && page.part ? data.title + ' · ' + page.part : (data.title || info.id);
  const playerUrl = new URL('https://api.bilibili.com/x/player/v2');
  playerUrl.searchParams.set('bvid', info.id);
  playerUrl.searchParams.set('cid', String(page.cid));
  if (data.aid) playerUrl.searchParams.set('aid', String(data.aid));
  const player = await getJson(playerUrl.toString(), { ...options, headers: { referer: value } });
  const tracks = player?.data?.subtitle?.subtitles ?? [];
  if (!tracks.length) {
    return needs(info, {
      title, duration: page.duration || data.duration || null, page: page.page || wanted,
      reason: 'B 站没有返回公开字幕（视频可能未上传字幕，或字幕需要登录/平台转写）',
      next: '在平台用视频理解/ASR 转写；或从字幕面板复制字幕后粘贴。没有转写就不生成笔记。'
    });
  }
  const track = tracks.find(item => /^zh|中文|简体|繁体/i.test((item.lan || '') + ' ' + (item.lan_doc || ''))) ||
    tracks.find(item => /^en|英文/i.test((item.lan || '') + ' ' + (item.lan_doc || ''))) || tracks[0];
  const subtitleUrl = absolute(track.subtitle_url);
  if (!subtitleUrl) return needs(info, { title, reason: '字幕条目缺少地址', next: '请粘贴字幕。' });
  const subtitle = await getJson(subtitleUrl, { ...options, headers: { referer: value } });
  const body = Array.isArray(subtitle.body) ? subtitle.body : [];
  const cues = body.map(item => ({
    start: Math.round((Number(item.from) || 0) * 1000),
    end: Math.round((Number(item.to) || 0) * 1000),
    text: String(item.content || '').replace(/\s+/g, ' ').trim()
  })).filter(cue => cue.text && cue.end >= cue.start);
  if (!cues.length) return needs(info, { title, reason: '字幕文件为空', next: '请粘贴字幕或转写。' });
  return finish(info, {
    title, duration: page.duration || data.duration || null, page: page.page || wanted,
    cues, url: value,
    labelPrefix: pages.length > 1 ? '视频字幕 P' + (page.page || wanted) : '视频字幕',
    extra: { pageTitle: page.part || '' }
  });
}

function extractBalanced(text, start) {
  if (text[start] !== '{') return null;
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parsePlayerResponse(html) {
  const markers = ['"ytInitialPlayerResponse":', 'ytInitialPlayerResponse =', 'ytInitialPlayerResponse='];
  for (const marker of markers) {
    const at = html.indexOf(marker);
    if (at < 0) continue;
    const brace = html.indexOf('{', at + marker.length);
    if (brace < 0) continue;
    const json = extractBalanced(html, brace);
    if (!json) continue;
    try { return JSON.parse(json); } catch { /* try next marker */ }
  }
  return null;
}

function youtubeCuesFromJson(text) {
  let data;
  try { data = JSON.parse(text); } catch { return []; }
  const events = Array.isArray(data.events) ? data.events : [];
  const cues = [];
  for (const event of events) {
    const segs = Array.isArray(event.segs) ? event.segs : [];
    const body = segs.map(seg => seg.utf8 || '').join('').replace(/\s+/g, ' ').trim();
    if (!body || !Number.isFinite(event.tStartMs)) continue;
    cues.push({ start: event.tStartMs, end: event.tStartMs + (Number(event.dDurationMs) || 800), text: body });
  }
  return cues;
}

function decodeEntities(text) {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function youtubeCuesFromXml(text) {
  const cues = [];
  for (const match of text.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const attrs = match[1];
    const start = Number((attrs.match(/\bstart="([\d.]+)"/) || [])[1]);
    const dur = Number((attrs.match(/\bdur="([\d.]+)"/) || [])[1]);
    const body = decodeEntities(match[2].replace(/<[^>]+>/g, ''));
    if (body && Number.isFinite(start)) cues.push({ start: Math.round(start * 1000), end: Math.round((start + (dur || 0.8)) * 1000), text: body });
  }
  return cues;
}

async function fetchYouTube(value, info, options) {
  const pageUrl = 'https://www.youtube.com/watch?v=' + encodeURIComponent(info.id) + '&hl=zh-CN';
  const html = await getText(pageUrl, options);
  const player = parsePlayerResponse(html);
  const title = player?.videoDetails?.title || info.id;
  const duration = Number(player?.videoDetails?.lengthSeconds) || null;
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) {
    return needs(info, {
      title, duration,
      reason: 'YouTube 没有返回公开字幕轨道（视频可能未开放字幕）',
      next: '在平台用视频理解/ASR 转写；或粘贴字幕。没有转写就不生成笔记。'
    });
  }
  const track = tracks.find(item => /^zh/i.test(item.languageCode || '')) ||
    tracks.find(item => /^en/i.test(item.languageCode || '')) || tracks[0];
  if (!track?.baseUrl) return needs(info, { title, duration, reason: '字幕轨道缺少地址', next: '请粘贴字幕。' });
  const captionUrl = track.baseUrl + (track.baseUrl.includes('fmt=') ? '' : '&fmt=json3');
  const caption = await getText(captionUrl, options);
  let cues = youtubeCuesFromJson(caption);
  if (!cues.length) cues = youtubeCuesFromXml(caption);
  if (!cues.length) return needs(info, { title, duration, reason: '字幕内容为空或格式不可读', next: '请粘贴字幕。' });
  return finish(info, { title, duration, cues, url: 'https://youtu.be/' + info.id, labelPrefix: '视频字幕' });
}

async function fetchVimeo(value, info, options) {
  const meta = await getJson('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(value), options);
  return needs(info, {
    title: meta?.title || info.id,
    duration: meta?.duration || null,
    reason: 'Vimeo 公开接口没有字幕，需要平台转写或人工提供',
    next: '用平台视频理解/ASR 转写，或粘贴字幕；没有转写就不生成笔记。'
  });
}

// 只读取公开字幕；不登录、不绕过权限、不把标题当正文。
export async function fetchVideo(value, options = {}) {
  const info = detectVideo(value);
  if (!info) return {
    status: 'needs_transcript',
    reason: '识别不到视频平台，或链接不是 http(s) 视频页',
    next: '请粘贴视频字幕/转写；或提供 B 站、YouTube、Vimeo 的公开视频链接。'
  };
  try {
    if (info.platform === 'bilibili') return await fetchBilibili(value, info, options);
    if (info.platform === 'youtube') return await fetchYouTube(value, info, options);
    if (info.platform === 'vimeo') return await fetchVimeo(value, info, options);
  } catch (error) {
    return errorResult(info, error);
  }
  return needs(info);
}

export function videoPrompt(value) {
  const info = detectVideo(value);
  return {
    status: 'needs_content',
    reason: info
      ? '只拿到 ' + info.platform + ' 视频链接（' + info.id + '），还没有可读字幕或转写'
      : '只拿到视频链接，还没有可读字幕或转写',
    next: '先调用平台视频理解/ASR 取带时间戳的转写；本地可运行 node cli/note.mjs video <链接> <来源.json> 探测公开字幕。拿不到就粘贴字幕，不按标题编摘要。',
    platform: info ? info.platform : null,
    videoId: info ? info.id : null
  };
}
