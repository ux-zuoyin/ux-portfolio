import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check, Copy, LoaderCircle, MessageCircle, Plus, Send, Sparkles, X } from 'lucide-react'
import { portfolioKnowledge } from '../data/portfolioKnowledge.js'

const openingMessage = {
  role: 'agent',
  text: [
    '## 你好，我是沙丁鱼',
    '',
    '你好，我是沙丁鱼，左胤的 AI 作品集助手。我的名字来自他的设计工作花名。',
    '',
    '你可以问我关于他的项目经历、AI 产品思考、B 端设计经验、作品集阅读路径和岗位匹配度的问题。我会基于本地项目资料，用更适合面试阅读的方式帮你快速梳理重点。',
  ].join('\n'),
}

const agentResponseGuidelines = [
  '所有回答使用 Markdown。',
  '回答以二级标题开头，不输出代码块或 JSON。',
  '项目分析优先包含：一句话总结、核心问题、设计判断、项目价值。',
  '正文使用短段落和克制分割线，重要结论用加粗表达。',
  '只有在欢迎语和自我介绍场景中使用“沙丁鱼”这个人格名称；不要自称左胤本人。',
].join('\n')

function normalizeText(value) {
  return value.toLowerCase().replace(/\s+/g, '')
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)))
}

function findRelevantProjects(question) {
  const normalizedQuestion = normalizeText(question)
  return portfolioKnowledge.projects.filter((project) => {
    const corpus = normalizeText([
      project.title,
      project.category,
      project.summary,
      project.background,
      project.conflict,
      project.designJudgment,
      project.solution,
      project.value,
      ...project.keywords,
    ].join(' '))
    return project.keywords.some((keyword) => normalizedQuestion.includes(normalizeText(keyword)))
      || normalizedQuestion.includes(normalizeText(project.category))
      || corpus.includes(normalizedQuestion)
  })
}

function formatProjectAnswer(project) {
  return [
    '## 一句话总结',
    '',
    `${project.summary}`,
    '',
    '---',
    '',
    '## 核心问题',
    '',
    project.conflict || project.background,
    '',
    project.background && project.conflict ? `具体背景是：${project.background}` : '',
    '',
    '---',
    '',
    '## 设计判断',
    '',
    `**核心判断：**${project.designJudgment || '需要从业务目标和用户行为出发，建立更稳定的产品机制，而不是只解决界面层问题。'}`,
    '',
    project.solution ? `最终方案是：${project.solution}` : '',
    '',
    '---',
    '',
    '## 项目价值',
    '',
    project.value || '这个项目的价值在于把复杂业务问题转化为可执行、可复用、可持续演进的体验系统。',
  ].filter(Boolean).join('\n')
}

function formatRelatedEvidenceSection(projects) {
  const uniqueProjects = [...new Set(projects)].filter(Boolean)
  if (uniqueProjects.length === 0) return []

  return [
    '',
    '---',
    '',
    '## 相关项目证据',
    '',
    uniqueProjects.map((project) => `- ${project}`).join('\n'),
  ]
}

function getFollowUpSuggestions(question) {
  const normalizedQuestion = normalizeText(question)
  const isBEndTopic = includesAny(normalizedQuestion, ['B 端', 'B端', '后台', '复杂系统', '复杂后台', '用户反馈', '运营中枢', '活动搭建', '活动搭投', '项目深度'])
  const isAITopic = includesAny(normalizedQuestion, ['AI', 'AIGC', 'Agent', '智能体', 'Codex', '标签', '灵魂记忆', 'Memory', 'Persona', 'Social Match', 'AI UX', 'AI产品', 'AI 产品'])
  const isRoleTopic = includesAny(normalizedQuestion, ['岗位', '职位', '匹配', '适合', '胜任'])
  const isCommercialTopic = includesAny(normalizedQuestion, ['商业化', '广告', '增长', '转化'])
  const isContentToolTopic = includesAny(normalizedQuestion, ['内容工具', '内容生产', '创作者工具', '发布器', 'NAWA', '编辑器'])

  if (isBEndTopic) {
    return [
      { label: '看具体 B 端项目', question: '请介绍一个最能体现 B 端复杂系统能力的项目。' },
      { label: '他在项目里负责什么？', question: '左胤在这些 B 端项目里具体负责什么？' },
      { label: '这个能力适合什么岗位？', question: '他的 B 端和复杂系统能力适合什么岗位？' },
    ]
  }

  if (isAITopic) {
    return [
      { label: '看 AI 标签项目', question: 'AI 标签管理与灵魂记忆空间这个项目具体解决了什么问题？' },
      { label: '看 AIGC 发布器', question: 'AIGC 发布器的设计判断是什么？' },
      { label: '看 AI Agent Demo', question: '这个 AI 作品集助手 Demo 能证明什么能力？' },
    ]
  }

  if (isRoleTopic) {
    return [
      { label: '看 AI 能力证据', question: '左胤的 AI 产品设计能力体现在哪里？有哪些项目可以证明？' },
      { label: '看 B 端深度', question: '我想了解下他 B 端设计经验以及项目深度如何。' },
      { label: '推荐阅读路径', question: '我应该按什么顺序看这个作品集？' },
    ]
  }

  if (isCommercialTopic) {
    return [
      { label: '看商业化项目', question: '广告商业化项目如何平衡体验和转化？' },
      { label: '看设计取舍', question: '左胤在商业化项目中有哪些关键设计判断和方案取舍？' },
      { label: '看岗位匹配', question: '商业化设计经验能支撑他匹配什么类型岗位？' },
    ]
  }

  if (isContentToolTopic) {
    return [
      { label: '看 AIGC 发布器', question: 'AIGC 发布器的设计判断是什么？' },
      { label: '看 NAWA 编辑器', question: 'NAWA 编辑器能体现哪些内容生产工具设计能力？' },
      { label: '看完整链路', question: '左胤如何设计生成、编辑、预览和发布的完整工作流？' },
    ]
  }

  return [
    { label: '3 分钟了解', question: '请用面试官视角，用 3 分钟帮我快速了解左胤的背景、核心能力和最值得看的项目。' },
    { label: '看 AI 能力', question: '左胤的 AI 产品设计能力体现在哪里？有哪些项目可以证明？' },
    { label: '看 B 端深度', question: '我想了解下他 B 端设计经验以及项目深度如何。' },
  ]
}

