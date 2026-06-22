import { S, getCurrentMap, roadY, ROAD_WIDTH, modes } from './gameState'
import { getParticles } from './particles'
import type { CarState } from './types'

let ctx: CanvasRenderingContext2D | null = null
let canvasW = 0
let canvasH = 0

export function setContext(context: CanvasRenderingContext2D, w: number, h: number): void {
  ctx = context
  canvasW = w
  canvasH = h
}

export function updateCanvasSize(w: number, h: number): void {
  canvasW = w
  canvasH = h
}

export function renderMenuBackground(): void {
  if (!ctx) return
  drawBackground()
}

function drawBackground(): void {
  if (!ctx) return
  const map = getCurrentMap()
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasH)
  gradient.addColorStop(0, map.bgColor1)
  gradient.addColorStop(0.5, map.bgColor2)
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasW, canvasH)

  ctx.fillStyle = '#0a0a1a'
  for (let i = 0; i < 20; i++) {
    const bx = (i * 137 + 50) % (canvasW + 200) - 100
    const bh = 40 + ((i * 73) % 120)
    const bw = 30 + ((i * 47) % 40)
    ctx.fillRect(bx, canvasH - bh - 100, bw, bh)
    ctx.fillStyle = '#1a1a3a'
    for (let wy = canvasH - bh - 90; wy < canvasH - 110; wy += 15) {
      for (let wx = bx + 5; wx < bx + bw - 5; wx += 12) {
        if (Math.random() > 0.3) {
          ctx.fillStyle = `rgba(255,255,100,${0.1 + Math.random() * 0.2})`
          ctx.fillRect(wx, wy, 6, 8)
        }
      }
    }
    ctx.fillStyle = '#0a0a1a'
  }

  ctx.fillStyle = '#ffffff'
  for (const s of S.stars) {
    ctx.globalAlpha = s.brightness * (0.6 + Math.sin(performance.now() * 0.001 * s.twinkleSpeed) * 0.2)
    ctx.fillRect(s.x, s.y, s.size, s.size)
  }
  ctx.globalAlpha = 1
}

function drawBoostPads(): void {
  if (!ctx) return
  const map = getCurrentMap()
  const time = performance.now() * 0.003

  for (let i = 0; i < map.boostPads.length; i++) {
    const pad = map.boostPads[i]
    const worldX = pad.worldX
    const y = roadY(worldX)
    const sx = worldX - S.cam.x + canvasW / 2 + S.cam.shakeX
    const sy = y - S.cam.y + canvasH / 2 + S.cam.shakeY

    if (sx < -60 || sx > canvasW + 60) continue

    const hitTimer = S.boostPadHitTimers?.[i] ?? 0
    const alpha = hitTimer > 0 ? 0.3 : 0.7 + Math.sin(time + i) * 0.3
    const halfW = pad.width / 2

    // Glow
    ctx.shadowColor = '#ffff00'
    ctx.shadowBlur = hitTimer > 0 ? 8 : 15

    // Pad arrow shape
    ctx.fillStyle = `rgba(255,220,0,${alpha})`
    ctx.beginPath()
    ctx.moveTo(sx + halfW, sy)
    ctx.lineTo(sx - halfW * 0.3, sy - 12)
    ctx.lineTo(sx - halfW, sy - 12)
    ctx.lineTo(sx - halfW, sy - 4)
    ctx.lineTo(sx - halfW * 0.5, sy)
    ctx.lineTo(sx - halfW, sy + 4)
    ctx.lineTo(sx - halfW, sy + 12)
    ctx.lineTo(sx - halfW * 0.3, sy + 12)
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 0

    // Border
    ctx.strokeStyle = '#ffff00'
    ctx.lineWidth = 2
    ctx.globalAlpha = hitTimer > 0 ? 0.2 : 0.6
    ctx.strokeRect(sx - halfW, sy - ROAD_WIDTH / 2, pad.width, ROAD_WIDTH)
    ctx.globalAlpha = 1
  }
}

function drawMapObjects(): void {
  if (!ctx) return
  const map = getCurrentMap()
  ctx.fillStyle = map.poleColor
  for (let worldX = Math.floor((S.cam.x - canvasW) / 180) * 180; worldX < S.cam.x + canvasW; worldX += 180) {
    const y = roadY(worldX)
    const sx = worldX - S.cam.x + canvasW / 2 + S.cam.shakeX
    const sy = y - S.cam.y + canvasH / 2 + S.cam.shakeY

    ctx.shadowColor = map.poleColor
    ctx.shadowBlur = 10
    ctx.fillRect(sx - ROAD_WIDTH / 2 - 18, sy - 18, 8, 36)
    ctx.fillRect(sx + ROAD_WIDTH / 2 + 10, sy - 18, 8, 36)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 15
    ctx.fillRect(sx - ROAD_WIDTH / 2 - 22, sy - 4, 16, 8)
    ctx.fillRect(sx + ROAD_WIDTH / 2 + 6, sy - 4, 16, 8)
    ctx.shadowBlur = 0
    ctx.fillStyle = map.poleColor
  }
}

