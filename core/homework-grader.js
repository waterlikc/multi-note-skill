// 作业智能批改模块 - 多模态作业批改与错因归因
export class HomeworkGrader {
  constructor(options = {}) {
    // 多模态处理器引用（外部注入）
    this.multimodalProcessor = options.multimodalProcessor || null
    
    // 知识图谱引用（用于错因归因）
    this.knowledgeGraph = options.knowledgeGraph || null
    
    // 批改记录存储
    this.gradingRecords = new Map()
    
    // 配置
    this.config = {
      ocrEnabled: options.ocrEnabled !== false,
      aiGradingEnabled: options.aiGradingEnabled !== false,
      ...options
    }
  }

  // ==================== 核心批改功能 ====================

  // 批改单个作业
  async grade(submission, standardAnswer, options = {}) {
    const startTime = performance.now()
    const gradingId = this.generateGradingId()

    try {
      // 1. 处理学生答案（支持多模态输入）
      let studentAnswer = submission.answer
      let ocrResult = null

      if (this.isImageInput(submission.answer)) {
        // 图片输入，需要OCR识别
        ocrResult = await this.performOCR(submission.answer)
        studentAnswer = ocrResult.text
      }

      // 2. 解析标准答案
      const parsedStandard = this.parseAnswer(standardAnswer)
      const parsedStudent = this.parseAnswer(studentAnswer)

      // 3. 执行批改
      const gradingResult = this.performGrading(parsedStudent, parsedStandard, options)

      // 4. 错因归因分析
      const errorAnalysis = this.analyzeErrors(gradingResult, parsedStandard, options)

      // 5. 生成批改报告
      const report = {
        id: gradingId,
        studentId: submission.studentId || 'unknown',
        subject: submission.subject || '通用',
        chapter: submission.chapter || '',
        timestamp: new Date().toISOString(),
        
        // 批改结果
        result: {
          score: gradingResult.score,
          totalScore: gradingResult.totalScore,
          percentage: gradingResult.percentage,
          grade: this.calculateGrade(gradingResult.percentage)
        },
        
        // 详细分析
        details: {
          correct: gradingResult.correct,
          incorrect: gradingResult.incorrect,
          partial: gradingResult.partial,
          blank: gradingResult.blank
        },
        
        // 错因分析
        errorAnalysis: errorAnalysis,
        
        // OCR信息（如果有）
        ocr: ocrResult ? {
          confidence: ocrResult.confidence,
          originalImage: submission.answer
        } : null,
        
        // 学习建议
        recommendations: this.generateRecommendations(errorAnalysis),
        
        // 性能指标
        performance: {
          gradingTime: (performance.now() - startTime).toFixed(2) + 'ms'
        }
      }

      // 6. 存储批改记录
      this.gradingRecords.set(gradingId, report)

      return report
    } catch (error) {
      return {
        id: gradingId,
        success: false,
        error: error.message,
        gradingTime: (performance.now() - startTime).toFixed(2) + 'ms'
      }
    }
  }

