// 错误处理模块测试用例
import { ErrorHandler, createErrorHandler, validateInput } from './core/error-handler.js'

// 测试颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0
}

// 测试函数
function test(name, fn) {
  testResults.total++
  try {
    fn()
    testResults.passed++
    console.log(colors.green(`✅ PASS: ${name}`))
  } catch (error) {
    testResults.failed++
    console.log(colors.red(`❌ FAIL: ${name}`))
    console.log(colors.red(`   Error: ${error.message}`))
  }
}

// 断言函数
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

// ==================== 错误处理器测试 ====================
console.log(colors.cyan('\n🛡️ 错误处理器测试'))

test('创建错误处理器', () => {
  const handler = createErrorHandler()
  assert(handler, '应该创建错误处理器')
  assert(handler.config, '应该有配置')
})

test('处理网络错误', () => {
  const handler = createErrorHandler()
  const error = new Error('fetch failed')
  const result = handler.handle(error, { module: 'test' })
  
  assert(result.success === false, '应该返回失败')
  assert(result.error.type === 'NETWORK_ERROR', '应该是网络错误')
  assert(result.error.retryable === true, '应该可重试')
})

test('处理文件不存在错误', () => {
  const handler = createErrorHandler()
  const error = new Error('ENOENT: no such file or directory')
  const result = handler.handle(error)
  
  assert(result.success === false, '应该返回失败')
  assert(result.error.type === 'FILE_NOT_FOUND', '应该是文件不存在错误')
  assert(result.error.retryable === false, '应该不可重试')
})

test('处理权限错误', () => {
  const handler = createErrorHandler()
  const error = new Error('EACCES: permission denied')
  const result = handler.handle(error)
  
  assert(result.success === false, '应该返回失败')
  assert(result.error.type === 'PERMISSION_ERROR', '应该是权限错误')
})

test('处理超时错误', () => {
  const handler = createErrorHandler()
  const error = new Error('ETIMEDOUT: connection timed out')
  const result = handler.handle(error)
  
  assert(result.success === false, '应该返回失败')
  assert(result.error.type === 'TIMEOUT_ERROR', '应该是超时错误')
  assert(result.error.retryable === true, '应该可重试')
})

test('处理验证错误', () => {
  const handler = createErrorHandler()
  const error = new Error('invalid input parameter')
  const result = handler.handle(error)
  
  assert(result.success === false, '应该返回失败')
  assert(result.error.type === 'VALIDATION_ERROR', '应该是验证错误')
})

test('处理模块加载错误', () => {
  const handler = createErrorHandler()
  const error = new Error('Cannot find module ./test-module')
  const result = handler.handle(error)
  
  assert(result.success === false, '应该返回失败')
  assert(result.error.type === 'MODULE_ERROR', '应该是模块错误')
})

test('处理未知错误', () => {
  const handler = createErrorHandler()
  const error = new Error('something went wrong')
  const result = handler.handle(error)
  
  assert(result.success === false, '应该返回失败')
  assert(result.error.type === 'UNKNOWN_ERROR', '应该是未知错误')
})

test('错误统计', () => {
  const handler = createErrorHandler()
  
  handler.handle(new Error('error 1'))
  handler.handle(new Error('error 2'))
  handler.handle(new Error('fetch failed'))
  
  const stats = handler.getStats()
  assert(stats.totalErrors === 3, '应该有3个错误')
  assert(stats.errorsByType['UNKNOWN_ERROR'] === 2, '应该有2个未知错误')
  assert(stats.errorsByType['NETWORK_ERROR'] === 1, '应该有1个网络错误')
})

test('重置统计', () => {
  const handler = createErrorHandler()
  
  handler.handle(new Error('error'))
  handler.resetStats()
  
  const stats = handler.getStats()
  assert(stats.totalErrors === 0, '应该重置为0')
})

// ==================== 输入验证测试 ====================
console.log(colors.cyan('\n✅ 输入验证测试'))

test('验证必填字段', () => {
  const result = validateInput({}, {
    required: ['name', 'email']
  })
  
  assert(result.valid === false, '应该验证失败')
  assert(result.errors.length === 2, '应该有2个错误')
})

test('验证类型', () => {
  const result = validateInput({ name: 123 }, {
    types: { name: 'string' }
  })
  
  assert(result.valid === false, '应该验证失败')
  assert(result.errors[0].message.includes('string'), '错误消息应该提到类型')
})

test('验证范围', () => {
  const result = validateInput({ age: 200 }, {
    ranges: { age: { min: 0, max: 150 } }
  })
  
  assert(result.valid === false, '应该验证失败')
})

test('验证通过', () => {
  const result = validateInput({ 
    name: 'test',
    email: 'test@example.com',
    age: 25
  }, {
    required: ['name', 'email'],
    types: { name: 'string', email: 'string' },
    ranges: { age: { min: 0, max: 150 } }
  })
  
  assert(result.valid === true, '应该验证通过')
  assert(result.errors.length === 0, '应该没有错误')
})

// ==================== 测试结果统计 ====================
console.log(colors.cyan('\n' + '='.repeat(50)))
console.log(colors.cyan('📊 错误处理测试结果统计'))
console.log(colors.cyan('='.repeat(50)))
console.log(`总计: ${testResults.total}`)
console.log(colors.green(`通过: ${testResults.passed}`))
console.log(colors.red(`失败: ${testResults.failed}`))

if (testResults.failed === 0) {
  console.log(colors.green('\n🎉 所有测试通过！'))
} else {
  console.log(colors.red(`\n⚠️ 有 ${testResults.failed} 个测试失败`))
}

// 导出测试结果
export { testResults }
