// 字幕解析：SRT / VTT 都只取时间轴与文本，不猜内容。
const TIME = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,](\d{3})/;

function toMs(h, m, s, ms) {
  return ((Number(h || 0) * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(ms);
}

function clean(text) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function parseSubtitles(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const cues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('-->')) continue;
    const [a, b] = line.split('-->').map(part => part.trim().split(/\s+/)[0]);
    const ma = a.match(TIME), mb = b.match(TIME);
    if (!ma || !mb) continue;
    const start = toMs(ma[1], ma[2], ma[3], ma[4]);
    const end = toMs(mb[1], mb[2], mb[3], mb[4]);
    const body = [];
    for (let j = i + 1; j < lines.length && lines[j].trim(); j++) body.push(lines[j]);
    const content = clean(body.join(' '));
    if (content) cues.push({ start, end, text: content });
  }
  return cues;
}

const clock = ms => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
  return h ? h + ':' + mm + ':' + ss : mm + ':' + ss;
};

// 把连续字幕并成来源块，label 保留起止时间，笔记可回到原视频。
export function toSources(cues, { maxChars = 600, prefix = 'S', labelPrefix = '视频字幕' } = {}) {
  const sources = [];
  let bucket = [], chars = 0;
  const flush = () => {
    if (!bucket.length) return;
    const id = prefix + (sources.length + 1);
    sources.push({
      id,
      label: labelPrefix + ' · ' + clock(bucket[0].start) + '–' + clock(bucket[bucket.length - 1].end),
      text: bucket.map(c => c.text).join(' ')
    });
    bucket = []; chars = 0;
  };
  for (const cue of cues) {
    if (chars && chars + cue.text.length > maxChars) flush();
    bucket.push(cue); chars += cue.text.length;
  }
  flush();
  return sources;
}