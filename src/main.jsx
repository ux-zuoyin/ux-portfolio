import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AlertCircle, ArrowLeft, ArrowUp, ArrowUpRight, Check, MessageCircle, Phone, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles.css'
import BorderGlow from './components/BorderGlow'
import TiltedCard from './components/TiltedCard'
import TargetCursor from './components/TargetCursor'
import AIPortfolioAgent, { AIPortfolioAssistantDrawer, PortfolioAssistantFab } from './components/AIPortfolioAgent'
import { projects, projectCategories } from './data/projects'

gsap.registerPlugin(ScrollTrigger)

const scrollToPageTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

const capabilities = [
  ['01', '复杂系统体验设计', '从业务目标、角色关系到关键链路，建立可解释、可扩展的产品体验框架。'],
  ['02', 'AI × 创作体验', '将 AI 能力转译为用户可理解、可控制、可获得确定反馈的创作工具。'],
  ['03', '商业与增长设计', '兼顾用户体验与商业效率，通过机制设计推动转化、留存和生态健康。'],
  ['04', '跨团队推动落地', '连接产品、研发、算法和运营，用原型与设计策略推动复杂项目持续交付。'],
]

function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const updateNav = () => setIsScrolled(window.scrollY > 80)
    updateNav()
    window.addEventListener('scroll', updateNav, { passive: true })
    return () => window.removeEventListener('scroll', updateNav)
  }, [])

  return <>
    <header className={`nav shell${isScrolled ? ' nav-scrolled' : ''}`}>
      <a className="brand" href="#top">SARDINE DESIGN</a>
      <nav>
        <a href="#top">首页</a><a href="#experience">经历</a><a href="#work">项目 × 7</a><a href="#strength">个人优势</a>
      </nav>
      <a className="nav-contact" href="#contact">联系我 <ArrowUpRight size={16}/></a>
    </header>
    <div className="nav-spacer" aria-hidden="true"/>
  </>
}

