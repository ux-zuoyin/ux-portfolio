# 作品集项目模板

新增项目时，优先在 `src/data/projects.js` 中新增一条项目数据。当前页面仍使用兼容字段渲染首页卡片和详情页，后续可以逐步补充结构化字段。

## 项目基础字段

```js
{
  id: 'project-08',
  index: '08',
  title: '项目标题\n第二行标题',
  subtitle: '项目副标题，说明项目背景、目标或核心价值。',
  category: 'AI产品体验设计',
  tags: ['标签一', '标签二', '标签三'],
  cover: 'project-cover.webp',
  role: 'UX / Product Designer',
  duration: '2026.01 - 2026.03'
}
```

## 当前页面兼容字段

当前首页和详情页直接读取以下字段。新增项目必须保证这些字段可用。

```js
{
  index: '08',
  title: '项目标题\n第二行标题',
  meta: 'SOUL APP · 2026',
  description: '当前页面使用的项目描述，会展示在首页卡片和详情页概览。',
  tags: ['标签一', '标签二', '标签三'],
  image: assetUrl('project-cover.webp'),
  accent: '#ff3526',
  detailTitle: '详情页标题',
  detailSubtitle: '详情页副标题',
  detailMedia: [
    assetUrl('project-08/1.webp'),
    assetUrl('project-08/2.webp')
  ],
  category: 'AI产品体验设计'
}
```

字段映射建议：

- `subtitle` 对应当前 `description`
- `cover` 对应当前 `image`
- `images` 对应当前 `detailMedia`

## 后续结构化字段

这些字段用于未来升级详情页模板，不要求当前页面立即渲染。

```js
{
  background: '项目背景',
  problem: '核心问题',
  goal: '设计目标',
  process: [
    '调研与问题定义',
    '方案探索',
    '原型验证',
    '上线复盘'
  ],
  solution: '最终方案',
  designDecisions: [
    '关键设计决策一',
    '关键设计决策二'
  ],
  value: '项目价值',
  takeaways: [
    '复盘结论一',
    '复盘结论二'
  ],
  images: [
    'project-08/1.webp',
    'project-08/2.webp'
  ],
  relatedCapabilities: [
    'AI产品体验',
    '复杂系统设计'
  ]
}
```

## AI 助手知识库同步字段

新增项目后，需要同步更新 `src/data/portfolioKnowledge.js`。至少补充：

```js
{
  title: '项目名称',
  category: 'AI 产品体验设计',
  keywords: ['关键词一', '关键词二'],
  background: '项目背景',
  conflict: '核心冲突或问题',
  designJudgment: '设计判断',
  solution: '解决方案',
  value: '项目价值',
  summary: '面试官可快速理解的一句话总结'
}
```

如果项目能支撑某类面试问题，也需要同步检查：

- `portfolioKnowledge.projects`
- `portfolioKnowledge.aiKnowledgeBase`
- `portfolioKnowledge.interviewKnowledge.evidenceMap`
- `portfolioKnowledge.recommendedQuestions`

## 新增项目检查清单

- [ ] `index` 不与现有项目重复。
- [ ] `category` 使用 `projectCategories` 中已有分类。
- [ ] `title` 可以使用 `\n` 控制首页和详情页换行。
- [ ] `tags` 数量控制在 3 个左右。
- [ ] `image` 使用 `assetUrl(...)`，不要写死 `/assets/...`。
- [ ] `detailMedia` 按展示顺序填写，图片用 `.webp`，动效用 `.mp4`。
- [ ] 新素材放在 `public/assets/项目目录/` 下。
- [ ] 同步更新 `src/data/portfolioKnowledge.js`。
- [ ] 运行 `npm run build`。
- [ ] 手动检查 `#work`、对应 `#project-xx`、分类 tab 和移动端展示。
