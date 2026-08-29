# 更新日志

## v2.0.0 (2026-07-23) - 知识图谱系统

### 🆕 新增功能

#### 知识图谱系统（构建个人知识库）
- **知识图谱引擎** (`core/knowledge-graph.js`)
  - 知识点管理：添加、获取、搜索知识点
  - 关系管理：建立知识点之间的关系（前置、相关、扩展、包含）
  - 学习记录：记录学生学习进度
  - 遗忘曲线：基于艾宾浩斯遗忘曲线计算记忆保持率

- **学习路径推荐** (`core/learning-path.js`)
  - 基于BFS算法生成学习路径
  - 考虑知识点难度和前置关系
  - 估计学习时间
  - 生成学习建议

- **薄弱点识别** (`core/weakness-detector.js`)
  - 分析知识点掌握程度
  - 识别薄弱原因（未学习、学习次数不足、正确率低、遗忘严重、难度过高、前置知识缺失）
  - 生成改进建议
  - 生成薄弱点报告

#### 主控制器升级
- **SmartNoteGenerator** (`core/smart-note-generator.js`)
  - 新增 `addKnowledgePoint()` 方法 - 添加知识点
  - 新增 `extractAndAddKnowledge()` 方法 - 从笔记提取知识点
  - 新增 `generateLearningPath()` 方法 - 生成学习路径
  - 新增 `detectWeaknesses()` 方法 - 检测薄弱点
  - 新增 `getKnowledgeGraphStats()` 方法 - 获取统计信息
  - 新增 `searchKnowledge()` 方法 - 搜索知识点
  - 新增 `getKnowledgeDetail()` 方法 - 获取知识点详情

### 📁 文件结构

```
multi-note-skill/
├── core/
│   ├── smart-note-generator.js   # 主控制器（已升级）
│   ├── multimodal-processor.js   # 多模态处理器
│   ├── subject-detector.js       # 学科识别器
│   ├── complexity-analyzer.js    # 复杂度分析器
│   ├── knowledge-extractor.js    # 知识点提取器
│   ├── structure-selector.js     # 结构选择器
│   ├── note-parser.js            # 笔记解析器
│   ├── content-comparer.js       # 内容对比器
│   ├── note-merger.js            # 笔记合并器
│   ├── version-manager.js        # 版本管理器
│   ├── knowledge-graph.js        # 🆕 知识图谱引擎
│   ├── learning-path.js          # 🆕 学习路径推荐
│   └── weakness-detector.js      # 🆕 薄弱点识别
├── docs/
│   ├── DEVELOPMENT-PLAN.md       # 开发规划
│   ├── CHANGELOG.md              # 更新日志（本文件）
│   └── OPTIMIZATION-REPORT-v2.md # 优化报告
├── test-smart-note-generator.js  # 智能笔记生成器测试
├── test-incremental-update.js    # 增量更新测试
└── test-knowledge-graph.js       # 🆕 知识图谱测试
```

### 🧪 测试用例

创建了知识图谱测试套件 `test-knowledge-graph.js`，包括：
- 知识图谱测试（添加知识点、添加关系、搜索知识点）
- 学习路径测试（生成路径、包含前置知识、估计时间）
- 薄弱点识别测试（检测薄弱点、分析原因、生成建议）
- 智能笔记生成器知识图谱集成测试

### 🎯 解决的痛点

| 痛点 | 解决方案 | 状态 |
|------|----------|------|
| 不知道学什么，怎么学？ | 学习路径推荐 | ✅ |
| 不知道哪里薄弱？ | 薄弱点识别 | ✅ |
| 知识点之间有什么关系？ | 知识图谱构建 | ✅ |
| 如何构建个人知识库？ | 知识点管理 | ✅ |

### 📖 使用示例

```javascript
import { createSmartNoteGenerator } from './core/smart-note-generator.js'

const generator = createSmartNoteGenerator()

// 1. 从笔记内容提取知识点
const noteContent = 'Python是一种编程语言，变量用于存储数据，函数用于封装代码。'
const extractionResult = generator.extractAndAddKnowledge(noteContent, {
  subject: '编程'
})

// 2. 生成学习路径
const pathResult = generator.generateLearningPath({
  studentId: 'student-001',
  subject: '编程',
  targetKnowledge: '函数',
  currentKnowledge: ['变量']
})

// 3. 检测薄弱点
const weaknessResult = generator.detectWeaknesses({
  studentId: 'student-001',
  subject: '编程',
  learningRecords: {
    '变量': { mastery: 0.8, studyCount: 5, correctRate: 0.9 },
    '函数': { mastery: 0.3, studyCount: 2, correctRate: 0.5 }
  }
})

// 4. 获取知识图谱统计
const stats = generator.getKnowledgeGraphStats()
console.log(`知识点数量: ${stats.nodeCount}`)
```

---

## v2.0.0 (2026-07-23) - 增量更新系统

### 🆕 新增功能

#### 增量更新系统（解决"怎么更新笔记"痛点）
- **笔记解析器** (`core/note-parser.js`)
  - 解析HTML笔记结构
  - 提取标题、章节、内容、代码块、列表、表格
  - 提取知识点（高亮、重点、代码术语）
  - 提取样式和组件信息
  - 计算统计信息

