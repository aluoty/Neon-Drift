import type { Particle } from './types'

let particles: Particle[] = []

export function getParticles(): Particle[] {
  return particles
}

export function addParticle(p: Particle): void {
  particles.push(p)
}

export function updateParticles(): void {
  particles = particles.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.life--
    return p.life > 0
  })
}

export function clearParticles(): void {
  particles = []
}
