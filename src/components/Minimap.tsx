import { useEffect, useState, useRef, type FC } from 'react'
import { S, roadY, getCurrentMap } from '../engine/gameState'

const MINIMAP_RANGE = 1200

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 10,
  right: 10,
  zIndex: 5,
  pointerEvents: 'auto',
  cursor: 'pointer',
}

const canvasStyle: React.CSSProperties = {
  borderRadius: 6,
  display: 'block',
}

export const Minimap: FC = () => {
  const [zoom, setZoom] = useState(false)
  const map = getCurrentMap()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'm' || e.key === 'M' || e.key === 'Escape') && zoom) {
        setZoom(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoom])

  if (zoom) {
    return <ZoomedMinimap onClose={() => setZoom(false)} />
  }

  return (
    <div style={containerStyle} onClick={() => setZoom(true)}>
      <LiveMinimapCanvas width={160} height={160} borderColor={map.edgeColor} />
    </div>
  )
}

const LiveMinimapCanvas: FC<{ width: number; height: number; borderColor: string }> = ({ width, height, borderColor }) => {
  const [tick, setTick] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      setTick(t => t + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawMinimapContent(ctx, width, height)
  }, [tick, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        ...canvasStyle,
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 12px ${borderColor}44`,
      }}
    />
  )
}

function drawMinimapContent(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const range = MINIMAP_RANGE
  const map = getCurrentMap()
  ctx.clearRect(0, 0, w, h)

  // Background
  ctx.fillStyle = '#000c'
  ctx.fillRect(0, 0, w, h)

  // Road path
  ctx.strokeStyle = '#556'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  const startX = S.playerCar.x - range / 2
  for (let i = 0; i <= range; i += 30) {
    const wx = startX + i
    const ry = roadY(wx)
    const sx = (i / range) * w
    const sy = h / 2 + (ry - S.playerCar.y) * 0.012
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.stroke()

  // Road edge glow
  ctx.strokeStyle = map.edgeColor + '33'
  ctx.lineWidth = 4
  ctx.beginPath()
  for (let i = 0; i <= range; i += 30) {
    const wx = startX + i
    const ry = roadY(wx)
    const sx = (i / range) * w
    const sy = h / 2 + (ry - S.playerCar.y) * 0.012 - 6
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.stroke()
  ctx.beginPath()
  for (let i = 0; i <= range; i += 30) {
    const wx = startX + i
    const ry = roadY(wx)
    const sx = (i / range) * w
    const sy = h / 2 + (ry - S.playerCar.y) * 0.012 + 6
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.stroke()

  // Finish line
  const finishPct = (S.levelTarget - S.playerCar.x + range / 2) / range
  ctx.fillStyle = '#ff44ff'
  ctx.shadowColor = '#ff44ff'
  ctx.shadowBlur = 8
  ctx.fillRect(finishPct * w - 2, 0, 4, h)
  ctx.shadowBlur = 0

  // AI cars
  for (const b of S.bots) {
    const bx = w / 2 + (b.x - S.playerCar.x) * (w / range)
    const by = h / 2 + (b.y - S.playerCar.y) * 0.012
    ctx.fillStyle = b.color
    ctx.shadowColor = b.color
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // Player 2
  if (S.playerCar2) {
    const p2x = w / 2 + (S.playerCar2.x - S.playerCar.x) * (w / range)
    const p2y = h / 2 + (S.playerCar2.y - S.playerCar.y) * 0.012
    ctx.fillStyle = S.playerCar2.color
    ctx.shadowColor = S.playerCar2.color
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(p2x, p2y, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Player car (with glow)
  ctx.fillStyle = S.playerCar.color
  ctx.shadowColor = S.playerCar.color
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Direction indicator
  ctx.strokeStyle = S.playerCar.color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w / 2, h / 2)
  ctx.lineTo(w / 2 + Math.cos(S.playerCar.angle) * 12, h / 2 + Math.sin(S.playerCar.angle) * 12)
  ctx.stroke()

  // Border
  ctx.strokeStyle = map.edgeColor + '88'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, w, h)
}

const zoomedContainerStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, zIndex: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,17,0.88)', pointerEvents: 'auto',
}

function ZoomedMinimap({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const [, setTick] = useState(0)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      setTick(t => t + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const size = Math.min(window.innerWidth, window.innerHeight) * 0.7
  const map = getCurrentMap()

  return (
    <div style={zoomedContainerStyle} onClick={onClose}>
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <ZoomedCanvas size={size} />
        <div style={{
          position: 'absolute', top: -40, left: 0, right: 0,
          textAlign: 'center', color: map.edgeColor,
          fontFamily: "'Courier New', monospace", fontSize: 14,
          textShadow: `0 0 10px ${map.edgeColor}`,
        }}>
          MINIMAP &mdash; M or ESC to close
        </div>
      </div>
    </div>
  )
}

const ZoomedCanvas: FC<{ size: number }> = ({ size }) => {
  const [tick, setTick] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      setTick(t => t + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawZoomedContent(ctx, size)
  }, [tick, size])

  return (
    <canvas
      width={size}
      height={size}
      style={{
        border: '2px solid ' + getCurrentMap().edgeColor,
        borderRadius: '50%',
        display: 'block',
        boxShadow: `0 0 30px ${getCurrentMap().edgeColor}33`,
      }}
      ref={canvasRef}
    />
  )
}

function drawZoomedContent(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2, cy = size / 2
  const map = getCurrentMap()

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = '#000c'
  ctx.fillRect(0, 0, size, size)

  const range = 2400
  const scale = size / range

  // Road
  ctx.strokeStyle = '#667'
  ctx.lineWidth = 3
  ctx.beginPath()
  const startX = S.playerCar.x - range / 2
  for (let i = 0; i <= range; i += 30) {
    const wx = startX + i
    const ry = roadY(wx)
    const sx = cx + (i - range / 2) * scale
    const sy = cy + (ry - S.playerCar.y) * 0.015
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.stroke()

  // Finish
  const finishDx = (S.levelTarget - S.playerCar.x) * scale
  ctx.strokeStyle = '#ff44ff'
  ctx.lineWidth = 3
  ctx.shadowColor = '#ff44ff'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(cx + finishDx, cy, 14, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0

  // AI
  for (const b of S.bots) {
    ctx.fillStyle = b.color
    ctx.shadowColor = b.color
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(cx + (b.x - S.playerCar.x) * scale, cy + (b.y - S.playerCar.y) * 0.015, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // P2
  if (S.playerCar2) {
    ctx.fillStyle = S.playerCar2.color
    ctx.shadowColor = S.playerCar2.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(cx + (S.playerCar2.x - S.playerCar.x) * scale, cy + (S.playerCar2.y - S.playerCar.y) * 0.015, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Player
  ctx.fillStyle = S.playerCar.color
  ctx.shadowColor = S.playerCar.color
  ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Direction
  ctx.strokeStyle = S.playerCar.color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(S.playerCar.angle) * 20, cy + Math.sin(S.playerCar.angle) * 20)
  ctx.stroke()

  ctx.restore()

  // Outer glow ring
  ctx.strokeStyle = map.edgeColor + '44'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2 - 1, 0, Math.PI * 2)
  ctx.stroke()
}
