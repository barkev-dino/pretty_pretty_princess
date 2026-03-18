import { useEffect, useState } from 'react'
import { SPINNER_SECTIONS } from './spin'

const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2
const R = 118
const LABEL_R = 78

function toXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function wedgePath(startDeg: number, endDeg: number): string {
  const s = toXY(startDeg, R)
  const e = toXY(endDeg, R)
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`
}

interface Props {
  spinTrigger: number
  targetSection: number
  onSpinComplete: () => void
}

export default function Spinner({ spinTrigger, targetSection, onSpinComplete }: Props) {
  const [rotation, setRotation] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (spinTrigger === 0) return
    const sectionCenter = targetSection * 60 + 30
    const targetAngle = (360 - sectionCenter) % 360
    const currentMod = ((rotation % 360) + 360) % 360
    const delta = (targetAngle - currentMod + 360) % 360
    const newRotation = rotation + delta + 5 * 360
    setAnimating(true)
    setRotation(newRotation)
    const t = setTimeout(() => {
      setAnimating(false)
      onSpinComplete()
    }, 2600)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinTrigger])

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* Spinning wheel group */}
      <g
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: animating
            ? 'transform 2.5s cubic-bezier(0.15, 0.85, 0.25, 1)'
            : 'none',
        }}
      >
        {SPINNER_SECTIONS.map((s, i) => (
          <path
            key={i}
            d={wedgePath(i * 60, (i + 1) * 60)}
            fill={s.color}
            stroke="#fff"
            strokeWidth="2.5"
          />
        ))}
        {SPINNER_SECTIONS.map((s, i) => {
          const pos = toXY(i * 60 + 30, LABEL_R)
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="28"
            >
              {s.emoji}
            </text>
          )
        })}
        <circle cx={CX} cy={CY} r={14} fill="#fff" stroke="#e0e0e0" strokeWidth="2" />
      </g>

      {/* Fixed outer border ring */}
      <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke="#9c27b0" strokeWidth="4" />

      {/* Fixed needle — downward triangle at top center */}
      <polygon
        points={`${CX - 11},3 ${CX + 11},3 ${CX},22`}
        fill="#c62828"
        stroke="#fff"
        strokeWidth="1.5"
      />
    </svg>
  )
}
