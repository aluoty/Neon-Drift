import type { Car, CarState, BotState, MapConfig, GameMode, Camera, Star, GameState, SerializedMap } from './types'
import { clearParticles } from './particles'

export const ROAD_WIDTH = 220

export const FX = {
  roadGlow: '#ff00ff',
  playerGlow: '#00ffff',
  penalty: 0.88,
  shakeDecay: 0.85,
}

export const modes: GameMode[] = [
  { name: 'Single Player', ai: false, multiplayer: false },
  { name: 'AI Race', ai: true, multiplayer: false },
  { name: 'Multiplayer', ai: false, multiplayer: true },
]

export const builtinMaps: MapConfig[] = [
  {
    name: 'Neon City',
    roadFunc: x => Math.sin(x * 0.01) * 220 + Math.sin(x * 0.003) * 320,
    finish: 8000,
    aiSpeed: 0.28,
    aiCount: 2,
    roadColor: '#111122',
    edgeColor: '#00ffff',
    centerColor: '#ffffff',
    poleColor: '#ff00ff',
    bgColor1: '#00101f',
    bgColor2: '#000011',
    boostPads: [
      { worldX: 1500, width: 60 },
      { worldX: 3500, width: 60 },
      { worldX: 5500, width: 60 },
    ],
  },
  {
    name: 'Cyber Canyon',
    roadFunc: x => Math.sin(x * 0.008) * 260 + Math.cos(x * 0.004) * 380,
    finish: 12000,
    aiSpeed: 0.34,
    aiCount: 3,
    roadColor: '#120018',
    edgeColor: '#66ffcc',
    centerColor: '#ff0088',
    poleColor: '#88ccff',
    bgColor1: '#0a0014',
    bgColor2: '#02000a',
    boostPads: [
      { worldX: 2000, width: 60 },
      { worldX: 5000, width: 60 },
      { worldX: 8000, width: 60 },
    ],
  },
  {
    name: 'Voltage Ridge',
    roadFunc: x => Math.sin(x * 0.02) * 140 + Math.sin(x * 0.01) * 260 + Math.cos(x * 0.0015) * 120,
    finish: 16000,
    aiSpeed: 0.40,
    aiCount: 4,
    roadColor: '#101014',
    edgeColor: '#ffdd00',
    centerColor: '#ffffff',
    poleColor: '#44ff88',
    bgColor1: '#1a1000',
    bgColor2: '#0a0800',
    boostPads: [
      { worldX: 2500, width: 60 },
      { worldX: 6000, width: 60 },
      { worldX: 10000, width: 60 },
      { worldX: 13000, width: 60 },
    ],
  },
]

export let customMaps: SerializedMap[] = []

function toMapConfig(s: SerializedMap): MapConfig {
  return {
    name: s.name,
    roadFunc: (x: number) =>
      Math.sin(x * s.freq1) * s.amp1 +
      Math.sin(x * s.freq2) * s.amp2 +
      Math.cos(x * s.freq3) * s.amp3,
    finish: s.finish,
    aiSpeed: 0.3,
    aiCount: 2,
    roadColor: s.roadColor,
    edgeColor: s.edgeColor,
    centerColor: s.centerColor,
    poleColor: s.poleColor,
    bgColor1: s.bgColor1,
    bgColor2: s.bgColor2,
    boostPads: s.boostPads || [],
  }
}

export function getMaps(): MapConfig[] {
  return [...builtinMaps, ...customMaps.map(toMapConfig)]
}

export function loadCustomMaps(): void {
  try {
    const raw = localStorage.getItem('neon-drift-custom-maps')
    if (raw) {
      customMaps = JSON.parse(raw)
    }
  } catch {
    customMaps = []
  }
}

export function saveCustomMap(map: SerializedMap): void {
  loadCustomMaps()
  const idx = customMaps.findIndex(m => m.name === map.name)
  if (idx >= 0) {
    customMaps[idx] = map
  } else {
    customMaps.push(map)
  }
  localStorage.setItem('neon-drift-custom-maps', JSON.stringify(customMaps))
}

export function deleteCustomMap(name: string): void {
  loadCustomMaps()
  customMaps = customMaps.filter(m => m.name !== name)
  localStorage.setItem('neon-drift-custom-maps', JSON.stringify(customMaps))
}

export const cars: Car[] = [
  { name: 'Neon', color: '#00ffff', accel: 0.32, turn: 0.042, maxSpeed: 10, grip: 0.92 },
  { name: 'Fire', color: '#ff6600', accel: 0.38, turn: 0.032, maxSpeed: 12, grip: 0.85 },
  { name: 'Ghost', color: '#ffffff', accel: 0.26, turn: 0.052, maxSpeed: 8, grip: 0.95 },
  { name: 'Shadow', color: '#aa44ff', accel: 0.30, turn: 0.048, maxSpeed: 9.5, grip: 0.90 },
]

export const S = {
  gameState: 'menu' as GameState,
  level: 1,
  score: 0,
  selectedMode: 1,
  selectedMap: 0,
  selectedCar: 0,
  currentMapIndex: 0,
  levelTarget: 8000,
  minimapZoomed: false,
  countdownValue: 0,
  countdownTimer: 0,
  levelUpFlash: 0,
  boostPadHitTimers: [] as number[],

  playerCar: {
    x: 0, y: 0, vx: 0, vy: 0, angle: 0, boost: 100,
    color: '#00ffff', accel: 0.3, turn: 0.04, maxSpeed: 10,
    driftAngle: 0, drifting: false,
  } as CarState,

  playerCar2: {
    x: 0, y: 0, vx: 0, vy: 0, angle: 0, boost: 100,
    color: '#ff00ff', accel: 0.28, turn: 0.045, maxSpeed: 9,
    driftAngle: 0, drifting: false,
  } as CarState,

  bots: [] as BotState[],
  cam: { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeIntensity: 0 } as Camera,
  stars: [] as Star[],
}

