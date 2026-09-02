import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AlertCircle, ArrowLeft, ArrowUp, ArrowUpRight, Check, MessageCircle, Phone, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles.css'
import BorderGlow from './components/BorderGlow'
import DotField from './components/DotField'
import TiltedCard from './components/TiltedCard'
import TargetCursor from './components/TargetCursor'
import { AIPortfolioAssistantDrawer, PortfolioAssistantFab } from './components/AIPortfolioAgent'
import { projects, projectCategories } from './data/projects'

gsap.registerPlugin(ScrollTrigger)

const scrollToPageTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
const detailReturnTargetKey = 'portfolio:return-to-work'

const markDetailReturnToWork = () => {
  window.sessionStorage.setItem(detailReturnTargetKey, '1')
}

const consumeDetailReturnToWork = () => {
  const shouldReturnToWork = window.sessionStorage.getItem(detailReturnTargetKey) === '1'
  if (shouldReturnToWork) window.sessionStorage.removeItem(detailReturnTargetKey)
  return shouldReturnToWork
}

const capabilities = [
  ['01', '复杂系统体验设计', '从业务目标、角色关系到关键链路，建立可解释、可扩展的产品体验框架。'],
  ['02', 'AI × 创作体验', '将 AI 能力转译为用户可理解、可控制、可获得确定反馈的创作工具。'],
  ['03', '商业与增长设计', '兼顾用户体验与商业效率，通过机制设计推动转化、留存和生态健康。'],
  ['04', '跨团队推动落地', '连接产品、研发、算法和运营，用原型与设计策略推动复杂项目持续交付。'],
]

const projectCount = projects.length
function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const updateNav = () => {
      const heroHeight = document.querySelector('.hero')?.offsetHeight || window.innerHeight
      setIsScrolled(window.scrollY >= heroHeight - 94)
    }
    updateNav()
    window.addEventListener('scroll', updateNav, { passive: true })
    window.addEventListener('resize', updateNav)
    return () => {
      window.removeEventListener('scroll', updateNav)
      window.removeEventListener('resize', updateNav)
    }
  }, [])

  return <>
    <header className={`nav shell${isScrolled ? ' nav-scrolled' : ''}`}>
      <a className="brand" href="#top">SARDINE DESIGN</a>
      <nav>
        <a href="#top">首页</a><a href="#experience">经历</a><a href="#work">项目 × {projectCount}</a><a href="#strength">个人优势</a>
      </nav>
      <a className="nav-contact" href="#contact">联系我 <ArrowUpRight size={16}/></a>
    </header>
  </>
}