function drawFinishLine(): void {
  if (!ctx) return
  const worldX = S.levelTarget
  const y = roadY(worldX)
  const sx = worldX - S.cam.x + canvasW / 2 + S.cam.shakeX
  const sy = y - S.cam.y + canvasH / 2 + S.cam.shakeY

  if (sx < -50 || sx > canvasW + 50) return

  const tileSize = 10
  const halfRoad = ROAD_WIDTH / 2
  for (let row = 0; row < Math.ceil(ROAD_WIDTH / tileSize); row++) {
    for (let col = 0; col < 3; col++) {
      const isWhite = (row + col) % 2 === 0
      ctx.fillStyle = isWhite ? '#ffffff' : '#000000'
      ctx.fillRect(sx + (col - 1) * tileSize, sy - halfRoad + row * tileSize, tileSize, tileSize)
    }
  }

  ctx.shadowColor = '#ff00ff'
  ctx.shadowBlur = 20
  ctx.strokeStyle = '#ff00ff'
  ctx.lineWidth = 2
  ctx.strokeRect(sx - 15, sy - halfRoad, 30, ROAD_WIDTH)
  ctx.shadowBlur = 0
}

function drawRoad(): void {
  if (!ctx) return
  const map = getCurrentMap()
  const shakeX = S.cam.shakeX
  const shakeY = S.cam.shakeY

  ctx.beginPath()
  for (let x = 0; x < canvasW; x++) {
    const wx = S.cam.x + (x - canvasW / 2)
    const y = roadY(wx)
    const top = y - ROAD_WIDTH / 2
    const sy = top - S.cam.y + canvasH / 2 + shakeY
    if (x === 0) ctx.moveTo(x + shakeX, sy)
    else ctx.lineTo(x + shakeX, sy)
  }

  for (let x = canvasW - 1; x >= 0; x--) {
    const wx = S.cam.x + (x - canvasW / 2)
    const y = roadY(wx)
    const bottom = y + ROAD_WIDTH / 2
    const sy = bottom - S.cam.y + canvasH / 2 + shakeY
    ctx.lineTo(x + shakeX, sy)
  }

  ctx.closePath()

  const roadGrad = ctx.createLinearGradient(0, 0, 0, canvasH)
  roadGrad.addColorStop(0, map.roadColor)
  roadGrad.addColorStop(0.5, lightenColor(map.roadColor, 10))
  roadGrad.addColorStop(1, map.roadColor)
  ctx.fillStyle = roadGrad
  ctx.fill()

  ctx.shadowColor = map.edgeColor
  ctx.shadowBlur = 20
  ctx.strokeStyle = map.edgeColor
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.strokeStyle = map.centerColor
  ctx.lineWidth = 2
  ctx.setLineDash([15, 15])
  ctx.beginPath()
  for (let x = 0; x < canvasW; x++) {
    const wx = S.cam.x + (x - canvasW / 2)
    const y = roadY(wx)
    const sy = y - S.cam.y + canvasH / 2 + shakeY
    if (x === 0) ctx.moveTo(x + shakeX, sy)
    else ctx.lineTo(x + shakeX, sy)
  }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.shadowBlur = 0
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + percent)
  const g = Math.min(255, ((num >> 8) & 0xff) + percent)
  const b = Math.min(255, (num & 0xff) + percent)
  return `rgb(${r},${g},${b})`
}

