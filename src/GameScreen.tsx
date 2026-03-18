import { GameState } from './types'

interface Props {
  game: GameState
  onSpin: () => void
  onNewGame: () => void
}

export default function GameScreen({ game, onSpin, onNewGame }: Props) {
  const current = game.players[game.currentIndex]

  if (game.phase === 'won' && game.winner !== null) {
    const winner = game.players[game.winner]
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>👑</div>
        <h2 style={{ fontSize: 32, color: '#7b1fa2', marginBottom: 8 }}>
          {winner.name} Wins!
        </h2>
        <p style={{ fontSize: 18, color: '#9c27b0', marginBottom: 32 }}>
          Collected all 5 jewels!
        </p>
        <div style={{ fontSize: 32, marginBottom: 32 }}>
          {winner.inventory.join(' ')}
        </div>
        <button onClick={onNewGame} style={bigBtn('#ce93d8')}>
          Play Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* KAN-11: Turn banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ce93d8, #f48fb1)',
        borderRadius: 20,
        padding: '20px 24px',
        marginBottom: 28,
        color: '#fff',
      }}>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>It's your turn!</div>
        <div style={{ fontSize: 30, fontWeight: 'bold' }}>{current.name} 💜</div>
      </div>

      {/* KAN-12: Spin button */}
      {game.lastSpin && (
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 20,
          fontSize: 18,
          color: '#7b1fa2',
        }}>
          {game.lastSpin}
        </div>
      )}

      <button
        onClick={onSpin}
        style={bigBtn('linear-gradient(135deg, #f48fb1, #ce93d8)')}
      >
        Spin! ✨
      </button>

      {/* KAN-13: Inventory */}
      <div style={{ marginTop: 36 }}>
        {game.players.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            marginBottom: 10,
            borderRadius: 12,
            background: i === game.currentIndex
              ? 'rgba(206,147,216,0.25)'
              : 'rgba(255,255,255,0.5)',
            border: i === game.currentIndex ? '2px solid #ce93d8' : '2px solid transparent',
          }}>
            <span style={{ fontWeight: 'bold', color: '#7b1fa2', minWidth: 80, textAlign: 'left' }}>
              {p.name}
            </span>
            <span style={{ fontSize: 22, letterSpacing: 4, flex: 1, textAlign: 'left' }}>
              {p.inventory.length === 0 ? (
                <span style={{ color: '#ccc', fontSize: 14 }}>no jewels yet</span>
              ) : p.inventory.join(' ')}
            </span>
            <span style={{ color: '#ab47bc', fontSize: 13 }}>
              {p.inventory.length}/5
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onNewGame}
        style={{ marginTop: 24, background: 'none', border: 'none', color: '#ab47bc', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
      >
        New Game
      </button>
    </div>
  )
}

function bigBtn(bg: string): React.CSSProperties {
  return {
    fontSize: 22,
    padding: '18px 56px',
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
