import React, { useEffect, useRef } from 'react'
import { setContext, updateCanvasSize, renderGame, renderMenuBackground, drawCountdown } from '../engine/renderer'
import { setupInput } from '../engine/input'
import { S, initStars, updateStars, modes, getCurrentMapIndex, getMaps } from '../engine/gameState'
import { updatePlayer, updatePlayer2, updateBots, updateCamera, updateCountdown } from '../engine/physics'
import { updateParticles } from '../engine/particles'
import { updateEngineSound } from '../engine/audio'

export interface GameFrameData {
  score: number
  level: number
  playerX: number
  playerBoost: number
  playerColor: string
  mapName: string
  modeName: string
  multiplayer: boolean
  player2X: number
  player2Color: string
  levelTarget: number
  minimapZoomed: boolean
  frameCount: number
  speed: number
  boosting: boolean
  levelUpFlash: number
}

const GameCanvas = React.forwardRef<{ frameDataRef: React.RefObject<GameFrameData | null> }>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameDataRef = useRef<GameFrameData | null>(null)
  const frameCountRef = useRef(0)

  React.useImperativeHandle(ref, () => ({
    frameDataRef,
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      updateCanvasSize(canvas.width, canvas.height)
      initStars(canvas.width, canvas.height)
    }

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    setContext(ctx, canvas.width, canvas.height)
    initStars(canvas.width, canvas.height)
    setupInput()

    window.addEventListener('resize', resize)

    let running = true
    const loop = () => {
      if (!running) return

      updateStars()

      if (S.gameState === 'menu') {
        renderMenuBackground()
      } else if (S.gameState === 'countdown') {
        renderMenuBackground()
        updateCountdown()
        drawCountdown()
      } else if (S.gameState === 'playing') {
        updatePlayer()
        if (modes[S.selectedMode].multiplayer) updatePlayer2()
        updateBots()
        updateParticles()
        updateCamera()

        const speed = Math.hypot(S.playerCar.vx, S.playerCar.vy)
        updateEngineSound(speed)

        renderGame()

        frameCountRef.current++
        frameDataRef.current = {
          score: S.score,
          level: S.level,
          playerX: S.playerCar.x,
          playerBoost: S.playerCar.boost,
          playerColor: S.playerCar.color,
          mapName: getMaps()[getCurrentMapIndex() % getMaps().length].name,
          modeName: modes[S.selectedMode].name,
          multiplayer: modes[S.selectedMode].multiplayer,
          player2X: S.playerCar2.x,
          player2Color: S.playerCar2.color,
          levelTarget: S.levelTarget,
          minimapZoomed: S.minimapZoomed,
          frameCount: frameCountRef.current,
          speed,
          boosting: S.playerCar.boost < 100 && S.playerCar.boost > 0,
          levelUpFlash: S.levelUpFlash,
        }
      }

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)

    return () => {
      running = false
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        background: 'transparent',
      }}
    />
  )
})

GameCanvas.displayName = 'GameCanvas'

export default GameCanvas
