import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import './TiltedCard.css'

const spring = {
  damping: 28,
  stiffness: 140,
  mass: 1.2,
}

export default function TiltedCard({ imageSrc, altText, rotateAmplitude = 5, scaleOnHover = 1.1 }) {
  const cardRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const rotateX = useSpring(useMotionValue(0), spring)
  const rotateY = useSpring(useMotionValue(0), spring)
  const scale = useSpring(1, spring)

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === 'touch' || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    rotateX.set(y * rotateAmplitude * -2)
    rotateY.set(x * rotateAmplitude * 2)
    scale.set(scaleOnHover)
  }

  const handlePointerEnter = (event) => {
    if (reduceMotion || event.pointerType === 'touch') return
    scale.set(scaleOnHover)
  }

  const resetCard = () => {
    rotateX.set(0)
    rotateY.set(0)
    scale.set(1)
  }

  return <figure
    ref={cardRef}
    className="tilted-card-figure"
    onPointerMove={handlePointerMove}
    onPointerEnter={handlePointerEnter}
    onPointerLeave={resetCard}
  >
    <motion.div className="tilted-card-inner" style={{ rotateX, rotateY, scale }}>
      <motion.img className="tilted-card-img" src={imageSrc} alt={altText}/>
      <span className="tilted-card-light" aria-hidden="true"/>
    </motion.div>
  </figure>
}