export function updateStars(): void {
  const speed = Math.hypot(S.playerCar.vx, S.playerCar.vy)
  for (const s of S.stars) {
    s.y += 0.3 + speed * 0.008 + s.twinkleSpeed * 0.1
    s.x += Math.sin(s.twinkleSpeed * performance.now() * 0.001) * 0.05
    if (s.y > 3000) { s.y = -10; s.x = Math.random() * 3000 }
  }
}

export function initStars(canvasW: number, canvasH: number): void {
  S.stars = []
  for (let i = 0; i < 250; i++) {
    S.stars.push({
      x: Math.random() * canvasW * 2,
      y: Math.random() * canvasH,
      brightness: 0.3 + Math.random() * 0.7,
      size: 0.5 + Math.random() * 1.5,
      twinkleSpeed: 0.5 + Math.random() * 2,
    })
  }
}

function randomAIColor(): string {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue},100%,60%)`
}

export function initMap(index: number): void {
  const maps = getMaps()
  S.currentMapIndex = index % maps.length
  const map = maps[S.currentMapIndex]
  S.levelTarget = S.playerCar.x + map.finish
  S.boostPadHitTimers = new Array(map.boostPads.length).fill(0)
}

export function getCurrentMap(): MapConfig {
  return getMaps()[S.currentMapIndex % getMaps().length]
}

export function getCurrentMapIndex(): number {
  return S.currentMapIndex
}

export function roadY(x: number): number {
  return getCurrentMap().roadFunc(x)
}

export function resetPlayers(): void {
  S.playerCar.x = 0
  S.playerCar.y = roadY(0)
  S.playerCar.vx = 0
  S.playerCar.vy = 0
  S.playerCar.angle = 0
  S.playerCar.boost = 100
  S.playerCar.driftAngle = 0
  S.playerCar.drifting = false

  S.playerCar2.x = -40
  S.playerCar2.y = roadY(S.playerCar2.x)
  S.playerCar2.vx = 0
  S.playerCar2.vy = 0
  S.playerCar2.angle = 0
  S.playerCar2.boost = 100
  S.playerCar2.driftAngle = 0
  S.playerCar2.drifting = false

  S.cam.shakeX = 0
  S.cam.shakeY = 0
  S.cam.shakeIntensity = 0
}

export function spawnBots(): void {
  S.bots = []
  const map = getCurrentMap()
  const mode = modes[S.selectedMode]
  const aiCount = mode.ai ? map.aiCount : 0

  for (let i = 0; i < aiCount; i++) {
    S.bots.push({
      x: S.playerCar.x - 400 - i * 120,
      y: S.playerCar.y,
      vx: 0,
      vy: 0,
      angle: 0,
      color: randomAIColor(),
      driftAngle: 0,
      boost: 100,
    })
  }
}

export function startCountdown(): void {
  S.countdownValue = 3
  S.countdownTimer = 0
  S.gameState = 'countdown'
}

export function startGame(carIdx: number, mapIdx: number, modeIdx: number): void {
  const mapsList = getMaps()
  const car = cars[carIdx]
  S.selectedCar = carIdx
  S.selectedMap = mapIdx
  S.selectedMode = modeIdx

  S.playerCar.color = car.color
  S.playerCar.accel = car.accel
  S.playerCar.turn = car.turn
  S.playerCar.maxSpeed = car.maxSpeed
  S.playerCar.driftAngle = 0
  S.playerCar.drifting = false

  if (modes[S.selectedMode].multiplayer) {
    S.playerCar2.color = '#ff55ff'
    S.playerCar2.accel = 0.28
    S.playerCar2.turn = 0.045
    S.playerCar2.maxSpeed = 9
  }

  S.level = 1
  S.score = 0
  S.currentMapIndex = mapIdx % mapsList.length
  S.levelUpFlash = 0
  resetPlayers()
  initMap(S.currentMapIndex)
  spawnBots()
  clearParticles()
  startCountdown()
}

export function updateLevel(): void {
  if (S.playerCar.x > S.levelTarget) {
    const mapsList = getMaps()
    S.level++
    S.currentMapIndex = (S.currentMapIndex + 1) % mapsList.length
    S.levelUpFlash = 60
    initMap(S.currentMapIndex)
    spawnBots()
  }
  if (S.levelUpFlash > 0) S.levelUpFlash--
}

export const maps = builtinMaps

export function checkBoostPads(car: { x: number; y: number; vx: number; vy: number; boost: number }): boolean {
  const map = getCurrentMap()
  let hit = false
  for (let i = 0; i < map.boostPads.length; i++) {
    const pad = map.boostPads[i]
    if (S.boostPadHitTimers[i] > 0) {
      S.boostPadHitTimers[i]--
      continue
    }
    const dist = Math.abs(car.x - pad.worldX)
    const onRoad = Math.abs(car.y - roadY(car.x)) < ROAD_WIDTH / 2
    if (dist < pad.width / 2 && onRoad) {
      const speed = Math.hypot(car.vx, car.vy)
      const factor = 1 + Math.max(0, (12 - speed) / 12) * 0.5
      car.vx *= 1 + 0.3 * factor
      car.vy *= 1 + 0.3 * factor
      car.boost = Math.min(100, car.boost + 20)
      S.boostPadHitTimers[i] = 30
      hit = true
    }
  }
  return hit
}
