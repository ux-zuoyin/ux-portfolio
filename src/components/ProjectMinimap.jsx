import { useEffect, useRef, useState } from 'react'
import './ProjectMinimap.css'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export default function ProjectMinimap({ contentRef, mediaStackRef, projectIndex, media }) {
  const trackRef = useRef(null)
  const frameRef = useRef(null)
  const rafRef = useRef(0)
  const dragRef = useRef(null)
  const metricsRef = useRef({ maxScroll: 0, documentHeight: 1, canvasTop: 0, canvasHeight: 0, frameTop: 0, frameHeight: 0 })
  const [preview, setPreview] = useState({ canvas: {}, frame: {}, progress: 0, items: [] })

  useEffect(() => {
    const content = contentRef.current
    const stack = mediaStackRef.current
    const track = trackRef.current
    if (!content || !stack || !track) return undefined

    const update = () => {
      rafRef.current = 0
      const stackRect = stack.getBoundingClientRect()
      const stackHeight = Math.max(stackRect.height, 1)
      const scale = Math.min(track.clientWidth / Math.max(stackRect.width, 1), track.clientHeight / stackHeight)
      const canvasWidth = stackRect.width * scale
      const canvasHeight = stackHeight * scale
      const canvasLeft = (track.clientWidth - canvasWidth) / 2
      const canvasTop = (track.clientHeight - canvasHeight) / 2
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, 1)
      const maxScroll = Math.max(0, documentHeight - window.innerHeight)
      const frameHeight = clamp((window.innerHeight / documentHeight) * canvasHeight, 2, canvasHeight)
      const frameTop = clamp(canvasTop + (window.scrollY / documentHeight) * canvasHeight, canvasTop, canvasTop + canvasHeight - frameHeight)
      const sourceItems = [...stack.querySelectorAll('.detail-media-item')]
      const items = sourceItems.map((item, index) => {
        const rect = item.getBoundingClientRect()
        return {
          index,
          media: media[index],
          isVideo: media[index]?.toLowerCase().endsWith('.mp4'),
          left: (rect.left - stackRect.left) * scale,
          top: (rect.top - stackRect.top) * scale,
          width: rect.width * scale,
          height: rect.height * scale,
        }
      })
      metricsRef.current = { maxScroll, documentHeight, canvasTop, canvasHeight, frameTop, frameHeight }
      setPreview({
        canvas: { left: canvasLeft, top: canvasTop, width: canvasWidth, height: canvasHeight },
        frame: { left: canvasLeft, top: frameTop, width: canvasWidth, height: frameHeight },
        progress: maxScroll ? window.scrollY / maxScroll : 0,
        items,
      })
    }

    const scheduleUpdate = () => { if (!rafRef.current) rafRef.current = window.requestAnimationFrame(update) }
    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(content)
    observer.observe(stack)
    observer.observe(track)
    const assets = [...stack.querySelectorAll('img, video')]
    assets.forEach((asset) => { asset.addEventListener('load', scheduleUpdate); asset.addEventListener('loadedmetadata', scheduleUpdate) })
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    scheduleUpdate()
    return () => {
      observer.disconnect()
      assets.forEach((asset) => { asset.removeEventListener('load', scheduleUpdate); asset.removeEventListener('loadedmetadata', scheduleUpdate) })
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [contentRef, mediaStackRef, media, projectIndex])

  const scrollToPreviewPoint = (clientY) => {
    const track = trackRef.current
    const { maxScroll, documentHeight, canvasTop, canvasHeight } = metricsRef.current
    if (!track || !maxScroll || !canvasHeight) return
    const localY = clientY - track.getBoundingClientRect().top
    const target = ((localY - canvasTop) / canvasHeight) * documentHeight - window.innerHeight / 2
    window.scrollTo({ top: clamp(target, 0, maxScroll), behavior: 'instant' })
  }

  const startDrag = (event) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const trackTop = trackRef.current?.getBoundingClientRect().top || 0
    dragRef.current = { grabOffset: event.clientY - trackTop - metricsRef.current.frameTop }
  }

  const drag = (event) => {
    if (!dragRef.current) return
    const { maxScroll, documentHeight, canvasTop, canvasHeight, frameHeight } = metricsRef.current
    const trackTop = trackRef.current?.getBoundingClientRect().top || 0
    const previewTop = clamp(event.clientY - trackTop - dragRef.current.grabOffset, canvasTop, canvasTop + canvasHeight - frameHeight)
    const target = ((previewTop - canvasTop) / canvasHeight) * documentHeight
    window.scrollTo({ top: clamp(target, 0, maxScroll), behavior: 'instant' })
  }

  const endDrag = (event) => {
    if (!dragRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
  }

  return <aside className="project-minimap" aria-label="项目详情缩略导航">
    <div className="project-minimap-track" ref={trackRef} onPointerDown={(event) => { if (event.target !== frameRef.current) { event.preventDefault(); scrollToPreviewPoint(event.clientY) } }}>
      <div className="project-minimap-canvas" style={preview.canvas}>
        {preview.items.map((item) => <div className="project-minimap-media" key={`${item.media}-${item.index}`} style={{ left: item.left, top: item.top, width: item.width, height: item.height }}>
          {item.isVideo ? <span/> : <img src={item.media} alt="" loading="lazy" decoding="async" draggable="false"/>}
        </div>)}
      </div>
      <div className="project-minimap-viewport" ref={frameRef} style={preview.frame} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} aria-label="当前阅读位置，可拖动定位" role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(preview.progress * 100)}/>
    </div>
  </aside>
}
