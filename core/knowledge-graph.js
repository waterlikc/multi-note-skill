// 知识图谱引擎 - 教育知识管理核心
export class KnowledgeGraph {
  constructor(options = {}) {
    // 知识点存储
    this.nodes = new Map() // id -> KnowledgeNode
    
    // 关系存储
    this.edges = new Map() // id -> Edge[]
    
    // 学习记录
    this.learningRecords = new Map() // studentId -> Record[]
    
    // 配置
    this.config = {
      maxNodes: options.maxNodes || 10000,
      decayFactor: options.decayFactor || 0.95, // 遗忘曲线衰减因子
      ...options
    }
  }

  // ==================== 知识点管理 ====================

  // 添加知识点
  addNode(node) {
    const id = node.id || this.generateId(node.name)
    const knowledgeNode = {
      id,
      name: node.name,
      subject: node.subject || '通用',
      chapter: node.chapter || '',
      section: node.section || '',
      difficulty: node.difficulty || 5, // 1-10
      importance: node.importance || 5, // 1-10
      tags: node.tags || [],
      content: node.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.nodes.set(id, knowledgeNode)
    if (!this.edges.has(id)) {
      this.edges.set(id, [])
    }
    
    return id
  }

  // 批量添加知识点
  addNodes(nodes) {
    return nodes.map(node => this.addNode(node))
  }

  // 获取知识点
  getNode(id) {
    return this.nodes.get(id)
  }

  // 搜索知识点
  searchNodes(query) {
    const results = []
    const queryLower = query.toLowerCase()
    
    for (const [id, node] of this.nodes) {
      if (
        node.name.toLowerCase().includes(queryLower) ||
        node.content.toLowerCase().includes(queryLower) ||
        node.tags.some(tag => tag.toLowerCase().includes(queryLower))
      ) {
        results.push(node)
      }
    }
    
    return results
  }

  // 按学科/章节获取知识点
  getNodesByChapter(subject, chapter) {
    const results = []
    for (const [id, node] of this.nodes) {
      if (node.subject === subject && node.chapter === chapter) {
        results.push(node)
      }
    }
    return results
  }

  // ==================== 关系管理 ====================

  // 添加关系
  addEdge(fromId, toId, relationType = 'related', weight = 1) {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      throw new Error('知识点不存在')
    }

    const edge = {
      from: fromId,
      to: toId,
      type: relationType, // prerequisite(前置), related(相关), extends(扩展), contains(包含)
      weight: weight, // 关系强度 0-1
      createdAt: new Date().toISOString()
    }

    if (!this.edges.has(fromId)) {
      this.edges.set(fromId, [])
    }
    this.edges.get(fromId).push(edge)

    return edge
  }

  // 获取节点的所有关系
  getEdges(nodeId) {
    return this.edges.get(nodeId) || []
  }

  // 获取前置知识点
  getPrerequisites(nodeId) {
    const edges = this.getEdges(nodeId)
    return edges
      .filter(e => e.type === 'prerequisite')
      .map(e => this.getNode(e.from))
      .filter(Boolean)
  }

  // 获取后续知识点
  getExtensions(nodeId) {
    const results = []
    for (const [id, edges] of this.edges) {
      for (const edge of edges) {
        if (edge.to === nodeId && edge.type === 'prerequisite') {
          results.push(this.getNode(id))
        }
      }
    }
    return results
  }

  // 获取相关知识点
  getRelatedNodes(nodeId) {
    const edges = this.getEdges(nodeId)
    return edges
      .filter(e => e.type === 'related')
      .map(e => this.getNode(e.to))
      .filter(Boolean)
  }

  // ==================== 学习记录管理 ====================

  // 记录学习行为
  recordLearning(studentId, nodeId, result) {
    if (!this.learningRecords.has(studentId)) {
      this.learningRecords.set(studentId, [])
    }

    const record = {
      studentId,
      nodeId,
      result: result.result || 'learned', // learned, practiced, mastered, failed
      score: result.score || 0, // 0-100
      duration: result.duration || 0, // 学习时长(秒)
      timestamp: new Date().toISOString()
    }

    this.learningRecords.get(studentId).push(record)
    return record
  }

