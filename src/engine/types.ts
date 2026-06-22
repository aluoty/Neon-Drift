export interface Car {
  name: string
  color: string
  accel: number
  turn: number
  maxSpeed: number
  grip: number
}

export interface CarState {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  boost: number
  color: string
  accel: number
  turn: number
  maxSpeed: number
  driftAngle: number
  drifting: boolean
}

export interface BotState {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  color: string
  driftAngle: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'boost' | 'smoke' | 'spark'
}

export interface Star {
  x: number
  y: number
  brightness: number
  size: number
  twinkleSpeed: number
}

export interface MapConfig {
  name: string
  roadFunc: (x: number) => number
  finish: number
  aiSpeed: number
  aiCount: number
  roadColor: string
  edgeColor: string
  centerColor: string
  poleColor: string
  bgColor1: string
  bgColor2: string
}

export interface GameMode {
  name: string
  ai: boolean
  multiplayer: boolean
}

export type GameState = 'menu' | 'countdown' | 'playing'

export interface Camera {
  x: number
  y: number
  shakeX: number
  shakeY: number
  shakeIntensity: number
}

export interface Keys {
  [key: string]: boolean
}