function HomePage() {
  const heroVideoRef = useRef(null)
  const appRef = useRef(null)
  const toastTimerRef = useRef(null)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [hasPassedHero, setHasPassedHero] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastSuccess, setToastSuccess] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [activeProjectCategory, setActiveProjectCategory] = useState('全部')
  const visibleProjects = activeProjectCategory === '全部'
    ? projects
    : projects.filter((project) => project.category === activeProjectCategory)

  const jumpToProjectCategory = (category) => {
    setActiveProjectCategory(category)
    window.requestAnimationFrame(() => {
      document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

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

  useEffect(() => {
    const updateAssistantFab = () => setHasPassedHero(window.scrollY > window.innerHeight * 0.9)
    updateAssistantFab()
    window.addEventListener('scroll', updateAssistantFab, { passive: true })
    window.addEventListener('resize', updateAssistantFab)
    return () => {
      window.removeEventListener('scroll', updateAssistantFab)
      window.removeEventListener('resize', updateAssistantFab)
    }
  }, [])

  useLayoutEffect(() => {
    const root = appRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const opening = gsap.timeline({ defaults: { ease: 'power4.out' } })

      opening
        .set('.nav, .hero-eyebrow-mask, .hero-title-mask, .hero-subtitle-mask, .hero-actions', { visibility: 'visible' })
        .fromTo('.opening-mark', { yPercent: 130, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.75 }, 0.1)
        .fromTo('.opening-line', { scaleX: 0 }, { scaleX: 1, duration: 0.9 }, 0.18)
        .to('.opening-mark', { yPercent: -80, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0.95)
        .to('.opening-curtain', { yPercent: -101, duration: 1.15, ease: 'power4.inOut' }, 1.08)
        .fromTo('.hero-media', { scale: 1.1 }, { scale: 1, duration: 1.9 }, 1.08)
        .fromTo('.nav', { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 1.42)
        .fromTo('.hero-eyebrow-mask .eyebrow', { yPercent: 100 }, { yPercent: 0, duration: 0.75 }, 1.55)
        .set('.hero-title-mask', { overflow: 'visible' }, 1.65)
        .fromTo('.hero-actions', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 2.1)

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
          if (section.classList.contains('experience-section')) {
            timeline.fromTo(title,
              { y: 28, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.9 },
            )
          } else {
            timeline.fromTo(title,
              { xPercent: section.classList.contains('strength') ? 22 : -22, scaleX: 0.72, opacity: 0 },
              { xPercent: 0, scaleX: 1, opacity: 1, duration: 1.55 },
            )
          }
        }
        if (heading) timeline.fromTo(heading, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.8')
        if (intro) timeline.fromTo(intro, { y: 72, opacity: 0 }, { y: 0, opacity: 1, duration: 1.15 }, '-=0.65')
        if (cards.length) {
          timeline.fromTo(cards,
            { y: 64, opacity: 0, clipPath: 'inset(0 0 14% 0)' },
            { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.9, stagger: 0.1 },
            '-=0.65',
          )
        }
      })

    }, root)

    return () => context.revert()
  }, [])

  return <main id="top" ref={appRef}>
    <section className="hero">
      <video ref={heroVideoRef} className="hero-media" autoPlay muted loop playsInline preload="auto" poster={`${import.meta.env.BASE_URL}assets/hero-cover.webp`}>
        <source src={`${import.meta.env.BASE_URL}assets/hero-video.mp4`} type="video/mp4" />
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
          <div className="hero-eyebrow-mask"><div className="eyebrow">AI PRODUCT DESIGN / UX EXPERIENCE</div></div>
          <div className="hero-heading-stage">
            <div className="hero-title-mask"><h1 className="hero-main-title">Hi，我是左胤</h1></div>
            <div className="hero-subtitle-mask">
              <p className="hero-statement">9年UX设计经验，前 Soul UX 设计师。<br />聚焦 AI 产品体验与复杂系统设计，擅长将 AI 能力转化为用户可理解、可信任、可持续使用的产品体验</p>
            </div>
          </div>
          <div className="hero-actions">
            <button type="button" className="hero-primary hero-ai-entry" onClick={() => jumpToProjectCategory('AI产品体验设计')}>
              <span className="hero-action-badge">推荐</span>
              查看AI作品
            </button>
            <button type="button" className="hero-email" onClick={() => jumpToProjectCategory('全部')}>查看全部作品</button>
          </div>
        </div>
      </div>
    </section>

    <AIPortfolioAgent onOpen={() => setIsAssistantOpen(true)} />

    <section className="experience-section section" id="experience" data-motion-section>
      <div className="shell">
      <div className="motion-title" aria-hidden="true">EXPERIENCE</div>
      <div className="section-label">01 / EXPERIENCE</div>
      <div className="experience-intro">
        <div><div className="status"><i/> SENIOR UX / PRODUCT DESIGNER</div><h2>9年设计实践，<br/>聚焦UX产品体验设计。</h2></div>
        <p>曾负责 Soul App 核心业务体验设计，覆盖内容创作、广告商业化、增长、3D资产平台与 AI 记忆 / 用户画像探索。<br/><br/>我的优势是从复杂业务问题出发，梳理产品机制与系统链路，并将 AI 能力转化为清晰、自然、可信任的用户体验。</p>
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
        <div className="section-label">02 / PROJECTS · 07</div>
        <div className="section-heading"><h2>七个项目，七种<br/>复杂问题的解法。</h2><p>SELECTED CASES<br/>2021 — 2026</p></div>
        <div className="project-tabs" role="tablist" aria-label="项目分类">
          {projectCategories.map((category) => <button
            className={activeProjectCategory === category ? 'is-active' : ''}
            key={category}
            type="button"
            role="tab"
            aria-selected={activeProjectCategory === category}
            onClick={() => setActiveProjectCategory(category)}
          >
            {category}
            {category === 'AI产品体验设计' && <span className="project-tab-badge">HOT</span>}
          </button>)}
        </div>
        <div className="project-list" key={activeProjectCategory}>
          {visibleProjects.map((p) => <BorderGlow className="project-glow" key={p.index} data-stagger-item>
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
                <div className="project-content">
                  <h3>{p.title.split('\n').map((line,i)=><React.Fragment key={line}>{line}{i===0&&<br/>}</React.Fragment>)}</h3>
                  <p>{p.description}</p>
                  <div className="project-tags" aria-label="项目标签">{p.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
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
    {hasPassedHero && <PortfolioAssistantFab onOpen={() => setIsAssistantOpen(true)} />}
    <AIPortfolioAssistantDrawer isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
  </main>
}

function DetailVideo({ media, label }) {
  const videoRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsLoaded(true)
        video.play().catch(() => {})
      }
      else video.pause()
    }, { threshold: 0.15, rootMargin: '320px 0px' })

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (isLoaded && video) video.play().catch(() => {})
  }, [isLoaded])

  return <video ref={videoRef} src={isLoaded ? media : undefined} aria-label={label} loop muted playsInline preload="none"/>
}

