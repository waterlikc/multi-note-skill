// 使用场景识别器
const SceneDetector = require('./core/scene-detector.js');
const TemplateManager = require('./core/template-manager.js');
const ExportManager = require('./core/export-manager.js');

// 创建核心模块实例
const detector = new SceneDetector();
const templateManager = new TemplateManager();
const exportManager = new ExportManager();

// Agent Skill 笔记内容
const agentSkillContent = `
# Agent Skill 核心概念

Agent Skill是AI智能体的能力模块化封装，每个skill代表智能体在特定领域的能力集合。

## 核心组成要素

### 1. 触发机制 (Trigger Words)
- 定义skill激活的关键词
- 支持模糊匹配和语义识别
- 优先级和冲突解决机制

### 2. 技能描述 (Description)
- 功能概述和适用范围
- 输入输出规范
- 使用限制和注意事项

### 3. 执行逻辑 (Implementation)
- 核心算法和处理流程
- 错误处理和异常情况
- 性能优化和资源管理

### 4. 资源依赖 (Dependencies)
- 外部API和工具调用
- 数据模型和知识库
- 系统权限和网络要求

## 典型应用场景

### 场景1: 智能编程助手
- 代码生成和优化
- Bug分析和修复建议
- 技术文档编写

### 场景2: 数据分析专家
- 数据清洗和预处理
- 统计分析和可视化
- 机器学习模型训练

### 场景3: 内容创作助手
- 文章写作和编辑
- 多语言翻译
- 内容摘要和提取

### 场景4: 教育辅导专家
- 个性化学习推荐
- 作业批改和反馈
- 知识点讲解

## 示例代码

### 基础Skill结构
\`\`\`javascript
class AgentSkill {
  constructor(config) {
    this.name = config.name;
    this.description = config.description;
    this.triggerWords = config.triggerWords || [];
    this.priority = config.priority || 0;
  }
  
  // 检查是否应该激活此skill
  shouldActivate(userInput) {
    return this.triggerWords.some(word => 
      userInput.toLowerCase().includes(word.toLowerCase())
    );
  }
  
  // 执行skill功能
  async execute(context) {
    throw new Error('execute method must be implemented');
  }
  
  // 获取skill元数据
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      triggerWords: this.triggerWords,
      priority: this.priority,
      version: '1.0.0'
    };
  }
}
\`\`\`

### 具体Skill实现: 代码助手
\`\`\`javascript
class CodeAssistantSkill extends AgentSkill {
  constructor() {
    super({
      name: 'code-assistant',
      description: '智能编程助手，提供代码生成、调试和优化建议',
      triggerWords: ['代码', '编程', 'debug', '函数', '算法'],
      priority: 10
    });
  }
  
  async execute(context) {
    const { userQuery, codeContext } = context;
    
    // 分析用户需求
    const intent = this.analyzeIntent(userQuery);
    
    // 根据意图执行相应操作
    switch(intent.type) {
      case 'generate':
        return this.generateCode(intent.specifications);
      case 'debug':
        return this.debugCode(codeContext, intent.errorInfo);
      case 'optimize':
        return this.optimizeCode(codeContext);
      default:
        return this.provideGeneralHelp(userQuery);
    }
  }
  
  analyzeIntent(query) {
    // 使用NLP技术分析用户意图
    // 返回结构化的意图对象
    return {
      type: 'generate', // or 'debug', 'optimize'
      specifications: {},
      confidence: 0.95
    };
  }
  
  generateCode(specs) {
    // 根据规格说明生成代码
    return {
      code: '// 生成的代码',
      explanation: '代码解释',
      suggestions: ['改进建议1', '改进建议2']
    };
  }
  
  debugCode(code, errorInfo) {
    // 分析代码错误并提供修复建议
    return {
      errorAnalysis: '错误原因分析',
      fixSuggestion: '修复建议',
      correctedCode: '// 修复后的代码'
    };
  }
  
  optimizeCode(code) {
    // 代码性能优化
    return {
      optimizations: ['优化点1', '优化点2'],
      optimizedCode: '// 优化后的代码',
      performanceGain: '性能提升30%'
    };
  }
}
\`\`\`

## Skill生态系统

### Skill注册机制
\`\`\`javascript
class SkillRegistry {
  constructor() {
    this.skills = new Map();
    this.fallbackSkill = null;
  }
  
  registerSkill(skill) {
    if (skill instanceof AgentSkill) {
      this.skills.set(skill.name, skill);
      return true;
    }
    return false;
  }
  
  findBestSkill(userInput) {
    const matchingSkills = Array.from(this.skills.values())
      .filter(skill => skill.shouldActivate(userInput))
      .sort((a, b) => b.priority - a.priority);
    
    return matchingSkills[0] || this.fallbackSkill;
  }
  
  async executeSkill(userInput, context) {
    const skill = this.findBestSkill(userInput);
    if (skill) {
      return await skill.execute(context);
    }
    return { error: 'No suitable skill found' };
  }
}
\`\`\`

## 最佳实践

### 1. Skill设计原则
- **单一职责**: 每个skill专注一个领域
- **清晰接口**: 明确定义输入输出
- **错误处理**: 完善的异常处理机制
- **性能优化**: 合理的资源使用

### 2. 触发词优化
- 选择具有代表性的关键词
- 避免过于宽泛的词汇
- 考虑同义词和相关词
- 设置合适的优先级

### 3. 上下文管理
- 保持会话状态一致性
- 处理多轮对话
- 管理长期记忆
- 隐私保护和数据清理

## 技术挑战

### 1. 意图识别准确性
- 自然语言理解的复杂性
- 上下文依赖关系
- 歧义消解能力

### 2. Skill冲突解决
- 多个skill同时激活
- 优先级动态调整
- 用户意图明确化

### 3. 性能和扩展性
- 响应时间优化
- 并发处理能力
- 资源消耗控制

## 未来发展方向

### 1. 自适应学习
- 根据用户反馈优化skill
- 个性化推荐算法
- 自动参数调优

### 2. 多模态支持
- 图像处理skill
- 语音交互skill
- 视频分析skill

### 3. 协作智能
- 多agent协同工作
- 分布式任务分配
- 集体决策机制
`;