function formatAgentCapabilityAnswer() {
  const capability = portfolioKnowledge.agentCapability
  return [
    '## 一句话总结',
    '',
    `会。${capability.summary}`,
    '',
    '---',
    '',
    '## 这个 Demo 能证明什么',
    '',
    `${capability.proof}它包含 ${capability.includes.join('、')}。`,
    '',
    '---',
    '',
    '## 他的 Agent 设计能力体现在哪里',
    '',
    capability.designFocus,
    '',
    '---',
    '',
    '## 能力边界',
    '',
    capability.boundary,
    ...formatRelatedEvidenceSection(['AI 作品集助手 Demo', 'AI 标签管理与灵魂记忆空间', 'AIGC 发布器']),
  ].join('\n')
}

function formatAssistantIntroAnswer() {
  return [
    '## 我是谁',
    '',
    '我是沙丁鱼，左胤的 AI 作品集助手。我的名字来自他的设计工作花名。我会基于他的真实项目资料，帮助你快速理解他的项目经历、设计判断和 AI 产品思考。',
    '',
    '---',
    '',
    '## 我能做什么',
    '',
    '我可以帮助你快速理解左胤的项目经历、设计决策、AI 产品思考和岗位匹配度。',
    '',
    '---',
    '',
    '## 这个 Demo 的意义',
    '',
    '这个助手由左胤使用 Codex 辅助搭建，用来验证 AI Agent 如何降低作品集阅读和面试沟通成本。它不是完整商业级 Agent 平台，而是一个面向作品集场景的可交互原型。',
  ].join('\n')
}

function formatBEndCapabilityAnswer() {
  return [
    '## 结论',
    '',
    '左胤具备较完整的 B 端 / 后台产品设计经验，不只是做页面 UI，而是参与过多角色流程、状态流转、配置效率、数据闭环和运营协作类问题的设计。',
    '',
    '---',
    '',
    '## 经验覆盖面',
    '',
    '他的 B 端经验主要集中在运营后台、内容生产工具、活动配置平台和用户反馈处理系统等方向。代表项目包括用户反馈运营中枢、0 代码活动搭建平台、AIGC 发布器和广告商业化相关后台。',
    '',
    '---',
    '',
    '## 项目深度',
    '',
    '这些项目的深度不在于页面数量，而在于是否处理过复杂业务规则。比如多角色协作、工单状态流转、配置发布链路、异常处理、数据回流和运营效率提升，这些都是 B 端设计里比较关键的问题。',
    '',
    '---',
    '',
    '## 能力判断',
    '',
    '如果从岗位匹配角度看，他比较适合 AI 产品后台、运营平台、内容生产工具、配置型系统、CMS / 工单类系统等方向。优势是能把复杂流程拆成清晰的信息架构和可执行任务链路。',
    ...formatRelatedEvidenceSection(['用户反馈运营中枢', '0 代码活动搭建平台', 'AIGC 发布器', '广告商业化相关后台']),
  ].join('\n')
}

function formatRoleFitAnswer(question) {
  const normalizedQuestion = normalizeText(question)
  const isBEndRole = includesAny(normalizedQuestion, ['B 端', 'B端', '后台', '平台', '复杂系统'])
  const isAIRole = includesAny(normalizedQuestion, ['AI', 'AIGC', 'Agent', '智能'])
  const roleLabel = isBEndRole ? 'B 端 / 复杂系统设计岗位' : isAIRole ? 'AI 产品体验设计岗位' : '偏 AI 产品体验、复杂 B 端和平台型工具的岗位'
  const evidenceProjects = isBEndRole
    ? ['B 端后台项目', '用户反馈运营中枢', '0 代码活动搭建', 'NAWA 编辑器']
    : isAIRole
      ? ['AI 标签管理与灵魂记忆空间', 'AIGC 发布器', 'AI 作品集助手 Demo']
      : ['AI 标签管理与灵魂记忆空间', 'B 端后台项目', 'AIGC 发布器', '广告商业化项目']

  return [
    '## 岗位匹配判断',
    '',
    `从作品集证据看，左胤比较适合${roleLabel}。他的优势不只是单点界面设计，而是能把业务目标、角色流程、数据机制和用户体验组织成可落地的产品方案。`,
    '',
    '---',
    '',
    '## 岗位要求',
    '',
    isBEndRole
      ? '这类岗位通常需要设计师能理解复杂业务流程，处理多角色协作、权限、状态流转、配置规则、效率提升和数据闭环。'
      : '这类岗位通常需要设计师能理解 AI 能力边界，把 AI 能力转译成用户可理解、可控制、能获得确定反馈的产品体验。',
    '',
    '---',
    '',
    '## 项目证据',
    '',
    isBEndRole
      ? '对应证据包括 B 端后台项目、用户反馈运营中枢、0 代码活动搭建和 NAWA 编辑器。这些项目能体现他对后台流程、平台化能力和复杂协作链路的设计经验。'
      : '对应证据包括 AI 标签管理与灵魂记忆空间、AIGC 发布器，以及这个用 Codex 辅助搭建的 AI 作品集助手 Demo。这些项目分别覆盖用户理解、AI 创作辅助和 Agent 原型验证。',
    '',
    '---',
    '',
    '## 能力优势',
    '',
    '他的优势在于能从业务问题出发，先判断机制和链路，再落到信息结构、交互流程和关键界面，而不是只做表层视觉包装。',
    '',
    '---',
    '',
    '## 风险边界',
    '',
    '需要说明的是，当前作品集展示的是项目经验和原型能力，不等同于已经完整负责过所有类型的商业级平台或 Agent 系统。更合理的判断是：他适合负责复杂产品体验设计和 Agent 原型验证，并能与产品、研发、算法和运营协作推进落地。',
    ...formatRelatedEvidenceSection(evidenceProjects),
  ].join('\n')
}