function drawCarShape(x: number, y: number, angle: number, color: string, driftAngle: number): void {
  if (!ctx) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  if (Math.abs(driftAngle) > 0.01) {
    ctx.transform(1, 0, 0, 1, driftAngle * 3, 0)
  }

  ctx.shadowColor = color
  ctx.shadowBlur = 22

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(14, 0)
  ctx.lineTo(10, -7)
  ctx.lineTo(-10, -7)
  ctx.lineTo(-12, -4)
  ctx.lineTo(-14, -4)
  ctx.lineTo(-14, 4)
  ctx.lineTo(-12, 4)
  ctx.lineTo(-10, 7)
  ctx.lineTo(10, 7)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.moveTo(6, 0)
  ctx.lineTo(3, -5)
  ctx.lineTo(-6, -5)
  ctx.lineTo(-8, 0)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#ffffaa'
  ctx.shadowColor = '#ffff00'
  ctx.shadowBlur = 10
  ctx.fillRect(13, -5, 3, 3)
  ctx.fillRect(13, 2, 3, 3)
  ctx.shadowBlur = 22
  ctx.shadowColor = color

  ctx.fillStyle = '#ff0044'
  ctx.shadowColor = '#ff0044'
  ctx.shadowBlur = 8
  ctx.fillRect(-14, -4, 2, 3)
  ctx.fillRect(-14, 1, 2, 3)

  ctx.shadowBlur = 6
  ctx.shadowColor = '#000'
  ctx.fillStyle = '#111'
  ctx.fillRect(-9, -9, 4, 4)
  ctx.fillRect(4, -9, 4, 4)
  ctx.fillRect(-9, 5, 4, 4)
  ctx.fillRect(4, 5, 4, 4)

  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 4
  ctx.fillRect(-8, -8, 2, 2)
  ctx.fillRect(5, -8, 2, 2)
  ctx.fillRect(-8, 6, 2, 2)
  ctx.fillRect(5, 6, 2, 2)

  ctx.restore()
  ctx.shadowBlur = 0
}

function drawCar(obj: CarState, color: string): void {
  if (!ctx) return
  const x = obj.x - S.cam.x + canvasW / 2 + S.cam.shakeX
  const y = obj.y - S.cam.y + canvasH / 2 + S.cam.shakeY
  drawCarShape(x, y, obj.angle, color, obj.driftAngle)
}

function drawParticles(): void {
  if (!ctx) return
  const particles = getParticles()
  for (const p of particles) {
    const x = p.x - S.cam.x + canvasW / 2 + S.cam.shakeX
    const y = p.y - S.cam.y + canvasH / 2 + S.cam.shakeY
    const alpha = p.life / p.maxLife

    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color

    if (p.type === 'boost') {
      ctx.shadowColor = p.color
      ctx.shadowBlur = 8
      ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size)
    } else if (p.type === 'spark') {
      ctx.fillRect(x - 1, y - 1, 2, 2)
    } else {
      ctx.fillStyle = `rgba(150,150,150,${alpha * 0.5})`
      ctx.beginPath()
      ctx.arc(x, y, p.size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

export function drawCountdown(): void {
  if (!ctx) return
  const text = S.countdownValue > 1 ? String(S.countdownValue) : 'GO!'
  const isGo = S.countdownValue <= 1

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const scale = 1 + Math.sin(S.countdownTimer * 0.1) * 0.05
  ctx.translate(canvasW / 2, canvasH / 2 - 50)
  ctx.scale(scale, scale)

  ctx.shadowColor = isGo ? '#00ff00' : '#00ffff'
  ctx.shadowBlur = 40
  ctx.fillStyle = isGo ? '#00ff00' : '#00ffff'
  ctx.font = isGo ? 'bold 80px monospace' : 'bold 100px monospace'
  ctx.fillText(text, 0, 0)

  ctx.shadowBlur = 0
  ctx.restore()
}

export function drawSpeedLines(): void {
  if (!ctx) return
  const speed = Math.hypot(S.playerCar.vx, S.playerCar.vy)
  if (speed < 5) return

  const intensity = Math.min(1, (speed - 5) / 8)
  ctx.strokeStyle = `rgba(255,255,255,${intensity * 0.15})`
  ctx.lineWidth = 1

  const camDx = S.cam.shakeX
  const camDy = S.cam.shakeY

  for (let i = 0; i < 12; i++) {
    const lx = Math.random() * canvasW
    const ly = Math.random() * canvasH
    const len = 20 + speed * 4 + Math.random() * 30
    const angle = -S.playerCar.angle + (Math.random() - 0.5) * 0.3

    ctx.beginPath()
    ctx.moveTo(lx + camDx, ly + camDy)
    ctx.lineTo(
      lx + Math.cos(angle) * len + camDx,
      ly + Math.sin(angle) * len + camDy,
    )
    ctx.stroke()
  }
}

export function renderGame(): void {
  if (!ctx) return
  drawBackground()
  drawSpeedLines()
  drawFinishLine()
  drawBoostPads()
  drawMapObjects()
  drawRoad()
  drawParticles()

  for (const b of S.bots) {
    drawCar(b as CarState, b.color)
  }
  drawCar(S.playerCar, S.playerCar.color)
  if (modes[S.selectedMode].multiplayer) {
    drawCar(S.playerCar2, S.playerCar2.color)
  }
}
