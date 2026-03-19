import { useRef, useState, useEffect, useMemo } from 'react'
import Spinner from './Spinner'
import { GameState, JEWELRY, JewelryId } from './types'
import { SPINNER_SECTIONS } from './spin'
import { GameTheme, getSpinnerSections } from './themes'

type ReturnChoice = JewelryId | '⚫'

interface Props {
  theme: GameTheme
  game: GameState
  isSpinning: boolean
  spinTrigger: number
  pendingSection: number
  extraRotations: number
  spinDuration: number
  pickAnyPending: boolean
  putBackChoicePending: boolean
  spinCounts: number[][]
  onSpinStart: (power: number) => void
  onSpinComplete: () => void
  onPickAny: (jewel: JewelryId) => void
  onPutBackChoice: (item: ReturnChoice) => void
  onNewGame: () => void
}

const CONFETTI = ['👑', '✨', '💍', '⭐', '🌟', '💫', '🎉', '🎊', '💕', '🌸']

function WinScreen({ winner, theme, onNewGame }: { winner: GameState['players'][0]; theme: GameTheme; onNewGame: () => void }) {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    emoji: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    left: Math.random() * 95,
    size: 20 + Math.floor(Math.random() * 24),
    duration: 2.5 + Math.random() * 2,
    delay: Math.random() * 2.5,
  })), [])

  const displayInventory = winner.inventory
    .map(j => theme.items[JEWELRY.indexOf(j)]?.emoji ?? j)
    .join('  ')

  return (
    <div style={{ textAlign: 'center', paddingTop: 48, position: 'relative' }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-80px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.2; }
        }
        @keyframes winBounce {
          0%, 100% { transform: scale(1); }
          40% { transform: scale(1.15); }
          60% { transform: scale(0.95); }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'fixed', left: `${p.left}%`, top: 0, fontSize: p.size,
          animation: `confettiFall ${p.duration}s ${p.delay}s linear infinite`,
          pointerEvents: 'none', zIndex: 200, userSelect: 'none',
        }}>{p.emoji}</div>
      ))}
      <div style={{ fontSize: 96, marginBottom: 16, animation: 'winBounce 0.8s ease-in-out 3' }}>
        {winner.character.emoji}
      </div>
      <h2 style={{ fontSize: 48, fontWeight: 900, color: winner.color, marginBottom: 10, letterSpacing: -1 }}>
        {winner.name} Wins! 🎉
      </h2>
      <p style={{ fontSize: 22, color: theme.accent, marginBottom: 32, fontWeight: 700 }}>
        {winner.name} {theme.winSuffix}
      </p>
      <div style={{ fontSize: 52, marginBottom: 40, letterSpacing: 8 }}>{displayInventory}</div>
      <button onClick={onNewGame} style={{
        fontSize: 26, padding: '20px 64px', borderRadius: 36,
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 900,
        background: `linear-gradient(135deg, ${theme.accent}, ${winner.color})`,
        color: '#fff', boxShadow: `0 8px 24px ${theme.accent}66`,
        animation: 'winBounce 1.2s ease-in-out infinite',
      }}>
        Play Again! 🎉
      </button>
    </div>
  )
}