function ProjectDetail({ project }) {
  const detailRef = useRef(null)
  const [isNavScrolled, setIsNavScrolled] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const projectIndex = projects.findIndex((item) => item.index === project.index)
  const previousProject = projects[(projectIndex - 1 + projects.length) % projects.length]
  const nextProject = projects[(projectIndex + 1) % projects.length]

  useEffect(() => {
    const updateNav = () => setIsNavScrolled(window.scrollY > 80)
    updateNav()
    window.addEventListener('scroll', updateNav, { passive: true })
    return () => window.removeEventListener('scroll', updateNav)
  }, [])

  useLayoutEffect(() => {
    scrollToPageTop()
    const scrollResetFrame = window.requestAnimationFrame(scrollToPageTop)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => window.cancelAnimationFrame(scrollResetFrame)
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } })
      timeline
        .fromTo('.detail-carousel', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.05)
        .fromTo('.detail-current .detail-cover-card', { clipPath: 'inset(0 100% 0 0)', scale: 1.03 }, { clipPath: 'inset(0 0% 0 0)', scale: 1, duration: 0.9 }, 0.15)
        .fromTo('.detail-current .detail-slide-copy', { x: 32, opacity: 0 }, { x: 0, opacity: 1, duration: 0.75 }, 0.3)

      gsap.utils.toArray('.detail-media-item').forEach((item) => {
        gsap.fromTo(item, { y: 52, opacity: 0, clipPath: 'inset(0 0 10% 0)' }, {
          y: 0,
          opacity: 1,
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.85,
          ease: 'power4.out',
          scrollTrigger: { trigger: item, start: 'top 82%', once: true },
        })
      })
    }, detailRef)

    return () => {
      window.cancelAnimationFrame(scrollResetFrame)
      context.revert()
    }
  }, [project.index])

  return <main className="project-detail" ref={detailRef}>
    <section className="detail-hero">
      <header className={`detail-nav shell${isNavScrolled ? ' nav-scrolled' : ''}`}>
        <a className="brand" href="#work">SARDINE DESIGN</a>
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
            <h1>{(project.detailTitle || project.title.replace('\n', ' ')).split(' ').map((part) => <span className="detail-title-mask" key={part}><span className="detail-title-line">{part}</span></span>)}</h1>
            <p className="detail-subtitle">{project.detailSubtitle || project.description}</p>
            <div className="detail-tags" aria-label="项目标签">
              {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
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
        {(project.detailMedia || [project.image]).map((media, index) => {
          const isVideo = media.toLowerCase().endsWith('.mp4')
          return <figure className={`detail-media-item${isVideo ? ' detail-media-video' : ''}`} key={media}>
            {isVideo
              ? <DetailVideo media={media} label={`${project.detailTitle || project.title.replace('\n', ' ')} 动效 ${index + 1}`}/>
              : <img src={media} alt={`${project.detailTitle || project.title.replace('\n', ' ')} 展示图 ${index + 1}`} loading="lazy" decoding="async"/>}
          </figure>
        })}
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
    <PortfolioAssistantFab onOpen={() => setIsAssistantOpen(true)} />
    <AIPortfolioAssistantDrawer isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
  </main>
}

function App() {
  const getProjectFromHash = () => projects.find((project) => window.location.hash === `#project-${project.index}`)
  const [activeProject, setActiveProject] = useState(getProjectFromHash)
  const activeProjectIndexRef = useRef(activeProject?.index || null)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const nextProject = getProjectFromHash()
      const nextProjectIndex = nextProject?.index || null

      const isCrossingHomeBoundary = Boolean(activeProjectIndexRef.current) !== Boolean(nextProjectIndex)

      if (isCrossingHomeBoundary) {
        window.location.reload()
        return
      }

      activeProjectIndexRef.current = nextProjectIndex
      setActiveProject(nextProject)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return <>
    <TargetCursor
      targetSelector="a, button, .project-card, .capability-grid article"
      spinDuration={2}
      hideDefaultCursor
      parallaxOn
    />
    {activeProject ? <ProjectDetail project={activeProject}/> : <HomePage/>}
  </>
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
