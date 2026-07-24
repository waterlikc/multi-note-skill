// 多场景模板管理系统
export class TemplateManager {
  constructor() {
    this.templates = {
      'style-a': {
        name: '学霸笔记本',
        template: 'assets/template.html',
        iconSet: 'lucide',
        features: ['spiral-binding', 'paper-texture', 'tape-decoration'],
        scenes: ['technical', 'classroom', 'science']
      },
      'style-b': {
        name: '手账皮革本', 
        template: 'assets/template-journal.html',
        iconSet: 'remix',
        features: ['leather-cover', 'metal-rings', 'page-flip'],
        scenes: ['meeting', 'attack-analysis', 'deep-research']
      }
    }

    this.sceneTemplates = {
      technical: {
        preferred: 'style-a',
        components: ['code-block', 'config-box', 'flow-box', 'compare-box'],
        layout: 'technical-layout'
      },
      classroom: {
        preferred: 'style-a', 
        components: ['highlight', 'side-note', 'question-box', 'safe-box'],
        layout: 'classroom-layout'
      },
      science: {
        preferred: 'style-a',
        components: ['flow-box', 'diagram-container', 'concept-cards', 'summary-box'],
        layout: 'science-layout'
      },
      meeting: {
        preferred: 'style-b',
        components: ['attack-chain', 'concept-cards', 'impact-grid', 'sticky-note'],
        layout: 'meeting-layout'
      }
    }
  }

  getTemplate(style) {
    return this.templates[style] || this.templates['style-a']
  }

  getSceneTemplate(scene) {
    return this.sceneTemplates[scene] || this.sceneTemplates['technical']
  }

  getRecommendedTemplate(scene) {
    const sceneConfig = this.getSceneTemplate(scene)
    return this.getTemplate(sceneConfig.preferred)
  }

  getAvailableTemplates() {
    return Object.keys(this.templates)
  }

  getSupportedScenes() {
    return Object.keys(this.sceneTemplates)
  }

  // 验证模板是否支持指定场景
  isTemplateSupported(style, scene) {
    const template = this.getTemplate(style)
    return template.scenes.includes(scene)
  }

  // 获取模板的特定组件
  getTemplateComponents(style, scene) {
    const sceneConfig = this.getSceneTemplate(scene)
    const template = this.getTemplate(style)
    
    // 返回场景推荐的组件，过滤掉模板不支持的
    return sceneConfig.components.filter(component => {
      // 这里可以根据模板特性来过滤组件
      return true // 暂时返回所有组件
    })
  }
}