function PowerMeter({ onSpin, disabled, theme }: { onSpin: (power: number) => void; disabled: boolean; theme: GameTheme }) {
  const [holding, setHolding] = useState(false)
  const [power, setPower] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const powerRef = useRef(0)

  function startHold(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (disabled) return
    startRef.current = performance.now()
    setHolding(true)
    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000
      const p = (Math.sin(t * Math.PI / 0.7) + 1) / 2
      powerRef.current = p
      setPower(p)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function endHold() {
    if (!holding) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const p = powerRef.current
    setHolding(false)
    setPower(0)
    onSpin(p)
  }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const isMagic = power > 0.85
  const label = holding
    ? (isMagic ? '🌈 Magic spot!' : power > 0.4 ? '💪 Strong!' : '🌱 Keep holding...')
    : disabled ? 'Spinning...' : 'Hold to Spin!'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Power bar */}
      <div style={{
        width: '100%', maxWidth: 320, height: 28,
        background: theme.id === 'warrior' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
        borderRadius: 14, border: `3px solid ${isMagic && holding ? '#ff9800' : theme.accent}`,
        overflow: 'hidden', position: 'relative',
        opacity: holding ? 1 : 0.4, transition: 'opacity 0.2s, border-color 0.15s',
        boxShadow: isMagic && holding ? `0 0 16px #ff980088` : 'none',
      }}>
        <div style={{
          width: `${power * 100}%`, height: '100%',
          background: 'linear-gradient(90deg, #a5d6a7, #ffe082, #ff7043, #f48fb1)',
          borderRadius: 14, transition: 'none',
        }} />
        {/* Rainbow magic zone — right 15% */}
        <div style={{
          position: 'absolute', right: 0, top: 0, width: '15%', height: '100%',
          background: 'linear-gradient(90deg, transparent, #f44336bb, #ff9800bb, #ffeb3bbb, #4caf50bb, #2196f3bb, #9c27b0bb)',
          borderRadius: '0 11px 11px 0', pointerEvents: 'none',
        }} />
      </div>

      <div style={{
        fontSize: 15, fontWeight: 700,
        color: isMagic && holding ? '#ff9800' : theme.accent,
        height: 22, letterSpacing: 0.3,
        textShadow: isMagic && holding ? '0 0 8px #ff980066' : 'none',
      }}>{label}</div>

      <button
        onMouseDown={startHold} onMouseUp={endHold}
        onMouseLeave={holding ? endHold : undefined}
        onTouchStart={startHold} onTouchEnd={endHold}
        disabled={disabled}
        style={{
          fontSize: 24, padding: '18px 0', width: '100%', maxWidth: 320,
          borderRadius: 28, border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontWeight: 900,
          background: disabled
            ? (theme.id === 'warrior' ? '#455a64' : '#e0e0e0')
            : holding
              ? 'linear-gradient(135deg, #f48fb1, #ff7043)'
              : `linear-gradient(135deg, ${theme.accent}ee, ${theme.accent})`,
          color: disabled ? (theme.id === 'warrior' ? '#78909c' : '#bbb') : '#fff',
          boxShadow: disabled ? 'none' : `0 6px 20px ${theme.accent}55`,
          transform: holding ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 0.1s, box-shadow 0.2s',
          touchAction: 'manipulation', userSelect: 'none',
          letterSpacing: 0.5,
        }}
      >
        {disabled ? '✨ Spinning...' : holding ? '🎯 Release!' : '✨ Hold to Spin!'}
      </button>
    </div>
  )
}

