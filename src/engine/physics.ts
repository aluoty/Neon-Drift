import { getKeys } from './input'
import { S, getCurrentMap, roadY, FX, ROAD_WIDTH, updateLevel } from './gameState'
import { addParticle } from './particles'
import { playTone } from './audio'

const friction = 0.97
const driftFriction = 0.985

function spawnBoostTrail(car: typeof S.playerCar, fx: number, fy: number): void {
  for (let i = 0; i < 3; i++) {
    addParticle({
      x: car.x - fx * (15 + i * 5),
      y: car.y - fy * (15 + i * 5) + (Math.random() - 0.5) * 8,
      vx: -fx * (1.5 + Math.random() * 1.5) + (Math.random() - 0.5) * 0.5,
      vy: -fy * (1.5 + Math.random() * 1.5) + (Math.random() - 0.5) * 0.5,
      life: 20 + i * 5,
      maxLife: 30,
      color: car.color,
      size: 2 + i * 1.5,
      type: 'boost',
    })
    addParticle({
      x: car.x - fx * 20 + (Math.random() - 0.5) * 12,
      y: car.y - fy * 20 + (Math.random() - 0.5) * 12,
      vx: -fx * 0.5 + (Math.random() - 0.5) * 0.3,
      vy: -fy * 0.5 + (Math.random() - 0.5) * 0.3,
      life: 25 + Math.random() * 15,
      maxLife: 40,
      color: '#888888',
      size: 3 + Math.random() * 3,
      type: 'smoke',
    })
  }
}

function spawnDriftSparks(car: typeof S.playerCar): void {
  for (let i = 0; i < 2; i++) {
    const angle = car.angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5
    addParticle({
      x: car.x + Math.cos(angle) * 14,
      y: car.y + Math.sin(angle) * 14,
      vx: Math.cos(angle) * (0.5 + Math.random()) + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(angle) * (0.5 + Math.random()) + (Math.random() - 0.5) * 0.5,
      life: 8 + Math.random() * 6,
      maxLife: 14,
      color: Math.random() > 0.5 ? '#ffaa00' : '#ffdd44',
      size: 1 + Math.random() * 1.5,
      type: 'spark',
    })
  }
}

function updateCarPhysics(
  car: typeof S.playerCar,
  keys: Record<string, boolean>,
  wKey: string,
  sKey: string,
  aKey: string,
  dKey: string,
  boostKey: string,
  isPlayer1: boolean,
): number {
  const fx = Math.cos(car.angle)
  const fy = Math.sin(car.angle)
  const speed = Math.hypot(car.vx, car.vy)

  if (keys[wKey]) {
    car.vx += fx * car.accel * (speed < car.maxSpeed * 0.5 ? 1.2 : 1)
    car.vy += fy * car.accel * (speed < car.maxSpeed * 0.5 ? 1.2 : 1)
  }

  if (keys[sKey]) {
    car.vx -= fx * car.accel * 0.4
    car.vy -= fy * car.accel * 0.4
  }

  const turning = keys[aKey] || keys[dKey]
  const braking = keys[sKey]

  // Drift mechanics: if turning + braking at speed, initiate drift
  if (turning && braking && speed > 2) {
    car.drifting = true
    const driftFactor = Math.min(1, (speed - 2) / 6)
    car.driftAngle += (keys[aKey] ? -1 : 1) * 0.015 * driftFactor
    car.driftAngle *= 0.97
    spawnDriftSparks(car)
  } else if (turning && speed > 3 && !braking) {
    // Subtle drift at high speed
    car.drifting = true
    car.driftAngle += (keys[aKey] ? -1 : 1) * 0.005 * Math.min(1, (speed - 3) / 5)
    car.driftAngle *= 0.95
  } else {
    car.drifting = false
    car.driftAngle *= 0.9
  }

  // Apply steering (reduced during drift)
  const steerFactor = car.drifting ? 0.6 : 1
  if (keys[aKey]) car.angle -= car.turn * Math.max(1, speed * 0.08) * steerFactor
  if (keys[dKey]) car.angle += car.turn * Math.max(1, speed * 0.08) * steerFactor

  // BOOST
  if (keys[boostKey] && car.boost > 0 && isPlayer1) {
    car.vx += fx * car.accel * 0.5
    car.vy += fy * car.accel * 0.5
    car.boost -= 0.8
    spawnBoostTrail(car, fx, fy)

    // Screen shake on boost
    if (isPlayer1) {
      S.cam.shakeIntensity = Math.min(6, S.cam.shakeIntensity + 2)
    }
  } else if (keys[boostKey] && car.boost > 0) {
    car.vx += fx * car.accel * 0.5
    car.vy += fy * car.accel * 0.5
    car.boost -= 0.8
  } else {
    car.boost = Math.min(100, car.boost + 0.15)
  }

  if (speed > car.maxSpeed) {
    const factor = car.maxSpeed / speed
    car.vx *= 0.9 + 0.1 * factor
    car.vy *= 0.9 + 0.1 * factor
  }

  // Offroad penalty
  const dist = Math.abs(car.y - roadY(car.x))
  if (dist > ROAD_WIDTH / 2) {
    car.vx *= FX.penalty
    car.vy *= FX.penalty
  }

  // Apply friction (less during drift for slide)
  const fric = car.drifting ? driftFriction : friction
  car.vx *= fric
  car.vy *= fric

  // Update position using drift-influenced angle
  const moveAngle = car.angle + car.driftAngle * 0.5
  const mfx = Math.cos(moveAngle)
  const mfy = Math.sin(moveAngle)
  const moveSpeed = Math.hypot(car.vx, car.vy)
  car.x += mfx * moveSpeed
  car.y += mfy * moveSpeed

  // Keep velocity aligned with actual movement
  if (moveSpeed > 0.1) {
    car.vx = mfx * moveSpeed
    car.vy = mfy * moveSpeed
  }

  return moveSpeed
}

