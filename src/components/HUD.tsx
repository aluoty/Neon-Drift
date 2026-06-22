import { useEffect, useState, type FC } from 'react'
import type { GameFrameData } from './GameCanvas'

interface HUDProps {
  gameRef: React.RefObject<{ frameDataRef: React.RefObject<GameFrameData | null> } | null>
}

const hudStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 5,
}

const topLeftStyle: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 14,
  fontFamily: "'Courier New', monospace",
  fontSize: '13px',
  color: '#00ffff',
  textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)',
  lineHeight: 1.8,
}

const topRightStyle: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 14,
  fontFamily: "'Courier New', monospace",
  textAlign: 'right',
  textShadow: '0 0 10px rgba(0,0,0,0.9)',
}

const speedValueStyle: React.CSSProperties = {
  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
  fontWeight: 'bold',
  color: '#ffffff',
  textShadow: '0 0 20px rgba(0,255,255,0.5)',
}

const speedUnitStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#88aacc',
  marginTop: -4,
}

const labelStyle: React.CSSProperties = {
  color: '#88aacc',
  fontSize: '11px',
}

const valueStyle: React.CSSProperties = {
  color: '#00ffff',
  fontSize: '13px',
}

const boostContainerStyle: React.CSSProperties = {
  marginTop: 8,
  width: 130,
}

const boostLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '11px',
  color: '#88aacc',
  marginBottom: 2,
}

const boostBarOuterStyle: React.CSSProperties = {
  height: 10,
  background: '#1a1a2a',
  border: '1px solid #334',
  borderRadius: 3,
  overflow: 'hidden',
}

const boostBarInnerStyle = (pct: number): React.CSSProperties => ({
  width: `${pct}%`,
  height: '100%',
  background: `linear-gradient(90deg, #ff3333, #ffaa00, #00ff88)`,
  transition: 'width 0.08s',
  borderRadius: 3,
  boxShadow: pct > 50 ? '0 0 8px rgba(0,255,136,0.5)' : 'none',
})

const levelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 14,
  left: 14,
  fontFamily: "'Courier New', monospace",
  fontSize: '13px',
  color: '#ff00ff',
  textShadow: '0 0 10px rgba(255,0,255,0.5), 0 0 4px rgba(0,0,0,0.8)',
}

const bottomRightStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 14,
  right: 14,
  fontFamily: "'Courier New', monospace",
  fontSize: '11px',
  color: '#556',
  textShadow: '0 0 6px rgba(0,0,0,0.8)',
}

const scanlineStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)',
  pointerEvents: 'none',
  zIndex: 6,
}

const levelUpStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontFamily: "'Courier New', monospace",
  fontSize: 'clamp(1.5rem, 4vw, 3rem)',
  fontWeight: 'bold',
  color: '#ff00ff',
  textShadow: '0 0 30px #ff00ff, 0 0 60px #ff00ff',
  opacity: 0.9,
  letterSpacing: '0.1em',
}

export const HUD: FC<HUDProps> = ({ gameRef }) => {
  const [data, setData] = useState<GameFrameData | null>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const d = gameRef.current?.frameDataRef.current ?? null
      if (d && d.frameCount % 2 === 0) {
        setData(d)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [gameRef])

  if (!data) return null

  const speedKmh = Math.floor(data.speed * 12)
  const boosting = data.boosting

  return (
    <>
      <div style={scanlineStyle} />
      <div style={hudStyle}>
        <div style={topLeftStyle}>
          <div><span style={labelStyle}>MODE</span> <span style={valueStyle}>{data.modeName}</span></div>
          <div><span style={labelStyle}>TRACK</span> <span style={valueStyle}>{data.mapName}</span></div>
          <div><span style={labelStyle}>SCORE</span> <span style={valueStyle}>{Math.floor(data.score).toLocaleString()}</span></div>
          <div><span style={labelStyle}>DIST</span> <span style={valueStyle}>{Math.floor(data.playerX).toLocaleString()}m</span></div>

          <div style={boostContainerStyle}>
            <div style={boostLabelStyle}>
              <span>BOOST</span>
              <span style={{ color: data.playerBoost > 50 ? '#00ff88' : data.playerBoost > 20 ? '#ffaa00' : '#ff3333' }}>
                {Math.floor(data.playerBoost)}%
              </span>
            </div>
            <div style={boostBarOuterStyle}>
              <div style={boostBarInnerStyle(data.playerBoost)} />
            </div>
          </div>

          {data.multiplayer && (
            <div style={{ color: data.player2Color, marginTop: 6, fontSize: 12 }}>
              P2 &middot; {Math.floor(data.player2X).toLocaleString()}m
            </div>
          )}
        </div>

        <div style={topRightStyle}>
          <div style={{
            ...speedValueStyle,
            color: boosting ? '#ffdd00' : '#ffffff',
            textShadow: boosting
              ? '0 0 30px rgba(255,221,0,0.6)'
              : '0 0 20px rgba(0,255,255,0.3)',
          }}>
            {speedKmh}
          </div>
          <div style={speedUnitStyle}>KM/H</div>
        </div>

        <div style={levelStyle}>
          LV {data.level}
        </div>

        <div style={bottomRightStyle}>
          {data.levelTarget - data.playerX > 0
            ? `${Math.floor(data.levelTarget - data.playerX)}m to finish`
            : 'FINISH!'}
        </div>

        {data.levelUpFlash > 0 && (
          <div style={levelUpStyle}>LEVEL UP!</div>
        )}
      </div>
    </>
  )
}
