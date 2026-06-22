import { useRef, useState, useCallback } from 'react'
import GameCanvas from './components/GameCanvas'
import type { GameFrameData } from './components/GameCanvas'
import { Menu } from './components/Menu'
import { HUD } from './components/HUD'
import { Minimap } from './components/Minimap'

const appStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
  background: '#000',
}

export default function App() {
  const [playing, setPlaying] = useState(false)
  const gameRef = useRef<{ frameDataRef: React.RefObject<GameFrameData | null> }>(null)

  const handleStart = useCallback(() => {
    setPlaying(true)
  }, [])

  return (
    <div style={appStyle}>
      <GameCanvas ref={gameRef} />
      {!playing && <Menu onStart={handleStart} />}
      {playing && <HUD gameRef={gameRef} />}
      {playing && <Minimap />}
    </div>
  )
}