- **内容对比器** (`core/content-comparer.js`)
  - 新旧内容对比
  - 相似度计算（Levenshtein距离）
  - 检测新增、删除、修改、重复内容
  - 生成差异摘要和建议

- **笔记合并器** (`core/note-merger.js`)
  - 多种合并策略：智能、追加、替换
  - 智能去重
  - 格式保留
  - 自动备份原文件

- **版本管理器** (`core/version-manager.js`)
  - 版本历史管理
  - 版本号自动生成（v1.0.0, v1.0.1, ...）
  - 版本比较
  - 版本回退
  - 版本导出/导入

#### 主控制器升级
- **SmartNoteGenerator** (`core/smart-note-generator.js`)
  - 新增 `updateNote()` 方法 - 增量更新笔记
  - 新增 `getNoteVersionHistory()` 方法 - 获取版本历史
  - 新增 `revertNote()` 方法 - 回退到指定版本
  - 新增 `compareNoteVersions()` 方法 - 比较版本差异

### 📁 文件结构

```
multi-note-skill/
├── core/
│   ├── smart-note-generator.js   # 主控制器（已升级）
│   ├── multimodal-processor.js   # 多模态处理器
│   ├── subject-detector.js       # 学科识别器
│   ├── complexity-analyzer.js    # 复杂度分析器
│   ├── knowledge-extractor.js    # 知识点提取器
│   ├── structure-selector.js     # 结构选择器
│   ├── note-parser.js            # 🆕 笔记解析器
│   ├── content-comparer.js       # 🆕 内容对比器
│   ├── note-merger.js            # 🆕 笔记合并器
│   └── version-manager.js        # 🆕 版本管理器
├── docs/
│   ├── DEVELOPMENT-PLAN.md       # 开发规划
│   ├── CHANGELOG.md              # 更新日志（本文件）
│   └── OPTIMIZATION-REPORT-v2.md # 优化报告
├── test-smart-note-generator.js  # 智能笔记生成器测试
└── test-incremental-update.js    # 🆕 增量更新测试
```

### 🧪 测试用例

创建了增量更新测试套件 `test-incremental-update.js`，包括：
- 笔记解析器测试
- 内容对比器测试
- 笔记合并器测试
- 版本管理器测试
- 智能笔记生成器增量更新测试

### 🎯 解决的痛点

| 痛点 | 解决方案 | 状态 |
|------|----------|------|
| 今天又学了一个东西，怎么加到原来的笔记中？ | 增量更新系统 | ✅ |
| 新旧内容重复怎么办？ | 内容对比器 + 智能去重 | ✅ |
| 更新后想回退怎么办？ | 版本管理器 | ✅ |
| 不知道改了什么？ | 版本比较功能 | ✅ |

### 📖 使用示例

```javascript
import { createSmartNoteGenerator } from './core/smart-note-generator.js'

const generator = createSmartNoteGenerator()

// 1. 生成笔记
const note = await generator.generate('Python基础教程')

// 2. 增量更新笔记
const updateResult = await generator.updateNote(
  'D:/blog/notes/Python基础教程-笔记.html',
  '今天学习了Python的函数定义和调用',
  {
    changes: '添加函数相关内容',
    tags: ['python', 'function']
  }
)

// 3. 查看版本历史
const history = generator.getNoteVersionHistory('D:/blog/notes/Python基础教程-笔记.html')

// 4. 回退到指定版本
const revertResult = await generator.revertNote(
  'D:/blog/notes/Python基础教程-笔记.html',
  'v1.0.0'
)
```

---

## v2.0.0 (2026-07-23) - 智能场景识别

### 🆕 新增功能

#### 智能场景识别系统
- **学科识别** (`core/subject-detector.js`)
  - 支持20+学科识别
  - 包括：数学、物理、化学、生物、编程、Python、JavaScript、AI、历史、英语等
  - 基于关键词和正则模式匹配
  - 置信度评估

- **复杂度分析** (`core/complexity-analyzer.js`)
  - 1-10级复杂度评估
  - 5个维度分析：词汇、句子、结构、概念、数学公式
  - 自动生成复杂度报告
  - 提供优化建议

- **知识点提取** (`core/knowledge-extractor.js`)
  - 10种知识点类型：定义、概念、原理、方法、公式、示例、注意事项、重点、总结、对比
  - 重要性评估：高、中、低
  - 知识点卡片生成
  - 摘要生成

- **结构选择** (`core/structure-selector.js`)
  - 20+学科专属结构
  - 根据复杂度自动选择结构
  - 模板推荐系统
  - 自定义结构支持

---

## v1.1.0 (2026-07-19)

### 🆕 新增功能
- 新增多模态输入支持
- 更新场景识别规则

### 📁 文件更新
- `core/multimodal-processor.js` - 多模态处理器
- `SKILL.md` - 更新多模态说明

---

## v1.0.0 (2026-07-16)

### 🎉 初始版本

#### 核心功能
- 采用Context Engineering方法论
- 提取公共CSS到 `assets/styles.css`
- 优化工作流为 Initialize → Generate → Validate

#### 场景支持
- 技术学习
- 课堂学习
- 科普知识
- 读书笔记
- 会议纪要
- 调研分析
- 项目报告

#### 模板样式
- Style A - 教学笔记本
- Style B - 手账皮革本