  // 获取学生学习记录
  getStudentRecords(studentId) {
    return this.learningRecords.get(studentId) || []
  }

  // 获取学生对某知识点的掌握程度
  getMasteryLevel(studentId, nodeId) {
    const records = this.getStudentRecords(studentId)
      .filter(r => r.nodeId === nodeId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    if (records.length === 0) return 0

    // 最近一次学习的结果权重更大
    const latest = records[0]
    const daysSinceLearning = (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    
    // 应用遗忘曲线
    const decayFactor = Math.pow(this.config.decayFactor, daysSinceLearning)
    
    return Math.min(100, latest.score * decayFactor)
  }

  // ==================== 智能分析 ====================

  // 找出薄弱知识点
  findWeakPoints(studentId, threshold = 60) {
    const weakPoints = []
    
    for (const [nodeId, node] of this.nodes) {
      const mastery = this.getMasteryLevel(studentId, nodeId)
      if (mastery < threshold) {
        weakPoints.push({
          ...node,
          masteryLevel: mastery
        })
      }
    }

    return weakPoints.sort((a, b) => a.masteryLevel - b.masteryLevel)
  }

  // 推荐学习路径
  recommendLearningPath(studentId, targetNodeId) {
    const visited = new Set()
    const path = []
    
    const dfs = (nodeId) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      const mastery = this.getMasteryLevel(studentId, nodeId)
      if (mastery >= 80) return // 已掌握，跳过
      
      // 先学习前置知识
      const prerequisites = this.getPrerequisites(nodeId)
      for (const prereq of prerequisites) {
        dfs(prereq.id)
      }
      
      path.push(this.getNode(nodeId))
    }
    
    dfs(targetNodeId)
    return path
  }

  // 生成学情分析报告
  generateLearningReport(studentId) {
    const records = this.getStudentRecords(studentId)
    const weakPoints = this.findWeakPoints(studentId)
    
    // 统计学习数据
    const totalLearned = new Set(records.map(r => r.nodeId)).size
    const totalNodes = this.nodes.size
    const coverage = totalNodes > 0 ? (totalLearned / totalNodes * 100).toFixed(1) : 0
    
    // 按学科统计
    const subjectStats = {}
    for (const [nodeId, node] of this.nodes) {
      if (!subjectStats[node.subject]) {
        subjectStats[node.subject] = { total: 0, learned: 0, mastery: 0 }
      }
      subjectStats[node.subject].total++
      
      const mastery = this.getMasteryLevel(studentId, nodeId)
      if (mastery > 0) {
        subjectStats[node.subject].learned++
        subjectStats[node.subject].mastery += mastery
      }
    }
    
    // 计算平均掌握度
    for (const subject in subjectStats) {
      const stats = subjectStats[subject]
      stats.averageMastery = stats.learned > 0 
        ? (stats.mastery / stats.learned).toFixed(1) 
        : 0
    }

    return {
      studentId,
      summary: {
        totalNodes,
        totalLearned,
        coverage: `${coverage}%`,
        weakPointsCount: weakPoints.length
      },
      subjectStats,
      weakPoints: weakPoints.slice(0, 10), // 前10个薄弱点
      recommendations: this.generateRecommendations(studentId, weakPoints),
      generatedAt: new Date().toISOString()
    }
  }

  // 生成学习建议
  generateRecommendations(studentId, weakPoints) {
    const recommendations = []
    
    if (weakPoints.length === 0) {
      recommendations.push({
        type: 'excellent',
        message: '太棒了！你已经掌握了所有知识点，继续保持！'
      })
      return recommendations
    }

    // 按重要性排序
    const importantWeakPoints = weakPoints
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)

    recommendations.push({
      type: 'focus',
      message: `建议优先学习以下 ${importantWeakPoints.length} 个重点知识：`,
      items: importantWeakPoints.map(p => p.name)
    })

    // 检查是否有前置知识未掌握
    for (const weakPoint of weakPoints.slice(0, 5)) {
      const prerequisites = this.getPrerequisites(weakPoint.id)
      const unmasteredPrereqs = prerequisites.filter(
        p => this.getMasteryLevel(studentId, p.id) < 60
      )
      
      if (unmasteredPrereqs.length > 0) {
        recommendations.push({
          type: 'prerequisite',
          message: `学习「${weakPoint.name}」前，建议先掌握：`,
          items: unmasteredPrereqs.map(p => p.name)
        })
      }
    }

    return recommendations
  }

