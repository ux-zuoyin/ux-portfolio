import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, LoaderCircle, MessageCircle, Plus, Send, Sparkles, X } from 'lucide-react'
import { portfolioKnowledge } from '../data/portfolioKnowledge.js'
import { projects as portfolioProjects } from '../data/projects.js'

const avatarSrc = `${import.meta.env.BASE_URL}assets/sardine-avatar.svg`

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

const initialWelcomeSuggestions = [
  '我只有 3 分钟，应该怎么看这份作品集？',
  '哪些项目最能体现他的 AI 产品设计能力？',
  '他的 B 端复杂系统能力体现在哪里？',
  '如果面试 AI UX 岗位，应该优先看哪些项目？',
]

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

function normalizeQuestion(value) {
  const chineseNumberMap = {
    一: '1',
    二: '2',
    三: '3',
    四: '4',
    五: '5',
    六: '6',
    七: '7',
    八: '8',
  }

  return String(value || '')
    .toLowerCase()
    .replace(/[一二三四五六七八]/g, (match) => chineseNumberMap[match])
    .replace(/\s+/g, '')
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)))
}

function splitKeywordText(value) {
  return String(value || '')
    .split(/[\s\n/｜|·,，。:：]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const projectAliasesByIndex = {
  '01': ['灵魂记忆', 'AI 动态画像', '动态画像'],
  '02': ['AIGC 发布器', 'AI 辅助发帖', 'AI 适时介入创作'],
  '03': ['Soul 广告生态设计', 'Soul 广告生态', '广告生态设计', '广告商业化项目'],
  '04': ['多任务福利积分页', '福利积分页', '多任务福利积分'],
  '05': ['NAWA', 'NAWA 特效编辑器', 'NAWA 编辑器', 'EffectCreator', '3D 资产配置全链路'],
  '06': ['用户声音统一运营中枢', '用户声音后台', '用户声音', '用户反馈平台'],
  '07': ['0 代码活动快速搭建', '0 代码活动搭建', '零代码活动快速搭建', '零代码活动搭建', '活动搭投平台', '活动搭建平台'],
  '08': ['Portfolio AI Agent', 'AI Portfolio Agent', '作品集智能导览助手', '作品集助手'],
  '09': ['复杂事件编排', '事件编排理解成本', '事件配置成本'],
}

const projectJumpTitles = {
  '01': '灵魂记忆 AI 动态画像',
  '02': 'AI 适时介入创作 / AIGC 发布器',
  '03': 'Soul 广告生态设计',
  '04': '多任务福利积分页',
  '05': 'NAWA 特效编辑器',
  '06': '用户声音统一运营中枢',
  '07': '0 代码活动快速搭建',
  '08': 'Portfolio AI Agent',
}

function normalizeProjectIndex(value) {
  return String(value || '').padStart(2, '0')
}

const assistantDeepDives = portfolioKnowledge.projects.flatMap((project) =>
  (project.deepDives || []).map((deepDive) => ({
    ...deepDive,
    projectIndex: normalizeProjectIndex(deepDive.projectIndex || project.index),
  })),
)

function convertProjectToAssistantKnowledge(project) {
  const subtitle = project.subtitle || project.detailSubtitle || project.description || ''
  const title = project.title || project.detailTitle
  const keywords = [
    project.index,
    `项目${project.index}`,
    `project-${project.index}`,
    project.category,
    title,
    subtitle,
    ...(project.tags || []),
  ].flatMap(splitKeywordText)

  return {
    ...project,
    index: normalizeProjectIndex(project.index),
    title: String(title || '').replace(/\n/g, ' '),
    subtitle,
    category: project.category,
    tags: project.tags || [],
    assistantBrief: project.assistantBrief,
    keywords: [...new Set(keywords)],
    summary: project.assistantBrief,
  }
}

const projectKnowledgeFromData = portfolioProjects
  .map(convertProjectToAssistantKnowledge)

const supplementalProjectKnowledgeByIndex = new Map(
  portfolioKnowledge.projects.map((project) => [normalizeProjectIndex(project.index), project]),
)

const assistantProjectKnowledge = projectKnowledgeFromData.map((project) => {
  const supplemental = supplementalProjectKnowledgeByIndex.get(project.index) || {}
  return {
    ...supplemental,
    ...project,
    summary: supplemental.summary || project.summary || project.assistantBrief || project.subtitle,
    value: supplemental.value || project.assistantBrief,
    keywords: [...new Set([
      ...(supplemental.keywords || []),
      ...(project.keywords || []),
      ...(projectAliasesByIndex[project.index] || []),
    ])],
  }
}).sort((a, b) => Number(a.index) - Number(b.index))

function getRelatedProjectsFromAnswer(answerText) {
  const normalizedAnswer = normalizeQuestion(answerText)

  return portfolioProjects
    .map((project) => {
      const index = normalizeProjectIndex(project.index)
      const candidates = [
        `项目${Number(index)}`,
        `项目${index}`,
        project.title,
        project.detailTitle,
        ...(projectAliasesByIndex[index] || []),
      ]
        .filter(Boolean)
        .map(normalizeQuestion)

      const positions = candidates
        .map((candidate) => normalizedAnswer.indexOf(candidate))
        .filter((position) => position >= 0)

      if (positions.length === 0) return null
      return { ...project, index, answerPosition: Math.min(...positions) }
    })
    .filter(Boolean)
    .sort((a, b) => a.answerPosition - b.answerPosition)
    .map(({ answerPosition, ...project }) => project)
}

function getProjectJumpTitle(project) {
  return projectJumpTitles[normalizeProjectIndex(project.index)]
    || String(project.title || project.detailTitle || '').replace(/\n/g, ' ')
}

function findRelevantProjects(question) {
  const normalizedQuestion = normalizeText(question)
  return assistantProjectKnowledge.filter((project) => {
    const keywords = project.keywords || []
    const corpus = normalizeText([
      project.title,
      project.category,
      project.summary,
      project.background,
      project.conflict,
      project.designJudgment,
      project.solution,
      project.value,
      ...keywords,
    ].join(' '))
    return keywords.some((keyword) => normalizedQuestion.includes(normalizeText(keyword)))
      || normalizedQuestion.includes(normalizeText(project.category))
      || corpus.includes(normalizedQuestion)
  })
}

function getProjectIndexByQuestion(question, recentProjectIndex = null) {
  const normalizedQuestion = normalizeQuestion(question)

  for (const project of portfolioProjects) {
    const paddedIndex = project.index
    const numericIndex = String(Number(project.index))
    const indexPatterns = [
      `项目${numericIndex}`,
      `项目${paddedIndex}`,
      `project${numericIndex}`,
      `project${paddedIndex}`,
      `project-${numericIndex}`,
      `project-${paddedIndex}`,
      `第${numericIndex}个项目`,
      `第${paddedIndex}个项目`,
    ]

    if (
      normalizedQuestion === numericIndex
      || normalizedQuestion === paddedIndex
      || indexPatterns.some((pattern) => normalizedQuestion.includes(pattern))
    ) {
      return normalizeProjectIndex(project.index)
    }
  }

  const refersToRecentProject = normalizedQuestion.includes('这个项目') || normalizedQuestion.includes('该项目')
  if (refersToRecentProject && recentProjectIndex) {
    return normalizeProjectIndex(recentProjectIndex)
  }

  for (const project of portfolioProjects) {
    const aliases = [
      ...(projectAliasesByIndex[normalizeProjectIndex(project.index)] || []),
      project.title,
      project.detailTitle,
    ].filter(Boolean)
    if (aliases.some((alias) => normalizedQuestion.includes(normalizeQuestion(alias)))) {
      return normalizeProjectIndex(project.index)
    }
  }

  return null
}

function getProjectKnowledgeByIndex(index) {
  const normalizedIndex = normalizeProjectIndex(index)
  return assistantProjectKnowledge.find((project) => project.index === normalizedIndex) || null
}

function getProjectByQuestion(question, recentProjectIndex = null) {
  const projectIndex = getProjectIndexByQuestion(question, recentProjectIndex)
  return projectIndex ? getProjectKnowledgeByIndex(projectIndex) : null
}

function getProjectDeepDiveByQuestion(question, recentProjectIndex = null, explicitProjectIndex = null) {
  const normalizedQuestion = normalizeQuestion(question)
  const matchedProject = explicitProjectIndex
    ? getProjectKnowledgeByIndex(explicitProjectIndex)
    : getProjectByQuestion(question, recentProjectIndex)
  if (!matchedProject) return null

  return assistantDeepDives
    .filter((deepDive) => deepDive.projectIndex === normalizeProjectIndex(matchedProject.index))
    .map((deepDive) => ({
      ...deepDive,
      matchScore: deepDive.keywords.reduce((score, keyword) => (
        normalizedQuestion.includes(normalizeQuestion(keyword)) ? score + 1 : score
      ), 0),
    }))
    .filter((deepDive) => deepDive.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)[0] || null
}

function getProjectSubtitle(project) {
  return project.subtitle || project.detailSubtitle || project.description || ''
}

const projectSpecificCapabilities = {
  '01': [
    'AI UX 可信与可控设计',
    '用户画像与标签管理',
    '复杂状态与边界设计',
    '用户确认与纠错机制',
  ],
  '02': ['AIGC 介入时机设计', '内容生产流程设计', '用户控制与确认', 'AI UX 反馈设计'],
  '03': ['商业化体验平衡', '场景化广告适配', '信息层级与转化路径', '复杂规则与跨团队协作'],
  '04': ['多任务决策设计', '状态驱动参与路径', '信息优先级与组件规则', '增长数据复盘'],
  '05': ['复杂对象与任务建模', '事件编排与配置降本', '预览验证闭环', '专业生产工具 UX'],
  '06': ['多来源反馈归一', '多角色状态流转', '任务处理闭环', '数据沉淀与运营效率'],
  '07': ['低代码搭建流程', '组件化与规则约束', '预览发布闭环', '运营配置效率'],
  '08': ['Agent 交互与任务导览', '本地知识库组织', '回答边界与证据关联', 'AI Coding 原型验证'],
}

function getUniqueProjectCapabilities(project) {
  const preferredCapabilities = projectSpecificCapabilities[normalizeProjectIndex(project.index)]
  const capabilities = preferredCapabilities || [...(project.tags || []), project.category]
  const seen = new Set()

  return capabilities.filter((capability) => {
    if (!capability) return false
    const key = normalizeText(capability)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 5)
}

function getProjectResponsibility(project) {
  const structuredResponsibility = project.role || project.responsibility || project.responsibilities
  if (Array.isArray(structuredResponsibility)) return structuredResponsibility.join('、')
  if (structuredResponsibility) return structuredResponsibility

  const responsibilityFromBrief = String(project.assistantBrief || '').match(/左胤负责[^。]+。?/)
  if (responsibilityFromBrief) return responsibilityFromBrief[0]

  return '当前结构化资料没有单独记录左胤在该项目中的具体职责，建议在面试中继续确认，不能根据详情图片自行推断。'
}

function generateSingleProjectAnswer(project) {
  const subtitle = getProjectSubtitle(project)
  const capabilities = getUniqueProjectCapabilities(project)
  const summary = project.summary || subtitle || project.assistantBrief || '当前项目资料正在补充。'
  const coreProblem = project.conflict || project.background || subtitle || '当前结构化资料没有单独记录核心问题。'
  const responsibility = getProjectResponsibility(project)

  return [
    '## 项目概览',
    '',
    summary,
    '',
    '---',
    '',
    '## 核心问题',
    '',
    coreProblem,
    '',
    '---',
    '',
    '## 左胤负责的内容',
    '',
    responsibility,
    '',
    '---',
    '',
    '## 设计判断',
    '',
    project.designJudgment || project.solution || '当前结构化资料没有记录足够具体的设计判断，不能根据图片自行补全。',
    '',
    '---',
    '',
    '## 能力体现',
    '',
    capabilities.map((item) => `- ${item}`).join('\n'),
  ].join('\n')
}

function isProjectDataQuestion(question) {
  const normalizedQuestion = normalizeText(question)
  return includesAny(normalizedQuestion, [
    '哪些数据', '真实数据', '真实上线数据', '上线结果', '测试数据', '验证数据',
    '数据真实吗', '数据边界', '模拟数据', '提升了多少', '增长了多少', '因果归因',
  ])
}

function isProjectResponsibilityQuestion(question) {
  return includesAny(normalizeText(question), ['负责什么', '具体负责', '职责', '参与了什么', '承担什么'])
}

function isProjectBoundaryQuestion(question) {
  return includesAny(normalizeText(question), ['能力边界', '哪些边界', '项目边界', '不能证明', '是否夸大', '过度包装'])
}

function isSingleProjectIntroQuestion(question) {
  return includesAny(normalizeText(question), [
    '介绍', '项目概览', '简单说说', '简单讲讲', '项目是什么', '是什么项目',
    '项目背景', '背景是什么',
  ])
}

function isProjectTopicQuestion(question) {
  return includesAny(normalizeText(question), [
    '如何', '为什么', '怎么判断', '怎么设计', '什么机制', '平衡', '降低',
    '设计判断', '设计取舍', '用户控制', '最终控制', '触发', '优先级',
    '如何体现', '证明什么能力', '验证', '闭环', '配置成本',
  ])
}

function isBareProjectReference(question, project) {
  const normalizedQuestion = normalizeQuestion(question)
  const candidates = [
    project.index,
    String(Number(project.index)),
    project.title,
    project.detailTitle,
    ...(projectAliasesByIndex[project.index] || []),
  ].filter(Boolean).map(normalizeQuestion)
  return candidates.includes(normalizedQuestion)
}

const projectValidationTypes = {
  '01': '内部小样本测试与方案模拟',
  '04': '真实上线后的同期对比数据',
  '05': '内部小样本任务测试',
}

function formatProjectDataBoundaryAnswer(project) {
  const validationType = projectValidationTypes[project.index]
  if (!project.validation) {
    return [
      '## 数据结论',
      '',
      `当前结构化资料中没有记录${getProjectJumpTitle(project)}的项目级验证数据或真实上线指标，因此不能编造提升比例、转化结果或因果结论。`,
      '',
      '---',
      '',
      '## 当前可确认的边界',
      '',
      project.boundary || '现有资料只能说明项目背景、设计判断和方案方向，数据结果需要在面试中继续向左胤确认。',
    ].join('\n')
  }

  return [
    '## 数据结论',
    '',
    `${getProjectJumpTitle(project)}当前有${validationType}，需要按证据类型准确表达，不能把内部测试或同期对比直接包装成严格因果结果。`,
    '',
    '---',
    '',
    '## 已有证据',
    '',
    project.validation,
    '',
    '---',
    '',
    '## 表达边界',
    '',
    project.boundary || '当前资料未补充更进一步的数据边界，不能扩展解释。',
  ].join('\n')
}

function formatProjectResponsibilityAnswer(project) {
  return [
    '## 左胤负责的内容',
    '',
    getProjectResponsibility(project),
    '',
    '---',
    '',
    '## 对应设计工作',
    '',
    project.solution || project.designJudgment || '当前资料没有进一步拆分具体设计工作，不能根据图片自行推断。',
  ].join('\n')
}

function formatProjectBoundaryAnswer(project) {
  return [
    '## 项目边界',
    '',
    project.boundary || `当前资料没有单独记录${getProjectJumpTitle(project)}的项目边界，不能补充未经确认的工程能力、数据结果或个人归因。`,
    '',
    '---',
    '',
    '## 可以确认的能力',
    '',
    getUniqueProjectCapabilities(project).map((capability) => `- ${capability}`).join('\n'),
  ].join('\n')
}

function formatProjectTopicAnswer(project) {
  if (!project.designJudgment && !project.solution) {
    return [
      '## 当前资料边界',
      '',
      `${getProjectJumpTitle(project)}目前只有标题、简介和详情媒体路径，缺少可检索的设计判断与机制说明。详情图内容尚未结构化，Agent 不能根据图片自行推断。`,
      '',
      '---',
      '',
      '## 建议补充',
      '',
      '需要补充项目范围、核心冲突、设计判断、关键机制、验证方式，以及它与其他项目的关系。',
    ].join('\n')
  }

  return [
    '## 核心判断',
    '',
    project.designJudgment || project.conflict,
    '',
    '---',
    '',
    '## 具体机制',
    '',
    project.solution || '当前资料只记录了设计判断，没有结构化到更细的交互机制，不能根据详情图自行补全。',
    '',
    '---',
    '',
    '## 项目价值',
    '',
    project.value || project.assistantBrief || '当前资料没有进一步记录项目价值。',
  ].join('\n')
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

function normalizeFollowUpText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/^(?:(?:请问|我想了解(?:一下|下)?|想了解(?:一下|下)?|请(?:帮我)?介绍(?:一下|下)?|介绍(?:一下|下)?|讲讲|说说)\s*)+/, '')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getFollowUpBigrams(value) {
  const text = normalizeFollowUpText(value).replace(/\s+/g, '')
  if (text.length < 2) return new Set(text ? [text] : [])

  const bigrams = new Set()
  for (let index = 0; index < text.length - 1; index += 1) {
    bigrams.add(text.slice(index, index + 2))
  }
  return bigrams
}

function areFollowUpTextsSimilar(first, second) {
  const firstText = normalizeFollowUpText(first).replace(/\s+/g, '')
  const secondText = normalizeFollowUpText(second).replace(/\s+/g, '')
  if (!firstText || !secondText) return false
  if (firstText === secondText) return true

  const shorterLength = Math.min(firstText.length, secondText.length)
  const longerLength = Math.max(firstText.length, secondText.length)
  if (
    shorterLength >= 6
    && (firstText.includes(secondText) || secondText.includes(firstText))
    && shorterLength / longerLength >= 0.72
  ) {
    return true
  }

  const firstBigrams = getFollowUpBigrams(firstText)
  const secondBigrams = getFollowUpBigrams(secondText)
  if (firstBigrams.size === 0 || secondBigrams.size === 0) return false

  let overlap = 0
  firstBigrams.forEach((bigram) => {
    if (secondBigrams.has(bigram)) overlap += 1
  })
  return (2 * overlap) / (firstBigrams.size + secondBigrams.size) >= 0.78
}

const unsupportedFollowUpQueries = new Set([
  '这些项目解决的问题和体现的能力有什么差异',
  '最关键的设计判断和方案取舍是什么',
  '哪个项目最适合在面试中重点展开',
  '哪些项目最适合在面试中重点展开',
  '这些项目之间有什么不同',
])

function getDeepDiveById(projectIndex, deepDiveId) {
  const normalizedIndex = normalizeProjectIndex(projectIndex)
  return assistantDeepDives.find((deepDive) => (
    deepDive.projectIndex === normalizedIndex && deepDive.id === deepDiveId
  )) || null
}

function createProjectFollowUp(projectIndex, label = null) {
  const project = getProjectKnowledgeByIndex(projectIndex)
  if (!project) return null

  return {
    label: label || `介绍项目 ${project.index}`,
    query: `介绍下项目 ${project.index}`,
    type: 'single-project',
    routeKey: 'single-project',
    projectIndex: project.index,
    deepDiveId: '',
  }
}

function createDeepDiveFollowUp(deepDive) {
  if (!deepDive) return null
  return {
    label: deepDive.title,
    query: deepDive.title.endsWith('？') ? deepDive.title : `${deepDive.title}？`,
    type: 'deep-dive',
    routeKey: 'deep-dive',
    projectIndex: deepDive.projectIndex,
    deepDiveId: deepDive.id,
  }
}

const overviewFollowUpPool = [
  {
    label: '看 AI 项目',
    query: '哪些项目最能体现他的 AI 产品设计能力？',
    type: 'project-collection',
    routeKey: 'ai-project-collection',
    projectIndex: '',
    deepDiveId: '',
  },
  {
    label: '看 B 端项目',
    query: '他的 B 端复杂系统能力体现在哪里？',
    type: 'project-collection',
    routeKey: 'b-end-project-collection',
    projectIndex: '',
    deepDiveId: '',
  },
  {
    label: '看 AI 岗位路径',
    query: '如果面试 AI UX 岗位，应该优先看哪些项目？',
    type: 'global-guide',
    routeKey: 'ai-ux-role-guide',
    projectIndex: '',
    deepDiveId: '',
  },
]

const aiCollectionFollowUpPool = [
  createDeepDiveFollowUp(getDeepDiveById('01', 'avoid-over-defining-user')),
  createDeepDiveFollowUp(getDeepDiveById('02', 'ai-intervention-timing')),
  createDeepDiveFollowUp(getDeepDiveById('08', 'local-knowledge-organization')),
].filter(Boolean)

const bEndCollectionFollowUpPool = [
  createProjectFollowUp('05'),
  createProjectFollowUp('06'),
  createProjectFollowUp('07'),
].filter(Boolean)

const commercialCollectionFollowUpPool = [
  createProjectFollowUp('03'),
  createProjectFollowUp('04'),
].filter(Boolean)

const followUpRouteValidators = {
  'global-guide': (followUp) => ['three-minute-guide', 'ai-ux-role-guide'].includes(followUp.routeKey),
  'project-collection': (followUp) => [
    'ai-project-collection',
    'b-end-project-collection',
    'commercial-project-collection',
  ].includes(followUp.routeKey),
  'single-project': (followUp) => followUp.routeKey === 'single-project' && Boolean(followUp.projectIndex),
  'deep-dive': (followUp) => followUp.routeKey === 'deep-dive'
    && Boolean(followUp.projectIndex)
    && Boolean(followUp.deepDiveId),
  'data-boundary': (followUp) => followUp.routeKey === 'project-data-boundary'
    && Boolean(followUp.projectIndex),
  contact: (followUp) => followUp.routeKey === 'contact',
  'role-fit': (followUp) => followUp.routeKey === 'role-fit',
}

function canAnswerFollowUp(followUp, {
  currentQuestion = '',
  askedQuestions = [],
  currentDeepDiveId = '',
} = {}) {
  if (!followUp?.query || !followUp?.type || !followUp?.routeKey) return false

  const validateRoute = followUpRouteValidators[followUp.type]
  if (!validateRoute || !validateRoute(followUp)) return false

  if (followUp.projectIndex && !getProjectKnowledgeByIndex(followUp.projectIndex)) return false

  if (followUp.deepDiveId) {
    const deepDive = getDeepDiveById(followUp.projectIndex, followUp.deepDiveId)
    if (!deepDive || deepDive.id === currentDeepDiveId) return false
  }

  const normalizedQuery = normalizeFollowUpText(followUp.query).replace(/\s+/g, '')
  if (unsupportedFollowUpQueries.has(normalizedQuery)) return false

  return ![currentQuestion, ...askedQuestions].some((question) => (
    areFollowUpTextsSimilar(followUp.query, question)
  ))
}

function getAnswerRouteKey(question, {
  matchedProject = null,
  matchedDeepDive = null,
} = {}) {
  const normalizedQuestion = normalizeText(question)

  if (matchedDeepDive) return 'deep-dive'
  if (isThreeMinuteReadingQuestion(normalizedQuestion)) return 'three-minute-guide'
  if (isAIUXRoleReadingQuestion(normalizedQuestion)) return 'ai-ux-role-guide'
  if (isAIProjectCollectionQuestion(normalizedQuestion)) return 'ai-project-collection'
  if (isBEndProjectCollectionQuestion(normalizedQuestion)) return 'b-end-project-collection'
  if (isCommercialProjectCollectionQuestion(normalizedQuestion)) return 'commercial-project-collection'
  if (matchedProject && isProjectDataQuestion(question)) return 'project-data-boundary'
  if (matchedProject) return 'single-project'
  return 'global-overview'
}

function getProjectDeepDiveFollowUps(projectIndex, currentDeepDiveId = '') {
  return assistantDeepDives
    .filter((deepDive) => (
      deepDive.projectIndex === normalizeProjectIndex(projectIndex)
      && deepDive.id !== currentDeepDiveId
    ))
    .map(createDeepDiveFollowUp)
}

function getFollowUpSuggestions(question, {
  askedQuestions = [],
  matchedProject = null,
  matchedDeepDive = null,
  answerRouteKey = 'global-overview',
} = {}) {
  let candidates = []

  if (answerRouteKey === 'ai-project-collection' || answerRouteKey === 'ai-ux-role-guide') {
    candidates = aiCollectionFollowUpPool
  } else if (answerRouteKey === 'b-end-project-collection') {
    candidates = bEndCollectionFollowUpPool
  } else if (answerRouteKey === 'commercial-project-collection') {
    candidates = commercialCollectionFollowUpPool
  } else if (matchedDeepDive) {
    candidates = getProjectDeepDiveFollowUps(matchedDeepDive.projectIndex, matchedDeepDive.id)
  } else if (matchedProject) {
    candidates = getProjectDeepDiveFollowUps(matchedProject.index)
  } else {
    candidates = overviewFollowUpPool
  }

  const accepted = []
  candidates.forEach((candidate) => {
    if (!canAnswerFollowUp(candidate, {
      currentQuestion: question,
      askedQuestions,
      currentDeepDiveId: matchedDeepDive?.id || '',
    })) return

    const isDuplicateCandidate = accepted.some((item) => (
      areFollowUpTextsSimilar(item.query, candidate.query)
    ))
    if (!isDuplicateCandidate) accepted.push(candidate)
  })

  return accepted.slice(0, 3)
}

function runFollowUpRegressionChecks() {
  const failures = []
  const expect = (condition, message) => {
    if (!condition) failures.push(message)
  }

  const unsupportedComparison = {
    label: '比较项目差异',
    query: '这些项目解决的问题和体现的能力有什么差异？',
    type: 'project-collection',
    routeKey: 'ai-project-collection',
    projectIndex: '',
    deepDiveId: '',
  }
  expect(!canAnswerFollowUp(unsupportedComparison), '泛化项目差异问题不应通过校验')

  const overviewSuggestions = getFollowUpSuggestions('请用 3 分钟介绍作品集', {
    answerRouteKey: 'three-minute-guide',
  })
  expect(
    overviewSuggestions.every((item) => ['global-guide', 'project-collection'].includes(item.type)),
    '作品集概览后只能展示全局稳定问题',
  )

  const aiSuggestions = getFollowUpSuggestions('哪些项目最能体现他的 AI 产品设计能力？', {
    answerRouteKey: 'ai-project-collection',
  })
  expect(
    aiSuggestions.every((item) => item.type === 'deep-dive' && Boolean(getDeepDiveById(item.projectIndex, item.deepDiveId))),
    'AI 项目集合后只能展示存在的 deepDive',
  )

  const project01DeepDive = getDeepDiveById('01', 'avoid-over-defining-user')
  const project01Suggestions = getFollowUpSuggestions('灵魂记忆如何避免 AI 过度定义用户？', {
    matchedProject: getProjectKnowledgeByIndex('01'),
    matchedDeepDive: project01DeepDive,
    answerRouteKey: 'deep-dive',
  })
  expect(
    project01Suggestions.every((item) => item.projectIndex === '01' && item.deepDiveId !== project01DeepDive.id),
    '项目 01 deepDive 后应保留同项目上下文且不重复当前专题',
  )

  const project07Suggestions = getFollowUpSuggestions('介绍下项目 07', {
    matchedProject: getProjectKnowledgeByIndex('07'),
    answerRouteKey: 'single-project',
  })
  expect(
    project07Suggestions.every((item) => item.projectIndex === '07' && item.routeKey === 'deep-dive'),
    '项目 07 后不应出现会误判为 B 端集合的追问',
  )

  expect(
    [overviewSuggestions, aiSuggestions, project01Suggestions, project07Suggestions]
      .every((items) => items.length <= 3),
    '继续追问最多显示 3 条',
  )

  return failures
}

if (import.meta.env.DEV) {
  const followUpRegressionFailures = runFollowUpRegressionChecks()
  if (followUpRegressionFailures.length > 0) {
    throw new Error(`继续追问回归检查失败：${followUpRegressionFailures.join('；')}`)
  }
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
    ...formatRelatedEvidenceSection(['Portfolio AI Agent 作品集智能导览助手', '灵魂记忆', 'AIGC 发布器']),
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
  const capability = portfolioKnowledge.bEndCapability
  return [
    '## 结论',
    '',
    capability.summary,
    '',
    '---',
    '',
    '## 经验覆盖面',
    '',
    `他的 B 端经验主要覆盖 ${capability.scope.join('、')}。`,
    '',
    '---',
    '',
    '## 项目深度',
    '',
    capability.depthJudgment,
    '',
    '---',
    '',
    '## 能力判断',
    '',
    `关键能力包括 ${capability.capabilities.join('、')}。${capability.boundary}`,
    ...formatRelatedEvidenceSection(capability.representativeProjects),
  ].join('\n')
}

function formatRoleFitAnswer(question) {
  const normalizedQuestion = normalizeText(question)
  const isBEndRole = includesAny(normalizedQuestion, ['B 端', 'B端', '后台', '平台', '复杂系统'])
  const isAIRole = includesAny(normalizedQuestion, ['AI', 'AIGC', 'Agent', '智能'])
  const roleLabel = isBEndRole ? 'B 端 / 复杂系统设计岗位' : isAIRole ? 'AI 产品体验设计岗位' : '偏 AI 产品体验、复杂 B 端和平台型工具的岗位'
  const evidenceProjects = isBEndRole
    ? ['NAWA 特效编辑器', '用户声音统一运营中枢', '0 代码活动快速搭建平台']
    : isAIRole
      ? ['灵魂记忆', 'AIGC 发布器', 'Portfolio AI Agent']
      : ['灵魂记忆', 'NAWA 编辑器', '多任务福利积分页', 'AIGC 发布器']

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
      ? '对应证据包括 NAWA 特效编辑器、用户声音统一运营中枢和 0 代码活动快速搭建平台。这些项目能体现他对后台流程、平台化能力和复杂协作链路的设计经验。'
      : '对应证据包括灵魂记忆、AIGC 发布器，以及这个用 Codex 辅助搭建的 AI 作品集助手。这些项目分别覆盖用户理解、AI 创作辅助和 Agent 原型验证。',
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
  const { profile } = portfolioKnowledge
  return [
    '## 一句话总结',
    '',
    `${positioning.summary}他的核心能力集中在 ${positioning.coreAbilities.join('、')}。`,
    '',
    profile.positioning,
    '',
    '---',
    '',
    '## 工作经历',
    '',
    profile.experienceTimeline.map((item) => `**${item.company}（${item.period}）：**${item.role}。主要负责 ${item.work.slice(0, 4).join('、')}。`).join('\n\n'),
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
    ...formatRelatedEvidenceSection(['灵魂记忆', 'AIGC 发布器', 'Portfolio AI Agent', 'NAWA 特效编辑器 / 用户声音统一运营中枢 / 0 代码活动快速搭建']),
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

function formatAIProjectCollectionAnswer({ roleFocused = false } = {}) {
  return [
    roleFocused ? '## AI UX 岗位优先阅读路径' : '## 推荐优先看的 AI 项目',
    '',
    roleFocused
      ? '如果面试 AI UX 岗位，建议优先阅读项目 01、02、08，分别判断他对 AI 信任、AI 创作辅助和 AI Agent 原型的理解。'
      : '最能体现左胤 AI 产品设计能力的项目是 01、02、08，它们覆盖三类不同的 AI 产品体验问题。',
    '',
    '---',
    '',
    '## 1. 项目 01：灵魂记忆 AI 动态画像',
    '',
    '体现 AI Memory、用户画像、推断确认、敏感信息边界，以及可信、可控、可纠错的 AI 体验设计。',
    '',
    '## 2. 项目 02：AI 适时介入创作 / AIGC 发布器',
    '',
    '体现 AIGC 创作辅助、发布器流程、AI 触发时机，以及在降低创作门槛时保留用户最终控制。',
    '',
    '## 3. 项目 08：Portfolio AI Agent',
    '',
    '体现 AI Agent 交互、作品集知识库组织、回答边界、推荐追问和 AI Coding 原型搭建能力。',
    '',
    '---',
    '',
    '这些项目分别覆盖 AI 画像理解、AI 创作辅助和 AI Agent 原型三个方向。',
  ].join('\n')
}

function formatBEndProjectCollectionAnswer() {
  return [
    '## B 端与复杂系统项目',
    '',
    '左胤的 B 端与复杂系统能力主要体现在项目 05、06、07。',
    '',
    '---',
    '',
    '## 1. 项目 05：NAWA 特效编辑器 / 3D 资产配置',
    '',
    '围绕复杂资产、对象关系、编辑配置、预览和投放链路进行重构，降低专业生产工具的理解、配置和跨团队协作成本。',
    '',
    '## 2. 项目 06：用户声音统一运营中枢',
    '',
    '统一多来源反馈、分类检索、状态流转和运营处理链路，让客服、产品和运营在同一工作台完成问题闭环。',
    '',
    '## 3. 项目 07：0 代码活动快速搭建',
    '',
    '通过低代码组件、规则约束、预览和发布流程，降低活动配置对研发排期的依赖并提升运营效率。',
    '',
    '---',
    '',
    '这些项目体现的是复杂信息架构、流程编排、配置降本和后台效率设计能力。',
  ].join('\n')
}

function formatCommercialProjectCollectionAnswer() {
  return [
    '## 商业化与增长项目',
    '',
    '商业化与增长设计可以优先看项目 03 和项目 04。',
    '',
    '---',
    '',
    '## 1. 项目 03：Soul 广告生态设计',
    '',
    '体现广告内容在不同社区场景中的适配、信息层级、转化路径和低打扰体验设计。',
    '',
    '## 2. 项目 04：多任务福利积分页',
    '',
    '体现收益优先的信息组织、任务状态驱动的参与路径，以及真实上线后的增长与商业化效果验证。',
    '',
    '---',
    '',
    '这两个项目分别覆盖商业内容场景化和增长任务决策设计。',
  ].join('\n')
}

function asksForProjectCollection(normalizedQuestion) {
  return includesAny(normalizedQuestion, [
    '哪些项目',
    '项目有哪些',
    '做过哪些',
    '相关项目',
    '项目推荐',
    '优先看哪些项目',
    '应该看哪些项目',
    '能力体现在哪里',
    '能力体现在哪',
  ])
}

function isAIProjectCollectionQuestion(normalizedQuestion) {
  const isAITopic = includesAny(normalizedQuestion, ['AI', 'AIGC', 'AI UX', 'AIUX', '智能', 'Agent'])
  return isAITopic && asksForProjectCollection(normalizedQuestion)
}

function isBEndProjectCollectionQuestion(normalizedQuestion) {
  const isBEndTopic = includesAny(normalizedQuestion, ['B 端', 'B端', '复杂系统', '复杂后台'])
  return isBEndTopic && asksForProjectCollection(normalizedQuestion)
}

function isCommercialProjectCollectionQuestion(normalizedQuestion) {
  const isCommercialTopic = includesAny(normalizedQuestion, ['商业化', '增长设计', '增长项目', '广告项目'])
  return isCommercialTopic && asksForProjectCollection(normalizedQuestion)
}

function isThreeMinuteReadingQuestion(normalizedQuestion) {
  return includesAny(normalizedQuestion, ['3 分钟', '3分钟', '三分钟'])
    && includesAny(normalizedQuestion, ['怎么看', '怎么阅读', '应该看', '快速了解'])
}

function isAIUXRoleReadingQuestion(normalizedQuestion) {
  return includesAny(normalizedQuestion, ['AI UX', 'AIUX', 'AI 产品设计'])
    && includesAny(normalizedQuestion, ['岗位', '面试'])
    && asksForProjectCollection(normalizedQuestion)
}

function isGlobalGuideOrProjectCollectionQuestion(normalizedQuestion) {
  return isThreeMinuteReadingQuestion(normalizedQuestion)
    || isAIUXRoleReadingQuestion(normalizedQuestion)
    || isAIProjectCollectionQuestion(normalizedQuestion)
    || isBEndProjectCollectionQuestion(normalizedQuestion)
    || isCommercialProjectCollectionQuestion(normalizedQuestion)
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
    'NAWA 特效编辑器、用户声音统一运营中枢和 0 代码活动快速搭建平台，都能体现这种复杂度。尤其是任务模型、流程状态、配置效率、数据闭环和设计取舍，是判断项目深度的重点。',
    ...formatRelatedEvidenceSection(['NAWA 特效编辑器', '用户声音统一运营中枢', '0 代码活动快速搭建平台']),
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

function formatDataBoundaryAnswer() {
  const { realOnlineData, internalTests, simulations } = portfolioKnowledge.dataBoundaries
  return [
    '## 数据与验证边界',
    '',
    '需要区分三类证据：真实上线数据、内部小样本测试和方案模拟。它们都能帮助判断设计方向，但不能混为同一种结果。',
    '',
    '---',
    '',
    '## 真实上线数据',
    '',
    realOnlineData.map((item) => `**${item.project}：**${item.data.join('、')}。${item.boundary}`).join('\n\n'),
    '',
    '---',
    '',
    '## 内部小样本测试',
    '',
    internalTests.map((item) => `**${item.project}：**${item.data.join('、')}。${item.boundary}`).join('\n\n'),
    '',
    '---',
    '',
    '## 方案模拟',
    '',
    simulations.map((item) => `**${item.project}：**${item.data.join('、')}。${item.boundary}`).join('\n\n'),
    '',
    '---',
    '',
    '## 结论',
    '',
    '福利积分页的数据可以作为真实上线后的联合验证；灵魂记忆和 NAWA 的测试数据更适合作为方向性证据；灵魂记忆的语音完成率和方案对比必须表述为模拟或预计结果。',
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
      ? '多任务福利积分页和 Soul 广告生态设计能体现他在商业目标、用户体验、配置效率和数据效果之间做平衡的经验。重点不是简单加广告位，而是理解商业内容如何进入社区场景。'
      : type === 'contentTools'
        ? 'AIGC 发布器体现生成、编辑、预览、发布的完整链路；NAWA 编辑器体现创作者工具和复杂事件编排经验。'
        : type === 'socialProduct'
          ? '灵魂记忆体现他对兴趣社交、AI 动态画像、用户控制和匹配效率的理解。'
          : 'Portfolio AI Agent 和 Codex 原型搭建过程体现他能把 Agent 体验想法快速做成交互原型。',
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
    '**灵魂记忆**体现了他对 AI Memory、Persona、Social Match、AI 信任和用户控制的理解。',
    '',
    '**AIGC 发布器**体现了他对内容生成、编辑、预览、发布完整链路的设计经验。',
    '',
    '**Portfolio AI Agent**体现了他使用 Codex 辅助搭建本地知识库型 Agent 原型的能力。',
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
    ...formatRelatedEvidenceSection(['灵魂记忆', 'AIGC 发布器', 'Portfolio AI Agent']),
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
    ...formatRelatedEvidenceSection(['Portfolio AI Agent', '灵魂记忆', 'AIGC 发布器']),
  ].join('\n')
}

function findProjectByKeyword(keywords) {
  return assistantProjectKnowledge.find((project) => {
    const corpus = normalizeText([project.title, project.summary, ...(project.keywords || [])].join(' '))
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

function buildStructuredFollowUpAnswer(question, context = {}) {
  const project = context.projectIndex
    ? getProjectKnowledgeByIndex(context.projectIndex)
    : null

  switch (context.routeKey) {
    case 'three-minute-guide':
      return formatReadingPathAnswer()
    case 'ai-ux-role-guide':
      return formatAIProjectCollectionAnswer({ roleFocused: true })
    case 'ai-project-collection':
      return formatAIProjectCollectionAnswer()
    case 'b-end-project-collection':
      return formatBEndProjectCollectionAnswer()
    case 'commercial-project-collection':
      return formatCommercialProjectCollectionAnswer()
    case 'single-project':
      return project ? generateSingleProjectAnswer(project) : null
    case 'deep-dive':
      return getDeepDiveById(context.projectIndex, context.deepDiveId)?.answer || null
    case 'project-data-boundary':
      return project ? formatProjectDataBoundaryAnswer(project) : null
    case 'contact':
      return [
        '## 联系方式',
        '',
        '- 微信：Sardine0717',
        '- 手机号码：186 2191 8554',
        '- 邮箱地址：1641043413@qq.com',
      ].join('\n')
    case 'role-fit':
      return formatRoleFitAnswer(question)
    default:
      return null
  }
}

function buildAgentReply(question, recentProjectIndex = null, context = {}) {
  void agentResponseGuidelines
  const structuredFollowUpAnswer = buildStructuredFollowUpAnswer(question, context)
  if (structuredFollowUpAnswer) return structuredFollowUpAnswer

  const normalizedQuestion = normalizeText(question)

  if (isThreeMinuteReadingQuestion(normalizedQuestion)) {
    return formatReadingPathAnswer()
  }

  if (isAIUXRoleReadingQuestion(normalizedQuestion)) {
    return formatAIProjectCollectionAnswer({ roleFocused: true })
  }

  if (isAIProjectCollectionQuestion(normalizedQuestion)) {
    return formatAIProjectCollectionAnswer()
  }

  if (isBEndProjectCollectionQuestion(normalizedQuestion)) {
    return formatBEndProjectCollectionAnswer()
  }

  if (isCommercialProjectCollectionQuestion(normalizedQuestion)) {
    return formatCommercialProjectCollectionAnswer()
  }

  const specificProject = context.projectIndex
    ? getProjectKnowledgeByIndex(context.projectIndex)
    : getProjectByQuestion(question, recentProjectIndex)
  if (specificProject) {
    const projectDeepDive = getProjectDeepDiveByQuestion(question, recentProjectIndex, specificProject.index)
    const availableDeepDive = projectDeepDive?.id === context.excludeDeepDiveId ? null : projectDeepDive

    if (isProjectDataQuestion(question)) {
      if (availableDeepDive?.intent === 'validation') {
        return availableDeepDive.answer
      }
      return formatProjectDataBoundaryAnswer(specificProject)
    }

    if (isProjectResponsibilityQuestion(question)) {
      return formatProjectResponsibilityAnswer(specificProject)
    }

    if (isProjectBoundaryQuestion(question)) {
      if (availableDeepDive && ['boundary', 'user-control'].includes(availableDeepDive.intent)) {
        return availableDeepDive.answer
      }
      return formatProjectBoundaryAnswer(specificProject)
    }

    if (availableDeepDive) {
      return availableDeepDive.answer
    }

    if (isSingleProjectIntroQuestion(question) || isBareProjectReference(question, specificProject)) {
      return generateSingleProjectAnswer(specificProject)
    }

    if (isProjectTopicQuestion(question)) {
      return formatProjectTopicAnswer(specificProject)
    }
  }

  const relevantProjects = findRelevantProjects(question)
  const isBEndTopic = includesAny(normalizedQuestion, ['B 端', 'B端', '后台', '平台型', '平台产品', '复杂后台', '复杂系统', '用户反馈', '运营中枢', '活动搭建', '活动搭投'])
  const isCapabilityEvaluationQuestion = includesAny(normalizedQuestion, ['经验怎么样', '经验如何', '项目深度', '深度如何', '能不能', '能否', '是否', '适合', '有没有', '胜任', '扎实', '能力怎么样', '能力如何'])
  const isProjectIntroQuestion = includesAny(normalizedQuestion, ['解决什么', '解决了什么', '设计判断', '介绍', '是什么', '项目背景', '项目价值', '核心问题'])
  const isWhoOrPositioningQuestion = includesAny(normalizedQuestion, ['左胤是谁', '他是谁', '他的背景', '左胤背景', '核心能力', '核心优势', '个人定位', '3分钟', '三分钟', '快速了解', '几年经验', '多少年经验', '哪家公司', '以前在哪', '工作经历', '普通执行', '界面执行', '执行型设计师'])
  const isCapabilityMatrixQuestion = includesAny(normalizedQuestion, ['能力矩阵', '项目证据', '哪些项目能证明', '什么项目能证明', '证明他的能力', '能力证据'])
  const isReadingPathQuestion = includesAny(normalizedQuestion, ['先看什么', '先看哪些', '阅读路径', '怎么看', '看什么项目', '最值得看', '按什么顺序'])
  const isDepthQuestion = includesAny(normalizedQuestion, ['项目深度', '深度如何', '深度怎么样', '复杂度', '页面数量', '项目够深', '项目扎实'])
  const isDesignDecisionQuestion = includesAny(normalizedQuestion, ['设计取舍', '方案取舍', '关键设计判断', '设计判断', '为什么这么做', '方案对比'])
  const isResponsibilityQuestion = includesAny(normalizedQuestion, ['职责', '负责什么', '参与什么', '协作', '落地', '验收', '产出'])
  const isBoundaryQuestion = includesAny(normalizedQuestion, ['能力边界', '边界', '夸大', '算法工程师', '大模型工程', '模型训练', '向量数据库', '后端架构', '数据结果'])
  const isDataBoundaryQuestion = includesAny(normalizedQuestion, [
    '真实上线数据',
    '真实数据',
    '上线结果',
    '完整线上结果',
    '语音完成率',
    '测试样本',
    '样本有多少',
    '因果归因',
    '严格因果',
    '单变量',
    '模拟',
    '预计',
    '哪些数据',
    '数据边界',
    '福利积分页有哪些真实上线数据',
    '能否做严格因果归因',
  ])
  const isAIEngineeringQuestion = includesAny(normalizedQuestion, ['做大模型', '训练模型', '模型训练', '微调模型', '模型微调', '向量数据库', '大模型工程', '懂不懂向量', '会不会训练'])
  const isAIMemorySystemQuestion = includesAny(normalizedQuestion, ['ai memory是什么', 'memory是什么', 'persona是什么', 'socialmatch是什么', 'social match是什么', 'soul项目的ai价值', 'soul 的ai价值', 'ai memory', 'persona', 'socialmatch', 'social match'])
  const isAICapabilityQuestion = (
    includesAny(normalizedQuestion, ['懂ai产品', 'ai产品经验', 'ai 产品经验', 'ai产品设计能力', 'ai 产品设计能力', 'ai产品设计岗位', 'ai 产品设计岗位', 'aiux岗位', 'ai ux岗位', '有什么ai产品', 'ai能力体现', 'ai 能力体现'])
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

  if (isDataBoundaryQuestion) {
    return formatDataBoundaryAnswer()
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
    const project = findProjectByKeyword(['灵魂记忆'])
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
    return formatBEndProjectCollectionAnswer()
  }

  if (normalizedQuestion.includes('复杂') || normalizedQuestion.includes('系统')) {
    return formatBEndProjectCollectionAnswer()
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

function ProjectJumpLinks({ projects, onNavigate }) {
  if (!projects?.length) return null
  const isSingleProject = projects.length === 1

  return <div className="agent-project-links" aria-label="回答关联项目">
    <span>{isSingleProject ? '查看完整项目' : '查看推荐项目'}</span>
    {projects.map((project) => <button
      key={project.index}
      type="button"
      onClick={() => onNavigate(project)}
    >
      <span>{isSingleProject ? '查看完整项目' : '查看项目'} {project.index}：{getProjectJumpTitle(project)}</span>
      <i aria-hidden="true">→</i>
    </button>)}
  </div>
}

function AgentChatPanel({ className = '', showHeader = true, onProjectNavigate }) {
  const [messages, setMessages] = useState([openingMessage])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUsedSuggestions, setHasUsedSuggestions] = useState(false)
  const [copyToast, setCopyToast] = useState({ message: '', success: true, visible: false })
  const inputRef = useRef(null)
  const chatRef = useRef(null)
  const latestMessageRef = useRef(null)
  const copyToastTimerRef = useRef(null)
  const recentProjectIndexRef = useRef(null)
  const askedQuestionsRef = useRef([])

  const suggestions = initialWelcomeSuggestions
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

  const submitQuestion = (question, context = {}) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isLoading) return

    const askedQuestions = [...askedQuestionsRef.current, trimmedQuestion]
    askedQuestionsRef.current = askedQuestions

    setHasUsedSuggestions(true)
    setMessages((current) => [...current, { role: 'user', text: trimmedQuestion }])
    setInputValue('')
    setIsLoading(true)

    window.setTimeout(() => {
      const normalizedQuestion = normalizeText(trimmedQuestion)
      const isStructuredGlobalQuestion = [
        'three-minute-guide',
        'ai-ux-role-guide',
        'ai-project-collection',
        'b-end-project-collection',
        'commercial-project-collection',
        'contact',
        'role-fit',
      ].includes(context.routeKey)
      const isGlobalQuestion = isStructuredGlobalQuestion
        || isGlobalGuideOrProjectCollectionQuestion(normalizedQuestion)
      const matchedProject = isGlobalQuestion
        ? null
        : (context.projectIndex
            ? getProjectKnowledgeByIndex(context.projectIndex)
            : getProjectByQuestion(trimmedQuestion, recentProjectIndexRef.current))
      if (matchedProject) recentProjectIndexRef.current = matchedProject.index

      const routedDeepDive = context.routeKey === 'deep-dive'
        ? getDeepDiveById(context.projectIndex, context.deepDiveId)
        : null
      const matchedDeepDive = routedDeepDive || (isGlobalQuestion
        ? null
        : getProjectDeepDiveByQuestion(trimmedQuestion, recentProjectIndexRef.current, matchedProject?.index))

      const answerText = buildAgentReply(trimmedQuestion, recentProjectIndexRef.current, {
        projectIndex: matchedProject?.index,
        deepDiveId: context.deepDiveId,
        routeKey: context.routeKey,
      })
      const relatedProjects = matchedProject ? [matchedProject] : getRelatedProjectsFromAnswer(answerText)
      const answerRouteKey = context.routeKey || getAnswerRouteKey(trimmedQuestion, {
        matchedProject,
        matchedDeepDive,
      })

      setMessages((current) => [...current, {
        role: 'agent',
        text: answerText,
        relatedProjects,
        followUps: getFollowUpSuggestions(trimmedQuestion, {
          askedQuestions,
          matchedProject: matchedProject || (relatedProjects.length === 1 ? relatedProjects[0] : null),
          matchedDeepDive,
          answerRouteKey,
        }),
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

  const navigateToProject = (project) => {
    if (project.externalUrl) {
      onProjectNavigate?.(project)
      window.location.assign(project.externalUrl)
      return
    }

    window.location.hash = `project-${project.index}`
    onProjectNavigate?.(project)
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
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
            <img src={avatarSrc} alt="" />
          </span>}
          {message.role === 'agent'
            ? <div className="agent-response-stack">
              <MarkdownMessage text={message.text} onCopyFeedback={showCopyFeedback} />
              <ProjectJumpLinks projects={message.relatedProjects} onNavigate={navigateToProject} />
              {message.followUps?.length > 0 && <div className="agent-follow-ups" aria-label="继续追问">
                <span>继续追问</span>
                {message.followUps.slice(0, 3).map((followUp) => <button
                  key={`${followUp.routeKey}-${followUp.projectIndex || 'global'}-${followUp.deepDiveId || followUp.query}`}
                  type="button"
                  onClick={() => submitQuestion(followUp.query, {
                    type: followUp.type,
                    routeKey: followUp.routeKey,
                    projectIndex: followUp.projectIndex,
                    deepDiveId: followUp.deepDiveId,
                  })}
                  disabled={isLoading}
                >
                  {followUp.query}
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
        <span className="agent-avatar" aria-hidden="true"><img src={avatarSrc} alt="" /></span>
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
  const projectNavigationRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return undefined

    projectNavigationRef.current = false

    const { body, documentElement } = document
    const scrollY = window.scrollY
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth
    const previousStyles = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: documentElement.style.overflow,
      htmlOverscrollBehavior: documentElement.style.overscrollBehavior,
      htmlScrollBehavior: documentElement.style.scrollBehavior,
    }

    documentElement.style.overflow = 'hidden'
    documentElement.style.overscrollBehavior = 'none'
    documentElement.style.scrollBehavior = 'auto'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      body.style.position = previousStyles.bodyPosition
      body.style.top = previousStyles.bodyTop
      body.style.left = previousStyles.bodyLeft
      body.style.right = previousStyles.bodyRight
      body.style.width = previousStyles.bodyWidth
      body.style.overflow = previousStyles.bodyOverflow
      body.style.paddingRight = previousStyles.bodyPaddingRight
      documentElement.style.overflow = previousStyles.htmlOverflow
      documentElement.style.overscrollBehavior = previousStyles.htmlOverscrollBehavior
      window.scrollTo({
        top: projectNavigationRef.current ? 0 : scrollY,
        left: 0,
        behavior: 'auto',
      })
      documentElement.style.scrollBehavior = previousStyles.htmlScrollBehavior
    }
  }, [isOpen])

  const handleProjectNavigate = () => {
    projectNavigationRef.current = true
    onClose()
  }

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
        <AgentChatPanel className="is-drawer" showHeader={false} onProjectNavigate={handleProjectNavigate} />
      </aside>
    </div>
  </>
}

export function PortfolioAssistantFab({ onOpen, className = '' }) {
  return <button type="button" className={`portfolio-assistant-fab ${className}`.trim()} onClick={onOpen}>
    <MessageCircle size={20} strokeWidth={2} />
    <span>AI作品集小助手</span>
  </button>
}