function formatPositioningAnswer() {
  const { positioning, readingPath } = portfolioKnowledge.interviewKnowledge
  return [
    '## 一句话总结',
    '',
    `${positioning.summary}他的核心能力集中在 ${positioning.coreAbilities.join('、')}。`,
    '',
    '---',
    '',
    '## 适合方向',
    '',
    `比较适合 ${positioning.suitableRoles.join('、')} 等方向。判断重点不是“会不会画界面”，而是他能否把 AI 能力、业务流程和用户体验组织成可落地方案。`,
    '',
    '---',
    '',
    '## 最值得先看的项目',
    '',
    readingPath.map((item) => `**${item.project}：**${item.reason}`).join('\n\n'),
    '',
    '---',
    '',
    '## 能力边界',
    '',
    '需要准确说明的是，他的优势是 AI 产品体验设计、复杂系统拆解和原型验证，不应夸大为大模型算法或完整后端架构能力。',
    ...formatRelatedEvidenceSection(['AI 标签管理与灵魂记忆空间', 'AIGC 发布器', 'AI 作品集助手 Demo', 'B 端后台 / 活动搭投 / 用户反馈运营中枢']),
  ].join('\n')
}

function formatReadingPathAnswer() {
  const { readingPath } = portfolioKnowledge.interviewKnowledge
  return [
    '## 阅读路径',
    '',
    '如果面试官时间有限，建议先看三类项目，这样能最快判断左胤的 AI 产品思考、复杂系统能力和内容工具经验。',
    '',
    '---',
    '',
    '## 优先项目',
    '',
    readingPath.map((item, index) => `**${index + 1}. ${item.project}：**${item.reason}`).join('\n\n'),
    '',
    '---',
    '',
    '## 判断方式',
    '',
    '不要只看页面数量，可以重点看他如何解释项目背景、核心矛盾、设计取舍，以及方案为什么最终这样落地。',
  ].join('\n')
}

function formatCapabilityMatrixAnswer() {
  const { capabilityMatrix } = portfolioKnowledge.interviewKnowledge
  const evidenceProjects = capabilityMatrix.flatMap((item) => item.evidence)
  return [
    '## 核心优势',
    '',
    '左胤的优势可以概括为：AI 产品体验、复杂系统设计、内容生产工具、社交产品理解、商业化设计和 AI Coding 原型能力。',
    '',
    '---',
    '',
    '## 能力证据',
    '',
    capabilityMatrix.map((item) => `**${item.capability}：**${item.evidence.join('、')}`).join('\n\n'),
    '',
    '---',
    '',
    '## 面试判断',
    '',
    '如果岗位需要设计师能从业务问题出发，拆解场景、组织信息架构、定义关键流程并推动原型落地，这组项目证据是比较匹配的。',
    ...formatRelatedEvidenceSection(evidenceProjects),
  ].join('\n')
}

function formatProjectDepthAnswer() {
  const { depthCriteria } = portfolioKnowledge.interviewKnowledge
  return [
    '## 项目深度怎么判断',
    '',
    '左胤项目的深度不应该只看页面数量，而要看是否处理过真实业务里的角色、流程、状态、配置和数据问题。',
    '',
    '---',
    '',
    '## 关键判断标准',
    '',
    depthCriteria.map((item) => `- ${item}`).join('\n'),
    '',
    '---',
    '',
    '## 对应项目',
    '',
    'B 端后台、用户反馈运营中枢、0 代码活动搭投、AIGC 发布器后台链路和 AI 标签体系，都能体现这种复杂度。尤其是流程状态、配置效率、数据闭环和设计取舍，是判断项目深度的重点。',
    ...formatRelatedEvidenceSection(['B 端后台', '用户反馈运营中枢', '0 代码活动搭投', 'AIGC 发布器后台链路', 'AI 标签体系']),
  ].join('\n')
}

function formatDesignDecisionAnswer() {
  const { designDecisions } = portfolioKnowledge.interviewKnowledge
  return [
    '## 关键设计判断',
    '',
    '左胤的项目里比较值得看的不是单个界面，而是他如何在业务目标、用户成本和系统可持续性之间做取舍。',
    '',
    '---',
    '',
    '## 代表取舍',
    '',
    designDecisions.map((item) => `- ${item}`).join('\n'),
    '',
    '---',
    '',
    '## 面试看点',
    '',
    '这些判断能体现他不是只做方案表现，而是在考虑系统是否可解释、可复用、可落地，以及用户是否真的能理解和持续使用。',
  ].join('\n')
}

function formatResponsibilityAnswer() {
  const { responsibility, responsibilityBoundary } = portfolioKnowledge.interviewKnowledge
  return [
    '## 职责范围',
    '',
    '从作品集资料看，左胤在团队项目中更准确的表达是：负责交互设计和体验方案推动，并与产品、研发协作落地。',
    '',
    '---',
    '',
    '## 具体工作',
    '',
    responsibility.map((item) => `- ${item}`).join('\n'),
    '',
    '---',
    '',
    '## 表达边界',
    '',
    responsibilityBoundary,
  ].join('\n')
}

function formatCapabilityBoundaryAnswer() {
  const { capabilityBoundary } = portfolioKnowledge.interviewKnowledge
  return [
    '## 能力边界',
    '',
    '回答左胤能力相关问题时，需要把产品体验能力和工程能力区分清楚，避免过度包装。',
    '',
    '---',
    '',
    '## 准确表达',
    '',
    capabilityBoundary.map((item) => `- ${item}`).join('\n'),
  ].join('\n')
}

function formatMissingKnowledgeAnswer() {
  return [
    '## 资料边界',
    '',
    '当前作品集资料中没有明确这部分信息，我可以基于已有资料说明项目背景、设计判断和可补充方向。',
    '',
    '---',
    '',
    '## 可以继续了解',
    '',
    '如果你关注面试判断，我可以改为说明这个项目的背景、核心设计判断、能力证据，或者哪些信息适合在面试中继续向左胤追问。',
  ].join('\n')
}

function isMissingKnowledgeQuestion(question) {
  const normalizedQuestion = normalizeText(question)
  const asksSpecificData = includesAny(normalizedQuestion, [
    '具体数据',
    '数据结果',
    '真实数据',
    '真实增长',
    '增长指标',
    '转化率',
    '留存率',
    '点击率',
    'roi',
    'dau',
    'mau',
    'uv',
    'pv',
    '提升了多少',
    '增长了多少',
    '具体提升',
  ])
  const asksEngineeringDetail = includesAny(normalizedQuestion, [
    '详细研发实现',
    '研发实现',
    '技术实现',
    '后端实现',
    '接口设计',
    '数据库',
    '数据表',
    '系统架构',
    '代码实现',
    '算法实现',
  ])
  const asksModelTraining = includesAny(normalizedQuestion, [
    '模型训练',
    '训练模型',
    '微调模型',
    '模型微调',
    '大模型训练',
    '向量数据库',
    'embedding',
    'rag实现',
  ])
  const asksInternalDocument = includesAny(normalizedQuestion, [
    '内部prd',
    'prd原文',
    '需求文档',
    '内部文档',
    '项目文档',
    '详细prd',
  ])
  const asksUnavailableDetails = includesAny(normalizedQuestion, [
    '完整方案细节',
    '全部页面',
    '每个页面',
    '埋点方案',
    '实验数据',
    'ab实验',
    'a/b实验',
    '上线结果',
    '复盘数据',
  ])

  return asksSpecificData || asksEngineeringDetail || asksModelTraining || asksInternalDocument || asksUnavailableDetails
}

