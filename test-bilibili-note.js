// 哔哩哔哩使用技巧笔记 - 测试脚本
import { generateNote, getSkillInfo } from './index.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🎯 哔哩哔哩使用技巧笔记生成测试')
console.log('='.repeat(60))
console.log()

// 哔哩哔哩使用技巧笔记内容
const bilibiliContent = `
# 哔哩哔哩使用技巧大全

## 一、基础功能速览

**画中画模式**
- 手机端：点击视频右下角「画中画」按钮
- 电脑端：右键视频选择「画中画」或按快捷键
- 支持悬浮窗大小调节和位置拖拽

**倍速播放**
- 支持 0.5x / 0.75x / 1.0x / 1.25x / 1.5x / 2.0x / 3.0x
- 长按视频可快速2倍速播放（松开恢复）
- 学习类视频推荐 1.5x 效率最高

**弹幕设置**
- 智能屏蔽：自动过滤低质量弹幕
- 透明度调节：10%-100% 可调
- 弹幕区域：顶部/底部/全屏/滚动
- 字号大小：小/中/大/超大

## 二、隐藏功能揭秘

**快捷键大全**
| 快捷键 | 功能 |
|--------|------|
| 空格键 | 暂停/播放 |
| J | 后退10秒 |
| K | 暂停/播放 |
| L | 前进10秒 |
| F | 全屏切换 |
| D | 弹幕开关 |
| M | 静音切换 |
| ← → | 前进/后退5秒 |
| ↑ ↓ | 调节音量 |

**深夜模式**
- 设置 → 深色模式 → 开启
- 护眼效果：减少蓝光伤害
- 自动切换：可设置定时开启

**评论区彩蛋**
- 长按点赞按钮：有特殊动画效果
- 输入特定关键词：触发特效弹幕
- 三连按钮：长按可一次性完成

**投稿定时发布**
- 创作中心 → 投稿 → 定时发布
- 可设置具体发布时间
- 支持修改定时设置

## 三、手机端技巧

**手势操作**
- 双击屏幕：点赞
- 双指缩放：调节视频大小
- 上下滑动：调节亮度/音量
- 左右滑动：快进/快退

**离线缓存**
- 点击视频下方「缓存」按钮
- 选择清晰度：360P/480P/720P/1080P
- 支持批量缓存（番剧整季）
- 缓存位置：我的 → 离线缓存

**投屏功能**
- 确保手机和电视在同一WiFi
- 点击视频右上角「TV」图标
- 选择投屏设备
- 支持DLNA/AirPlay协议

**青少年模式**
- 设置 → 青少年模式
- 限制使用时间和内容
- 需要密码才能退出
- 适合家长控制

## 四、电脑端技巧

**浏览器插件推荐**
- *==哔哩哔哩助手==*：解除区域限制、画质增强
- *==Bilibili Evolved==*：功能增强、自定义界面
- *==bilibili-old==*：恢复旧版界面风格

**开发者工具技巧**
- F12 打开开发者工具
- Network 标签页 → 筛选 media
- 可查看视频源地址
- 支持下载视频片段

**快捷下载方法**
- 配合 IDM 下载工具
- 复制视频链接自动抓取
- 支持多P视频批量下载
- 可选择不同清晰度

**多P视频批量操作**
- 播放列表 → 全部添加到稍后观看
- 支持批量缓存/下载
- 可调整播放顺序

## 五、创作相关

**专栏投稿技巧**
- 标题：包含关键词，吸引点击
- 封面：高清、有吸引力
- 内容：分段清晰，图文并茂
- 标签：选择热门相关标签

**视频封面设计**
- 推荐尺寸：1146x717 像素
- 使用对比色吸引注意力
- 添加简洁文字说明
- 避免过于杂乱

**标题优化建议**
- 包含核心关键词
- 使用数字和符号增加吸引力
- 控制在20字以内
- 避免标题党

**互动数据查看**
- 创作中心 → 数据中心
- 查看播放量、点赞、收藏、分享
- 分析观众画像和观看时段
- 优化内容策略

## 六、实用小技巧

**搜索技巧**
- 使用引号精确搜索：「"关键词"」
- 筛选时长：短视频/中视频/长视频
- 按时间排序：查看最新内容
- 搜索UP主：直接搜索用户名

**会员权益**
- 大会员：1080P+画质、抢先看
- 年费大会员：更优惠价格
- 自动续费：可随时取消
- 赠送好友：可购买赠送

**直播互动**
- 弹幕互动：发送弹幕与主播互动
- 礼物系统：支持喜欢的主播
- 连麦功能：与主播实时对话
- 舰长/提督/总督：专属粉丝徽章

---

## 学习建议

1. **循序渐进**：先掌握基础功能，再探索隐藏技巧
2. **实践为主**：边看边操作，加深记忆
3. **整理笔记**：将有用的功能记录下来
4. **定期复习**：避免遗忘已学技巧

---

## 总结

哔哩哔哩作为国内领先的视频平台，拥有丰富的功能和隐藏技巧。掌握这些技巧可以：

- 提升观看体验
- 提高学习效率
- 更好地参与社区互动
- 发挥创作潜力

希望这份笔记对你有所帮助！
`

// 运行测试
async function runTest() {
  const skillInfo = getSkillInfo()
  console.log('📦 技能信息:')
  console.log('   名称:', skillInfo.name)
  console.log('   版本:', skillInfo.version)
  console.log()

  console.log('📝 生成哔哩哔哩使用技巧笔记...')
  console.log('-'.repeat(40))

  try {
    const result = await generateNote({
      content: bilibiliContent,
      title: '哔哩哔哩使用技巧大全',
      scene: 'reading' // 使用读书笔记场景
    })

    console.log('✅ 生成成功!')
    console.log('   标题:', result.metadata.title)
    console.log('   场景:', result.metadata.scene)
    console.log('   日期:', result.metadata.date)
    console.log()

    // 保存HTML文件
    const outputDir = 'D:\\blog\\notes'
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const filename = '哔哩哔哩使用技巧大全-学习笔记.html'
    const filePath = join(outputDir, filename)
    
    writeFileSync(filePath, result.html, 'utf-8')
    
    console.log('💾 文件保存成功!')
    console.log('   路径:', filePath)
    console.log()

    // 显示文件大小
    const stats = Buffer.byteLength(result.html, 'utf-8')
    console.log('📊 文件统计:')
    console.log('   大小:', (stats / 1024).toFixed(2), 'KB')
    console.log('   字符数:', result.html.length)
    console.log()

    console.log('🎨 笔记特色:')
    console.log('   ✓ 学霸笔记本风格')
    console.log('   ✓ 手写体字体（Kalam）')
    console.log('   ✓ 螺旋装订效果')
    console.log('   ✓ 横线纸张背景')
    console.log('   ✓ 逐渐生成动画效果')
    console.log('   ✓ 胶带和回形针装饰')
    console.log()

    console.log('='.repeat(60))
    console.log('✨ 测试完成！请用浏览器打开HTML文件查看效果')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    console.error(error.stack)
  }
}

// 运行测试
runTest().catch(console.error)
