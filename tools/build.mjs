import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { generateNote, createState, mergeState, escapeHtml } from '../index.mjs';

const root = new URL('../', import.meta.url);
const write = (name, value) => writeFile(new URL(name, root), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', 'utf8');
await mkdir(new URL('assets/', root), { recursive: true });
await mkdir(new URL('examples/', root), { recursive: true });
const themeCss = {
  a: await readFile(new URL('assets/theme-a.css', root), 'utf8'),
  b: await readFile(new URL('assets/theme-b.css', root), 'utf8'),
  c: await readFile(new URL('assets/theme-c.css', root), 'utf8')
};
for (const [style, css] of Object.entries(themeCss)) {
  await write(`assets/template-${style}.html`, `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{TITLE}}</title><style>${css}</style></head>
<body><input type="checkbox" id="night" class="night-toggle"><div class="topbar"><span class="tb-title">学习笔记</span><span class="tb-meta">v{{REVISION}}</span><label for="night" class="night-toggle-label" title="切换夜间/白天"></label></div><main id="top"><header><p class="eyebrow">{{SCENE}}</p><h1>{{TITLE}}</h1><p class="lead">{{SUMMARY}}</p></header><nav aria-label="章节导航">{{NAV}}</nav>{{CONTENT}}<section><h2>原始材料与来源</h2><ol class="sources">{{SOURCES}}</ol></section>{{STATE}}<p class="footer">全天候智慧学伴 · 离线可读 · 使用浏览器打印</p>{{PAGER}}</main></body></html>\n`);
}

const p = text => ({ type: 'paragraph', text });
const list = (...items) => ({ type: 'list', items });
const callout = text => ({ type: 'callout', text });
const table = (headers, rows) => ({ type: 'table', headers, rows });
const section = (id, heading, blocks, origin = 'source', sourceIds = ['S1']) => ({ id, heading, blocks, origin, sourceIds });
const sample = (id, title, scene, style, summary, text, sections) => ({ schemaVersion: 1, id, revision: 1, title, scene, style, summary, sources: [{ id: 'S1', label: '教学演示材料（人工编写），第1段', text }], sections });
const samples = [
  sample('java-web', 'Spring Boot 3 订单接口：从 Controller 到 SQL', 'tech', 'style-a', '一次请求穿过三层：Controller 收参数、Service 管事务、Mapper 绑 SQL；异常在边界统一收口。',
    '教学演示材料（人工编写）：Spring Boot 3 需要 Java 17 或更高版本。@RestController 的返回值由 Jackson 序列化为 JSON；@Valid 触发 DTO 校验；@Transactional 默认只在 RuntimeException 时回滚；MyBatis 用 @Mapper 扫描接口，#{} 走 PreparedStatement，${} 是字符串拼接。', [
      section('api', '分层：一次请求经过谁', [p('接口层只负责协议转换，业务规则留在 Service，SQL 只出现在 Mapper。三层各自可测，改动才不会互相牵连。'), table(['层', '职责', '关键注解'], [['Controller', '接参数、校验、返回视图', '@RestController · @Valid'], ['Service', '业务规则、事务边界', '@Service · @Transactional'], ['Mapper', 'SQL 与结果映射', '@Mapper · @Select']])]),
      section('controller', 'Controller：只接参数、只返结果', [{ type: 'code', language: 'Java · OrderController', text: '@RestController\n@RequestMapping("/api/orders")\npublic class OrderController {\n    private final OrderService service;\n    public OrderController(OrderService service) { this.service = service; }\n\n    @GetMapping("/{id}")\n    public OrderView get(@PathVariable long id) {\n        return service.find(id);\n    }\n}' }, list('构造器注入，字段 final，便于测试替换。', '返回对象而不是拼接 JSON 字符串。', '不在 Controller 里写 if 业务判断。')]),
      section('validation', 'DTO 校验：把坏请求挡在门外', [{ type: 'code', language: 'Java · 请求体与校验', text: 'public record CreateOrderRequest(\n        @NotNull Long userId,\n        @NotEmpty List<@Valid Item> items) {}\n\n@PostMapping\npublic OrderView create(@Valid @RequestBody CreateOrderRequest req) {\n    return service.create(req);\n}' }, callout('@Valid 失败默认返回 400，不会进入方法体。400 是请求问题，500 才是服务端问题，排错方向完全不同。')]),
      section('service', 'Service：事务边界画在哪', [{ type: 'code', language: 'Java · 事务', text: '@Service\npublic class OrderService {\n    private final OrderMapper mapper;\n    public OrderService(OrderMapper mapper) { this.mapper = mapper; }\n\n    @Transactional(rollbackFor = Exception.class)\n    public OrderView create(CreateOrderRequest req) {\n        long id = mapper.insert(req);\n        return mapper.findById(id);\n    }\n}' }, callout('@Transactional 默认只对 RuntimeException 回滚；有受检异常时要显式写 rollbackFor = Exception.class。事务不要包住远程调用。')]),
      section('mapper', 'Mapper：SQL 与参数绑定', [{ type: 'code', language: 'Java · MyBatis', text: '@Mapper\npublic interface OrderMapper {\n    @Select("select id, user_id, amount from orders where id = #{id}")\n    OrderRow findById(long id);\n}' }, table(['写法', '编译结果', '风险'], [['#{id}', 'PreparedStatement 占位符', '参数被正确处理，推荐'], ['${id}', '字符串直接拼接', '可能 SQL 注入，禁用'], ['${columns}', '拼接列名', '只允许白名单常量']])]),
      section('debug', '排错顺序：日志 → 参数 → SQL', [list('先看异常栈第一行，确认是 4xx 还是 5xx。', '400 先核对请求体字段名与类型。', '5xx 打开 SQL 日志，确认语句与参数。', '用最小请求复现，再逐层加回条件。'), callout('不要在 Controller 里 try-catch 吞掉异常；统一异常处理只做转换，不隐藏堆栈。')]),
      section('quiz', '自测：三个必答', [p('1. @Transactional 默认对哪些异常回滚？'), p('答：RuntimeException 及其子类；受检异常需要 rollbackFor = Exception.class。'), p('2. #{} 和 ${} 的区别？'), p('答：#{} 走 PreparedStatement 占位符并处理参数；${} 直接拼接字符串，可能被注入。'), p('3. 接口返回 400 和 500，分别先查什么？'), p('答：400 查参数绑定与校验；500 查服务端异常栈与 SQL。')], 'supplement', [])]),
  sample('physics', '牛顿第二定律：合力决定加速度', 'course', 'style-a', '计算之前，先明确研究对象、参考系和合力。',
    '在惯性参考系内，对质量不变的物体，合外力 F合=ma，方向与加速度一致。质量2kg的小车受水平向右10N拉力和向左2N摩擦力，竖直方向合力为0。水平合力8N，加速度向右4m/s²。', [
      section('law', '适用条件与公式', [p('在惯性参考系中，恒定质量物体满足 F合=ma。加速度方向与合力方向相同。'), table(['量', '符号', '单位'], [['合力', 'F合', 'N'], ['质量', 'm', 'kg'], ['加速度', 'a', 'm/s²']])]),
      section('example', '小车受力计算', [list('选取向右为正方向。', 'F合=10−2=8 N。', 'a=F合/m=8/2=4 m/s²，方向向右。'), callout('不能把拉力直接当作合力。速度方向也不一定与加速度方向相同。')]),
      section('quiz', '自测与答案', [p('若向右拉力仍为10N，向左摩擦力改为4N，求加速度。'), p('答案：(10−4)/2=3 m/s²，向右。')], 'supplement', [])]),
  sample('programming', 'Python 列表：复制与共享', 'tech', 'style-c', '赋值不会复制列表；先理解对象共享，再选择复制方式。',
    'Python 中 b=a 会让两个变量引用同一个列表。b=a.copy() 创建新的外层列表，是浅拷贝。嵌套列表的内部对象仍共享。列表推导式可以从可迭代对象构造新列表。', [
      section('concept', '赋值和浅拷贝的区别', [table(['写法', '外层列表', '嵌套对象'], [['b=a', '共享', '共享'], ['b=a.copy()', '新列表', '仍可能共享']])]),
      section('code', '观察共享行为', [{ type: 'code', language: 'Python 3 · 补充示例', text: 'a = [1, 2]\nb = a\nb.append(3)\nprint(a)  # [1, 2, 3]\n\nc = a.copy()\nc.append(4)\nprint(a)  # [1, 2, 3]' }, callout('这里展示的是示例的预期输出。渲染笔记不会执行代码。')], 'supplement', []),
      section('quiz', '自测：嵌套列表', [p('a=[[1]]; b=a.copy(); b[0].append(2)。此时 a 是什么？'), p('答案：[[1,2]]。浅拷贝只复制外层，内层列表仍被共享。')], 'supplement', [])]),
  sample('meeting', '课程项目会议：把讨论变成行动', 'meeting', 'style-b', '确定演示范围，记录责任归属，把未决事项留在明处。',
    '10月12日项目会：小林负责整理数学示例，10月15日前交付；小周负责离线打印检查，10月16日前交付。大家同意演示先展示输入与笔记对照，再展示增量更新。音频转写是否接入仍需确认，预算未提供。', [
      section('decision', '已确认的决议', [p('先展示原始材料与笔记对照，再展示增量更新。演示只使用已验证路径。')]),
      section('actions', '行动清单', [table(['行动', '负责人', '截止时间'], [['整理数学示例', '小林', '10月15日（年份未提供）'], ['离线打印检查', '小周', '10月16日（年份未提供）']])]),
      section('open', '待确认事项', [list('音频转写接入方案尚未确定。', '预算未提供；不要在会议纪要中补造金额。')], 'uncertain')]),
  sample('course', '检索练习：先回忆，再核对', 'course', 'style-a', '用可检查的问题组织复习，区分熟悉感与实际回忆。',
    '课程记录：检索练习指在不看材料时主动回忆。先合上书写出概念，再打开核对并修正遗漏。课堂任务：用自己的话解释一个概念，完成后与原文对照。没有提供具体复习间隔和提分数据。', [
      section('definition', '检索练习的流程', [list('合上资料，先尝试回忆。', '写出概念解释或步骤。', '对照原文，标记遗漏并修正。')]),
      section('practice', '可立即完成的练习', [p('不看上文，写出检索练习的三个步骤。'), p('参考答案：主动回忆 → 写出解释 → 对照并修正。请根据实际回答记录学习状态。')], 'supplement', []),
      section('limits', '材料没有提供什么', [callout('具体复习间隔、适用人群和提分效果均未提供，不能用本笔记推断。')], 'uncertain')]),
  sample('science', '月相变化：从日月地位置理解', 'science', 'style-a', '月相取决于从地球看到的月球受光部分。',
    '月球本身不发光，反射太阳光。月球绕地球运动时，我们看到的被太阳照亮部分发生变化，形成月相。月食与月相不是同一种现象。', [
      section('why', '现象与原理', [p('月球反射太阳光。日月地相对位置变化，使观察者看到的受光部分比例变化。')]),
      section('boundary', '不要混淆月相和月食', [callout('普通月相变化不能解释为地球影子遮住月球；月食涉及月球进入地球的影子。')], 'supplement', [])]),
  sample('reading', '阅读记录：观察与解释要分开', 'reading', 'style-b', '把原文观点与自己的联想分别记录。',
    '教学自编短文：窗边的豆苗朝光处弯曲。我记下每天的位置，又把花盆转了半圈，想看看接下来会怎样。', [
      section('quote', '文本依据', [p('记录中出现了连续观察和改变花盆朝向的动作。作者表达的是继续观察的意图。')]),
      section('analysis', '个人分析', [p('可以把这段文字理解为一次从观察走向探究的尝试。但短文没有提供实验结果，不能据此下定论。')], 'supplement', [])]),
  sample('research', '班级阅读问卷：描述结果与局限', 'research', 'style-c', '报告已有样本，不把便利抽样当作全体学生结论。',
    '某班自愿问卷收到20份有效回答，其中12人表示一周课外阅读至少3次，8人少于3次。问卷只覆盖一个班，未记录未回答者情况，也未核实自报频率。', [
      section('results', '描述性结果', [table(['自报频率', '人数', '样本占比'], [['每周至少3次', '12', '60%'], ['每周少于3次', '8', '40%']]), p('占比按有效回答20份计算。')]),
      section('limits', '局限与后续建议', [list('仅为单班自愿样本，不能代表其他班级。', '未回答者情况未知，自报频率未经核实。')]),
      section('next', '改进建议', [p('后续可以补充调查范围、回收率和问题措辞，再讨论推广范围。')], 'supplement', [])]),
  sample('project', '智慧学伴项目：先闭合演示路径', 'project', 'style-b', '用可交付文件证明能力，再记录待接入部分。',
    '教学演示项目记录：目标是离线学习笔记。当前已设计三种单文件主题和文本输入流程。下一步要核对打印结果、实际平台输出和字幕粘贴路径。外部OCR尚未接入，负责人和日期未提供。', [
      section('progress', '已完成的设计', [list('三种单文件主题设计。', '文本输入到结构化笔记的流程设计。')]),
      section('risks', '待验证与依赖', [callout('设计完成不等于平台验收完成。外部 OCR 尚未接入。')]),
      section('next', '下一步', [table(['任务', '负责人', '日期'], [['核对打印与平台输出', '未提供', '未提供'], ['验证字幕粘贴路径', '未提供', '未提供']])])])
];
const mathFixture =   sample('math', '一次函数：读懂斜率与截距', 'course', 'style-a', '先看变化率，再看起点；把公式、图像和实际含义对应起来。',
    '一次函数 y=kx+b，k≠0。k 是斜率，b 是直线与 y 轴交点的纵坐标。当 k>0 时，y 随 x 增大而增大；k<0 时则减小。例：y=2x+1，x 从1增加到3，y 从3增加到7。', [
      section('concept', '斜率与截距', [table(['符号', '含义', '读图方法'], [['k', 'Δy/Δx（Δx≠0）', '横坐标增加1时纵坐标的变化量'], ['b', 'y 轴截距', '令 x=0，得到 y=b']]), callout('一次函数要求 k≠0；“截距”是带符号的数，不等于距离。')]),
      section('example', '例题：y=2x+1', [list('当 x=1，y=3；当 x=3，y=7。', 'Δx=2，Δy=4，所以 k=4/2=2。', '当 x=0，y=1，所以 b=1。')]),
      section('quiz', '自测与答案', [p('对于 y=−3x+2，判断随 x 增大时 y 如何变化，并求 y 轴截距。'), p('答案：y 减小；y 轴截距是2。理由：k=−3<0，b=2。')], 'supplement', [])]);
const mathState = createState(mathFixture);
mathState.graph = {
  nodes: [
    { id: 'slope', label: '斜率', sectionIds: ['concept'], mastery: 'unknown', evidence: [] },
    { id: 'linear-example', label: '一次函数计算', sectionIds: ['example'], mastery: 'unknown', evidence: [] }
  ],
  edges: [{ from: 'slope', to: 'linear-example', type: 'prerequisite', basis: '例题计算需要先理解斜率定义（教学建议）' }]
};
await write('examples/math.json', mathFixture);
await write('examples/math.state.json', mathState);

for (const note of samples) {
  const state = createState(note);
  await write(`examples/${note.id}.json`, note);
  await write(`examples/${note.id}.state.json`, state);
  await write(`examples/${note.id}.html`, (await generateNote(note, state)).html);
}
const previous = JSON.parse(await readFile(new URL('examples/math.state.json', root), 'utf8'));
const patch = {
  baseRevision: 1, summary: '补充两点求斜率，原有概念与例题保留', replaceIds: [],
  sources: [{ id: 'S2', label: '教学演示补充材料，第1段', text: '直线经过(1,3)和(3,7)，斜率 k=(7−3)/(3−1)=2。两点横坐标相同不能用该式求有限斜率。' }],
  sections: [section('two-points', '增量补充：两点求斜率', [p('k=(y₂−y₁)/(x₂−x₁)，要求 x₂≠x₁。本例 k=(7−3)/(3−1)=2。')], 'source', ['S2'])]
};
const updated = mergeState(previous, patch);
await write('examples/math.patch.json', patch);
await write('examples/math-updated.state.json', updated.state);
await write('examples/math-updated.html', (await generateNote(updated.state.note, updated.state)).html);
for (const style of ['style-b', 'style-c']) {
  const note = { ...samples[0], style };
  await write(`examples/${samples[0].id}-${style}.html`, (await generateNote(note)).html);
}
const e = escapeHtml;
await write('examples/index.html', `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全天候智慧学伴 · 示例与对照</title><style>${themeCss.c}</style></head><body><main><header><p class="eyebrow">全天候智慧学伴 · 国赛体验材料</p><h1>把零散材料<br>变成可复习的笔记</h1><p class="lead">先看原文，再打开笔记核对。主示例是一门 Java Web 后端教程；所有示例为人工编写的教学材料，不代表真实学生实验数据。</p></header><nav aria-label="体验路径"><a href="java-web.html">Java 后端 · 主示例</a><a href="java-web-style-b.html">同内容 · 蓝图</a><a href="java-web-style-c.html">同内容 · 手账</a><a href="math-updated.html">增量更新 · 数学夹具</a></nav>${samples.map(n => `<section><p class="eyebrow">${e(n.scene)} · ${e(n.style)}</p><h2>${e(n.title)}</h2><h3>生成前 · 原始材料</h3><blockquote>${e(n.sources[0].text)}</blockquote><h3>生成后 · 整理结果</h3><p>${e(n.summary)}</p><p>章节：${n.sections.map(s => e(s.heading)).join(' / ')}</p><a href="${n.id}.html">打开完整笔记 →</a></section>`).join('')}<section><h2>现场验证</h2><ol><li>断网后打开任意笔记，检查字体、公式和表格。</li><li>使用浏览器打印预览，核对正文、答案与来源。</li><li>打开数学增量版，对照初版确认旧章节保留。</li><li>复制页尾 JSON，在新会话提供给模型后继续整理。</li></ol><p>真实平台与不同模型的直接生成质量仍需按验收表实测；这些静态文件由 Node 渲染生成。</p></section></main></body></html>`);
console.log(`已生成三种模板、${samples.length} 个场景示例、状态与增量演示。`);