function formatEvidenceMapAnswer(type) {
  const map = portfolioKnowledge.interviewKnowledge.evidenceMap
  const labels = {
    commercialization: '商业化设计能力',
    contentTools: '内容生产工具设计能力',
    socialProduct: '社交产品理解',
    aiAgent: 'AI Agent 能力',
  }
  const projects = map[type] || []

  return [
    '## 能力判断',
    '',
    `如果从${labels[type]}来看，可以优先看 ${projects.join('、')}。`,
    '',
    '---',
    '',
    '## 项目证据',
    '',
    type === 'commercialization'
      ? '广告商业化项目能体现他在商业目标、用户体验、配置效率和数据效果之间做平衡的经验。重点不是简单加广告位，而是理解商业内容如何进入社区场景。'
      : type === 'contentTools'
        ? 'AIGC 发布器体现生成、编辑、预览、发布的完整链路；NAWA 编辑器体现创作者工具和复杂资产管理经验。'
        : type === 'socialProduct'
          ? 'Soul AI 标签和灵魂记忆空间体现他对兴趣社交、用户画像、长期记忆和匹配效率的理解。'
          : 'AI 作品集助手 Demo 和 Codex 原型搭建过程体现他能把 Agent 体验想法快速做成交互原型。',
    '',
    '---',
    '',
    '## 能力边界',
    '',
    '这里证明的是产品体验、流程拆解和原型验证能力，不应夸大为完整商业平台或底层工程能力。',
    ...formatRelatedEvidenceSection(projects),
  ].join('\n')
}

function formatAICapabilityEvaluationAnswer() {
  return [
    '## 结论',
    '',
    '左胤具备 AI 产品体验设计、AI UX、AIGC 工具和 AI Agent 原型验证相关能力。更准确地说，他的优势在于把 AI 能力放进具体产品场景，降低用户理解、表达、决策和操作成本。',
    '',
    '---',
    '',
    '## 项目证据',
    '',
    '**AI 标签管理与灵魂记忆空间**体现了他对 AI Memory、Persona、Social Match 和用户画像体系的理解。',
    '',
    '**AIGC 发布器**体现了他对内容生成、编辑、预览、发布完整链路的设计经验。',
    '',
    '**AI 作品集助手 Demo**体现了他使用 Codex 辅助搭建本地知识库型 Agent 原型的能力。',
    '',
    '---',
    '',
    '## 设计理解',
    '',
    '他理解的 AI 产品不是把 AI 功能塞进界面，而是让 AI 在具体任务里提供可理解、可信任、可控制、可修正的辅助。Agent 体验也不是单纯聊天窗口，而是围绕明确任务场景设计入口、推荐问题、回答结构和用户控制感。',
    '',
    '---',
    '',
    '## 能力边界',
    '',
    '当前资料能证明的是 AI 产品体验设计、AI Agent 原型设计、AIGC 工具体验、AI Coding 协作和复杂场景拆解能力。不能夸大为大模型训练、模型微调、向量数据库工程或完整商业级 Agent 平台开发能力。',
    ...formatRelatedEvidenceSection(['AI 标签管理与灵魂记忆空间', 'AIGC 发布器', 'AI 作品集助手 Demo']),
  ].join('\n')
}

function formatAIMemorySystemAnswer() {
  return [
    '## 一句话总结',
    '',
    'AI Memory → Persona → Social Match 是左胤在 Soul 项目中对 AI 社交产品价值的理解：先通过长期行为沉淀用户记忆，再形成更稳定的人格画像，最后提升社交匹配和关系建立效率。',
    '',
    '---',
    '',
    '## AI Memory',
    '',
    'AI Memory 指通过长期行为数据沉淀用户兴趣、偏好和表达特征，而不是依赖用户主动填写资料。它解决的是兴趣社交里“用户不愿主动表达，但平台需要理解用户”的矛盾。',
    '',
    '---',
    '',
    '## Persona',
    '',
    'Persona 是基于长期记忆形成更稳定、更可信的用户画像，让平台更理解用户是谁。这里的重点不是做一个酷炫的数字分身，而是让画像能被解释、复用，并服务后续产品链路。',
    '',
    '---',
    '',
    '## Social Match',
    '',
    'Social Match 是利用画像提升社交推荐和关系建立效率，降低兴趣社交中的灵魂连接成本。最终选择标签作为外显方式，是因为标签轻量、可解释，也能和站内原有引力签体系融合。',
  ].join('\n')
}

function formatAIEngineeringBoundaryAnswer() {
  return [
    '## 谨慎判断',
    '',
    '从当前作品集资料看，左胤的核心优势不是大模型工程，而是 AI 产品体验设计、Agent 原型搭建、AI Coding 协作和复杂场景拆解。',
    '',
    '---',
    '',
    '## 已经体现的能力',
    '',
    '可以说他具备 AI 产品体验设计、AIGC 工具体验、AI Agent 原型设计和本地知识库型 Demo 搭建能力。当前 AI 作品集助手就是用 Codex 辅助完成的交互原型。',
    '',
    '---',
    '',
    '## 不能夸大的部分',
    '',
    '目前资料不能证明他精通大模型训练、模型微调、向量数据库工程或完整后端架构。当前助手也是本地知识库 Demo，不调用外部 API，不是完整商业级 Agent 平台。',
    ...formatRelatedEvidenceSection(['AI 作品集助手 Demo', 'AI 标签管理与灵魂记忆空间', 'AIGC 发布器']),
  ].join('\n')
}

function findProjectByKeyword(keywords) {
  return portfolioKnowledge.projects.find((project) => {
    const corpus = normalizeText([project.title, project.summary, ...project.keywords].join(' '))
    return keywords.some((keyword) => corpus.includes(normalizeText(keyword)))
  })
}