  // 批量批改
  async gradeBatch(submissions, standardAnswer, options = {}) {
    const results = []
    const batchSize = options.batchSize || 5

    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(sub => this.grade(sub, standardAnswer, options))
      )
      results.push(...batchResults)
    }

    return results
  }

  // ==================== 批改逻辑 ====================

  // 执行批改
  performGrading(studentAnswer, standardAnswer, options = {}) {
    const result = {
      score: 0,
      totalScore: 0,
      percentage: 0,
      correct: [],
      incorrect: [],
      partial: [],
      blank: []
    }

    // 选择题批改
    if (standardAnswer.type === 'choice') {
      return this.gradeChoiceQuestions(studentAnswer, standardAnswer, result)
    }

    // 填空题批改
    if (standardAnswer.type === 'fill') {
      return this.gradeFillQuestions(studentAnswer, standardAnswer, result)
    }

    // 解答题批改
    if (standardAnswer.type === 'essay') {
      return this.gradeEssayQuestions(studentAnswer, standardAnswer, result, options)
    }

    // 混合题型批改
    if (standardAnswer.type === 'mixed') {
      return this.gradeMixedQuestions(studentAnswer, standardAnswer, result, options)
    }

    // 默认：文本对比批改
    return this.gradeByTextComparison(studentAnswer, standardAnswer, result)
  }

  // 选择题批改
  gradeChoiceQuestions(student, standard, result) {
    const questions = standard.questions || []
    result.totalScore = questions.length * (standard.scorePerQuestion || 1)

    for (let i = 0; i < questions.length; i++) {
      const studentAns = student.answers?.[i] || ''
      const correctAns = questions[i].answer

      if (!studentAns || studentAns.trim() === '') {
        result.blank.push({
          index: i + 1,
          question: questions[i].question,
          correctAnswer: correctAns
        })
      } else if (this.normalizeAnswer(studentAns) === this.normalizeAnswer(correctAns)) {
        result.correct.push({
          index: i + 1,
          question: questions[i].question,
          answer: correctAns
        })
        result.score += standard.scorePerQuestion || 1
      } else {
        result.incorrect.push({
          index: i + 1,
          question: questions[i].question,
          studentAnswer: studentAns,
          correctAnswer: correctAns
        })
      }
    }

    result.percentage = result.totalScore > 0 
      ? Math.round(result.score / result.totalScore * 100) 
      : 0

    return result
  }

  // 填空题批改
  gradeFillQuestions(student, standard, result) {
    const questions = standard.questions || []
    result.totalScore = questions.length * (standard.scorePerQuestion || 1)

    for (let i = 0; i < questions.length; i++) {
      const studentAns = student.answers?.[i] || ''
      const correctAns = questions[i].answer

      if (!studentAns || studentAns.trim() === '') {
        result.blank.push({
          index: i + 1,
          question: questions[i].question,
          correctAnswer: correctAns
        })
      } else if (this.compareAnswers(studentAns, correctAns, { fuzzy: true })) {
        result.correct.push({
          index: i + 1,
          question: questions[i].question,
          answer: correctAns
        })
        result.score += standard.scorePerQuestion || 1
      } else {
        result.incorrect.push({
          index: i + 1,
          question: questions[i].question,
          studentAnswer: studentAns,
          correctAnswer: correctAns
        })
      }
    }

    result.percentage = result.totalScore > 0 
      ? Math.round(result.score / result.totalScore * 100) 
      : 0

    return result
  }

  // 解答题批改（简化版，实际需要AI辅助）
  gradeEssayQuestions(student, standard, result, options) {
    // 简化实现：关键词匹配 + 长度检查
    const keywords = standard.keywords || []
    const studentText = student.text || ''
    const minWords = standard.minWords || 50

    result.totalScore = standard.totalScore || 100

    // 关键词匹配得分
    let keywordScore = 0
    const matchedKeywords = []
    const missingKeywords = []

    for (const keyword of keywords) {
      if (studentText.includes(keyword)) {
        keywordScore += standard.keywordScore || 5
        matchedKeywords.push(keyword)
      } else {
        missingKeywords.push(keyword)
      }
    }

    // 长度得分
    const wordCount = studentText.length
    const lengthScore = Math.min(20, Math.floor(wordCount / minWords * 20))

    // 计算总分
    result.score = Math.min(result.totalScore, keywordScore + lengthScore)
    result.percentage = Math.round(result.score / result.totalScore * 100)

    // 详细信息
    result.correct = matchedKeywords.length > 0 
      ? [{ type: 'keywords', matched: matchedKeywords }] 
      : []
    result.incorrect = missingKeywords.length > 0 
      ? [{ type: 'keywords', missing: missingKeywords }] 
      : []

    return result
  }

  // 混合题型批改
  gradeMixedQuestions(student, standard, result, options) {
    const sections = standard.sections || []
    let totalWeightedScore = 0
    let totalWeight = 0

    for (const section of sections) {
      const sectionResult = this.performGrading(
        { answers: student[section.type] },
        section,
        options
      )

      totalWeightedScore += sectionResult.score * (section.weight || 1)
      totalWeight += section.weight || 1

      result.correct.push(...sectionResult.correct.map(item => ({
        ...item,
        section: section.name
      })))
      result.incorrect.push(...sectionResult.incorrect.map(item => ({
        ...item,
        section: section.name
      })))
    }

    result.score = Math.round(totalWeightedScore / totalWeight)
    result.totalScore = standard.totalScore || 100
    result.percentage = Math.round(result.score / result.totalScore * 100)

    return result
  }

  // 文本对比批改
  gradeByTextComparison(student, standard, result) {
    const similarity = this.calculateSimilarity(
      student.text || '',
      standard.text || ''
    )

    result.totalScore = 100
    result.score = Math.round(similarity * 100)
    result.percentage = result.score

    if (similarity >= 0.9) {
      result.correct.push({ type: 'text', similarity })
    } else {
      result.incorrect.push({ type: 'text', similarity, threshold: 0.9 })
    }

    return result
  }

  // ==================== 错因归因 ====================

  // 分析错误原因
  analyzeErrors(gradingResult, standardAnswer, options = {}) {
    const errors = []

    for (const incorrect of gradingResult.incorrect) {
      const error = {
        question: incorrect.index || incorrect.section,
        studentAnswer: incorrect.studentAnswer,
        correctAnswer: incorrect.correctAnswer,
        errorType: this.classifyError(incorrect),
        possibleCauses: [],
        relatedKnowledge: []
      }

      // 分类错误类型
      switch (error.errorType) {
        case 'conceptual':
          error.possibleCauses = ['概念理解不清', '知识点混淆']
          error.relatedKnowledge = this.findRelatedKnowledge(incorrect)
          break
        case 'calculation':
          error.possibleCauses = ['计算失误', '公式记错']
          break
        case 'careless':
          error.possibleCauses = ['粗心大意', '审题不清']
          break
        case 'incomplete':
          error.possibleCauses = ['答题不完整', '遗漏要点']
          break
        default:
          error.possibleCauses = ['未知原因']
      }

      errors.push(error)
    }

    // 统计错误类型分布
    const errorDistribution = {}
    for (const error of errors) {
      errorDistribution[error.errorType] = (errorDistribution[error.errorType] || 0) + 1
    }

    return {
      totalErrors: errors.length,
      errors,
      errorDistribution,
      mainErrorType: Object.entries(errorDistribution)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
    }
  }

  // 错误分类
  classifyError(incorrect) {
    const studentAns = (incorrect.studentAnswer || '').toLowerCase()
    const correctAns = (incorrect.correctAnswer || '').toLowerCase()

    // 空白
    if (!studentAns || studentAns.trim() === '') {
      return 'blank'
    }

    // 完全不同
    if (this.calculateSimilarity(studentAns, correctAns) < 0.3) {
      return 'conceptual'
    }

    // 数字错误
    if (/\d/.test(studentAns) && /\d/.test(correctAns)) {
      const studentNums = studentAns.match(/\d+/g) || []
      const correctNums = correctAns.match(/\d+/g) || []
      if (studentNums.length === correctNums.length) {
        return 'calculation'
      }
    }

    // 部分正确
    if (this.calculateSimilarity(studentAns, correctAns) >= 0.6) {
      return 'incomplete'
    }

    // 可能是粗心
    return 'careless'
  }

  // 查找相关知识点
  findRelatedKnowledge(incorrect) {
    if (!this.knowledgeGraph) return []

    const keywords = [
      incorrect.question,
      incorrect.correctAnswer
    ].filter(Boolean)

    const relatedNodes = []
    for (const keyword of keywords) {
      const nodes = this.knowledgeGraph.searchNodes(keyword)
      relatedNodes.push(...nodes.slice(0, 2))
    }

    return [...new Set(relatedNodes.map(n => n.name))]
  }

  // ==================== OCR处理 ====================

  // 执行OCR识别
  async performOCR(imageInput) {
    if (!this.multimodalProcessor) {
      return {
        text: '[OCR功能需要配置多模态处理器]',
        confidence: 0
      }
    }

    try {
      const result = await this.multimodalProcessor.process(imageInput, {
        type: 'image'
      })

      return {
        text: result.content,
        confidence: result.metadata?.confidence || 0.8
      }
    } catch (error) {
      return {
        text: '[OCR识别失败: ' + error.message + ']',
        confidence: 0
      }
    }
  }

  // ==================== 学习建议 ====================

  // 生成学习建议
  generateRecommendations(errorAnalysis) {
    const recommendations = []

    if (errorAnalysis.totalErrors === 0) {
      recommendations.push({
        type: 'excellent',
        priority: 'low',
        message: '太棒了！全部正确，继续保持！'
      })
      return recommendations
    }

    // 根据主要错误类型给出建议
    switch (errorAnalysis.mainErrorType) {
      case 'conceptual':
        recommendations.push({
          type: 'conceptual',
          priority: 'high',
          message: '概念理解需要加强',
          actions: [
            '回顾相关知识点的定义和原理',
            '做更多概念辨析练习',
            '尝试用自己的话解释概念'
          ]
        })
        break

      case 'calculation':
        recommendations.push({
          type: 'calculation',
          priority: 'medium',
          message: '计算能力需要提升',
          actions: [
            '多做计算练习',
            '注意检查计算过程',
            '使用草稿纸规范演算'
          ]
        })
        break

      case 'careless':
        recommendations.push({
          type: 'careless',
          priority: 'medium',
          message: '需要更加细心',
          actions: [
            '仔细审题，圈出关键词',
            '做完后检查一遍',
            '养成良好的答题习惯'
          ]
        })
        break

      case 'incomplete':
        recommendations.push({
          type: 'incomplete',
          priority: 'high',
          message: '答题需要更加完整',
          actions: [
            '注意题目要求的答题范围',
            '列出答题要点',
            '检查是否遗漏重要信息'
          ]
        })
        break
    }

    // 根据错题找出薄弱知识点
    if (this.knowledgeGraph && errorAnalysis.errors.length > 0) {
      const weakTopics = []
      for (const error of errorAnalysis.errors) {
        if (error.relatedKnowledge) {
          weakTopics.push(...error.relatedKnowledge)
        }
      }

      if (weakTopics.length > 0) {
        recommendations.push({
          type: 'knowledge',
          priority: 'high',
          message: '建议复习以下知识点：',
          items: [...new Set(weakTopics)].slice(0, 5)
        })
      }
    }

    return recommendations
  }

  // ==================== 工具方法 ====================

  // 比较答案
  compareAnswers(studentAns, correctAns, options = {}) {
    const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, '')
    
    const normalizedStudent = normalize(studentAns)
    const normalizedCorrect = normalize(correctAns)

    if (normalizedStudent === normalizedCorrect) return true

    if (options.fuzzy) {
      const similarity = this.calculateSimilarity(normalizedStudent, normalizedCorrect)
      return similarity >= 0.85
    }

    return false
  }

  // 标准化答案
  normalizeAnswer(answer) {
    return (answer || '').trim().toUpperCase().replace(/\s+/g, '')
  }

  // 计算相似度（简化版Levenshtein）
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0
    if (str1 === str2) return 1

    const len1 = str1.length
    const len2 = str2.length
    const maxLen = Math.max(len1, len2)

    if (maxLen === 0) return 1

    // 简化计算：基于共同字符比例
    const set1 = new Set(str1)
    const set2 = new Set(str2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    
    return intersection.size / maxLen
  }

  // 解析答案
  parseAnswer(answer) {
    if (typeof answer === 'string') {
      // 尝试解析为JSON
      try {
        return JSON.parse(answer)
      } catch {
        // 作为纯文本处理
        return { type: 'text', text: answer }
      }
    }
    return answer
  }

  // 计算等级
  calculateGrade(percentage) {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  // 检查是否为图片输入
  isImageInput(input) {
    if (typeof input !== 'string') return false
    return /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i.test(input) ||
           input.startsWith('data:image/') ||
           input.startsWith('http')
  }

  // 生成批改ID
  generateGradingId() {
    return 'grade_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5)
  }

  // 获取批改记录
  getRecord(gradingId) {
    return this.gradingRecords.get(gradingId)
  }

  // 获取所有批改记录
  getAllRecords() {
    return Array.from(this.gradingRecords.values())
  }

  // 获取学生批改历史
  getStudentRecords(studentId) {
    return this.getAllRecords().filter(r => r.studentId === studentId)
  }

  // 生成学情统计
  generateStudentStats(studentId) {
    const records = this.getStudentRecords(studentId)
    
    if (records.length === 0) {
      return { studentId, totalGraded: 0 }
    }

    const scores = records.map(r => r.result.percentage)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

    // 错误类型统计
    const errorStats = {}
    for (const record of records) {
      if (record.errorAnalysis?.errorDistribution) {
        for (const [type, count] of Object.entries(record.errorAnalysis.errorDistribution)) {
          errorStats[type] = (errorStats[type] || 0) + count
        }
      }
    }

    return {
      studentId,
      totalGraded: records.length,
      averageScore: avgScore.toFixed(1),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      errorDistribution: errorStats,
      recentRecords: records.slice(-5).reverse()
    }
  }
}

export default HomeworkGrader
