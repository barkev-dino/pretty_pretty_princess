import { Character } from './types'

interface Props {
  player: { name: string; character: Character }
  onReady: () => void
}

export default function HandoffScreen({ player, onReady }: Props) {
  const { name, character } = player
  return (
    <div
      onClick={onReady}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)',
        textAlign: 'center', cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 96, marginBottom: 16 }}>{character.emoji}</div>
      <p style={{ fontSize: 20, color: '#9c27b0', marginBottom: 8 }}>Pass the phone to</p>
      <h2 style={{ fontSize: 36, fontWeight: 'bold', color: character.color, marginBottom: 40 }}>
        {name}
      </h2>
      <button
        onClick={e => { e.stopPropagation(); onReady() }}
        style={{
          fontSize: 22, padding: '18px 52px', borderRadius: 16,
          border: `3px solid ${character.color}`,
          background: `${character.color}22`,
          color: character.color, cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 'bold',
        }}
      >
        I'm ready! 🎮
      </button>
      <p style={{ marginTop: 24, fontSize: 13, color: '#ab47bc', opacity: 0.7 }}>
        (tap anywhere to continue)
      </p>
    </div>
  )
}
