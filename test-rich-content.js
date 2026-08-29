// 丰富内容笔记测试 - 使用新语法
import { generateNote } from './index.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const outputDir = 'D:\\blog\\notes'
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

console.log('📚 丰富内容笔记生成测试')
console.log('='.repeat(60))
console.log()

// 使用新语法的笔记内容
const richContent = `
# JavaScript数组方法完全指南

:::badge 技术教学 | 前端 | JavaScript

## 一、数组基础

:::question 什么是数组？数组和对象有什么区别？

数组是**有序的数据集合**，可以存储任意类型的元素。

:::grid
索引访问
动态长度
多种方法
类型混合
迭代遍历
原型继承

## 二、添加和删除元素

### push() - 末尾添加

:::tip push()是最常用的数组方法，用于在末尾添加元素

**语法**：
\`\`\`javascript
array.push(element1, element2, ...)
\`\`\`

**返回值**：数组的新长度

:::steps
1. 调用push()方法
2. 传入要添加的元素
3. 获取返回的新长度

**示例**：
\`\`\`javascript
const fruits = ['苹果', '香蕉'];
const newLength = fruits.push('橙子');
console.log(fruits);     // ['苹果', '香蕉', '橙子']
console.log(newLength);  // 3
\`\`\`

:::warning 注意：push()会修改原数组，不会创建新数组

### pop() - 末尾删除

**语法**：
\`\`\`javascript
array.pop()
\`\`\`

**返回值**：被删除的元素

:::compare
| 方法 | 位置 | 修改原数组 | 返回值 |
|------|------|------------|--------|
| push | 末尾 | 是 | 新长度 |
| pop | 末尾 | 是 | 被删元素 |
| unshift | 开头 | 是 | 新长度 |
| shift | 开头 | 是 | 被删元素 |

## 三、遍历方法

### forEach() - 遍历数组

:::success forEach()是遍历数组最常用的方法

\`\`\`javascript
const colors = ['红', '绿', '蓝'];
colors.forEach((color, index) => {
    console.log(index + ': ' + color);
});
// 0: 红
// 1: 绿
// 2: 蓝
\`\`\`

### map() - 映射新数组

:::tip map()不会修改原数组，而是返回一个新数组

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);  // [2, 4, 6, 8, 10]
console.log(numbers);  // [1, 2, 3, 4, 5] (原数组不变)
\`\`\`

:::flow 数组 -> map() -> 新数组 -> 返回

## 四、查找方法

### find() - 查找元素

\`\`\`javascript
const users = [
    { name: '张三', age: 25 },
    { name: '李四', age: 30 },
    { name: '王五', age: 28 }
];
const user = users.find(u => u.age > 25);
console.log(user);  // { name: '李四', age: 30 }
\`\`\`

### filter() - 过滤数组

:::success filter()返回所有满足条件的元素组成的新数组

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const even = numbers.filter(n => n % 2 === 0);
console.log(even);  // [2, 4, 6, 8, 10]
\`\`\`

:::compare
| 方法 | 返回值 | 用途 |
|------|--------|------|
| find | 单个元素 | 查找第一个匹配 |
| filter | 新数组 | 查找所有匹配 |

## 五、常用技巧

### 数组去重

\`\`\`javascript
const arr = [1, 2, 2, 3, 3, 4, 5, 5];
const unique = [...new Set(arr)];
console.log(unique);  // [1, 2, 3, 4, 5]
\`\`\`

### 数组扁平化

\`\`\`javascript
const nested = [[1, 2], [3, 4], [5, 6]];
const flat = nested.flat();
console.log(flat);  // [1, 2, 3, 4, 5, 6]
\`\`\`

### 数组求和

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, cur) => acc + cur, 0);
console.log(sum);  // 15
\`\`\`

:::warning reduce()是最强大的数组方法，但也是最难理解的

## 六、性能考虑

:::grid
大数组用for循环
避免频繁push/pop
使用展开运算符
善用includes()
链式调用注意性能
提前声明数组长度

## 七、总结

:::summary
- **添加删除**：push/pop/unshift/shift
- **遍历转换**：forEach/map/filter/reduce
- **查找判断**：find/findIndex/includes/some/every
- **排序转换**：sort/reverse/flat
- **最佳实践**：优先使用不修改原数组的方法
:::

:::danger 切记：不要在forEach中修改原数组长度！

---

**学习建议**：多动手实践，理解每个方法的使用场景和注意事项。
`

// 生成笔记
async function generateRichNote() {
  console.log('📝 生成丰富内容笔记...')
  console.log('-'.repeat(40))
  
  try {
    const result = await generateNote({
      content: richContent,
      title: 'JavaScript数组方法完全指南',
      scene: 'technical'
    })
    
    const filename = 'JavaScript数组方法-丰富内容版.html'
    const filePath = join(outputDir, filename)
    writeFileSync(filePath, result.html, 'utf-8')
    
    console.log('✅ 生成成功!')
    console.log('   标题:', result.metadata.title)
    console.log('   场景:', result.metadata.scene)
    console.log('   文件:', filename)
    console.log('   大小:', (Buffer.byteLength(result.html, 'utf-8') / 1024).toFixed(2), 'KB')
    console.log()
    
    console.log('🎨 使用的新组件:')
    console.log('   ✓ 徽章标签 (badge)')
    console.log('   ✓ 问题框 (question)')
    console.log('   ✓ 网格列表 (grid)')
    console.log('   ✓ 提示框 (tip)')
    console.log('   ✓ 步骤列表 (steps)')
    console.log('   ✓ 流程图 (flow)')
    console.log('   ✓ 对比框 (compare)')
    console.log('   ✓ 成功框 (success)')
    console.log('   ✓ 警告框 (warning)')
    console.log('   ✓ 总结框 (summary)')
    console.log('   ✓ 危险框 (danger)')
    console.log()
    
    console.log('='.repeat(60))
    console.log('✨ 测试完成！请用浏览器打开HTML文件查看效果')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    console.error(error.stack)
  }
}

generateRichNote().catch(console.error)
