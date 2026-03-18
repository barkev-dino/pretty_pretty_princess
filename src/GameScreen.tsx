import Spinner from './Spinner'
import { GameState, JEWELRY, JewelryId } from './types'
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

export default function GameScreen({
  game, isSpinning, spinTrigger, pendingSection,
  pickAnyPending, putBackChoicePending,
  onSpinStart, onSpinComplete, onPickAny, onPutBackChoice, onNewGame,
}: Props) {
  const current = game.players[game.currentIndex]

  if (game.phase === 'won' && game.winner !== null) {
    const winner = game.players[game.winner]
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>👑</div>
        <h2 style={{ fontSize: 32, color: winner.color, marginBottom: 8 }}>{winner.name} Wins!</h2>
        <p style={{ fontSize: 18, color: '#9c27b0', marginBottom: 32 }}>Collected all 5 jewels!</p>
        <div style={{ fontSize: 32, marginBottom: 32 }}>{winner.inventory.join(' ')}</div>
        <button onClick={onNewGame} style={bigBtn('#ce93d8')}>Play Again</button>
      </div>
    )
  }

  const missingJewels = JEWELRY.filter(j => !current.inventory.includes(j))

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Pick Any modal */}
      {pickAnyPending && (
        <Modal title="⭐ Pick any jewel!" items={missingJewels} onSelect={onPickAny} />
      )}

      {/* Put Back Choice modal */}
      {putBackChoicePending && (
        <Modal title="↩️ Choose a jewel to return" items={current.inventory} onSelect={onPutBackChoice} />
      )}

      {/* Turn banner */}
      <div style={{
        background: `linear-gradient(135deg, ${current.color}cc, ${current.color}88)`,
        borderRadius: 20, padding: '14px 24px', marginBottom: 12, color: '#fff',
      }}>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>It's your turn!</div>
        <div style={{ fontSize: 26, fontWeight: 'bold' }}>{current.name}</div>
      </div>

      {/* Spinner */}
      <Spinner spinTrigger={spinTrigger} targetSection={pendingSection} onSpinComplete={onSpinComplete} />

      {/* Legend */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px 6px', margin: '8px 0 10px',
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.6)', borderRadius: 10,
      }}>
        {SPINNER_SECTIONS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 12, height: 12, background: s.color,
              borderRadius: 3, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
            }} />
            <span style={{ fontSize: 13 }}>{s.emoji}</span>
            <span style={{ fontSize: 10, color: '#6a1b9a', whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Result message */}
      {game.lastSpin && (
        <div style={{
          background: 'rgba(255,255,255,0.75)', borderRadius: 12,
          padding: '10px 20px', marginBottom: 12, fontSize: 16, color: '#6a1b9a',
        }}>
          {game.lastSpin}
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={onSpinStart}
        disabled={isSpinning}
        style={bigBtn(isSpinning ? '#e0e0e0' : `linear-gradient(135deg, ${current.color}, #f48fb1)`)}
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
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 'bold', color: p.color, minWidth: 80, textAlign: 'left' }}>{p.name}</span>
            <span style={{ fontSize: 20, letterSpacing: 3, flex: 1, textAlign: 'left' }}>
              {p.inventory.length === 0
                ? <span style={{ color: '#ccc', fontSize: 13 }}>no jewels yet</span>
                : p.inventory.join(' ')}
            </span>
            {p.hasBlackRing && <span title="Black Ring">⚫</span>}
            <span style={{ color: p.color, fontSize: 12 }}>{p.inventory.length}/5</span>
          </div>
        ))}
      </div>

      <button onClick={onNewGame} style={{
        marginTop: 18, background: 'none', border: 'none',
        color: '#ab47bc', cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
      }}>New Game</button>
    </div>
  )
}

function Modal({ title, items, onSelect }: { title: string; items: readonly JewelryId[]; onSelect: (j: JewelryId) => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
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
            }}>
              {j}
            </button>
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
