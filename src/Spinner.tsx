import { useEffect, useState } from 'react'
import { SpinnerSection } from './spin'

const SIZE = 340
const CX = SIZE / 2
const CY = SIZE / 2
const R = 142
const LABEL_R = 96

function toXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function wedgePath(startDeg: number, endDeg: number): string {
  const s = toXY(startDeg, R)
  const e = toXY(endDeg, R)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`
}

interface Props {
  spinTrigger: number
  targetSection: number
  extraRotations: number
  spinDuration: number
  onSpinComplete: () => void
  sections: SpinnerSection[]
  ringColor: string
  needleColor: string
}

export default function Spinner({ spinTrigger, targetSection, extraRotations, spinDuration, onSpinComplete, sections, ringColor, needleColor }: Props) {
  const [rotation, setRotation] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (spinTrigger === 0) return
    const s = sections[targetSection]
    const sectionCenter = (s.startDeg + s.endDeg) / 2
    const targetAngle = (360 - sectionCenter + 360) % 360
    const currentMod = ((rotation % 360) + 360) % 360
    const delta = (targetAngle - currentMod + 360) % 360
    const newRotation = rotation + delta + extraRotations * 360
    setAnimating(true)
    setRotation(newRotation)
    const t = setTimeout(() => {
      setAnimating(false)
      onSpinComplete()
    }, spinDuration + 100)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinTrigger])

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block', margin: '0 auto' }}>
      <g style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${CX}px ${CY}px`,
        transition: animating ? `transform ${spinDuration}ms cubic-bezier(0.0, 0.0, 0.08, 1.0)` : 'none',
      }}>
        {sections.map((s, i) => (
          <path key={i} d={wedgePath(s.startDeg, s.endDeg)} fill={s.color} stroke="#fff" strokeWidth="2" />
        ))}
        {sections.map((s, i) => {
          const center = (s.startDeg + s.endDeg) / 2
          const pos = toXY(center, LABEL_R)
          const arcDeg = s.endDeg - s.startDeg
          const fontSize = arcDeg <= 25 ? '16' : '26'
          return (
            <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize}>
              {s.emoji}
            </text>
          )
        })}
        <circle cx={CX} cy={CY} r={14} fill="#fff" stroke="#e0e0e0" strokeWidth="2" />
      </g>
      <circle cx={CX} cy={CY} r={R + 6} fill="none" stroke={ringColor} strokeWidth="6" />
      <polygon points={`${CX - 13},2 ${CX + 13},2 ${CX},28`} fill={needleColor} stroke="#fff" strokeWidth="2" />
    </svg>
  )
}
