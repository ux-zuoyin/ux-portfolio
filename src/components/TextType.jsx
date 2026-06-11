import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './TextType.css'

export default function TextType({ text, as: Component = 'div', typingSpeed = 50, initialDelay = 0, pauseDuration = 2000, deletingSpeed = 30, loop = true, className = '', showCursor = true, cursorCharacter = '|', cursorClassName = '', cursorBlinkDuration = 0.5, variableSpeed, startOnVisible = false, ...props }) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const cursorRef = useRef(null)
  const containerRef = useRef(null)
  const textArray = useMemo(() => Array.isArray(text) ? text : [text], [text])
  const getSpeed = useCallback(() => variableSpeed ? Math.random() * (variableSpeed.max - variableSpeed.min) + variableSpeed.min : typingSpeed, [typingSpeed, variableSpeed])

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setIsVisible(true), { threshold: 0.1 })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [startOnVisible])

  useEffect(() => {
    if (!showCursor || !cursorRef.current) return
    const tween = gsap.fromTo(cursorRef.current, { opacity: 1 }, { opacity: 0, duration: cursorBlinkDuration, repeat: -1, yoyo: true, ease: 'power2.inOut' })
    return () => tween.kill()
  }, [showCursor, cursorBlinkDuration])

  useEffect(() => {
    if (!isVisible) return
    const currentText = textArray[currentTextIndex]
    let timeout
    if (isDeleting) {
      if (displayedText === '') {
        setIsDeleting(false)
        setCurrentTextIndex(index => (index + 1) % textArray.length)
        setCurrentCharIndex(0)
      } else timeout = setTimeout(() => setDisplayedText(value => value.slice(0, -1)), deletingSpeed)
    } else if (currentCharIndex < currentText.length) {
      timeout = setTimeout(() => {
        setDisplayedText(value => value + currentText[currentCharIndex])
        setCurrentCharIndex(index => index + 1)
      }, currentCharIndex === 0 ? initialDelay : getSpeed())
    } else if (loop) timeout = setTimeout(() => setIsDeleting(true), pauseDuration)
    return () => clearTimeout(timeout)
  }, [currentCharIndex, currentTextIndex, deletingSpeed, displayedText, getSpeed, initialDelay, isDeleting, isVisible, loop, pauseDuration, textArray])

  return createElement(Component, { ref: containerRef, className: `text-type ${className}`, ...props },
    <span className="text-type__content">{displayedText}</span>,
    showCursor && <span ref={cursorRef} className={`text-type__cursor ${cursorClassName}`}>{cursorCharacter}</span>)
}
