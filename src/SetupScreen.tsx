import { useState } from 'react'
import { Player } from './types'

interface Props {
  onStart: (players: Player[]) => void
}

const BTN: React.CSSProperties = {
  fontSize: 20,
  padding: '16px 40px',
  borderRadius: 16,
  border: '3px solid #ce93d8',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 'bold',
  transition: 'transform 0.1s',
}

const INPUT: React.CSSProperties = {
  fontSize: 18,
  padding: '10px 14px',
  borderRadius: 10,
  border: '2px solid #ce93d8',
  width: '100%',
  fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.8)',
  outline: 'none',
}

export default function SetupScreen({ onStart }: Props) {
  const [count, setCount] = useState<2 | 3 | null>(null)
  const [names, setNames] = useState(['', '', ''])

  const playerNames = count ? names.slice(0, count) : []
  const canStart = count !== null && playerNames.every(n => n.trim().length > 0)

  function handleCountSelect(n: 2 | 3) {
    setCount(n)
    setNames(prev => {
      const next = [...prev]
      if (!next[0]) next[0] = 'Player 1'
      if (!next[1]) next[1] = 'Player 2'
      if (n === 3 && !next[2]) next[2] = 'Player 3'
      return next
    })
  }

  function handleStart() {
    if (!canStart || count === null) return
    const players = playerNames.map(name => ({ name: name.trim(), inventory: [] }))
    onStart(players)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Title */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
        <h1 style={{ fontSize: 28, color: '#7b1fa2', letterSpacing: 1 }}>
          Pretty Pretty Princess
        </h1>
        <p style={{ color: '#9c27b0', marginTop: 6, fontSize: 15 }}>
          Collect all 5 jewels to win! 💍📿💎✨
        </p>
      </div>

      {/* KAN-7: Player count */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 18, color: '#6a1b9a', marginBottom: 16, fontWeight: 'bold' }}>
          How many players?
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {([2, 3] as const).map(n => (
            <button
              key={n}
              onClick={() => handleCountSelect(n)}
              style={{
                ...BTN,
                background: count === n ? '#ce93d8' : 'rgba(255,255,255,0.8)',
                color: count === n ? '#fff' : '#7b1fa2',
                transform: count === n ? 'scale(1.07)' : 'scale(1)',
              }}
            >
              {n} Players
            </button>
          ))}
        </div>
      </div>

      {/* KAN-8: Player names */}
      {count !== null && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 18, color: '#6a1b9a', marginBottom: 16, fontWeight: 'bold' }}>
            Enter names
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, width: 32 }}>
                  {['💜', '💗', '💙'][i]}
                </span>
                <input
                  style={INPUT}
                  value={names[i]}
                  onChange={e => {
                    const next = [...names]
                    next[i] = e.target.value
                    setNames(next)
                  }}
                  placeholder={`Player ${i + 1}`}
                  maxLength={20}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KAN-9: Start button */}
      {count !== null && (
        <button
          onClick={handleStart}
          disabled={!canStart}
          style={{
            ...BTN,
            fontSize: 22,
            padding: '18px 56px',
            background: canStart ? 'linear-gradient(135deg, #ce93d8, #f48fb1)' : '#e0e0e0',
            color: canStart ? '#fff' : '#bbb',
            border: canStart ? '3px solid #ab47bc' : '3px solid #ccc',
            cursor: canStart ? 'pointer' : 'not-allowed',
            marginTop: 8,
          }}
        >
          Start Game ✨
        </button>
      )}
    </div>
  )
}