function Modal({ title, items, onSelect, theme }: {
  title: string
  items: readonly ReturnChoice[]
  onSelect: (item: ReturnChoice) => void
  theme: GameTheme
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: theme.id === 'warrior'
          ? 'linear-gradient(135deg, #37474f, #263238)'
          : 'linear-gradient(135deg, #fff0f5, #f8f0ff)',
        borderRadius: 28, padding: '32px 36px', textAlign: 'center',
        boxShadow: `0 16px 48px rgba(0,0,0,0.4)`,
        border: `3px solid ${theme.accent}`,
        minWidth: 280, maxWidth: '90vw',
      }}>
        <div style={{
          fontSize: 24, fontWeight: 900, color: theme.id === 'warrior' ? theme.accentDark : theme.accentDark,
          marginBottom: 20, letterSpacing: 0.3,
        }}>{title}</div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {items.map(item => {
            const display = item === '⚫'
              ? theme.blackRing.emoji
              : (theme.items[JEWELRY.indexOf(item as JewelryId)]?.emoji ?? item)
            return (
              <button key={item} onClick={() => onSelect(item)} style={{
                fontSize: 48, lineHeight: 1,
                background: theme.id === 'warrior' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
                border: `3px solid ${theme.accent}`,
                borderRadius: 20, padding: '12px 16px',
                cursor: 'pointer', touchAction: 'manipulation',
                boxShadow: `0 4px 12px ${theme.accent}33`,
                transition: 'transform 0.1s',
              }}>{display}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function GameScreen({
  theme, game, isSpinning, spinTrigger, pendingSection,
  extraRotations, spinDuration,
  pickAnyPending, putBackChoicePending, spinCounts,
  onSpinStart, onSpinComplete, onPickAny, onPutBackChoice, onNewGame,
}: Props) {
  const current = game.players[game.currentIndex]
  const themeSections = useMemo(() => getSpinnerSections(theme), [theme])

  if (game.phase === 'won' && game.winner !== null) {
    return <WinScreen winner={game.players[game.winner]} theme={theme} onNewGame={onNewGame} />
  }

  const missingJewels = JEWELRY.filter(j => !current.inventory.includes(j))
  const putBackItems: ReturnChoice[] = [
    ...current.inventory,
    ...(current.hasBlackRing ? ['⚫' as const] : []),
  ]

  const T = theme
  const isDark = T.id === 'warrior'

  return (
    <div>
      <style>{`
        @keyframes turnSlideIn {
          0%   { opacity: 0; transform: translateY(-14px) scale(0.96); }
          60%  { transform: translateY(3px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes passFlash {
          0%, 100% { opacity: 0; }
          15%, 70% { opacity: 1; }
        }
        @keyframes activePulse {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 0 6px ${current.color}44; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.4; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }
      `}</style>

      {pickAnyPending && (
        <Modal title={`${T.pickAny.emoji} Pick any item!`} items={missingJewels} onSelect={j => onPickAny(j as JewelryId)} theme={T} />
      )}
      {putBackChoicePending && (
        <Modal title={`${T.leprechaun.emoji} Choose to return`} items={putBackItems} onSelect={onPutBackChoice} theme={T} />
      )}

      {/* ── Turn banner ── */}
      <div key={game.currentIndex} style={{
        background: `linear-gradient(135deg, ${current.color}ee, ${current.color}99)`,
        borderRadius: 24, padding: '18px 28px', marginBottom: 18,
        animation: 'turnSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        textAlign: 'center',
        boxShadow: `0 8px 28px ${current.color}55`,
        border: `3px solid ${current.color}`,
      }}>
        <div style={{
          fontSize: 13, color: '#fff', marginBottom: 4, fontWeight: 700,
          animation: 'passFlash 2.5s linear forwards', opacity: 0,
        }}>
          👋 Pass to {current.name}!
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
          {current.character.emoji}  {current.name}'s Turn!
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Players + History ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Players card */}
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.82)',
            borderRadius: 22, padding: '16px 14px',
            border: `2px solid ${T.accent}44`,
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(186,104,200,0.12)',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 900, color: T.dimText, marginBottom: 12,
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}>✨ Players</div>
            {game.players.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: i < game.players.length - 1 ? 8 : 0,
                borderRadius: 16,
                background: i === game.currentIndex
                  ? isDark ? `${p.color}28` : `${p.color}18`
                  : 'transparent',
                border: `2.5px solid ${i === game.currentIndex ? p.color : 'transparent'}`,
                animation: i === game.currentIndex ? 'activePulse 2s ease-in-out infinite' : 'none',
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{p.character.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 900, color: p.color, fontSize: 16,
                    marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    {JEWELRY.flatMap((j, ji) => {
                      const display = T.items[ji].emoji
                      if (ji === 4) {
                        // Earrings: show two independent slots
                        const count = p.inventory.filter(i => i === '✨').length
                        return [0, 1].map(n => (
                          <span key={`ear-${n}`} style={{
                            fontSize: count > n ? 24 : 18,
                            opacity: count > n ? 1 : 0.18,
                            filter: count > n ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' : 'none',
                            transition: 'all 0.3s',
                          }}>{display}</span>
                        ))
                      }
                      const has = p.inventory.includes(j)
                      return [<span key={j} style={{
                        fontSize: has ? 24 : 18, opacity: has ? 1 : 0.18,
                        filter: has ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' : 'none',
                        transition: 'all 0.3s',
                      }}>{display}</span>]
                    })}
                    {p.hasBlackRing && (
                      <span style={{
                        fontSize: 20, marginLeft: 3,
                        filter: 'drop-shadow(0 0 4px #000)',
                        animation: 'sparkle 1.5s ease-in-out infinite',
                      }}>{T.blackRing.emoji}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Spin history card */}
          {spinCounts.length > 0 && (
            <div style={{
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.82)',
              borderRadius: 22, padding: '14px 14px',
              border: `2px solid ${T.accent}44`,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(186,104,200,0.10)',
            }}>
              <div style={{
                fontSize: 13, fontWeight: 900, color: T.dimText, marginBottom: 10,
                letterSpacing: 1.5, textTransform: 'uppercase',
              }}>📊 Spin History</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '2px 4px', color: T.tableHeaderColor, fontWeight: 800, fontSize: 11 }}>Slice</th>
                    {game.players.map((p, i) => (
                      <th key={i} style={{ padding: '2px 4px', color: p.color, fontWeight: 800, textAlign: 'center', fontSize: 14 }}>
                        {p.character.emoji}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {themeSections.map((s, si) => {
                    const total = spinCounts.reduce((sum, row) => sum + (row[si] ?? 0), 0)
                    return (
                      <tr key={si} style={{ opacity: total === 0 ? 0.28 : 1 }}>
                        <td style={{ padding: '3px 4px', fontSize: 12 }}>
                          <span style={{ marginRight: 3 }}>{s.emoji}</span>
                          <span style={{ color: T.dimText, fontSize: 11 }}>{s.label}</span>
                        </td>
                        {game.players.map((_, pi) => (
                          <td key={pi} style={{
                            padding: '3px 4px', textAlign: 'center',
                            fontWeight: spinCounts[pi]?.[si] ? 800 : 400,
                            color: spinCounts[pi]?.[si] ? T.tableHeaderColor : T.dimText,
                            fontSize: 13,
                          }}>{spinCounts[pi]?.[si] ?? 0}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <button onClick={onNewGame} style={{
            background: 'none', border: 'none', color: T.accent,
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
            textDecoration: 'underline', textAlign: 'left', padding: '4px 0',
          }}>New Game</button>
        </div>

        {/* ── RIGHT: Spinner + Legend + Last spin + Power ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

          <Spinner
            spinTrigger={spinTrigger} targetSection={pendingSection}
            extraRotations={extraRotations} spinDuration={spinDuration}
            onSpinComplete={onSpinComplete}
            sections={themeSections} ringColor={T.spinnerRing} needleColor={T.needle}
          />

          {/* Legend */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '5px 10px', width: '100%',
            padding: '14px 16px',
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.80)',
            borderRadius: 20, border: `2px solid ${T.accent}33`,
            boxShadow: isDark ? 'none' : '0 4px 14px rgba(186,104,200,0.10)',
          }}>
            {themeSections.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? T.accentDark : T.accentDark, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>
                    {((s.endDeg - s.startDeg) / 360 * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: T.accent, opacity: 0.75, fontWeight: 600 }}>
            🌈 &gt;85% power → +50% positive bias{current.hasBlackRing ? ` (incl. ${T.leprechaun.emoji})` : ''}
          </div>

          {/* Last spin result */}
          {game.lastSpin && (
            <div style={{
              background: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.88)',
              borderRadius: 18, padding: '12px 20px', width: '100%', textAlign: 'center',
              fontSize: 18, fontWeight: 800, color: isDark ? T.accentDark : T.accentDark,
              border: `2px solid ${T.accent}44`,
              boxShadow: isDark ? 'none' : '0 3px 12px rgba(186,104,200,0.12)',
            }}>
              {game.lastSpin}
            </div>
          )}

          <PowerMeter onSpin={onSpinStart} disabled={isSpinning} theme={T} />
        </div>
      </div>
    </div>
  )
}