  // ==================== 工具方法 ====================

  // 生成ID
  generateId(name) {
    return name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36)
  }

  // 导出图谱数据
  export() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()).flat(),
      metadata: {
        nodeCount: this.nodes.size,
        edgeCount: Array.from(this.edges.values()).flat().length,
        exportedAt: new Date().toISOString()
      }
    }
  }

  // 导入图谱数据
  import(data) {
    if (data.nodes) {
      for (const node of data.nodes) {
        this.addNode(node)
      }
    }
    if (data.edges) {
      for (const edge of data.edges) {
        this.addEdge(edge.from, edge.to, edge.type, edge.weight)
      }
    }
  }
}

// 创建默认知识图谱（用于演示）
export function createDefaultKnowledgeGraph() {
  const graph = new KnowledgeGraph()
  
  // 添加高中物理知识点
  const physicsNodes = [
    { id: 'phys_001', name: '力学基础', subject: '物理', chapter: '力学', difficulty: 3, importance: 8 },
    { id: 'phys_002', name: '牛顿第一定律', subject: '物理', chapter: '力学', difficulty: 4, importance: 9 },
    { id: 'phys_003', name: '牛顿第二定律', subject: '物理', chapter: '力学', difficulty: 6, importance: 10 },
    { id: 'phys_004', name: '牛顿第三定律', subject: '物理', chapter: '力学', difficulty: 5, importance: 8 },
    { id: 'phys_005', name: '电磁感应', subject: '物理', chapter: '电磁学', difficulty: 8, importance: 10 },
    { id: 'phys_006', name: '法拉第定律', subject: '物理', chapter: '电磁学', difficulty: 9, importance: 10 },
    { id: 'phys_007', name: '楞次定律', subject: '物理', chapter: '电磁学', difficulty: 8, importance: 9 },
    { id: 'phys_008', name: '电磁波', subject: '物理', chapter: '电磁学', difficulty: 7, importance: 7 },
  ]

  const mathNodes = [
    { id: 'math_001', name: '函数基础', subject: '数学', chapter: '函数', difficulty: 3, importance: 9 },
    { id: 'math_002', name: '一次函数', subject: '数学', chapter: '函数', difficulty: 4, importance: 8 },
    { id: 'math_003', name: '二次函数', subject: '数学', chapter: '函数', difficulty: 6, importance: 9 },
    { id: 'math_004', name: '导数', subject: '数学', chapter: '微积分', difficulty: 8, importance: 10 },
    { id: 'math_005', name: '积分', subject: '数学', chapter: '微积分', difficulty: 9, importance: 9 },
  ]

  graph.addNodes(physicsNodes)
  graph.addNodes(mathNodes)

  // 添加关系
  graph.addEdge('phys_002', 'phys_001', 'prerequisite') // 牛一定律 <- 力学基础
  graph.addEdge('phys_003', 'phys_002', 'prerequisite') // 牛二定律 <- 牛一定律
  graph.addEdge('phys_004', 'phys_002', 'prerequisite') // 牛三定律 <- 牛一定律
  graph.addEdge('phys_006', 'phys_005', 'prerequisite') // 法拉第定律 <- 电磁感应
  graph.addEdge('phys_007', 'phys_005', 'prerequisite') // 楞次定律 <- 电磁感应
  graph.addEdge('phys_006', 'phys_007', 'related')     // 法拉第定律 <-> 楞次定律

  graph.addEdge('math_002', 'math_001', 'prerequisite') // 一次函数 <- 函数基础
  graph.addEdge('math_003', 'math_002', 'prerequisite') // 二次函数 <- 一次函数
  graph.addEdge('math_004', 'math_003', 'prerequisite') // 导数 <- 二次函数
  graph.addEdge('math_005', 'math_004', 'prerequisite') // 积分 <- 导数

  return graph
}

export default KnowledgeGraph