export function updatePlayer(): void {
  const keys = getKeys()
  const speed = updateCarPhysics(S.playerCar, keys, 'w', 's', 'a', 'd', 'shift', true)
  S.score += Math.max(0, speed * 0.04)
  updateLevel()
}

export function updatePlayer2(): void {
  const keys = getKeys()
  updateCarPhysics(S.playerCar2, keys, 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', false)
}

export function updateBots(): void {
  const map = getCurrentMap()
  const aiSpeed = map.aiSpeed * (1 + (S.level - 1) * 0.05)

  for (let i = 0; i < S.bots.length; i++) {
    const b = S.bots[i]

    // Look further ahead based on speed
    const lookAhead = 150 + Math.hypot(b.vx, b.vy) * 5
    const tx = b.x + lookAhead
    const ty = roadY(tx)

    const dx = tx - b.x
    const dy = ty - b.y

    const targetAngle = Math.atan2(dy, dx)

    // Smoother steering for AI
    const angleDiff = targetAngle - b.angle
    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff))
    b.angle += normalizedDiff * 0.04

    // Avoid other bots
    let avoidX = 0
    let avoidY = 0
    for (const other of S.bots) {
      if (other === b) continue
      const ddx = b.x - other.x
      const ddy = b.y - other.y
      const dist = Math.hypot(ddx, ddy)
      if (dist < 80 && dist > 0) {
        avoidX += (ddx / dist) * (80 - dist) * 0.01
        avoidY += (ddy / dist) * (80 - dist) * 0.01
      }
    }

    b.vx += (Math.cos(b.angle) + avoidX) * aiSpeed
    b.vy += (Math.sin(b.angle) + avoidY) * aiSpeed

    const bSpeed = Math.hypot(b.vx, b.vy)
    if (bSpeed > 8 + S.level * 0.3) {
      b.vx *= 0.95
      b.vy *= 0.95
    }

    b.vx *= 0.97
    b.vy *= 0.97

    b.x += b.vx
    b.y += b.vy

    // Keep on road
    const dist = Math.abs(b.y - roadY(b.x))
    if (dist > ROAD_WIDTH / 2) {
      b.vx *= 0.95
      b.vy *= 0.95
    }
  }
}

export function updateCamera(): void {
  const targetX = S.playerCar.x
  const targetY = S.playerCar.y
  S.cam.x += (targetX - S.cam.x) * 0.08
  S.cam.y += (targetY - S.cam.y) * 0.08

  // Apply shake
  if (S.cam.shakeIntensity > 0.1) {
    S.cam.shakeX = (Math.random() - 0.5) * S.cam.shakeIntensity * 2
    S.cam.shakeY = (Math.random() - 0.5) * S.cam.shakeIntensity * 2
    S.cam.shakeIntensity *= FX.shakeDecay
  } else {
    S.cam.shakeX = 0
    S.cam.shakeY = 0
  }
}

export function updateCountdown(): void {
  S.countdownTimer++
  if (S.countdownTimer === 1) {
    playTone(440, 0.15, 'square')
  }
  if (S.countdownTimer === 50 && S.countdownValue > 1) {
    S.countdownValue--
    S.countdownTimer = 0
  } else if (S.countdownTimer === 50 && S.countdownValue <= 1) {
    playTone(880, 0.25, 'square')
    S.gameState = 'playing'
    S.countdownTimer = 0
  }
}
