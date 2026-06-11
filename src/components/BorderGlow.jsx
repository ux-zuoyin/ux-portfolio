import { useCallback, useRef } from 'react'
import './BorderGlow.css'

function parseHSL(value) {
  const match = value.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 5, s: 100, l: 57 }
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) }
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor)
  const levels = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
  return Object.fromEntries(levels.map((opacity, index) => [
    `--glow-color${keys[index]}`,
    `hsl(${h}deg ${s}% ${l}% / ${Math.min(opacity * intensity, 100)}%)`,
  ]))
}

const positions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const keys = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven']
const colorMap = [0, 1, 2, 0, 1, 2, 1]

function buildGradientVars(colors) {
  const vars = Object.fromEntries(keys.map((key, index) => [
    key,
    `radial-gradient(at ${positions[index]}, ${colors[colorMap[index]]} 0px, transparent 50%)`,
  ]))
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`
  return vars
}

export default function BorderGlow({ children, className = '', ...props }) {
  const cardRef = useRef(null)

  const handlePointerMove = useCallback((event) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = x - cx
    const dy = y - cy
    const kx = dx === 0 ? Infinity : cx / Math.abs(dx)
    const ky = dy === 0 ? Infinity : cy / Math.abs(dy)
    const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
    if (angle < 0) angle += 360
    card.style.setProperty('--edge-proximity', (edge * 100).toFixed(3))
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
  }, [])

  const colors = ['#ff3526', '#ff766b', '#8f170f']

  return <div
    {...props}
    ref={cardRef}
    onPointerMove={handlePointerMove}
    className={`border-glow-card ${className}`}
    style={{
      '--card-bg': '#111111',
      '--edge-sensitivity': 25,
      '--border-radius': '6px',
      '--glow-padding': '28px',
      '--cone-spread': 22,
      '--fill-opacity': 0.26,
      ...buildGlowVars('5 100 57', 0.9),
      ...buildGradientVars(colors),
    }}
  >
    <span className="edge-light" />
    <div className="border-glow-inner">{children}</div>
  </div>
}