function findAIKnowledge(question) {
  const normalizedQuestion = normalizeText(question)
  const knowledge = portfolioKnowledge.aiKnowledgeBase

  if (includesAny(normalizedQuestion, ['边界', '技术深度', '大模型', '模型训练', '微调', '向量数据库', '后端架构', '工程能力', '精通'])) {
    return knowledge.find((item) => item.id === 'ai-capability-boundary')
  }

  if (includesAny(normalizedQuestion, ['memory', 'persona', 'socialmatch', '社交匹配', '灵魂连接', '用户画像', '兴趣匹配', 'ai记忆', 'ai memory'])) {
    return knowledge.find((item) => item.id === 'ai-memory-persona-social-match')
  }

  if (includesAny(normalizedQuestion, ['aigc', '发布器', '内容生成', '内容生产', '生成', '创作者', '写作'])) {
    return knowledge.find((item) => item.id === 'aigc-product-design')
  }

  if (includesAny(normalizedQuestion, ['agent', '智能体', 'codex', '作品集助手', '这个助手', 'aicoding'])) {
    return knowledge.find((item) => item.id === 'ai-agent-design-capability')
  }

  if (includesAny(normalizedQuestion, ['aiux', '体验原则', '可信任', '可控制', '可理解', '可修正', '解释', '信任'])) {
    return knowledge.find((item) => item.id === 'ai-ux-principles')
  }

  if (includesAny(normalizedQuestion, ['ai产品', 'ai 产品', 'ai设计', 'ai 设计', '人工智能产品', 'ai能力', 'ai 能力', '岗位匹配'])) {
    return knowledge.find((item) => item.id === 'ai-product-design-thinking')
  }

  return null
}

function formatAIKnowledgeAnswer(item) {
  return [
    '## 一句话总结',
    '',
    item.summary,
    '',
    '---',
    '',
    '## 设计理解',
    '',
    item.keyPoints.slice(0, 3).join(' '),
    '',
    '---',
    '',
    '## 项目关联',
    '',
    `这部分能力主要和 ${item.relatedProjects.join('、')} 相关。`,
    '',
    item.answerAngle,
    '',
    '---',
    '',
    '## 能力边界',
    '',
    '需要准确说明的是，这些证据体现的是 AI 产品体验设计、Agent 原型设计、AIGC 工具设计和 AI Coding 协作能力，不应夸大为大模型训练、模型微调或完整商业级 Agent 平台开发经验。',
    ...formatRelatedEvidenceSection(item.relatedProjects),
  ].join('\n')
}

