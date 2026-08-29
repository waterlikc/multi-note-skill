// 学科识别器 - 自动识别内容所属学科
export class SubjectDetector {
  constructor(options = {}) {
    // 学科模式配置
    this.subjectPatterns = {
      // ==================== 理科 ====================
      mathematics: {
        name: '数学',
        keywords: ['数学', '公式', '定理', '证明', '计算', '几何', '代数', '微积分', '概率', '统计', '函数', '方程', '矩阵', '向量', '极限', '导数', '积分', '级数', '线性代数', '离散数学'],
        patterns: [/∑|∏|∫|∂|∇|∞|∈|∉|⊂|⊃|∪|∩/g, /[a-zA-Z]\s*=\s*[a-zA-Z0-9+\-*/().^]+/g, /证明[：:]/g, /定理[：:]/g],
        complexity: 7,
        icon: '📐'
      },
      physics: {
        name: '物理',
        keywords: ['物理', '力学', '电磁', '光学', '热学', '量子', '相对论', '牛顿', '能量', '动量', '电场', '磁场', '波', '粒子', '原子', '核', '万有引力', '加速度'],
        patterns: [/F\s*=\s*ma/g, /E\s*=\s*mc²/g, /[A-Z]\s*=\s*[A-Z][a-z]*/g, /定律[：:]/g],
        complexity: 8,
        icon: '⚛️'
      },
      chemistry: {
        name: '化学',
        keywords: ['化学', '元素', '反应', '分子', '原子', '离子', '化学键', '有机', '无机', '酸碱', '氧化', '还原', '催化剂', '溶液', '浓度', '摩尔', '周期表'],
        patterns: [/[A-Z][a-z]?\d*/g, /→|←|⇌/g, /化学方程式/g, /反应[：:]/g],
        complexity: 7,
        icon: '🧪'
      },
      biology: {
        name: '生物',
        keywords: ['生物', '细胞', '基因', 'DNA', 'RNA', '蛋白质', '进化', '生态', '器官', '组织', '代谢', '遗传', '变异', '光合作用', '呼吸作用', '有丝分裂', '减数分裂'],
        patterns: [/基因/g, /细胞/g, /蛋白质/g, /进化/g],
        complexity: 6,
        icon: '🧬'
      },
      
      // ==================== 工科 ====================
      programming: {
        name: '编程',
        keywords: ['编程', '代码', '程序', '算法', '数据结构', '函数', '类', '对象', '变量', '数组', '循环', '条件', '递归', '排序', '搜索', '面向对象', '设计模式'],
        patterns: [/```[\s\S]*?```/g, /function\s+\w+/g, /class\s+\w+/g, /import\s+\w+/g, /const\s+\w+/g, /let\s+\w+/g, /var\s+\w+/g],
        complexity: 7,
        icon: '💻'
      },
      python: {
        name: 'Python',
        keywords: ['Python', 'pip', 'django', 'flask', 'pandas', 'numpy', 'matplotlib', 'scikit-learn', 'tensorflow', 'pytorch', 'def ', 'class ', 'import ', 'from '],
        patterns: [/def\s+\w+/g, /class\s+\w+/g, /import\s+\w+/g, /from\s+\w+\s+import/g],
        complexity: 6,
        icon: '🐍'
      },
      javascript: {
        name: 'JavaScript',
        keywords: ['JavaScript', 'JS', 'Node.js', 'React', 'Vue', 'Angular', 'TypeScript', 'npm', 'yarn', 'webpack', 'async', 'await', 'Promise', 'DOM', 'AJAX'],
        patterns: [/function\s+\w+/g, /const\s+\w+/g, /let\s+\w+/g, /var\s+\w+/g, /=>\s*{/g],
        complexity: 6,
        icon: '📜'
      },
      web: {
        name: 'Web开发',
        keywords: ['Web', 'HTML', 'CSS', '前端', '后端', '全栈', '响应式', 'Bootstrap', 'Tailwind', 'SASS', 'LESS', 'RESTful', 'API', 'HTTP', 'URL'],
        patterns: [/<[^>]+>/g, /class="[^"]*"/g, /style="[^"]*"/g],
        complexity: 5,
        icon: '🌐'
      },
      database: {
        name: '数据库',
        keywords: ['数据库', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', '表', '字段', '索引', '查询', '事务', '主键', '外键', '范式', 'NoSQL'],
        patterns: [/SELECT\s+/gi, /FROM\s+/gi, /WHERE\s+/gi, /INSERT\s+INTO/gi, /CREATE\s+TABLE/gi],
        complexity: 6,
        icon: '🗄️'
      },
      devops: {
        name: '运维部署',
        keywords: ['运维', '部署', 'Docker', 'Kubernetes', 'K8s', 'Linux', 'CI/CD', 'Jenkins', 'Git', 'GitHub', 'GitLab', 'Nginx', 'Apache', '云服务', 'AWS', '阿里云'],
        patterns: [/docker\s+/g, /kubectl\s+/g, /git\s+/g, /sudo\s+/g],
        complexity: 7,
        icon: '⚙️'
      },
      ai: {
        name: '人工智能',
        keywords: ['人工智能', 'AI', '机器学习', '深度学习', '神经网络', 'CNN', 'RNN', 'LSTM', 'Transformer', 'BERT', 'GPT', '强化学习', '自然语言处理', 'NLP', '计算机视觉', 'CV'],
        patterns: [/神经网络/g, /模型训练/g, /损失函数/g, /梯度下降/g],
        complexity: 9,
        icon: '🤖'
      },
      
      // ==================== 文科 ====================
      chinese: {
        name: '语文',
        keywords: ['语文', '作文', '阅读', '古诗', '文言文', '修辞', '语法', '词汇', '阅读理解', '写作', '文学', '名著', '诗词', '散文', '小说'],
        patterns: [/《.*》/g, /作者[：:]/g, /修辞手法/g],
        complexity: 5,
        icon: '📖'
      },
      english: {
        name: '英语',
        keywords: ['英语', 'English', '语法', '词汇', '听力', '口语', '阅读', '写作', '翻译', '四六级', '雅思', '托福', '单词', '句型', '时态', '语态'],
        patterns: [/[A-Za-z]+\s+[A-Za-z]+/g, /grammar/gi, /vocabulary/gi],
        complexity: 5,
        icon: '🔤'
      },
      history: {
        name: '历史',
        keywords: ['历史', '朝代', '战争', '革命', '改革', '文明', '古代', '近代', '现代', '世纪', '年代', '皇帝', '王朝', '帝国', '事件'],
        patterns: [/公元前/g, /公元/g, /世纪/g, /朝代/g],
        complexity: 5,
        icon: '📜'
      },
      geography: {
        name: '地理',
        keywords: ['地理', '地形', '气候', '洋流', '板块', '经纬度', '纬度', '经度', '大陆', '海洋', '山脉', '河流', '湖泊', '城市', '国家'],
        patterns: [/°[NS]/g, /°[EW]/g, /气候/g, /地形/g],
        complexity: 5,
        icon: '🌍'
      },
      politics: {
        name: '政治',
        keywords: ['政治', '经济', '哲学', '法律', '制度', '民主', '自由', '平等', '权利', '义务', '宪法', '政府', '市场', '宏观', '微观'],
        patterns: [/政治/g, /经济/g, /哲学/g],
        complexity: 5,
        icon: '⚖️'
      },
      
      // ==================== 其他 ====================
      music: {
        name: '音乐',
        keywords: ['音乐', '乐理', '音符', '节拍', '旋律', '和弦', '调式', '音阶', '节奏', '曲式', '作曲', '演奏', '钢琴', '吉他', '小提琴'],
        patterns: [/音符/g, /节拍/g, /旋律/g],
        complexity: 5,
        icon: '🎵'
      },
      art: {
        name: '美术',
        keywords: ['美术', '绘画', '素描', '色彩', '构图', '透视', '油画', '水彩', '国画', '雕塑', '设计', '艺术', '美学', '创作'],
        patterns: [/绘画/g, /素描/g, /色彩/g],
        complexity: 5,
        icon: '🎨'
      },
      sports: {
        name: '体育',
        keywords: ['体育', '运动', '健身', '跑步', '游泳', '篮球', '足球', '排球', '网球', '训练', '体能', '耐力', '力量', '速度'],
        patterns: [/运动/g, /训练/g, /健身/g],
        complexity: 4,
        icon: '⚽'
      },
      psychology: {
        name: '心理学',
        keywords: ['心理', '心理学', '认知', '情绪', '行为', '人格', '动机', '学习', '记忆', '思维', '潜意识', '心理咨询', '治疗', '发展'],
        patterns: [/心理学/g, /认知/g, /情绪/g],
        complexity: 6,
        icon: '🧠'
      },
      economics: {
        name: '经济学',
        keywords: ['经济', '经济学', '宏观', '微观', '市场', '供需', '价格', '成本', '利润', 'GDP', '通胀', '失业', '货币', '财政', '金融'],
        patterns: [/经济学/g, /市场/g, /供需/g],
        complexity: 6,
        icon: '💰'
      },
      management: {
        name: '管理学',
        keywords: ['管理', '管理学', '组织', '领导', '计划', '控制', '决策', '战略', '人力资源', '项目管理', '团队', '绩效', '创新'],
        patterns: [/管理/g, /组织/g, /领导/g],
        complexity: 5,
        icon: '📊'
      }
    }
    
    // 缓存机制
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 100
  }

  // 主识别方法
  detect(content) {
    if (!content || typeof content !== 'string') {
      return { subject: 'unknown', confidence: 0, details: [] }
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(content)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // 执行识别
    const result = this.performDetection(content)
    
    // 缓存结果
    this.cache.set(cacheKey, result)
    this.manageCacheSize()
    
    return result
  }

  // 执行识别
  performDetection(content) {
    const scores = {}
    const details = []

    // 对每个学科进行评分
    for (const [subjectId, pattern] of Object.entries(this.subjectPatterns)) {
      let score = 0
      const matchedKeywords = []
      const matchedPatterns = []

      // 关键词匹配
      for (const keyword of pattern.keywords) {
        const regex = new RegExp(keyword, 'gi')
        const matches = content.match(regex)
        if (matches) {
          score += matches.length * 2
          matchedKeywords.push(keyword)
        }
      }

      // 正则模式匹配
      for (const regex of pattern.patterns) {
        const matches = content.match(regex)
        if (matches) {
          score += matches.length * 3
          matchedPatterns.push(regex.source)
        }
      }

      // 计算置信度
      const confidence = Math.min(score / 20, 1)
      
      if (score > 0) {
        scores[subjectId] = {
          score,
          confidence,
          name: pattern.name,
          icon: pattern.icon,
          complexity: pattern.complexity,
          matchedKeywords,
          matchedPatterns
        }
        
        details.push({
          subject: pattern.name,
          score,
          confidence: (confidence * 100).toFixed(1) + '%',
          keywords: matchedKeywords.slice(0, 5)
        })
      }
    }

    // 找到最高分的学科
    const sortedSubjects = Object.entries(scores)
      .sort(([, a], [, b]) => b.score - a.score)

    if (sortedSubjects.length === 0) {
      return {
        subject: 'general',
        subjectName: '通用',
        icon: '📝',
        confidence: 0,
        complexity: 5,
        details: [],
        allScores: {}
      }
    }

    const [topSubjectId, topSubject] = sortedSubjects[0]
    
    // 计算综合置信度
    const totalScore = sortedSubjects.reduce((sum, [, s]) => sum + s.score, 0)
    const normalizedConfidence = totalScore > 0 ? topSubject.score / totalScore : 0

    return {
      subject: topSubjectId,
      subjectName: topSubject.name,
      icon: topSubject.icon,
      confidence: normalizedConfidence,
      complexity: topSubject.complexity,
      matchedKeywords: topSubject.matchedKeywords,
      matchedPatterns: topSubject.matchedPatterns,
      details: details.sort((a, b) => b.score - a.score).slice(0, 5),
      allScores: scores
    }
  }

  // 获取学科信息
  getSubjectInfo(subjectId) {
    return this.subjectPatterns[subjectId] || null
  }

  // 获取所有学科
  getAllSubjects() {
    return Object.entries(this.subjectPatterns).map(([id, pattern]) => ({
      id,
      name: pattern.name,
      icon: pattern.icon,
      complexity: pattern.complexity,
      keywordCount: pattern.keywords.length
    }))
  }

  // 按类别获取学科
  getSubjectsByCategory() {
    return {
      '理科': ['mathematics', 'physics', 'chemistry', 'biology'],
      '工科': ['programming', 'python', 'javascript', 'web', 'database', 'devops', 'ai'],
      '文科': ['chinese', 'english', 'history', 'geography', 'politics'],
      '其他': ['music', 'art', 'sports', 'psychology', 'economics', 'management']
    }
  }

  // 生成缓存键
  generateCacheKey(content) {
    const hash = this.simpleHash(content.substring(0, 500))
    return `subject_${hash}`
  }

  // 简单哈希
  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < Math.min(str.length, 100); i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  // 管理缓存大小
  manageCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  // 清空缓存
  clearCache() {
    this.cache.clear()
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cache.size > 0 ? 'cached' : 'empty'
    }
  }
}

// 便捷工厂函数
export function createSubjectDetector(options = {}) {
  return new SubjectDetector(options)
}

// 快速识别函数
export function detectSubject(content, options = {}) {
  const detector = createSubjectDetector(options)
  return detector.detect(content)
}
