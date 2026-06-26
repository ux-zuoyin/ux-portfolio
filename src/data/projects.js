const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/${file}`

export const projectCategories = [
  '全部',
  'AI产品体验设计',
  '商业化与增长设计',
  '创作者与生产力平台',
]

export const createProjectTemplate = (index, overrides = {}) => {
  const placeholderImage = assetUrl('project-placeholder.svg')
  return {
    index,
    title: '新项目标题\n等待内容补充',
    meta: 'NEW PROJECT · COMING SOON',
    description: '这里是项目副标题占位内容，后续可替换为项目背景、目标与核心价值说明。',
    tags: ['占位标签', '项目类型', '待补充'],
    image: placeholderImage,
    accent: '#ff3526',
    detailTitle: '新项目内容准备中',
    detailSubtitle: '项目详情将在内容整理完成后补充',
    detailMedia: [placeholderImage],
    category: 'AI产品体验设计',
    ...overrides,
  }
}

export const projects = [
  // 新增项目时复制此调用，并通过第二个参数覆盖标题、封面、标签及详情内容。
  createProjectTemplate('01', {
    title: '灵魂记忆空间\n基于 AI 记忆构建用户画像体系',
    description: '从用户行为到社交连接，探索兴趣社交场景下的新一代 Persona System',
    tags: ['AI记忆', '用户画像', '兴趣匹配'],
    image: assetUrl('project-memory.webp'),
    detailTitle: '灵魂记忆空间\n基于 AI 记忆构建用户画像体系',
    detailSubtitle: '从用户行为到社交连接，探索兴趣社交场景下的新一代 Persona System',
    detailMedia: Array.from({ length: 14 }, (_, index) => assetUrl(`project-memory/${index + 1}.webp`)),
  }),
  {
    index: '02',
    title: '构建全链路发布器\nAIGC 辅助体系',
    meta: 'SOUL APP · 2025–2026',
    description: '从“不敢发”到“发得好”，以心智破冰、联想写作与确定性反馈重构内容发布体验。',
    tags: ['AIGC', '内容创作', '体验策略'],
    image: assetUrl('project-01.webp'),
    accent: '#ff3526',
    detailTitle: '发布器 AI 辅助发帖',
    detailSubtitle: '实现从「不敢发」到「发得好」的体验跃迁',
    category: 'AI产品体验设计',
    detailMedia: Array.from({ length: 8 }, (_, index) => {
      const number = index + 1
      return assetUrl(`project-01/1-${number}.webp`)
    }),
  },
  {
    index: '03',
    title: '多维场景下的商业适配\nSoul 广告生态设计',
    meta: 'SOUL APP · 2024–2025',
    description: '在商业效率与社区体验之间建立平衡，搭建可持续演进的广告产品体验框架。',
    tags: ['商业化', '广告平台', '体验设计'],
    image: assetUrl('project-02.webp'),
    accent: '#ff3526',
    category: '商业化与增长设计',
    detailMedia: Array.from({ length: 7 }, (_, index) => {
      const number = index + 1
      return assetUrl(`project-02/2-${number}.webp`)
    }),
  },
  {
    index: '04',
    title: '广告激励平台化\n从单点活动到玩法聚合',
    meta: '增长体验 · 2023–2024',
    description: '围绕任务、激励与转化链路，推动单次运营活动升级为可复用的平台能力。',
    tags: ['增长设计', '激励体系', '平台化'],
    image: assetUrl('project-03.webp'),
    accent: '#ff3526',
    category: '商业化与增长设计',
    detailMedia: [1, 2, 8, 9, 10, 11, 12].map((index) => assetUrl(`project-03/2-${index}.webp`)),
  },
  {
    index: '05',
    title: '支撑 Soul 主站\n3D 资产全链路管控',
    meta: 'NAWA · EFFECTCREATOR',
    description: '打通 3D 资产生产、审核、配置与投放流程，提升跨角色协同和内容交付效率。',
    tags: ['3D 资产', '复杂系统', '协同平台'],
    image: assetUrl('project-04.webp'),
    accent: '#ff3526',
    category: '创作者与生产力平台',
    detailMedia: [
      '1.webp',
      '2.webp',
      '3.webp',
      '4.webp',
      '5.mp4',
      '6.mp4',
      '7-1.mp4',
      '7-2.mp4',
      '8.mp4',
      '9-0.mp4',
      '9-1.mp4',
      '9-2.mp4',
      '9-3.mp4',
      '9-4.mp4',
      '10.mp4',
      '11.mp4',
      '12.mp4',
      '13.mp4',
      '14.webp',
    ].map((file) => assetUrl(`project-04/${file}`)),
  },
  {
    index: '06',
    title: '支撑用户反馈平台\n用户声音统一运营中枢',
    meta: 'SOUL APP · CONTENT CREATION',
    description: '打通工单处理、投诉收集与需求流转流程，沉淀用户一线反馈数据，支撑问题分析、功能迭代及效果验证，提升跨团队协同与产品优化效率。',
    tags: ['用户反馈', '运营中枢', '数据闭环'],
    image: assetUrl('project-05.webp'),
    accent: '#ff3526',
    category: '创作者与生产力平台',
    detailMedia: Array.from({ length: 16 }, (_, index) => assetUrl(`project-05/${index + 1}.mp4`)),
  },
  {
    index: '07',
    title: '支撑活动搭投\n0代码活动快速搭建',
    meta: 'SOUL APP · HARMONYOS',
    description: '构建 0 代码活动搭投平台，支持 H5 页面可视化搭建、组件化配置与快速发布，实现活动资产标准化管理。缩短活动上线周期，提升运营自主性与投放效率。',
    tags: ['0代码', '活动搭建', '组件化'],
    image: assetUrl('project-06.webp'),
    accent: '#ff3526',
    category: '创作者与生产力平台',
    detailMedia: Array.from({ length: 16 }, (_, index) => assetUrl(`project-06/${index + 1}.mp4`)),
  },
  createProjectTemplate('08', {
    title: 'Portfolio AI Agent\n作品集智能导览助手',
    meta: 'PERSONAL PROJECT · 2026',
    description: '当个人网站内容不断增加，我尝试用 AI Agent 降低浏览者理解作品集的成本',
    tags: ['AI Agent', '作品集导览', '知识库设计', '对话体验', 'AI Coding'],
    image: assetUrl('project-08/cover.webp'),
    detailTitle: 'Portfolio AI Agent\n作品集智能导览助手',
    detailSubtitle: '当个人网站内容不断增加，我尝试用 AI Agent 降低浏览者理解作品集的成本',
    assistantBrief: 'AI Portfolio Agent 是一个基于本地项目知识库构建的作品集智能讲解助手，用来帮助面试官快速理解左胤的项目经历、设计判断、AI 产品思考和岗位匹配度。项目通过 Codex 辅助完成，包含助手入口设计、推荐问题、继续追问、相关项目证据、结构化回答、底部快捷入口和本地知识库 mock 逻辑，体现了 AI Agent 产品体验设计、AI UX 和 AI Coding 原型搭建能力。',
    category: 'AI产品体验设计',
    detailMedia: Array.from({ length: 14 }, (_, index) => assetUrl(`project-08/${String(index + 1).padStart(2, '0')}.webp`)),
  }),
]