function buildAgentReply(question) {
  void agentResponseGuidelines
  const normalizedQuestion = normalizeText(question)
  const relevantProjects = findRelevantProjects(question)
  const isBEndTopic = includesAny(normalizedQuestion, ['B 端', 'B端', '后台', '平台型', '平台产品', '复杂后台', '复杂系统', '用户反馈', '运营中枢', '活动搭建', '活动搭投'])
  const isCapabilityEvaluationQuestion = includesAny(normalizedQuestion, ['经验怎么样', '经验如何', '项目深度', '深度如何', '能不能', '能否', '是否', '适合', '有没有', '胜任', '扎实', '能力怎么样', '能力如何'])
  const isProjectIntroQuestion = includesAny(normalizedQuestion, ['解决什么', '解决了什么', '设计判断', '介绍', '是什么', '项目背景', '项目价值', '核心问题'])
  const isWhoOrPositioningQuestion = includesAny(normalizedQuestion, ['左胤是谁', '他是谁', '他的背景', '左胤背景', '核心能力', '核心优势', '个人定位', '3分钟', '三分钟', '快速了解'])
  const isCapabilityMatrixQuestion = includesAny(normalizedQuestion, ['能力矩阵', '项目证据', '哪些项目能证明', '什么项目能证明', '证明他的能力', '能力证据'])
  const isReadingPathQuestion = includesAny(normalizedQuestion, ['先看什么', '先看哪些', '阅读路径', '怎么看', '看什么项目', '最值得看', '按什么顺序'])
  const isDepthQuestion = includesAny(normalizedQuestion, ['项目深度', '深度如何', '深度怎么样', '复杂度', '页面数量', '项目够深', '项目扎实'])
  const isDesignDecisionQuestion = includesAny(normalizedQuestion, ['设计取舍', '方案取舍', '关键设计判断', '设计判断', '为什么这么做', '方案对比'])
  const isResponsibilityQuestion = includesAny(normalizedQuestion, ['职责', '负责什么', '参与什么', '协作', '落地', '验收', '产出'])
  const isBoundaryQuestion = includesAny(normalizedQuestion, ['能力边界', '边界', '夸大', '算法工程师', '大模型工程', '模型训练', '向量数据库', '后端架构', '数据结果'])
  const isAIEngineeringQuestion = includesAny(normalizedQuestion, ['做大模型', '训练模型', '模型训练', '微调模型', '模型微调', '向量数据库', '大模型工程', '懂不懂向量', '会不会训练'])
  const isAIMemorySystemQuestion = includesAny(normalizedQuestion, ['ai memory是什么', 'memory是什么', 'persona是什么', 'socialmatch是什么', 'social match是什么', 'soul项目的ai价值', 'soul 的ai价值', 'ai memory', 'persona', 'socialmatch', 'social match'])
  const isAICapabilityQuestion = (
    includesAny(normalizedQuestion, ['懂ai产品', 'ai产品经验', 'ai 产品经验', 'ai产品设计岗位', 'ai 产品设计岗位', 'aiux岗位', 'ai ux岗位', '有什么ai产品', 'ai能力体现', 'ai 能力体现'])
    || (includesAny(normalizedQuestion, ['会', '懂', '做过']) && includesAny(normalizedQuestion, ['agent设计', 'agent产品', 'aiagent', 'ai agent']))
    || (includesAny(normalizedQuestion, ['适合']) && includesAny(normalizedQuestion, ['ai产品', 'ai 产品', 'aiux', 'ai ux']))
  )
  const isRoleFitQuestion = (
    includesAny(normalizedQuestion, ['岗位', '职位', '招聘', '匹配'])
    || (normalizedQuestion.includes('适合') && includesAny(normalizedQuestion, ['岗位', '职位', '团队']))
  )
  const isAssistantIntroQuestion = (
    normalizedQuestion.includes('你是谁')
    || normalizedQuestion.includes('你是什么')
    || normalizedQuestion.includes('你叫什么')
    || normalizedQuestion.includes('助手叫什么')
    || normalizedQuestion.includes('这个助手叫什么')
    || normalizedQuestion.includes('助手是做什么')
    || normalizedQuestion.includes('这个助手是做什么')
    || normalizedQuestion.includes('你是左胤做的吗')
  )
  const isAgentCapabilityQuestion = (
    normalizedQuestion.includes('agent')
    || normalizedQuestion.includes('智能体')
    || normalizedQuestion.includes('助手是他做的吗')
    || normalizedQuestion.includes('作品集助手')
    || normalizedQuestion.includes('这个助手')
    || normalizedQuestion.includes('codex')
    || normalizedQuestion.includes('aicoding')
    || normalizedQuestion.includes('ai产品设计能力')
  )

  if (normalizedQuestion.includes('联系') || normalizedQuestion.includes('微信') || normalizedQuestion.includes('电话') || normalizedQuestion.includes('手机') || normalizedQuestion.includes('邮箱')) {
    return [
      '## 联系方式',
      '',
      '- 微信：Sardine0717',
      '- 手机号码：186 2191 8554',
      '- 邮箱地址：1641043413@qq.com',
      '',
      '---',
      '',
      '## 期待沟通',
      '',
      '如果你对左胤的 AI 产品设计、复杂系统设计或岗位匹配度感兴趣，期待您的联系。',
    ].join('\n')
  }

  if (isAssistantIntroQuestion) {
    return formatAssistantIntroAnswer()
  }

  if (isMissingKnowledgeQuestion(question)) {
    return formatMissingKnowledgeAnswer()
  }

  if (isAIEngineeringQuestion) {
    return formatAIEngineeringBoundaryAnswer()
  }

  if (isAIMemorySystemQuestion) {
    return formatAIMemorySystemAnswer()
  }

  if (isAICapabilityQuestion) {
    return formatAICapabilityEvaluationAnswer()
  }

  if (isAgentCapabilityQuestion) {
    return formatAgentCapabilityAnswer()
  }

  if (isWhoOrPositioningQuestion) {
    return formatPositioningAnswer()
  }

  if (isCapabilityMatrixQuestion) {
    return formatCapabilityMatrixAnswer()
  }

  if (isReadingPathQuestion) {
    return formatReadingPathAnswer()
  }

  if (isDepthQuestion && !isBEndTopic) {
    return formatProjectDepthAnswer()
  }

  if (isDesignDecisionQuestion && !isProjectIntroQuestion) {
    return formatDesignDecisionAnswer()
  }

  if (isResponsibilityQuestion) {
    return formatResponsibilityAnswer()
  }

  if (isBoundaryQuestion) {
    return formatCapabilityBoundaryAnswer()
  }

  if (includesAny(normalizedQuestion, ['商业化能力', '商业化设计', '商业化经验'])) {
    return formatEvidenceMapAnswer('commercialization')
  }

  if (includesAny(normalizedQuestion, ['内容生产工具', '内容工具', '创作者工具', '生产工具设计'])) {
    return formatEvidenceMapAnswer('contentTools')
  }

  if (includesAny(normalizedQuestion, ['社交产品理解', '社交产品', '兴趣社交', '社交理解'])) {
    return formatEvidenceMapAnswer('socialProduct')
  }

  if (isRoleFitQuestion) {
    return formatRoleFitAnswer(question)
  }

  if (isBEndTopic && isCapabilityEvaluationQuestion) {
    return formatBEndCapabilityAnswer()
  }

  const aiKnowledge = findAIKnowledge(question)
  if (aiKnowledge && !isProjectIntroQuestion) {
    return formatAIKnowledgeAnswer(aiKnowledge)
  }

  if (normalizedQuestion.includes('标签') || normalizedQuestion.includes('灵魂记忆') || normalizedQuestion.includes('引力签') || normalizedQuestion.includes('persona') || normalizedQuestion.includes('memory') || normalizedQuestion.includes('match')) {
    const project = findProjectByKeyword(['AI 标签', '灵魂记忆'])
    return formatProjectAnswer(project)
  }

  if (normalizedQuestion.includes('发布器') || normalizedQuestion.includes('aigc') || normalizedQuestion.includes('发帖') || normalizedQuestion.includes('内容创作')) {
    const project = findProjectByKeyword(['AIGC 发布器'])
    return formatProjectAnswer(project)
  }

  if (normalizedQuestion.includes('nawa') || normalizedQuestion.includes('编辑器') || normalizedQuestion.includes('3d') || normalizedQuestion.includes('资产')) {
    const project = findProjectByKeyword(['NAWA'])
    return formatProjectAnswer(project)
  }

  if (normalizedQuestion.includes('b端') || normalizedQuestion.includes('b 端') || normalizedQuestion.includes('后台') || normalizedQuestion.includes('工单') || normalizedQuestion.includes('活动搭建') || normalizedQuestion.includes('用户反馈')) {
    const project = findProjectByKeyword(['B 端后台'])
    return formatProjectAnswer(project)
  }

  if (normalizedQuestion.includes('复杂') || normalizedQuestion.includes('系统')) {
    return [
      '## 一句话总结',
      '',
      '最能体现复杂系统能力的项目包括 NAWA 编辑器、B 端后台项目、AI 标签管理与灵魂记忆空间。',
      '',
      '---',
      '',
      '## 核心问题',
      '',
      '这些项目都不是单页面设计，而是涉及多角色、多流程、多状态和长期数据沉淀。难点在于让复杂业务可以被稳定理解、配置和协作。',
      '',
      '---',
      '',
      '## 设计判断',
      '',
      '**核心判断：**复杂系统设计的重点不是堆功能，而是把角色边界、流程状态、数据闭环和异常处理设计清楚。',
      '',
      '---',
      '',
      '## 项目价值',
      '',
      '这类项目能体现他从业务机制到产品结构的抽象能力，也能体现跨团队推动复杂项目落地的经验。',
      ...formatRelatedEvidenceSection(['NAWA 编辑器', 'B 端后台项目', 'AI 标签管理与灵魂记忆空间']),
    ].join('\n')
  }

  if (normalizedQuestion.includes('商业') || normalizedQuestion.includes('增长') || normalizedQuestion.includes('广告')) {
    const project = findProjectByKeyword(['广告商业化'])
    return formatProjectAnswer(project)
  }

  if (normalizedQuestion.includes('ai') || normalizedQuestion.includes('aigc') || normalizedQuestion.includes('智能')) {
    return formatAIKnowledgeAnswer(portfolioKnowledge.aiKnowledgeBase.find((item) => item.id === 'ai-product-design-thinking'))
  }

  if (relevantProjects.length > 0) {
    return relevantProjects.slice(0, 2).map(formatProjectAnswer).join('\n\n')
  }

  return [
    '## 作品集概览',
    '',
    `${portfolioKnowledge.profile.name} 是${portfolioKnowledge.profile.title}，${portfolioKnowledge.profile.experience}`,
    '',
    '---',
    '',
    '## 可以重点提问的方向',
    '',
    `他的主要方向包括 ${portfolioKnowledge.profile.focus.join('、')}。`,
    '',
    '你可以继续问我项目推荐、AI 经验、商业化经验、B 端后台经验或联系方式。',
  ].join('\n')
}

