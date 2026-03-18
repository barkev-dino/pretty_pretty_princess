import { useMemo } from 'react'
import Spinner from './Spinner'
import { GameState, JEWELRY, JewelryId, Player } from './types'
import { SPINNER_SECTIONS } from './spin'

interface Props {
  game: GameState
  isSpinning: boolean
  spinTrigger: number
  pendingSection: number
  pickAnyPending: boolean
  putBackChoicePending: boolean
  onSpinStart: () => void
  onSpinComplete: () => void
  onPickAny: (jewel: JewelryId) => void
  onPutBackChoice: (jewel: JewelryId) => void
  onNewGame: () => void
}

const CONFETTI_EMOJIS = ['👑', '✨', '💍', '⭐', '🌟', '💫', '🎉', '🎊']

function WinScreen({ winner, onNewGame }: { winner: Player; onNewGame: () => void }) {
  const particles = useMemo(() => (
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
      left: Math.random() * 95,
      size: 18 + Math.floor(Math.random() * 18),
      duration: 2.5 + Math.random() * 2,
      delay: Math.random() * 2,
    }))
  ), [])

  return (
    <div style={{ textAlign: 'center', paddingTop: 40, position: 'relative' }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-60px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.3; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'fixed',
          left: `${p.left}%`,
          top: 0,
          fontSize: p.size,
          animation: `confettiFall ${p.duration}s ${p.delay}s linear infinite`,
          pointerEvents: 'none',
          zIndex: 200,
          userSelect: 'none',
        }}>{p.emoji}</div>
      ))}
      <div style={{ fontSize: 72, marginBottom: 16 }}>{winner.character.emoji}</div>
      <h2 style={{ fontSize: 32, color: winner.color, marginBottom: 8 }}>{winner.name} Wins!</h2>
      <p style={{ fontSize: 18, color: '#9c27b0', marginBottom: 32 }}>Collected all 5 jewels!</p>
      <div style={{ fontSize: 32, marginBottom: 32 }}>{winner.inventory.join(' ')}</div>
      <button onClick={onNewGame} style={{ ...bigBtn('#ce93d8'), touchAction: 'manipulation' }}>
        Play Again 🎉
      </button>
    </div>
  )
}

export default function GameScreen({
  game, isSpinning, spinTrigger, pendingSection,
  pickAnyPending, putBackChoicePending,
  onSpinStart, onSpinComplete, onPickAny, onPutBackChoice, onNewGame,
}: Props) {
  const current = game.players[game.currentIndex]

  if (game.phase === 'won' && game.winner !== null) {
    const winner = game.players[game.winner]
    return <WinScreen winner={winner} onNewGame={onNewGame} />
  }

  const missingJewels = JEWELRY.filter(j => !current.inventory.includes(j))

  return (
    <div style={{ textAlign: 'center' }}>
      <style>{`
        @keyframes turnIn {
          0%   { opacity: 0.4; transform: translateY(-8px) scale(0.97); }
          60%  { transform: translateY(2px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes passTextFade {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          65%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      {pickAnyPending && (
        <Modal title="⭐ Pick any jewel!" items={missingJewels} onSelect={onPickAny} />
      )}
      {putBackChoicePending && (
        <Modal title="↩️ Choose a jewel to return" items={current.inventory} onSelect={onPutBackChoice} />
      )}

      {/* Turn banner */}
      <div
        key={game.currentIndex}
        style={{
          background: `linear-gradient(135deg, ${current.color}cc, ${current.color}88)`,
          borderRadius: 20, padding: '14px 24px', marginBottom: 12, color: '#fff',
          animation: 'turnIn 0.45s ease-out',
        }}
      >
        <div style={{ fontSize: 13, marginBottom: 2, animation: 'passTextFade 2s linear forwards' }}>
          👋 Pass to {current.name}!
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>It's your turn!</div>
        <div style={{ fontSize: 26, fontWeight: 'bold' }}>{current.character.emoji} {current.name}</div>
      </div>

      <Spinner spinTrigger={spinTrigger} targetSection={pendingSection} onSpinComplete={onSpinComplete} />

      {/* Legend */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '3px 6px', margin: '8px 0 10px',
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.6)', borderRadius: 10,
      }}>
        {SPINNER_SECTIONS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>{s.emoji}</span>
            <span style={{ fontSize: 10, color: '#6a1b9a' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {game.lastSpin && (
        <div style={{
          background: 'rgba(255,255,255,0.75)', borderRadius: 12,
          padding: '10px 20px', marginBottom: 12, fontSize: 16, color: '#6a1b9a',
        }}>
          {game.lastSpin}
        </div>
      )}

      <button
        onClick={onSpinStart}
        disabled={isSpinning}
        style={{
          ...bigBtn(isSpinning ? '#e0e0e0' : `linear-gradient(135deg, ${current.color}, #f48fb1)`),
          touchAction: 'manipulation',
        }}
      >
        {isSpinning ? 'Spinning...' : 'Spin! ✨'}
      </button>

      {/* Player rows */}
      <div style={{ marginTop: 20 }}>
        {game.players.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 8, borderRadius: 12,
            background: i === game.currentIndex ? `${p.color}22` : 'rgba(255,255,255,0.5)',
            border: `2px solid ${i === game.currentIndex ? p.color : 'transparent'}`,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{p.character.emoji}</span>
            <span style={{ fontWeight: 'bold', color: p.color, minWidth: 72, textAlign: 'left', fontSize: 14 }}>
              {p.name}
            </span>
            <span style={{ flex: 1, textAlign: 'left', letterSpacing: 2 }}>
              {JEWELRY.map(j => (
                <span key={j} style={{
                  fontSize: p.inventory.includes(j) ? 20 : 15,
                  opacity: p.inventory.includes(j) ? 1 : 0.2,
                  marginRight: 2,
                }}>
                  {j}
                </span>
              ))}
            </span>
            {p.hasBlackRing && <span title="Black Ring">⚫</span>}
          </div>
        ))}
      </div>

      <button onClick={onNewGame} style={{
        marginTop: 18, background: 'none', border: 'none',
        color: '#ab47bc', cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
        touchAction: 'manipulation',
      }}>New Game</button>
    </div>
  )
}

function Modal({ title, items, onSelect }: { title: string; items: readonly JewelryId[]; onSelect: (j: JewelryId) => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)',
        borderRadius: 20, padding: '24px 28px', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: 240,
      }}>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#7b1fa2', marginBottom: 16 }}>{title}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {items.map(j => (
            <button key={j} onClick={() => onSelect(j)} style={{
              fontSize: 38, background: 'rgba(255,255,255,0.85)',
              border: '2px solid #ce93d8', borderRadius: 12,
              padding: '8px 14px', cursor: 'pointer',
              touchAction: 'manipulation',
            }}>{j}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function bigBtn(bg: string): React.CSSProperties {
  return {
    fontSize: 22, padding: '16px 52px', borderRadius: 16,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: 'bold', background: bg, color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }
}