// 场景识别
console.log('=== 场景识别 ===');
const detectedScene = detector.detect(agentSkillContent);
console.log(`检测到的场景: ${detectedScene}`);

// 模板推荐
console.log('\n=== 模板推荐 ===');
const recommendedTemplate = templateManager.getRecommendedTemplate(detectedScene);
console.log(`推荐模板: ${recommendedTemplate.name}`);
console.log(`模板路径: ${recommendedTemplate.template}`);
console.log(`图标集: ${recommendedTemplate.iconSet}`);

// 获取场景配置
console.log('\n=== 场景配置 ===');
const sceneConfig = templateManager.getSceneTemplate(detectedScene);
console.log(`推荐组件: ${sceneConfig.components.join(', ')}`);

// 准备笔记数据
const noteData = {
  title: 'Agent Skill 核心概念与技术实现',
  subtitle: 'AI智能体能力模块化设计与最佳实践',
  date: '2026-07-15',
  scene: detectedScene,
  style: sceneConfig.preferred,
  content: agentSkillContent
};

// 导出为不同格式
console.log('\n=== 多格式导出 ===');

try {
  // JSON导出
  const jsonExport = exportManager.exportToJson(noteData);
  console.log('✅ JSON导出成功');
  console.log(`元数据字段: ${Object.keys(JSON.parse(jsonExport).metadata).join(', ')}`);
  
  // Markdown导出
  const mdExport = exportManager.exportToMarkdown(noteData);
  console.log('✅ Markdown导出成功');
  console.log(`文档长度: ${mdExport.length} 字符`);
  
  // HTML导出
  const htmlExport = exportManager.exportToHtml(noteData);
  console.log('✅ HTML导出成功');
  console.log(`内容长度: ${htmlExport.length} 字符`);
  
  // PDF导出信息
  const pdfInfo = await exportManager.exportToPdf(noteData, htmlExport);
  console.log('✅ PDF导出信息获取成功');
  console.log(`文件名: ${pdfInfo.options.filename}`);
  
} catch (error) {
  console.error('❌ 导出失败:', error.message);
}

console.log('\n=== 技术笔记生成完成 ===');