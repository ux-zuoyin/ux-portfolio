import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AlertCircle, ArrowLeft, ArrowUp, ArrowUpRight, Check, MessageCircle, Phone, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles.css'
import BorderGlow from './components/BorderGlow'
import TextType from './components/TextType'
import TiltedCard from './components/TiltedCard'

gsap.registerPlugin(ScrollTrigger)

const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/${file}`

const projects = [
  {
    index: '01',
    title: '构建全链路发布器\nAIGC 辅助体系',
    meta: 'SOUL APP · 2025–2026',
    description: '从“不敢发”到“发得好”，以心智破冰、联想写作与确定性反馈重构内容发布体验。',
    image: assetUrl('project-01.png'),
    accent: '#ff3526',
    detailTitle: '发布器 AI 辅助发帖',
    detailSubtitle: '实现从「不敢发」到「发得好」的体验跃迁',
    detailMedia: Array.from({ length: 8 }, (_, index) => assetUrl(`project-01/1-${index + 1}.png`)),
  },
  {
    index: '02',
    title: '多维场景下的商业适配\nSoul 广告生态设计',
    meta: 'SOUL APP · 2024–2025',
    description: '在商业效率与社区体验之间建立平衡，搭建可持续演进的广告产品体验框架。',
    image: assetUrl('project-02.png'),
    accent: '#ff3526',
    detailMedia: Array.from({ length: 7 }, (_, index) => assetUrl(`project-02/2-${index + 1}.png`)),
  },
  {
    index: '03',
    title: '广告激励平台化\n从单点活动到玩法聚合',
    meta: '增长体验 · 2023–2024',
    description: '围绕任务、激励与转化链路，推动单次运营活动升级为可复用的平台能力。',
    image: assetUrl('project-03.png'),
    accent: '#ff3526',
    detailMedia: [1, 2, 8, 9, 10, 11, 12].map((index) => assetUrl(`project-03/2-${index}.png`)),
  },
  {
    index: '04',
    title: '支撑 Soul 主站\n3D 资产全链路管控',
    meta: 'NAWA · EFFECTCREATOR',
    description: '打通 3D 资产生产、审核、配置与投放流程，提升跨角色协同和内容交付效率。',
    image: assetUrl('project-04.png'),
    accent: '#ff3526',
    detailMedia: [
      '1.png',
      '2.png',
      '3.png',
      '4.png',
      '5.gif',
      '6.gif',
      '7-1.gif',
      '7-2.gif',
      '8.gif',
      '9-0.gif',
      '9-1.gif',
      '9-2.gif',
      '9-3.gif',
      '9-4.gif',
      '10.gif',
      '11.gif',
      '12.gif',
      '13.gif',
      '14.png',
    ].map((file) => assetUrl(`project-04/${file}`)),
  },
  {
    index: '05',
    title: '支撑用户反馈平台\n用户声音统一运营中枢',
    meta: 'SOUL APP · CONTENT CREATION',
    description: '打通工单处理、投诉收集与需求流转流程，沉淀用户一线反馈数据，支撑问题分析、功能迭代及效果验证，提升跨团队协同与产品优化效率。',
    image: assetUrl('project-05.png'),
    accent: '#ff3526',
    detailMedia: Array.from({ length: 16 }, (_, index) => assetUrl(`project-05/${index + 1}.gif`)),
  },
  {
    index: '06',
    title: '支撑活动搭投\n0代码活动快速搭建',
    meta: 'SOUL APP · HARMONYOS',
    description: '构建 0 代码活动搭投平台，支持 H5 页面可视化搭建、组件化配置与快速发布，实现活动资产标准化管理。缩短活动上线周期，提升运营自主性与投放效率。',
    image: assetUrl('project-06.png'),
    accent: '#ff3526',
    detailMedia: Array.from({ length: 16 }, (_, index) => assetUrl(`project-06/${index + 1}.gif`)),
  },
]

const capabilities = [
  ['01', '复杂系统体验设计', '从业务目标、角色关系到关键链路，建立可解释、可扩展的产品体验框架。'],
  ['02', 'AI × 创作体验', '将 AI 能力转译为用户可理解、可控制、可获得确定反馈的创作工具。'],
  ['03', '商业与增长设计', '兼顾用户体验与商业效率，通过机制设计推动转化、留存和生态健康。'],
  ['04', '跨团队推动落地', '连接产品、研发、算法和运营，用原型与设计策略推动复杂项目持续交付。'],
]

function Nav() {
  return <header className="nav shell">
    <a className="brand" href="#top"><span>SD</span> SARDINE DESIGN</a>
    <nav>
      <a href="#top">首页</a><a href="#experience">经历</a><a href="#work">项目 × 6</a><a href="#strength">个人优势</a>
    </nav>
    <a className="nav-contact" href="#contact">联系我 <ArrowUpRight size={16}/></a>
  </header>
}

function HomePage() {
  const heroVideoRef = useRef(null)
  const appRef = useRef(null)
  const toastTimerRef = useRef(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastSuccess, setToastSuccess] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const showCopyToast = (message, success) => {
    window.clearTimeout(toastTimerRef.current)
    setToastMessage(message)
    setToastSuccess(success)
    setToastVisible(true)
    toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 3200)
  }

  const copyWechat = () => {
    const wechatId = 'Sardine0717'
    let eventCopied = false
    const textarea = document.createElement('textarea')
    const handleCopy = (event) => {
      event.clipboardData.setData('text/plain', wechatId)
      event.preventDefault()
      eventCopied = true
    }

    try {
      textarea.value = wechatId
      textarea.readOnly = true
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '0'
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

    let clipboardWrite
    try {
      clipboardWrite = navigator.clipboard?.writeText?.(wechatId)
    } catch {
      clipboardWrite = null
    }
    if (clipboardWrite) {
      clipboardWrite
        .then(() => showCopyToast('微信号Sardine0717 复制成功，快去添加Ta的微信吧', true))
        .catch(() => showCopyToast(
          eventCopied ? '微信号Sardine0717 复制成功，快去添加Ta的微信吧' : '复制失败，请手动复制微信号：Sardine0717',
          eventCopied,
        ))
      return
    }

    showCopyToast(
      eventCopied ? '微信号Sardine0717 复制成功，快去添加Ta的微信吧' : '复制失败，请手动复制微信号：Sardine0717',
      eventCopied,
    )
  }

  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    }, { threshold: 0.1 })

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  useLayoutEffect(() => {
    const root = appRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const opening = gsap.timeline({ defaults: { ease: 'power4.out' } })

      opening
        .set('.nav, .hero-eyebrow-mask, .hero-title-mask, .hero-subtitle-mask, .hero-actions', { visibility: 'visible' })
        .fromTo('.opening-mark', { yPercent: 130, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1 }, 0.15)
        .fromTo('.opening-line', { scaleX: 0 }, { scaleX: 1, duration: 1.15 }, 0.25)
        .to('.opening-mark', { yPercent: -80, opacity: 0, duration: 0.65, ease: 'power3.in' }, 1.3)
        .to('.opening-curtain', { yPercent: -101, duration: 1.45, ease: 'power4.inOut' }, 1.45)
        .fromTo('.hero-media', { scale: 1.14 }, { scale: 1, duration: 2.4 }, 1.45)
        .fromTo('.nav', { y: -34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.15 }, 1.9)
        .fromTo('.hero-eyebrow-mask .eyebrow', { yPercent: 120 }, { yPercent: 0, duration: 1 }, 2.05)
        .fromTo('.hero-title-mask', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.5 }, 2.15)
        .fromTo('.hero-main-title', { y: 100, scaleX: 0.72, transformOrigin: '50% 50%' }, { y: 0, scaleX: 1, duration: 1.65 }, 2.15)
        .set('.hero-title-mask', { overflow: 'visible' }, 3.85)
        .to('.hero-main-title', { y: -18, scale: 0.84, duration: 1.15, ease: 'power4.inOut' }, 4.4)
        .fromTo('.hero-subtitle-mask', { clipPath: 'inset(0 0 100% 0)', y: 28, opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', y: 0, opacity: 1, duration: 1.05 }, 4.65)
        .fromTo('.hero-actions', { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 1.05 }, 5.25)

      gsap.utils.toArray('[data-motion-section]').forEach((section) => {
        const title = section.querySelector('.motion-title')
        const heading = section.querySelector('.section-label, .contact-inner > h3')
        const intro = section.querySelector('.experience-intro, .section-heading')
        const cards = section.querySelectorAll('[data-stagger-item]')

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 76%',
            once: true,
          },
          defaults: { ease: 'power4.out' },
        })

        if (title) {
          timeline.fromTo(title,
            { xPercent: section.classList.contains('strength') ? 22 : -22, scaleX: 0.72, opacity: 0 },
            { xPercent: 0, scaleX: 1, opacity: 1, duration: 1.55 },
          )
        }
        if (heading) timeline.fromTo(heading, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.8')
        if (intro) timeline.fromTo(intro, { y: 72, opacity: 0 }, { y: 0, opacity: 1, duration: 1.15 }, '-=0.65')
        if (cards.length) {
          timeline.fromTo(cards,
            { y: 110, opacity: 0, clipPath: 'inset(0 0 24% 0)' },
            { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.2, stagger: 0.13 },
            '-=0.65',
          )
        }
      })

    }, root)

    return () => context.revert()
  }, [])

  return <main id="top" ref={appRef}>
    <section className="hero">
      <video ref={heroVideoRef} className="hero-media" autoPlay muted loop playsInline preload="auto" poster={assetUrl('hero-cover.png')}>
        <source src={assetUrl('hero-video.mp4')} type="video/mp4" />
      </video>
      <div className="hero-shade" />
      <div className="hero-frost" />
      <div className="opening-curtain" aria-hidden="true">
        <div className="opening-mark">SARDINE DESIGN <span>PORTFOLIO 2026</span></div>
        <i className="opening-line" />
      </div>
      <Nav />
      <div className="hero-content shell">
        <div className="hero-copy">
          <div className="hero-eyebrow-mask"><div className="eyebrow">UX / PRODUCT / EXPERIENCE DESIGN</div></div>
          <div className="hero-heading-stage">
            <div className="hero-title-mask"><h1 className="hero-main-title">Hi，我是左胤</h1></div>
            <div className="hero-subtitle-mask">
            <TextType
              as="p"
              className="hero-statement"
              text="用设计思维与工程协同，让产品体验更可靠、更包容、更有竞争力"
              initialDelay={4550}
              variableSpeed={{ min: 38, max: 70 }}
              loop={false}
              cursorCharacter="|"
              startOnVisible={false}
            />
            </div>
          </div>
          <div className="hero-actions">
            <a href="#work" className="hero-primary">查看作品 <ArrowUpRight size={15}/></a>
            <a href="mailto:1641043413@qq.com" className="hero-email">1641043413@qq.com</a>
          </div>
        </div>
      </div>
    </section>

    <section className="experience-section section" id="experience" data-motion-section>
      <div className="shell">
      <div className="motion-title" aria-hidden="true">EXPERIENCE</div>
      <div className="section-label">01 / EXPERIENCE</div>
      <div className="experience-intro">
        <div><div className="status"><i/> SENIOR UX / PRODUCT DESIGNER</div><h2>9 年设计实践，<br/>持续处理复杂问题。</h2></div>
        <p>曾负责 Soul App 核心业务体验设计，覆盖内容创作、商业化、增长与 3D 资产平台。擅长将复杂业务与技术能力，转化为清晰、自然且可持续演进的用户体验。</p>
      </div>
      <div className="stats">
          <div data-stagger-item><strong>9<sup>+</sup></strong><span>年设计经验</span></div><div data-stagger-item><strong>4<sup>+</sup></strong><span>业务领域</span></div><div data-stagger-item><strong>30<sup>+</sup></strong><span>核心项目</span></div><div data-stagger-item><strong>0→1<sup className="stat-spacer" aria-hidden="true">+</sup></strong><span>复杂产品搭建</span></div>
      </div>
      <div className="experience">
        <div className="experience-title">CAREER PATH <span>2016 — 2026</span></div>
        <div className="timeline">
          <div data-stagger-item><time>2021.06 — 2026.05</time><b>Soul App</b><span>资深UX体验设计师</span></div><div data-stagger-item><time>2018 — 2021</time><b>VIP 陪练</b><span>高级 UI 设计师</span></div><div data-stagger-item><time>2017 — 2018</time><b>全旗金融信息服务有限公司</b><span>高级 UI 设计师</span></div><div data-stagger-item><time>2016 — 2017</time><b>苏州海云网络科技有限公司</b><span>UI 设计师</span></div>
        </div>
      </div>
      </div>
    </section>

    <section className="work section" id="work" data-motion-section>
      <div className="shell">
        <div className="motion-title" aria-hidden="true">PROJECTS</div>
        <div className="section-label">02 / PROJECTS · 06</div>
        <div className="section-heading"><h2>六个项目，六种<br/>复杂问题的解法。</h2><p>SELECTED CASES<br/>2023 — 2026</p></div>
        <div className="project-list">
          {projects.map((p) => <BorderGlow className="project-glow" key={p.index} data-stagger-item>
            <a className="project-card project-link" href={`#project-${p.index}`} style={{'--accent': p.accent}} aria-label={`查看项目：${p.title.replace('\n', ' ')}`}>
              <div className="project-cover">
                <div className="project-media">
                  <TiltedCard
                    imageSrc={p.image}
                    altText={p.title.replace('\n', ' ')}
                    rotateAmplitude={5}
                    scaleOnHover={1.1}
                  />
                </div>
              </div>
              <div className="project-info">
                <div className="project-top"><span>{p.index}</span><span>{p.meta}</span></div>
                <div className="project-content"><h3>{p.title.split('\n').map((line,i)=><React.Fragment key={line}>{line}{i===0&&<br/>}</React.Fragment>)}</h3><p>{p.description}</p></div>
                <div className="project-arrow"><ArrowUpRight/></div>
              </div>
            </a>
          </BorderGlow>)}
        </div>
      </div>
    </section>

    <section className="strength section" id="strength" data-motion-section>
      <div className="shell">
      <div className="motion-title" aria-hidden="true">CAPABILITY</div>
      <div className="section-label">03 / CAPABILITY</div>
      <div className="section-heading"><h2>不止是界面，<br/>更是系统与结果。</h2><p>HOW I<br/>CREATE VALUE</p></div>
      <div className="capability-grid">
        {capabilities.map(([n,t,d])=><article key={n} data-stagger-item><span>{n}</span><Sparkles size={24}/><h3>{t}</h3><p>{d}</p></article>)}
      </div>
      </div>
    </section>

    <footer className="contact" id="contact" data-motion-section>
      <div className="contact-grid"/><div className="shell contact-inner">
        <div className="motion-title" aria-hidden="true">CONTACT</div>
        <h3>期待与新产品团队一起，<br/>把体验做得更可靠、更包容、更有竞争力。</h3>
        <div className="contact-actions">
          <button className="contact-primary" type="button" onClick={copyWechat} data-stagger-item><MessageCircle size={16}/> 获取微信联系方式</button>
          <a className="contact-secondary" href="tel:18621918554" data-stagger-item><Phone size={15}/> 186 2191 8554</a>
        </div>
        <div className="footer-row"><span>WECHAT · SARDINE0717</span><span>SHANGHAI · CHINA</span><span>© 2026 ZUO YIN</span></div>
      </div>
    </footer>
    <div className={`copy-toast${toastVisible ? ' is-visible' : ''}${toastSuccess ? '' : ' is-error'}`} role="status" aria-live="polite">
      {toastSuccess ? <Check size={17}/> : <AlertCircle size={17}/>}<span>{toastMessage}</span>
    </div>
  </main>
}