function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }
    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
  })
}

function getContactCopyValue(item) {
  const match = item.match(/^(微信|手机号码|邮箱地址)：(.+)$/)
  if (!match) return null
  return {
    label: match[1],
    value: match[2].trim(),
  }
}

function copyTextWithTextarea(value) {
  let eventCopied = false
  const textarea = document.createElement('textarea')
  const handleCopy = (event) => {
    event.clipboardData.setData('text/plain', value)
    event.preventDefault()
    eventCopied = true
  }

  try {
    textarea.value = value
    textarea.readOnly = true
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    textarea.style.opacity = '0'
    textarea.style.fontSize = '16px'
    document.body.appendChild(textarea)
    document.addEventListener('copy', handleCopy, { once: true })
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    eventCopied = document.execCommand('copy') || eventCopied
  } catch {
    eventCopied = false
  } finally {
    document.removeEventListener('copy', handleCopy)
    textarea.remove()
  }

  return eventCopied
}

async function copyTextToClipboard(value) {
  let clipboardWrite = null
  try {
    if (navigator.clipboard?.writeText) {
      clipboardWrite = navigator.clipboard.writeText(value)
    }
  } catch {
    clipboardWrite = null
  }

  const textareaCopied = copyTextWithTextarea(value)
  if (!clipboardWrite) return textareaCopied

  try {
    await clipboardWrite
    return true
  } catch {
    return textareaCopied
  }
}

