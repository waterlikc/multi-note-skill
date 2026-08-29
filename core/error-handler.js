// 统一错误处理模块
export class ErrorHandler {
  constructor(options = {}) {
    this.config = {
      // 是否记录错误日志
      enableLogging: options.enableLogging !== false,
      // 是否返回详细错误信息
      enableDetailedErrors: options.enableDetailedErrors !== false,
      // 最大重试次数
      maxRetries: options.maxRetries || 3,
      // 重试延迟（毫秒）
      retryDelay: options.retryDelay || 1000,
      ...options
    }

    // 错误统计
    this.stats = {
      totalErrors: 0,
      errorsByType: {},
      lastError: null
    }
  }

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {object} context - 错误上下文
   * @returns {object} 标准化错误结果
   */
  handle(error, context = {}) {
    const errorInfo = this.analyzeError(error)
    
    // 更新统计
    this.stats.totalErrors++
    this.stats.errorsByType[errorInfo.type] = (this.stats.errorsByType[errorInfo.type] || 0) + 1
    this.stats.lastError = {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      context
    }

    // 记录日志
    if (this.config.enableLogging) {
      this.logError(errorInfo, context)
    }

    // 返回标准化错误结果
    return {
      success: false,
      error: {
        type: errorInfo.type,
        message: this.config.enableDetailedErrors ? errorInfo.message : '操作失败',
        code: errorInfo.code,
        suggestion: errorInfo.suggestion,
        retryable: errorInfo.retryable
      },
      context,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 分析错误类型
   */
  analyzeError(error) {
    const message = error.message || error.toString()
    
    // 网络错误
    if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
      return {
        type: 'NETWORK_ERROR',
        message: '网络连接失败',
        code: 'ERR_NETWORK',
        suggestion: '请检查网络连接后重试',
        retryable: true
      }
    }

    // 文件不存在
    if (message.includes('ENOENT') || message.includes('no such file')) {
      return {
        type: 'FILE_NOT_FOUND',
        message: '文件不存在',
        code: 'ERR_FILE_NOT_FOUND',
        suggestion: '请检查文件路径是否正确',
        retryable: false
      }
    }

    // 权限错误
    if (message.includes('EACCES') || message.includes('permission')) {
      return {
        type: 'PERMISSION_ERROR',
        message: '权限不足',
        code: 'ERR_PERMISSION',
        suggestion: '请检查文件权限',
        retryable: false
      }
    }

    // 超时错误
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return {
        type: 'TIMEOUT_ERROR',
        message: '操作超时',
        code: 'ERR_TIMEOUT',
        suggestion: '请稍后重试',
        retryable: true
      }
    }

    // 输入验证错误
    if (message.includes('invalid') || message.includes('Invalid')) {
      return {
        type: 'VALIDATION_ERROR',
        message: '输入无效',
        code: 'ERR_VALIDATION',
        suggestion: '请检查输入内容',
        retryable: false
      }
    }

    // 模块加载错误
    if (message.includes('Cannot find module') || message.includes('MODULE_NOT_FOUND')) {
      return {
        type: 'MODULE_ERROR',
        message: '模块加载失败',
        code: 'ERR_MODULE_NOT_FOUND',
        suggestion: '请检查依赖是否安装',
        retryable: false
      }
    }

    // 默认错误
    return {
      type: 'UNKNOWN_ERROR',
      message: message.substring(0, 200), // 限制错误消息长度
      code: 'ERR_UNKNOWN',
      suggestion: '请联系管理员',
      retryable: false
    }
  }

  /**
   * 记录错误日志
   */
  logError(errorInfo, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: errorInfo.type,
      code: errorInfo.code,
      message: errorInfo.message,
      context: context
    }

    // 在开发环境输出到控制台
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ErrorHandler] ${errorInfo.type}: ${errorInfo.message}`)
      if (context.module) {
        console.error(`  Module: ${context.module}`)
      }
      if (context.operation) {
        console.error(`  Operation: ${context.operation}`)
      }
    }
  }

  /**
   * 带重试的执行
   * @param {Function} fn - 要执行的函数
   * @param {object} options - 重试选项
   * @returns {Promise} 执行结果
   */
  async withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries || this.config.maxRetries
    const retryDelay = options.retryDelay || this.config.retryDelay
    let lastError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        const errorInfo = this.analyzeError(error)

        // 如果错误不可重试，直接抛出
        if (!errorInfo.retryable) {
          throw error
        }

        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          await this.delay(retryDelay * (attempt + 1)) // 指数退避
        }
      }
    }

    throw lastError
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取错误统计
   */
  getStats() {
    return {
      ...this.stats,
      errorRate: this.stats.totalErrors > 0 ? '有错误' : '无错误'
    }
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      totalErrors: 0,
      errorsByType: {},
      lastError: null
    }
  }

  /**
   * 创建错误结果
   */
  static createErrorResult(message, code, suggestion) {
    return {
      success: false,
      error: {
        message,
        code: code || 'ERR_CUSTOM',
        suggestion: suggestion || '请联系管理员',
        retryable: false
      },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 创建成功结果
   */
  static createSuccessResult(data, metadata = {}) {
    return {
      success: true,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// 便捷工厂函数
export function createErrorHandler(options = {}) {
  return new ErrorHandler(options)
}

// 全局错误处理器实例
let globalErrorHandler = null

/**
 * 获取全局错误处理器
 */
export function getErrorHandler(options = {}) {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler(options)
  }
  return globalErrorHandler
}

/**
 * 包装异步函数，添加错误处理
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    const errorHandler = getErrorHandler()
    try {
      return await fn(...args)
    } catch (error) {
      return errorHandler.handle(error, context)
    }
  }
}

/**
 * 验证输入
 */
export function validateInput(input, rules = {}) {
  const errors = []

  // 检查必填字段
  if (rules.required) {
    for (const field of rules.required) {
      if (!input[field]) {
        errors.push({
          field,
          message: `${field} 是必填项`
        })
      }
    }
  }

  // 检查类型
  if (rules.types) {
    for (const [field, expectedType] of Object.entries(rules.types)) {
      if (input[field] && typeof input[field] !== expectedType) {
        errors.push({
          field,
          message: `${field} 类型应为 ${expectedType}`
        })
      }
    }
  }

  // 检查范围
  if (rules.ranges) {
    for (const [field, range] of Object.entries(rules.ranges)) {
      if (input[field] !== undefined) {
        if (range.min !== undefined && input[field] < range.min) {
          errors.push({
            field,
            message: `${field} 不能小于 ${range.min}`
          })
        }
        if (range.max !== undefined && input[field] > range.max) {
          errors.push({
            field,
            message: `${field} 不能大于 ${range.max}`
          })
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
