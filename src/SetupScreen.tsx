import { useState } from 'react'
import { CHARACTERS, Character } from './types'
import { GameTheme } from './themes'

interface Selection { name: string; character: Character }
interface Props { onStart: (selections: Selection[]) => void; theme: GameTheme }

export default function SetupScreen({ onStart, theme }: Props) {
  const [count, setCount] = useState<2 | 3 | null>(null)
  const [names, setNames] = useState(['', '', ''])
  const [selectedChars, setSelectedChars] = useState<(Character | null)[]>([null, null, null])
  const isDark = theme.id === 'warrior'

  function handleCountSelect(n: 2 | 3) {
    setCount(n)
    setNames(prev => {
      const next = [...prev]
      if (!next[0]) next[0] = 'Player 1'
      if (!next[1]) next[1] = 'Player 2'
      if (n === 3 && !next[2]) next[2] = 'Player 3'
      return next
    })
    setSelectedChars(prev => {
      const next: (Character | null)[] = [null, null, null]
      for (let i = 0; i < n; i++) {
        const taken = new Set(next.slice(0, i).filter(Boolean).map(c => c!.emoji))
        const existing = prev[i]
        next[i] = (existing && !taken.has(existing.emoji)) ? existing : (CHARACTERS.find(c => !taken.has(c.emoji)) ?? null)
      }
      return next
    })
  }

  function handleCharSelect(slotIndex: number, char: Character) {
    setSelectedChars(prev => { const next = [...prev]; next[slotIndex] = char; return next })
  }

  const activeCount = count ?? 0
  const takenEmojis = new Set(selectedChars.slice(0, activeCount).filter(Boolean).map(c => c!.emoji))
  const playerNames = count ? names.slice(0, count) : []
  const playerChars = count ? selectedChars.slice(0, count) : []
  const canStart = count !== null && playerNames.every(n => n.trim().length > 0) && playerChars.every(c => c !== null)

  function handleStart() {
    if (!canStart || count === null) return
    onStart(playerNames.map((name, i) => ({ name: name.trim(), character: playerChars[i]! })))
  }

  const T = theme

  return (
    <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto', paddingBottom: 40 }}>
      <style>{`
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Title */}
      <div style={{ marginBottom: 40, paddingTop: 16 }}>
        <div style={{
          fontSize: 80, marginBottom: 10,
          animation: 'titleFloat 3s ease-in-out infinite',
          display: 'inline-block',
        }}>
          {T.items[0].emoji}
        </div>
        <h1 style={{
          fontSize: 42, fontWeight: 900, color: T.accentDark,
          letterSpacing: -1, marginBottom: 10,
          textShadow: isDark ? `0 0 20px ${T.accent}66` : `0 2px 0 ${T.accent}33`,
        }}>
          {T.name}
        </h1>
        <div style={{
          fontSize: 20, color: T.accent, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span>Collect all 5 to win!</span>
          {T.items.map((item, i) => (
            <span key={i} style={{ fontSize: 24, animation: `shimmer ${1 + i * 0.3}s ease-in-out infinite` }}>
              {item.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Player count */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 20, color: T.accentDark, marginBottom: 18, fontWeight: 800 }}>
          How many players? 👥
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {([2, 3] as const).map(n => (
            <button key={n} onClick={() => handleCountSelect(n)} style={{
              fontSize: 22, padding: '18px 48px', borderRadius: 28,
              border: `3px solid ${count === n ? T.accent : T.accent + '55'}`,
              background: count === n
                ? `linear-gradient(135deg, ${T.accent}, ${T.accentDark === '#ffcdd2' ? '#ef5350' : T.accentDark})`
                : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)',
              color: count === n ? '#fff' : T.accentDark,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 900,
              transform: count === n ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.15s',
              boxShadow: count === n ? `0 6px 20px ${T.accent}55` : 'none',
            }}>
              {n} Players
            </button>
          ))}
        </div>
      </div>

      {/* Character + name picker */}
      {count !== null && (
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 20, color: T.accentDark, marginBottom: 20, fontWeight: 800 }}>
            Pick your character ✨
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Array.from({ length: count }, (_, i) => {
              const selected = selectedChars[i]
              return (
                <div key={i} style={{
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.70)',
                  borderRadius: 24, padding: '18px 20px',
                  border: `2px solid ${selected ? selected.color + '88' : T.accent + '33'}`,
                  boxShadow: selected ? `0 4px 16px ${selected.color}33` : 'none',
                  transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                    {CHARACTERS.map(char => {
                      const isSelected = selected?.emoji === char.emoji
                      const isTaken = !isSelected && takenEmojis.has(char.emoji)
                      return (
                        <button key={char.emoji}
                          onClick={() => !isTaken && handleCharSelect(i, char)}
                          disabled={isTaken}
                          style={{
                            fontSize: 32, width: 62, height: 62,
                            borderRadius: '50%',
                            border: isSelected ? `4px solid ${char.color}` : `2px solid ${T.accent}33`,
                            background: isSelected ? `${char.color}30` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
                            cursor: isTaken ? 'not-allowed' : 'pointer',
                            opacity: isTaken ? 0.25 : 1,
                            transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                            transition: 'all 0.15s',
                            padding: 0, lineHeight: 1,
                            boxShadow: isSelected ? `0 4px 12px ${char.color}66` : 'none',
                          }}
                        >{char.emoji}</button>
                      )
                    })}
                  </div>
                  <input
                    style={{
                      fontSize: 20, padding: '12px 16px', borderRadius: 16,
                      border: `2.5px solid ${T.accent}66`, width: '100%',
                      fontFamily: 'inherit', fontWeight: 700,
                      background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.90)',
                      color: isDark ? '#fff' : T.accentDark,
                      outline: 'none',
                    }}
                    value={names[i]}
                    onChange={e => { const next = [...names]; next[i] = e.target.value; setNames(next) }}
                    placeholder={`Player ${i + 1}'s name`}
                    maxLength={20}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Start button */}
      {count !== null && (
        <button onClick={handleStart} disabled={!canStart} style={{
          fontSize: 26, padding: '20px 72px', borderRadius: 36,
          border: 'none', cursor: canStart ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', fontWeight: 900,
          background: canStart
            ? `linear-gradient(135deg, ${T.accent}, ${T.accentDark === '#ffcdd2' ? '#ef5350' : T.accentDark})`
            : isDark ? '#455a64' : '#e0e0e0',
          color: canStart ? '#fff' : isDark ? '#78909c' : '#bbb',
          boxShadow: canStart ? `0 8px 28px ${T.accent}66` : 'none',
          transform: 'scale(1)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          letterSpacing: 0.5,
        }}>
          Start Game ✨
        </button>
      )}
    </div>
  )
}
