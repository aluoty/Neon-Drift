import { useState, useEffect, useRef } from 'react'
import { modes, maps, cars } from '../engine/gameState'
import { startGame } from '../engine/gameState'
import { initAudio, playTone } from '../engine/audio'

interface MenuProps {
  onStart: () => void
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(ellipse at center, rgba(0,26,51,0.85) 0%, rgba(0,0,17,0.9) 50%, rgba(0,0,0,0.95) 100%)',
  color: '#00ffff',
  fontFamily: "'Courier New', monospace",
  zIndex: 10,
  backdropFilter: 'blur(4px)',
}

const titleContainer: React.CSSProperties = {
  position: 'relative',
  marginBottom: '0.5rem',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(2.5rem, 7vw, 5rem)',
  fontWeight: 'bold',
  letterSpacing: '0.15em',
  background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ffff)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: 'none',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 'clamp(0.65rem, 1.2vw, 0.9rem)',
  color: '#88ccff',
  marginBottom: '1.5rem',
  textAlign: 'center',
  lineHeight: 1.6,
  opacity: 0.8,
}

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.4rem',
  marginBottom: '1.2rem',
  flexWrap: 'wrap',
  justifyContent: 'center',
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.5rem 1.2rem',
  border: active ? '2px solid #00ffff' : '1px solid #334',
  borderRadius: '4px',
  background: active ? 'rgba(0,255,255,0.12)' : 'transparent',
  color: active ? '#00ffff' : '#556',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'clamp(0.6rem, 1.1vw, 0.85rem)',
  transition: 'all 0.3s',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
})

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '0.7rem',
  width: 'min(85vw, 650px)',
  marginBottom: '1.2rem',
}

const cardStyle = (selected: boolean, color?: string): React.CSSProperties => ({
  padding: '0.8rem 0.6rem',
  border: selected ? `2px solid ${color || '#00ffff'}` : '1px solid #223',
  borderRadius: '10px',
  background: selected
    ? `linear-gradient(135deg, ${color || '#00ffff'}15, transparent 80%)`
    : 'rgba(0,0,0,0.3)',
  cursor: 'pointer',
  textAlign: 'center' as const,
  transition: 'all 0.25s',
  boxShadow: selected ? `0 0 20px ${color || '#00ffff'}33` : 'none',
  position: 'relative' as const,
  overflow: 'hidden',
})

const cardTitleStyle: React.CSSProperties = {
  fontSize: 'clamp(0.75rem, 1.3vw, 1rem)',
  fontWeight: 'bold',
  marginBottom: '0.25rem',
}

const cardDetailStyle: React.CSSProperties = {
  fontSize: 'clamp(0.55rem, 0.9vw, 0.75rem)',
  color: '#88aacc',
}

const startButtonStyle: React.CSSProperties = {
  padding: '0.7rem 2.5rem',
  fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
  fontWeight: 'bold',
  fontFamily: 'inherit',
  border: '2px solid #00ffff',
  borderRadius: '6px',
  background: 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,100,255,0.1))',
  color: '#00ffff',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  transition: 'all 0.2s',
  marginTop: '0.3rem',
  textShadow: '0 0 10px rgba(0,255,255,0.5)',
}

const summaryStyle: React.CSSProperties = {
  fontSize: 'clamp(0.6rem, 1vw, 0.8rem)',
  color: '#669',
  marginTop: '0.6rem',
}

const carPreviewStyle = (color: string): React.CSSProperties => ({
  width: 50,
  height: 24,
  margin: '0 auto 6px',
  position: 'relative' as const,
  background: color,
  clipPath: 'polygon(0% 25%, 15% 0%, 85% 0%, 100% 25%, 100% 75%, 85% 100%, 15% 100%, 0% 75%)',
  opacity: 0.8,
  boxShadow: `0 0 10px ${color}`,
})

function CarPreview({ color }: { color: string }) {
  return <div style={carPreviewStyle(color)} />
}

