import { useCallback, useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import './TargetCursor.css'

const getContainingBlock = (element) => {
  let node = element?.parentElement
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node)
    if (
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.filter !== 'none' ||
      style.willChange.includes('transform') ||
      style.willChange.includes('perspective') ||
      style.willChange.includes('filter') ||
      /paint|layout|strict|content/.test(style.contain)
    ) return node
    node = node.parentElement
  }
  return null
}

const getContainingBlockOffset = (block) => {
  if (!block) return { x: 0, y: 0 }
  const rect = block.getBoundingClientRect()
  return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop }
}

export default function TargetCursor({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
}) {
  const cursorRef = useRef(null)
  const cornersRef = useRef(null)
  const spinTl = useRef(null)
  const dotRef = useRef(null)
  const containingBlockRef = useRef(null)
  const targetCornerPositionsRef = useRef(null)
  const tickerFnRef = useRef(null)
  const activeStrengthRef = useRef(0)

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth <= 768
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    return (hasTouchScreen && isSmallScreen) || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
  }, [])

  const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), [])

  const moveCursor = useCallback((x, y) => {
    if (!cursorRef.current) return
    const offset = getContainingBlockOffset(containingBlockRef.current)
    gsap.to(cursorRef.current, { x: x - offset.x, y: y - offset.y, duration: 0.1, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    if (isMobile || !cursorRef.current) return

    const originalCursor = document.body.style.cursor
    if (hideDefaultCursor) {
      document.body.style.cursor = 'none'
      document.body.classList.add('target-cursor-active')
    }

    const cursor = cursorRef.current
    cornersRef.current = cursor.querySelectorAll('.target-cursor-corner')
    containingBlockRef.current = getContainingBlock(cursor)
    const getOffset = () => getContainingBlockOffset(containingBlockRef.current)
    let activeTarget = null
    let currentLeaveHandler = null
    let resumeTimeout = null

    const cleanupTarget = (target) => {
      if (currentLeaveHandler) target.removeEventListener('mouseleave', currentLeaveHandler)
      currentLeaveHandler = null
    }

    const initialOffset = getOffset()
    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2 - initialOffset.x,
      y: window.innerHeight / 2 - initialOffset.y,
    })

    const createSpinTimeline = () => {
      spinTl.current?.kill()
      spinTl.current = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' })
    }
    createSpinTimeline()

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) return
      const strength = activeStrengthRef.current
      if (strength === 0) return
      const cursorX = gsap.getProperty(cursorRef.current, 'x')
      const cursorY = gsap.getProperty(cursorRef.current, 'y')
      Array.from(cornersRef.current).forEach((corner, index) => {
        const currentX = gsap.getProperty(corner, 'x')
        const currentY = gsap.getProperty(corner, 'y')
        const targetX = targetCornerPositionsRef.current[index].x - cursorX
        const targetY = targetCornerPositionsRef.current[index].y - cursorY
        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05
        gsap.to(corner, {
          x: currentX + (targetX - currentX) * strength,
          y: currentY + (targetY - currentY) * strength,
          duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto',
        })
      })
    }
    tickerFnRef.current = tickerFn

    const moveHandler = (event) => moveCursor(event.clientX, event.clientY)
    window.addEventListener('mousemove', moveHandler)

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return
      const offset = getOffset()
      const mouseX = gsap.getProperty(cursorRef.current, 'x') + offset.x
      const mouseY = gsap.getProperty(cursorRef.current, 'y') + offset.y
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY)
      const isStillOverTarget = elementUnderMouse && (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget)
      if (!isStillOverTarget) currentLeaveHandler?.()
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })

    const mouseDownHandler = () => {
      if (!dotRef.current) return
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 })
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 })
    }
    const mouseUpHandler = () => {
      if (!dotRef.current) return
      gsap.to(dotRef.current, { scale: 1, duration: 0.3 })
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 })
    }
    window.addEventListener('mousedown', mouseDownHandler)
    window.addEventListener('mouseup', mouseUpHandler)

    const enterHandler = (event) => {
      let target = event.target
      while (target && target !== document.body && !target.matches(targetSelector)) target = target.parentElement
      if (!target || target === document.body || !cursorRef.current || !cornersRef.current || activeTarget === target) return
      if (activeTarget) cleanupTarget(activeTarget)
      if (resumeTimeout) clearTimeout(resumeTimeout)
      activeTarget = target

      const corners = Array.from(cornersRef.current)
      corners.forEach((corner) => gsap.killTweensOf(corner))
      gsap.killTweensOf(cursorRef.current, 'rotation')
      spinTl.current?.pause()
      gsap.set(cursorRef.current, { rotation: 0 })

      const rect = target.getBoundingClientRect()
      const offset = getOffset()
      const cursorX = gsap.getProperty(cursorRef.current, 'x')
      const cursorY = gsap.getProperty(cursorRef.current, 'y')
      const { borderWidth, cornerSize } = constants
      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth - offset.x, y: rect.top - borderWidth - offset.y },
        { x: rect.right + borderWidth - cornerSize - offset.x, y: rect.top - borderWidth - offset.y },
        { x: rect.right + borderWidth - cornerSize - offset.x, y: rect.bottom + borderWidth - cornerSize - offset.y },
        { x: rect.left - borderWidth - offset.x, y: rect.bottom + borderWidth - cornerSize - offset.y },
      ]

      gsap.ticker.add(tickerFnRef.current)
      gsap.to(activeStrengthRef, { current: 1, duration: hoverDuration, ease: 'power2.out' })
      corners.forEach((corner, index) => gsap.to(corner, {
        x: targetCornerPositionsRef.current[index].x - cursorX,
        y: targetCornerPositionsRef.current[index].y - cursorY,
        duration: hoverDuration,
        ease: 'power2.out',
      }))

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current)
        targetCornerPositionsRef.current = null
        gsap.set(activeStrengthRef, { current: 0, overwrite: true })
        activeTarget = null
        const positions = [
          { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: cornerSize * 0.5 },
          { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
        ]
        corners.forEach((corner, index) => {
          gsap.killTweensOf(corner)
          gsap.to(corner, { ...positions[index], duration: 0.3, ease: 'power3.out' })
        })
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current) createSpinTimeline()
          resumeTimeout = null
        }, 50)
        cleanupTarget(target)
      }
      currentLeaveHandler = leaveHandler
      target.addEventListener('mouseleave', leaveHandler)
    }
    window.addEventListener('mouseover', enterHandler, { passive: true })

    const resizeHandler = () => { containingBlockRef.current = getContainingBlock(cursor) }
    window.addEventListener('resize', resizeHandler)

    return () => {
      gsap.ticker.remove(tickerFnRef.current)
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseover', enterHandler)
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', resizeHandler)
      window.removeEventListener('mousedown', mouseDownHandler)
      window.removeEventListener('mouseup', mouseUpHandler)
      if (activeTarget) cleanupTarget(activeTarget)
      if (resumeTimeout) clearTimeout(resumeTimeout)
      spinTl.current?.kill()
      document.body.style.cursor = originalCursor
      document.body.classList.remove('target-cursor-active')
      targetCornerPositionsRef.current = null
      activeStrengthRef.current = 0
    }
  }, [constants, hideDefaultCursor, hoverDuration, isMobile, moveCursor, parallaxOn, spinDuration, targetSelector])

  if (isMobile) return null

  return <div ref={cursorRef} className="target-cursor-wrapper">
    <div ref={dotRef} className="target-cursor-dot"/>
    <div className="target-cursor-corner corner-tl"/>
    <div className="target-cursor-corner corner-tr"/>
    <div className="target-cursor-corner corner-br"/>
    <div className="target-cursor-corner corner-bl"/>
  </div>
}