function HomePage() {
  const appRef = useRef(null)
  const heroTitleRef = useRef(null)
  const strengthRef = useRef(null)
  const contactRef = useRef(null)
  const toastTimerRef = useRef(null)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [hasPassedHero, setHasPassedHero] = useState(false)
  const [isHeroDimmed, setIsHeroDimmed] = useState(false)
  const [isFinalPage, setIsFinalPage] = useState(false)
  const [isStrengthActive, setIsStrengthActive] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastSuccess, setToastSuccess] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [activeProjectCategory, setActiveProjectCategory] = useState('全部')
  const visibleProjects = (activeProjectCategory === '全部'
    ? projects
    : projects.filter((project) => (
      project.category === activeProjectCategory
      || project.categories?.includes(activeProjectCategory)
    )))
    .slice()
    .sort((a, b) => Number(a.index) - Number(b.index))

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

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  useEffect(() => {
    const updateScrollState = () => {
      const titleScrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight * 0.55, 1), 1)
      if (heroTitleRef.current) {
        heroTitleRef.current.style.setProperty('--hero-title-scroll-y', `${-titleScrollProgress * window.innerHeight * 0.2}px`)
        heroTitleRef.current.style.setProperty('--hero-title-opacity', String(1 - titleScrollProgress))
      }
      const hasReachedStrength = strengthRef.current?.getBoundingClientRect().top <= window.innerHeight * 0.68
      const hasReachedContact = contactRef.current?.getBoundingClientRect().top <= window.innerHeight * 0.65
      setHasPassedHero(window.scrollY > window.innerHeight * 0.9)
      setIsFinalPage(Boolean(hasReachedContact))
      setIsStrengthActive(Boolean(hasReachedStrength))
      setIsHeroDimmed(window.scrollY > window.innerHeight * 0.55 && !hasReachedContact)
    }
    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [])

  useLayoutEffect(() => {
    const root = appRef.current
    if (!root) return

    const shouldReturnToWork = consumeDetailReturnToWork()
    const shouldSkipHomeMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 800px)').matches
    if (shouldReturnToWork) {
      gsap.set(root.querySelectorAll('.motion-title, [data-stagger-item]'), { clearProps: 'transform,opacity,clipPath' })
      const scrollFrame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById('work')?.scrollIntoView({ behavior: 'auto', block: 'start' })
        })
      })
      return () => window.cancelAnimationFrame(scrollFrame)
    }

    if (shouldSkipHomeMotion) {
      gsap.set(root.querySelectorAll('.motion-title, [data-stagger-item]'), { clearProps: 'transform,opacity,clipPath' })
      return
    }

    const context = gsap.context(() => {
      gsap.utils.toArray('[data-motion-section]').forEach((section) => {
        const title = section.querySelector('.motion-title')
        const heading = section.querySelector('.section-label, .contact-inner > h3')
        const intro = section.querySelector('.experience-intro, .section-heading')
        const cards = section.querySelectorAll('[data-stagger-item]')
        const isContact = section.classList.contains('contact')

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 76%',
            once: true,
          },
          defaults: { ease: 'power4.out' },
        })

        if (isContact) {
          timeline.fromTo(section.querySelector('.contact-inner'),
            { yPercent: 64 },
            { yPercent: 0, duration: 1.2, ease: 'power4.out' },
          )
        } else if (title) {
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
        if (heading && !isContact) timeline.fromTo(heading, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.8')
        if (intro) timeline.fromTo(intro, { y: 72, opacity: 0 }, { y: 0, opacity: 1, duration: 1.15 }, '-=0.65')
        if (cards.length && !isContact) {
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
    <Nav />
    <section className={`hero${isHeroDimmed ? ' is-dimmed' : ''}`}>
      <img className="hero-blocks" src={`${import.meta.env.BASE_URL}assets/hero-blocks.png`} alt="" aria-hidden="true" />
      <DotField
        className="hero-dot-field"
        aria-hidden="true"
        dotRadius={1.5}
        dotSpacing={14}
        bulgeStrength={67}
        glowRadius={180}
        gradientFrom="rgba(85, 0, 195, 0.52)"
        gradientTo="rgba(185, 156, 255, 0.24)"
        glowColor="rgba(85, 0, 195, 0.32)"
      />
      <div ref={heroTitleRef} className="shell hero-text-container">
        <img className="hero-welcome" src={`${import.meta.env.BASE_URL}assets/hero-welcome.png`} alt="欢迎光临" />
        <img className="hero-brand" src={`${import.meta.env.BASE_URL}assets/hero-brand.png`} alt="沙丁鱼设计小卖铺" />
      </div>
      <img className="hero-header-left" src={`${import.meta.env.BASE_URL}assets/header-left.png`} alt="" />
      <img className="hero-header-right" src={`${import.meta.env.BASE_URL}assets/header-right.png`} alt="" />
      <img className="hero-footer-left" src={`${import.meta.env.BASE_URL}assets/footer-left.png`} alt="" />
      <img className="hero-footer-right" src={`${import.meta.env.BASE_URL}assets/footer-right.png`} alt="" />
      <img className={`hero-subject hero-subject-default${isStrengthActive || isFinalPage ? ' is-hidden' : ''}`} src={`${import.meta.env.BASE_URL}assets/hero-subject.png`} alt="" aria-hidden="true" fetchPriority="high" />
      <img className={`hero-subject hero-subject-like${isStrengthActive || isFinalPage ? ' is-visible' : ''}`} src={`${import.meta.env.BASE_URL}assets/hero-subject-like.png`} alt="" aria-hidden="true" />
      <div className="hero-scroll-overlay" aria-hidden="true" />
    </section>

    <section className="experience-section section" id="experience" data-motion-section>
      <div className="shell">
      <div className="experience-intro">
        <div><div className="status"><i/> UX / PRODUCT DESIGNER</div><h2>Hi 我是左胤<br/>UX体验设计师</h2></div>
        <p>前 Soul APP 用户体验设计师，近几年主要聚焦复杂产品与 AI 体验，具备 C 端社区与商业化、内容工具、B 端复杂系统及鸿蒙多端项目经验。<br/><br/>擅长从业务目标和用户问题出发，完成问题定义、信息架构、复杂流程、关键交互与 UI 视觉设计，并通过原型验证、数据反馈和跨团队协作推动方案落地。<br/><br/>将 AI 辅助分析、视觉生成与 Coding 原型融入日常设计流程，以更低成本验证关键判断，提升方案沟通与交付效率。</p>
      </div>
      <div className="stats">
          <div data-stagger-item><strong>C / B / AI</strong><span>产品类型</span></div><div data-stagger-item><strong>10<sup>+</sup></strong><span>复杂系统与工具</span></div><div data-stagger-item><strong>30<sup>+</sup></strong><span>核心项目</span></div><div data-stagger-item><strong>0→1<sup className="stat-spacer" aria-hidden="true">+</sup></strong><span>产品搭建与落地</span></div>
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
        <div className="section-heading"><h2>多个项目，多个<br/>复杂问题的解法。</h2><p>SELECTED CASES<br/>2021 — 2026</p></div>
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
            {category === 'UX体验设计' && <span className="project-tab-badge">HOT</span>}
          </button>)}
        </div>
        <div className="project-list" key={activeProjectCategory}>
          {visibleProjects.map((p) => <BorderGlow className="project-glow" key={p.index} data-stagger-item>
            <a
              className={`project-card project-link${p.coverOnly ? ' is-cover-only' : ''}`}
              href={p.externalUrl || `#project-${p.index}`}
              style={{'--accent': p.accent}}
              aria-label={`${p.externalUrl ? '访问外部项目' : '查看项目'}：${p.title.replace(/\n/g, ' ')}`}
            >
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
              {!p.coverOnly && <div className="project-info">
                <div className="project-top"><span>{p.index}</span><span>{p.meta}</span></div>
                <div className="project-content">
                  <h3>{p.title.replace(/\n/g, ' ')}</h3>
                  <p>{p.description}</p>
                  <div className="project-tags" aria-label="项目标签">{p.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <div className="project-arrow"><ArrowUpRight/></div>
              </div>}
            </a>
          </BorderGlow>)}
        </div>
      </div>
    </section>

    <section ref={strengthRef} className="strength section" id="strength" data-motion-section>
      <div className="shell">
      <div className="section-heading"><h2>不止是界面，<br/>更是系统与结果。</h2><p>HOW I<br/>CREATE VALUE</p></div>
      <div className="capability-grid">
        {capabilities.map(([n,t,d])=><article key={n} data-stagger-item><span>{n}</span><Sparkles size={24}/><h3>{t}</h3><p>{d}</p></article>)}
      </div>
      </div>
    </section>

    <footer ref={contactRef} className="contact" id="contact" data-motion-section>
      <div className="contact-grid"/><div className="shell contact-inner">
        <h3>期待与新产品团队一起，<br/>把体验做得更可靠、更包容、更有竞争力。</h3>
        <div className="contact-actions">
          <button className="contact-primary" type="button" onClick={copyWechat} data-stagger-item><MessageCircle size={16}/> 获取微信联系方式</button>
          <a className="contact-secondary" href="tel:18621918554" data-stagger-item><Phone size={15}/> 186 2191 8554</a>
        </div>
      </div>
    </footer>
    <div className={`copy-toast${toastVisible ? ' is-visible' : ''}${toastSuccess ? '' : ' is-error'}`} role="status" aria-live="polite">
      {toastSuccess ? <Check size={17}/> : <AlertCircle size={17}/>}<span>{toastMessage}</span>
    </div>
    {hasPassedHero && <PortfolioAssistantFab className="home-assistant-fab" onOpen={() => setIsAssistantOpen(true)} />}
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

function DetailMediaItem({ media, label, isVideo }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) return null

  return <figure className={`detail-media-item${isVideo ? ' detail-media-video' : ''}`}>
    {isVideo
      ? <DetailVideo media={media} label={label}/>
      : <img src={media} alt={label} loading="lazy" decoding="async" onError={() => setHasError(true)}/>}
  </figure>
}

function ProjectDetail({ project }) {
  const detailRef = useRef(null)
  const [isNavScrolled, setIsNavScrolled] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  useEffect(() => {
    const updateNav = () => setIsNavScrolled(window.scrollY > 80)
    updateNav()
    window.addEventListener('scroll', updateNav, { passive: true })
    return () => window.removeEventListener('scroll', updateNav)
  }, [])

  useLayoutEffect(() => {
    scrollToPageTop()
    const scrollResetFrame = window.requestAnimationFrame(scrollToPageTop)
    const shouldSkipDetailMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 800px)').matches
    if (shouldSkipDetailMotion) {
      return () => window.cancelAnimationFrame(scrollResetFrame)
    }

    const context = gsap.context(() => {
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
        <a className="brand" href="#work" onClick={markDetailReturnToWork}>SARDINE DESIGN</a>
        <a className="detail-back" href="#work" onClick={markDetailReturnToWork}><ArrowLeft size={16}/> 返回项目列表</a>
      </header>
    </section>

    <section className="detail-body">
      <div className="shell detail-intro">
        <div className="detail-intro-grid">
          <h2>{project.title.split('\n').map((line) => <React.Fragment key={line}>{line}<br/></React.Fragment>)}</h2>
          <p>{project.description}</p>
        </div>
      </div>
      <div className="shell detail-media-stack">
        {(project.detailMedia || [project.image]).map((media, index) => {
          const isVideo = media.toLowerCase().endsWith('.mp4')
          return <DetailMediaItem
            key={media}
            media={media}
            isVideo={isVideo}
            label={`${project.detailTitle || project.title.replace('\n', ' ')} ${isVideo ? '动效' : '展示图'} ${index + 1}`}
          />
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
      <ArrowUp size={20} strokeWidth={2}/>
    </button>
    <PortfolioAssistantFab
      className={`detail-assistant-fab${isNavScrolled ? ' is-compact' : ''}`}
      onOpen={() => setIsAssistantOpen(true)}
    />
    <AIPortfolioAssistantDrawer isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
  </main>
}

function App() {
  const getProjectFromHash = () => projects.find((project) => (
    !project.externalUrl && window.location.hash === `#project-${project.index}`
  ))
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
        if (activeProjectIndexRef.current && !nextProjectIndex) {
          markDetailReturnToWork()
        }
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
