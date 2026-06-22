import type { Keys } from './types'

const keys: Keys = {}

const listeners: Array<() => void> = []

export function getKeys(): Keys {
  return keys
}

export function onStartGame(cb: () => void): void {
  listeners.push(cb)
}

export function setupInput(): void {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true
  })

  window.addEventListener('keyup', (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false
  })
}

export function clearKeys(): void {
  for (const k in keys) {
    delete keys[k]
  }
}