function MarkdownMessage({ text, onCopyFeedback }) {
  const [copiedValue, setCopiedValue] = useState('')
  const blocks = []
  const lines = text.split('\n')
  let index = 0

  const copyContactValue = async (label, value) => {
    const copied = await copyTextToClipboard(value)
    if (copied) {
      setCopiedValue(value)
      window.setTimeout(() => setCopiedValue(''), 1200)
      onCopyFeedback?.(`${label}已复制：${value}`, true)
    } else {
      setCopiedValue('')
      onCopyFeedback?.(`复制失败，请手动复制：${value}`, false)
    }
  }

  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }

    if (line === '---') {
      blocks.push(<hr key={`hr-${index}`} />)
      index += 1
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(<h3 key={`h3-${index}`}>{renderInlineMarkdown(line.slice(4))}</h3>)
      index += 1
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${index}`}>{renderInlineMarkdown(line.slice(3))}</h2>)
      index += 1
      continue
    }

    if (line.startsWith('- ')) {
      const items = []
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2))
        index += 1
      }
      blocks.push(<ul key={`ul-${index}`}>{items.map((item, itemIndex) => {
        const contactCopy = getContactCopyValue(item)
        if (!contactCopy) {
          return <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
        }

        return <li key={`${item}-${itemIndex}`} className="agent-contact-copy-item">
          <span>{renderInlineMarkdown(item)}</span>
          <button
            type="button"
            aria-label={`复制${contactCopy.label}`}
            title={`复制${contactCopy.label}`}
            onPointerDown={(event) => {
              event.preventDefault()
              copyContactValue(contactCopy.label, contactCopy.value)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              copyContactValue(contactCopy.label, contactCopy.value)
            }}
          >
            {copiedValue === contactCopy.value ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </li>
      })}</ul>)
      continue
    }

    const paragraph = [line]
    index += 1
    while (
      index < lines.length
      && lines[index].trim()
      && lines[index].trim() !== '---'
      && !lines[index].trim().startsWith('## ')
      && !lines[index].trim().startsWith('### ')
      && !lines[index].trim().startsWith('- ')
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={`p-${index}`}>{renderInlineMarkdown(paragraph.join(' '))}</p>)
  }

  return <div className="agent-markdown">{blocks}</div>
}

function AgentChatPanel({ className = '', showHeader = true }) {
  const [messages, setMessages] = useState([openingMessage])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUsedSuggestions, setHasUsedSuggestions] = useState(false)
  const [copyToast, setCopyToast] = useState({ message: '', success: true, visible: false })
  const inputRef = useRef(null)
  const chatRef = useRef(null)
  const latestMessageRef = useRef(null)
  const copyToastTimerRef = useRef(null)

  const suggestions = useMemo(() => portfolioKnowledge.recommendedQuestions, [])
  const quickActions = useMemo(() => [
    {
      label: '一句话了解',
      question: '请用面试官视角，用 3 分钟帮我快速了解左胤的背景、核心能力和最值得看的项目。',
    },
    {
      label: 'AI能力',
      question: '左胤的 AI 产品设计能力体现在哪里？有哪些项目可以证明？',
    },
    {
      label: 'B端深度',
      question: '我想了解下他 B 端设计经验以及项目深度如何。',
    },
    {
      label: 'AI岗位匹配',
      question: '从 AI 产品设计 / AI UX 岗位角度看，左胤的匹配度如何？',
    },
    {
      label: '联系方式',
      question: '请告诉我左胤的联系方式。',
    },
  ], [])
  const shouldShowSuggestions = !hasUsedSuggestions && messages.length === 1 && !isLoading

  useEffect(() => {
    const chat = chatRef.current
    const latestMessage = latestMessageRef.current
    if (!chat || !latestMessage) return
    chat.scrollTo({ top: latestMessage.offsetTop - chat.offsetTop, behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`
  }, [inputValue])

  useEffect(() => () => {
    window.clearTimeout(copyToastTimerRef.current)
  }, [])

  const showCopyFeedback = (message, success) => {
    window.clearTimeout(copyToastTimerRef.current)
    setCopyToast({ message, success, visible: true })
    copyToastTimerRef.current = window.setTimeout(() => {
      setCopyToast((current) => ({ ...current, visible: false }))
    }, 2200)
  }

  const submitQuestion = (question) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isLoading) return

    setHasUsedSuggestions(true)
    setMessages((current) => [...current, { role: 'user', text: trimmedQuestion }])
    setInputValue('')
    setIsLoading(true)

    window.setTimeout(() => {
      setMessages((current) => [...current, {
        role: 'agent',
        text: buildAgentReply(trimmedQuestion),
        followUps: getFollowUpSuggestions(trimmedQuestion),
      }])
      setIsLoading(false)
      inputRef.current?.focus()
    }, 720)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    submitQuestion(inputValue)
  }

  const handleInputKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    submitQuestion(inputValue)
  }

  return <div className={`agent-panel ${className}`} aria-label="AI Portfolio Agent 聊天面板">
    <div
      className={`agent-copy-toast${copyToast.visible ? ' is-visible' : ''}${copyToast.success ? '' : ' is-error'}`}
      role="status"
      aria-live="polite"
    >
      {copyToast.success ? <Check size={14} /> : <X size={14} />}
      <span>{copyToast.message}</span>
    </div>

    {showHeader && <div className="agent-panel-header">
      <div>
        <span className="agent-status"><i /> Local knowledge online</span>
        <h3>作品集智能讲解助手</h3>
      </div>
      <Sparkles size={22} />
    </div>}

    <div className="agent-chat" aria-live="polite" ref={chatRef}>
      {messages.map((message, index) => <React.Fragment key={`${message.role}-${index}`}>
        <div
          className={`agent-message ${message.role === 'agent' ? 'assistant-message is-agent' : 'user-message is-user'}`}
          ref={index === messages.length - 1 ? latestMessageRef : null}
        >
          {message.role === 'agent' && <span className="agent-avatar" aria-hidden="true">
            S
          </span>}
          {message.role === 'agent'
            ? <div className="agent-response-stack">
              <MarkdownMessage text={message.text} onCopyFeedback={showCopyFeedback} />
              {message.followUps?.length > 0 && <div className="agent-follow-ups" aria-label="继续追问">
                <span>继续追问</span>
                {message.followUps.slice(0, 3).map((followUp) => <button
                  key={followUp.question}
                  type="button"
                  onClick={() => submitQuestion(followUp.question)}
                  disabled={isLoading}
                >
                  {followUp.question}
                </button>)}
              </div>}
            </div>
            : <p>{message.text}</p>}
        </div>
        {index === 0 && shouldShowSuggestions && <div className="agent-welcome-suggestions" aria-label="推荐问题">
          <span>你可以这样问：</span>
          <div className="agent-suggestion-list">
            {suggestions.map((question) => <button
              key={question}
              type="button"
              onClick={() => submitQuestion(question)}
            >
              <span>{question}</span>
              <i aria-hidden="true">→</i>
            </button>)}
          </div>
        </div>}
      </React.Fragment>)}
      {isLoading && <div className="agent-message assistant-message is-agent is-loading">
        <span className="agent-avatar" aria-hidden="true">S</span>
        <p><LoaderCircle size={16} /> 正在从本地知识库整理回答</p>
      </div>}
    </div>

    <div className="agent-quick-actions" aria-label="快捷提问入口">
      {quickActions.map((action) => <button
        key={action.label}
        type="button"
        onClick={() => submitQuestion(action.question)}
        disabled={isLoading}
      >
        {action.label}
      </button>)}
    </div>

    <form className="agent-input-row agent-composer" onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="询问 AI 经验、项目推荐或联系方式"
        aria-label="输入问题"
        rows={1}
      />
      <div className="agent-composer-toolbar" aria-label="输入工具栏">
        <span className="agent-composer-meta"><Plus size={15} /> 本地知识库</span>
        <button type="submit" disabled={isLoading || !inputValue.trim()} aria-label="发送问题">
          <Send size={16} />
          <span>发送</span>
        </button>
      </div>
    </form>
  </div>
}

export default function AIPortfolioAgent({ onOpen }) {
  return <section className="agent-entry-section" id="ai-agent" aria-labelledby="agent-entry-title">
    <div className="shell">
      <button type="button" className="agent-entry-card" onClick={onOpen}>
        <span className="agent-entry-icon" aria-hidden="true"><MessageCircle size={20} /></span>
        <span className="agent-entry-copy">
          <strong id="agent-entry-title">不确定从哪里看起？</strong>
          <span>试试作品集智能讲解助手，快速了解项目重点。</span>
        </span>
        <span className="agent-entry-action">打开助手</span>
      </button>
    </div>
  </section>
}

export function AIPortfolioAssistantDrawer({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined

    const scrollY = window.scrollY
    const previousBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    }

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = previousBodyStyle.position
      document.body.style.top = previousBodyStyle.top
      document.body.style.left = previousBodyStyle.left
      document.body.style.right = previousBodyStyle.right
      document.body.style.width = previousBodyStyle.width
      document.body.style.overflow = previousBodyStyle.overflow
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  return <>
    <div className={`assistant-drawer${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
      <button className="assistant-drawer-backdrop" type="button" aria-label="关闭作品集助手背景层" onClick={onClose} />
      <aside className="assistant-drawer-panel" role="dialog" aria-modal="true" aria-label="作品集智能讲解助手">
        <div className="assistant-drawer-topbar">
          <div>
            <span>PORTFOLIO ASSISTANT</span>
            <strong>作品集智能讲解助手</strong>
          </div>
          <button type="button" className="assistant-drawer-close" onClick={onClose} aria-label="关闭作品集助手">
            <X size={20} />
          </button>
        </div>
        <AgentChatPanel className="is-drawer" showHeader={false} />
      </aside>
    </div>
  </>
}

export function PortfolioAssistantFab({ onOpen }) {
  return <button type="button" className="portfolio-assistant-fab" onClick={onOpen}>
    <MessageCircle size={18} />
    AI作品集小助手
  </button>
}