function ProjectDetail({ project }) {
  const detailRef = useRef(null)
  const projectIndex = projects.findIndex((item) => item.index === project.index)
  const previousProject = projects[(projectIndex - 1 + projects.length) % projects.length]
  const nextProject = projects[(projectIndex + 1) % projects.length]

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } })
      timeline
        .fromTo('.detail-nav', { y: -28, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.2)
        .fromTo('.detail-carousel', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1.25 }, 0.45)
        .fromTo('.detail-current .detail-cover-card', { clipPath: 'inset(0 100% 0 0)', scale: 1.06 }, { clipPath: 'inset(0 0% 0 0)', scale: 1, duration: 1.4 }, 0.65)
        .fromTo('.detail-current .detail-slide-copy', { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1 }, 0.95)

      gsap.utils.toArray('.detail-media-item').forEach((item) => {
        gsap.fromTo(item, { y: 100, opacity: 0, clipPath: 'inset(0 0 18% 0)' }, {
          y: 0,
          opacity: 1,
          clipPath: 'inset(0 0 0% 0)',
          duration: 1.25,
          ease: 'power4.out',
          scrollTrigger: { trigger: item, start: 'top 82%', once: true },
        })
      })
    }, detailRef)

    return () => context.revert()
  }, [project.index])

  return <main className="project-detail" ref={detailRef}>
    <section className="detail-hero">
      <header className="detail-nav shell">
        <a className="brand" href="#work"><span>SD</span> SARDINE DESIGN</a>
        <a className="detail-back" href="#work"><ArrowLeft size={16}/> 返回项目列表</a>
      </header>
      <div className="detail-carousel" aria-label="项目切换">
        <a className="detail-slide detail-side detail-previous" href={`#project-${previousProject.index}`} aria-label={`上一个项目：${previousProject.title.replace('\n', ' ')}`}>
          <img src={previousProject.image} alt=""/>
          <div><strong>{previousProject.title.split('\n')[0]}</strong><span>{previousProject.meta}</span></div>
        </a>
        <article className="detail-slide detail-current">
          <div className="detail-cover-card"><img src={project.image} alt={`${project.title.replace('\n', ' ')}封面`}/></div>
          <div className="detail-slide-copy">
            <div className="detail-kicker">PROJECT {project.index} / {project.meta}</div>
            <h1>{(project.detailTitle || project.title.replace('\n', ' ')).split(' ').map((part) => <span className="detail-title-mask" key={part}><span className="detail-title-line">{part}</span></span>)}</h1>
            <p className="detail-subtitle">{project.detailSubtitle || project.description}</p>
          </div>
        </article>
        <a className="detail-slide detail-side detail-next" href={`#project-${nextProject.index}`} aria-label={`下一个项目：${nextProject.title.replace('\n', ' ')}`}>
          <img src={nextProject.image} alt=""/>
          <div><strong>{nextProject.title.split('\n')[0]}</strong><span>{nextProject.meta}</span></div>
        </a>
      </div>
    </section>

    <section className="detail-body">
      <div className="shell detail-intro">
        <div className="section-label">CASE STUDY / OVERVIEW</div>
        <div className="detail-intro-grid">
          <h2>{project.title.split('\n').map((line) => <React.Fragment key={line}>{line}<br/></React.Fragment>)}</h2>
          <p>{project.description}</p>
        </div>
      </div>
      <div className="shell detail-media-stack">
        {(project.detailMedia || [project.image]).map((media, index) => <figure className="detail-media-item" key={media}>
          {media.toLowerCase().endsWith('.gif')
            ? <img src={media} alt={`${project.detailTitle || project.title.replace('\n', ' ')} 动效 ${index + 1}`}/>
            : <img src={media} alt={`${project.detailTitle || project.title.replace('\n', ' ')} 展示图 ${index + 1}`}/>}
        </figure>)}
      </div>
    </section>
    <button
      className="back-to-top"
      type="button"
      aria-label="回到顶部"
      title="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={22}/>
    </button>
  </main>
}

function App() {
  const getProjectFromHash = () => projects.find((project) => window.location.hash === `#project-${project.index}`)
  const [activeProject, setActiveProject] = useState(getProjectFromHash)

  useEffect(() => {
    const handleHashChange = () => setActiveProject(getProjectFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return activeProject ? <ProjectDetail project={activeProject}/> : <HomePage/>
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
