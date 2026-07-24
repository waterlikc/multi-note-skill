// 学习路径推荐器 - 基于知识图谱推荐学习路径
export class LearningPath {
  constructor(options = {}) {
    // 知识图谱引用
    this.knowledgeGraph = options.knowledgeGraph || null
    
    // 配置
    this.config = {
      // 最大路径数
      maxPaths: options.maxPaths || 5,
      // 最大路径长度
      maxPathLength: options.maxPathLength || 20,
      // 学习速度因子
      learningSpeedFactor: options.learningSpeedFactor || 1.0,
      // 难度递增因子
      difficultyIncrementFactor: options.difficultyIncrementFactor || 0.5,
      ...options
    }
    
    // 缓存
    this.cache = new Map()
    this.maxCacheSize = options.maxCacheSize || 50
  }

  /**
   * 生成学习路径
   * @param {object} params - 参数
   * @param {string} params.studentId - 学生ID
   * @param {string} params.subject - 学科
   * @param {string} params.targetKnowledge - 目标知识点
   * @param {object} params.currentKnowledge - 当前掌握的知识点
   * @param {object} params.options - 配置选项
   * @returns {object} 学习路径
   */
  generatePath(params) {
    const startTime = performance.now()
    const { studentId, subject, targetKnowledge, currentKnowledge, options = {} } = params

    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(params)
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // 获取目标知识点
      const targetNodes = this.getTargetNodes(targetKnowledge, subject)
      if (targetNodes.length === 0) {
        return {
          success: false,
          error: '未找到目标知识点'
        }
      }

      // 获取当前掌握的知识点
      const masteredNodes = this.getMasteredNodes(currentKnowledge)

      // 生成多条学习路径
      const paths = []
      for (const targetNode of targetNodes) {
        const path = this.findPath(masteredNodes, targetNode, subject, options)
        if (path) {
          paths.push(path)
        }
      }

      // 排序路径（按难度、长度、推荐度）
      const sortedPaths = this.sortPaths(paths, options)

      // 选择最佳路径
      const bestPath = sortedPaths.length > 0 ? sortedPaths[0] : null

      // 生成学习建议
      const suggestions = this.generateSuggestions(bestPath, masteredNodes, options)

      const result = {
        success: true,
        // 学习路径
        paths: sortedPaths.slice(0, this.config.maxPaths),
        bestPath,
        // 学习建议
        suggestions,
        // 统计信息
        statistics: {
          targetCount: targetNodes.length,
          masteredCount: masteredNodes.length,
          pathCount: paths.length,
          averagePathLength: paths.length > 0 
            ? Math.round(paths.reduce((sum, p) => sum + p.nodes.length, 0) / paths.length)
            : 0
        },
        metadata: {
          studentId,
          subject,
          targetKnowledge,
          generatedAt: new Date().toISOString(),
          duration: (performance.now() - startTime).toFixed(2) + 'ms'
        }
      }

      // 缓存结果
      this.cache.set(cacheKey, result)
      this.manageCacheSize()

      return result
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  /**
   * 获取目标知识点
   */
  getTargetNodes(targetKnowledge, subject) {
    if (!this.knowledgeGraph) {
      return []
    }

    // 如果是字符串，搜索匹配的知识点
    if (typeof targetKnowledge === 'string') {
      return this.knowledgeGraph.searchNodes(targetKnowledge)
        .filter(node => !subject || node.subject === subject)
    }

    // 如果是数组，直接返回
    if (Array.isArray(targetKnowledge)) {
      return targetKnowledge.map(id => this.knowledgeGraph.getNode(id)).filter(Boolean)
    }

    // 如果是单个ID
    const node = this.knowledgeGraph.getNode(targetKnowledge)
    return node ? [node] : []
  }

  /**
   * 获取已掌握的知识点
   */
  getMasteredNodes(currentKnowledge) {
    if (!currentKnowledge) {
      return []
    }

    // 如果是数组
    if (Array.isArray(currentKnowledge)) {
      return currentKnowledge.map(id => {
        if (typeof id === 'string') {
          return this.knowledgeGraph?.getNode(id)
        }
        return id
      }).filter(Boolean)
    }

    // 如果是对象（包含掌握程度）
    if (typeof currentKnowledge === 'object') {
      return Object.entries(currentKnowledge)
        .map(([id, mastery]) => {
          const node = this.knowledgeGraph?.getNode(id)
          if (node) {
            return { ...node, mastery }
          }
          return null
        })
        .filter(Boolean)
    }

    return []
  }

  /**
   * 查找学习路径
   */
  findPath(masteredNodes, targetNode, subject, options) {
    if (!this.knowledgeGraph) {
      return null
    }

    // 使用BFS查找路径
    const visited = new Set()
    const queue = []
    
    // 初始化：从已掌握的知识点开始
    for (const node of masteredNodes) {
      queue.push({
        current: node.id,
        path: [node.id],
        difficulty: node.difficulty || 5,
        totalWeight: 0
      })
      visited.add(node.id)
    }

    // BFS
    while (queue.length > 0) {
      const { current, path, difficulty, totalWeight } = queue.shift()
      
      // 检查是否到达目标
      if (current === targetNode.id) {
        return this.buildPath(path, difficulty, totalWeight)
      }

      // 检查路径长度限制
      if (path.length >= this.config.maxPathLength) {
        continue
      }

      // 获取相邻知识点
      const neighbors = this.getNeighbors(current, subject)
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id)
          
          // 计算新的难度和权重
          const newDifficulty = this.calculateNewDifficulty(difficulty, neighbor.difficulty)
          const newWeight = totalWeight + (neighbor.weight || 1)
          
          queue.push({
            current: neighbor.id,
            path: [...path, neighbor.id],
            difficulty: newDifficulty,
            totalWeight: newWeight
          })
        }
      }
    }

    return null
  }

  /**
   * 获取相邻知识点
   */
  getNeighbors(nodeId, subject) {
    if (!this.knowledgeGraph) {
      return []
    }

    const neighbors = []
    const edges = this.knowledgeGraph.getEdges(nodeId) || []
    
    for (const edge of edges) {
      const neighborId = edge.from === nodeId ? edge.to : edge.from
      const neighborNode = this.knowledgeGraph.getNode(neighborId)
      
      if (neighborNode && (!subject || neighborNode.subject === subject)) {
        neighbors.push({
          ...neighborNode,
          weight: edge.weight || 1,
          relationType: edge.type
        })
      }
    }

    return neighbors
  }

  /**
   * 计算新的难度
   */
  calculateNewDifficulty(currentDifficulty, nodeDifficulty) {
    // 使用加权平均
    const factor = this.config.difficultyIncrementFactor
    return Math.round(currentDifficulty * (1 - factor) + nodeDifficulty * factor)
  }

  /**
   * 构建路径
   */
  buildPath(nodeIds, totalDifficulty, totalWeight) {
    const nodes = nodeIds.map(id => this.knowledgeGraph?.getNode(id)).filter(Boolean)
    
    return {
      nodes,
      nodeIds,
      length: nodes.length,
      totalDifficulty,
      averageDifficulty: Math.round(totalDifficulty / nodes.length),
      totalWeight,
      // 生成路径描述
      description: this.generatePathDescription(nodes),
      // 估计学习时间（分钟）
      estimatedTime: this.estimateLearningTime(nodes)
    }
  }

  /**
   * 生成路径描述
   */
  generatePathDescription(nodes) {
    if (nodes.length === 0) {
      return '空路径'
    }

    if (nodes.length === 1) {
      return `学习 "${nodes[0].name}"`
    }

    if (nodes.length === 2) {
      return `先学习 "${nodes[0].name}"，然后学习 "${nodes[1].name}"`
    }

    return `从 "${nodes[0].name}" 开始，经过 ${nodes.length - 2} 个知识点，最终学习 "${nodes[nodes.length - 1].name}"`
  }

  /**
   * 估计学习时间
   */
  estimateLearningTime(nodes) {
    // 基于难度和知识点数量估计时间
    let totalTime = 0
    
    for (const node of nodes) {
      const difficulty = node.difficulty || 5
      // 每个知识点的基础时间（分钟）
      const baseTime = 10
      // 难度系数
      const difficultyFactor = 1 + (difficulty - 5) * 0.2
      // 内容长度系数
      const contentFactor = Math.max(1, (node.content?.length || 100) / 500)
      
      totalTime += baseTime * difficultyFactor * contentFactor
    }

    return Math.round(totalTime)
  }

  /**
   * 排序路径
   */
  sortPaths(paths, options) {
    return paths.sort((a, b) => {
      // 优先级1：路径长度（越短越好）
      const lengthDiff = a.length - b.length
      if (Math.abs(lengthDiff) > 2) {
        return lengthDiff
      }

      // 优先级2：平均难度（越低越好）
      const difficultyDiff = a.averageDifficulty - b.averageDifficulty
      if (Math.abs(difficultyDiff) > 2) {
        return difficultyDiff
      }

      // 优先级3：总权重（越低越好）
      return a.totalWeight - b.totalWeight
    })
  }

  /**
   * 生成学习建议
   */
  generateSuggestions(bestPath, masteredNodes, options) {
    const suggestions = []

    if (!bestPath) {
      suggestions.push({
        type: 'no-path',
        message: '未找到合适的学习路径，建议先学习基础知识',
        priority: 'high'
      })
      return suggestions
    }

    // 路径长度建议
    if (bestPath.length > 10) {
      suggestions.push({
        type: 'long-path',
        message: '学习路径较长，建议分阶段学习',
        priority: 'medium'
      })
    }

    // 难度建议
    if (bestPath.averageDifficulty > 7) {
      suggestions.push({
        type: 'high-difficulty',
        message: '学习路径难度较高，建议先巩固基础知识',
        priority: 'high'
      })
    }

    // 时间建议
    if (bestPath.estimatedTime > 120) {
      suggestions.push({
        type: 'long-time',
        message: `预计学习时间 ${bestPath.estimatedTime} 分钟，建议安排多次学习`,
        priority: 'medium'
      })
    }

    // 已掌握知识点建议
    if (masteredNodes.length > 0) {
      suggestions.push({
        type: 'mastered',
        message: `已掌握 ${masteredNodes.length} 个知识点，可以跳过相关内容`,
        priority: 'low'
      })
    }

    return suggestions
  }

  /**
   * 获取学习进度
   */
  getProgress(studentId, pathId) {
    // 这里可以集成学习记录系统
    return {
      studentId,
      pathId,
      completedNodes: [],
      currentNode: null,
      progress: 0,
      estimatedRemaining: 0
    }
  }

  /**
   * 更新学习进度
   */
  updateProgress(studentId, pathId, nodeId, status) {
    // 这里可以集成学习记录系统
    return {
      studentId,
      pathId,
      nodeId,
      status,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(params) {
    const { studentId, subject, targetKnowledge } = params
    const hash = this.simpleHash(`${studentId}_${subject}_${targetKnowledge}`)
    return `path_${hash}`
  }

  /**
   * 简单哈希
   */
  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < Math.min(str.length, 100); i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * 管理缓存大小
   */
  manageCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    }
  }
}

// 便捷工厂函数
export function createLearningPath(options = {}) {
  return new LearningPath(options)
}

// 快速生成学习路径
export function generateLearningPath(params) {
  const learningPath = createLearningPath(params.options)
  return learningPath.generatePath(params)
}