const controlsHintStyle: React.CSSProperties = {
  fontSize: 'clamp(0.5rem, 0.8vw, 0.65rem)',
  color: '#446',
  marginTop: '0.8rem',
  textAlign: 'center',
  lineHeight: 1.8,
}

export function Menu({ onStart }: MenuProps) {
  const [page, setPage] = useState(0)
  const [selMode, setSelMode] = useState(1)
  const [selMap, setSelMap] = useState(0)
  const [selCar, setSelCar] = useState(0)
  const [glowOffset, setGlowOffset] = useState(0)
  const titleRef = useRef<HTMLDivElement>(null)

  const tabs = ['Mode', 'Track', 'Car']

  useEffect(() => {
    let raf = 0
    const animate = () => {
      setGlowOffset(t => t + 0.02)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleStart = () => {
    initAudio()
    playTone(523, 0.1, 'square')
    setTimeout(() => playTone(659, 0.1, 'square'), 80)
    setTimeout(() => playTone(784, 0.15, 'square'), 160)
    startGame(selCar, selMap, selMode)
    onStart()
  }

  return (
    <div style={containerStyle}>
      <div style={titleContainer}>
        <div
          ref={titleRef}
          style={{
            ...titleStyle,
            backgroundPosition: `${glowOffset * 100}% center`,
          }}
        >
          NEON DRIFT
        </div>
      </div>

      <div style={subtitleStyle}>
        SELECT YOUR SETUP &mdash; THEN RACE
      </div>

      <div style={tabBarStyle}>
        {tabs.map((t, i) => (
          <button key={t} style={tabStyle(page === i)} onClick={() => setPage(i)}>
            {t}
          </button>
        ))}
      </div>

      {page === 0 && (
        <div style={gridStyle}>
          {modes.map((m, i) => (
            <div
              key={m.name}
              style={cardStyle(selMode === i)}
              onClick={() => setSelMode(i)}
            >
              <div style={cardTitleStyle}>{m.name}</div>
              <div style={cardDetailStyle}>
                {m.ai ? 'Race against AI' : m.multiplayer ? 'Local 2-player' : 'Practice driving'}
              </div>
            </div>
          ))}
        </div>
      )}

      {page === 1 && (
        <div style={gridStyle}>
          {maps.map((m, i) => {
            const edgeColor = /** @type {typeof m} */ (m).edgeColor || '#00ffff'
            return (
              <div
                key={m.name}
                style={{
                  ...cardStyle(selMap === i, edgeColor),
                }}
                onClick={() => setSelMap(i)}
              >
                <div
                  style={{
                    width: '100%',
                    height: 4,
                    borderRadius: 2,
                    marginBottom: 6,
                    background: `linear-gradient(90deg, ${edgeColor}, transparent)`,
                  }}
                />
                <div style={cardTitleStyle}>{m.name}</div>
                <div style={cardDetailStyle}>{m.finish}m &middot; {m.aiCount} AI</div>
              </div>
            )
          })}
        </div>
      )}

      {page === 2 && (
        <div style={gridStyle}>
          {cars.map((c, i) => (
            <div
              key={c.name}
              style={{
                ...cardStyle(selCar === i, c.color),
              }}
              onClick={() => setSelCar(i)}
            >
              <CarPreview color={c.color} />
              <div style={{ ...cardTitleStyle, color: c.color }}>{c.name}</div>
              <div style={cardDetailStyle}>
                <div>Accel {c.accel.toFixed(2)}</div>
                <div>Turn {c.turn.toFixed(3)}</div>
                <div>Speed {c.maxSpeed}</div>
                <div>Grip {(c.grip * 100).toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        style={startButtonStyle}
        onClick={handleStart}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(0,255,255,0.25)'
          e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,255,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,100,255,0.1))'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        START RACE
      </button>

      <div style={summaryStyle}>
        {modes[selMode].name} &middot; {maps[selMap].name} &middot; {cars[selCar].name}
      </div>

      <div style={controlsHintStyle}>
        W/ArrowUp = Accelerate &middot; S/ArrowDown = Brake/Drift &middot; A/D = Steer &middot; Shift = Boost
      </div>
    </div>
  )
}
