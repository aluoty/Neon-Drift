let audioContext: AudioContext | null = null
let engineOscillator: OscillatorNode | null = null
let engineSubOscillator: OscillatorNode | null = null
let engineGain: GainNode | null = null
let engineSubGain: GainNode | null = null
export function initAudio(): void {
  if (audioContext) return
  audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

  // Main engine oscillator
  engineGain = audioContext.createGain()
  engineGain.gain.value = 0.02
  engineGain.connect(audioContext.destination)

  engineOscillator = audioContext.createOscillator()
  engineOscillator.type = 'sawtooth'
  engineOscillator.frequency.value = 80
  engineOscillator.connect(engineGain)
  engineOscillator.start()

  // Sub oscillator for rumble
  engineSubGain = audioContext.createGain()
  engineSubGain.gain.value = 0.015

  engineSubOscillator = audioContext.createOscillator()
  engineSubOscillator.type = 'square'
  engineSubOscillator.frequency.value = 40
  engineSubOscillator.connect(engineSubGain)
  engineSubGain.connect(audioContext.destination)
  engineSubOscillator.start()
}

export function playTone(freq: number, duration: number, type: OscillatorType = 'sine'): void {
  if (!audioContext) return
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = 0.1
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
  osc.connect(gain)
  gain.connect(audioContext.destination)
  osc.start()
  osc.stop(audioContext.currentTime + duration)
}

export function updateEngineSound(speed: number): void {
  if (!engineOscillator || !engineGain || !engineSubOscillator || !engineSubGain) return

  const baseFreq = 70 + speed * 14
  engineOscillator.frequency.value = baseFreq
  engineGain.gain.value = 0.015 + Math.min(0.08, speed * 0.004)

  // Sub oscillator
  engineSubOscillator.frequency.value = baseFreq / 2
  engineSubGain.gain.value = 0.01 + Math.min(0.05, speed * 0.002)
}
