import Spinner from './Spinner'
import { GameState } from './types'

interface Props {
  game: GameState
  isSpinning: boolean
  spinTrigger: number
  pendingSection: number
  onSpinStart: () => void
  onSpinComplete: () => void
  onNewGame: () => void
}

export default function GameScreen({
  game, isSpinning, spinTrigger, pendingSection,
  onSpinStart, onSpinComplete, onNewGame,
}: Props) {
  const current = game.players[game.currentIndex]

  if (game.phase === 'won' && game.winner !== null) {
    const winner = game.players[game.winner]
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>👑</div>
        <h2 style={{ fontSize: 32, color: winner.color, marginBottom: 8 }}>
          {winner.name} Wins!
        </h2>
        <p style={{ fontSize: 18, color: '#9c27b0', marginBottom: 32 }}>Collected all 5 jewels!</p>
        <div style={{ fontSize: 32, marginBottom: 32 }}>{winner.inventory.join(' ')}</div>
        <button onClick={onNewGame} style={bigBtn('#ce93d8')}>Play Again</button>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Turn banner */}
      <div style={{
        background: `linear-gradient(135deg, ${current.color}cc, ${current.color}88)`,
        borderRadius: 20,
        padding: '14px 24px',
        marginBottom: 16,
        color: '#fff',
      }}>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>It's your turn!</div>
        <div style={{ fontSize: 26, fontWeight: 'bold' }}>{current.name}</div>
      </div>

      {/* SVG Spinner */}
      <div style={{ marginBottom: 12 }}>
        <Spinner
          spinTrigger={spinTrigger}
          targetSection={pendingSection}
          onSpinComplete={onSpinComplete}
        />
      </div>

      {/* Result message */}
      {game.lastSpin && (
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          borderRadius: 12,
          padding: '10px 20px',
          marginBottom: 14,
          fontSize: 17,
          color: '#6a1b9a',
          minHeight: 40,
        }}>
          {game.lastSpin}
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={onSpinStart}
        disabled={isSpinning}
        style={bigBtn(
          isSpinning
            ? '#e0e0e0'
            : `linear-gradient(135deg, ${current.color}, #f48fb1)`
        )}
      >
        {isSpinning ? 'Spinning...' : 'Spin! ✨'}
      </button>

      {/* Player rows */}
      <div style={{ marginTop: 24 }}>
        {game.players.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            marginBottom: 8,
            borderRadius: 12,
            background: i === game.currentIndex ? `${p.color}22` : 'rgba(255,255,255,0.5)',
            border: `2px solid ${i === game.currentIndex ? p.color : 'transparent'}`,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: p.color, flexShrink: 0,
            }} />
            <span style={{ fontWeight: 'bold', color: p.color, minWidth: 80, textAlign: 'left' }}>
              {p.name}
            </span>
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

      <button
        onClick={onNewGame}
        style={{ marginTop: 18, background: 'none', border: 'none', color: '#ab47bc', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
      >
        New Game
      </button>
    </div>
  )
}

function bigBtn(bg: string): React.CSSProperties {
  return {
    fontSize: 22,
    padding: '16px 52px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    background: bg,
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }
}
