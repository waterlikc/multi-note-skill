const prompts = {
  image: '请粘贴图片中的文字，公式和不清楚的数字请单独标注。',
  video: '请粘贴视频字幕，可保留时间戳。',
  web: '只有链接不算已读：请粘贴网页标题与正文，或允许我读取这一页。',
  audio: '请粘贴音频转写，未知发言人请标注。',
  text: '请提供实际学习材料，链接本身不能代替正文。'
};

export async function resolveInput(input, adapters = {}, { timeoutMs = 15000 } = {}) {
  if (!input || !Object.hasOwn(prompts, input.kind)) throw new Error('未知输入类型');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('超时时间必须为正数');
  const text = input.extractedText ?? (input.kind === 'text' ? input.value : '');
  const usable = value => typeof value === 'string' && value.trim() && !/^https?:\/\/\S+$/i.test(value.trim());
  // 大材料不硬吞：先要求拆分，避免一次塞爆上下文与渲染。
  const MAX_TEXT = 200000;
  const tooBig = value => typeof value === 'string' && value.length > MAX_TEXT;
  if (usable(text) && tooBig(text)) return {
    status: 'needs_content', reason: '材料过大（' + text.length + ' 字符，上限 ' + MAX_TEXT + '）',
    next: '请按章节拆分后分批提供，单次不超过 ' + MAX_TEXT + ' 字符；或先给目录，再逐章整理。'
  };
  if (usable(text)) return { status: 'ready', text: text.trim(), label: input.label || '用户提供材料', via: 'provided' };
  const fallback = reason => ({ status: 'needs_content', reason, next: prompts[input.kind] });
  const adapter = adapters[input.kind];
  if (typeof adapter !== 'function') return fallback('本次没有可用的内容解析工具');
  const controller = new AbortController();
  let timer;
  try {
    const result = await Promise.race([
      Promise.resolve().then(() => adapter({ value: input.value, signal: controller.signal })),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('解析超时')); }, timeoutMs); })
    ]);
    if (!usable(result?.text)) return fallback('解析工具没有返回正文');
    // 识别置信度低时不猜：先让用户核对，再生成。
    const confidence = typeof result?.confidence === 'number' ? result.confidence : null;
    if (result?.uncertain === true || (confidence !== null && confidence < 0.8)) {
      return {
        status: 'needs_content',
        reason: '识别结果不确定' + (confidence !== null ? '（置信度 ' + confidence + '）' : ''),
        next: '请核对图片里的数字、公式与专有名词后粘贴；或换一张更清晰的照片。',
        preview: result.text.trim().slice(0, 120)
      };
    }
    return { status: 'ready', text: result.text.trim(), label: result.label || input.label || '解析工具返回材料', via: 'adapter', confidence };
  } catch {
    return fallback(controller.signal.aborted ? '解析超时' : '解析失败或无权限');
  } finally { clearTimeout(timer); }
}
