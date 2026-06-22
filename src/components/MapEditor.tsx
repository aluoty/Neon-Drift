import { useState, useRef, useEffect, useCallback } from 'react'
import { saveCustomMap } from '../engine/gameState'
import type { SerializedMap, BoostPad } from '../engine/types'

interface MapEditorProps {
  onBack: () => void
  editMap?: SerializedMap | null
}

const containerStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, overflow: 'auto',
  background: 'radial-gradient(ellipse at center, rgba(0,26,51,0.95) 0%, rgba(0,0,17,0.95) 100%)',
  color: '#00ffff', fontFamily: "'Courier New', monospace", zIndex: 20,
  padding: '1.5rem',
}

const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: '1.5rem',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 'bold',
  letterSpacing: '0.1em', background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
}

const backBtnStyle: React.CSSProperties = {
  padding: '0.4rem 1.2rem', border: '1px solid #00ffff', borderRadius: 4,
  background: 'transparent', color: '#00ffff', fontFamily: 'inherit',
  cursor: 'pointer', fontSize: '0.85rem',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.2rem',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '0.9rem', color: '#88ccff', marginBottom: '0.5rem',
  borderBottom: '1px solid #223', paddingBottom: '0.3rem',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem', color: '#8899bb', display: 'block', marginBottom: '0.2rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.4rem 0.6rem', borderRadius: 4, border: '1px solid #334',
  background: 'rgba(0,0,0,0.5)', color: '#00ffff', fontFamily: 'inherit', fontSize: '0.85rem',
  outline: 'none', marginBottom: '0.5rem',
}

const rowStyle: React.CSSProperties = {
  display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
}

const sliderStyle: React.CSSProperties = {
  flex: 1, minWidth: 120, accentColor: '#00ffff', cursor: 'pointer',
}

const sliderValue: React.CSSProperties = {
  fontSize: '0.75rem', color: '#00ffff', minWidth: 40, textAlign: 'right',
}

function LayerSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={labelStyle}>{label}</span>
        <span style={sliderValue}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        style={sliderStyle} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  )
}

const colorInputStyle: React.CSSProperties = {
  width: 40, height: 32, border: '1px solid #334', borderRadius: 4,
  background: 'transparent', cursor: 'pointer', padding: 0,
}

const colorBoxStyle = (): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#8899bb',
})

const btnStyle: React.CSSProperties = {
  padding: '0.4rem 1rem', border: '1px solid #00ffff', borderRadius: 4,
  background: 'rgba(0,255,255,0.1)', color: '#00ffff', fontFamily: 'inherit',
  cursor: 'pointer', fontSize: '0.8rem',
}

const dangerBtnStyle: React.CSSProperties = {
  ...btnStyle,
  border: '1px solid #ff4444', background: 'rgba(255,68,68,0.1)', color: '#ff4444',
}

const saveBtnStyle: React.CSSProperties = {
  padding: '0.6rem 2rem', border: '2px solid #00ff88', borderRadius: 6,
  background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,200,100,0.1))',
  color: '#00ff88', fontFamily: 'inherit', cursor: 'pointer', fontSize: '1rem',
  fontWeight: 'bold', letterSpacing: '0.1em', marginTop: '0.5rem',
}

export function MapEditor({ onBack, editMap }: MapEditorProps) {
  const [name, setName] = useState(editMap?.name ?? '')
  const [finish, setFinish] = useState(editMap?.finish ?? 12000)
  const [amp1, setAmp1] = useState(editMap?.amp1 ?? 220)
  const [freq1, setFreq1] = useState(editMap?.freq1 ?? 0.01)
  const [amp2, setAmp2] = useState(editMap?.amp2 ?? 320)
  const [freq2, setFreq2] = useState(editMap?.freq2 ?? 0.003)
  const [amp3, setAmp3] = useState(editMap?.amp3 ?? 0)
  const [freq3, setFreq3] = useState(editMap?.freq3 ?? 0.001)
  const [roadColor, setRoadColor] = useState(editMap?.roadColor ?? '#111122')
  const [edgeColor, setEdgeColor] = useState(editMap?.edgeColor ?? '#00ffff')
  const [centerColor, setCenterColor] = useState(editMap?.centerColor ?? '#ffffff')
  const [poleColor, setPoleColor] = useState(editMap?.poleColor ?? '#ff00ff')
  const [bgColor1, setBgColor1] = useState(editMap?.bgColor1 ?? '#00101f')
  const [bgColor2, setBgColor2] = useState(editMap?.bgColor2 ?? '#000011')
  const [boostPads, setBoostPads] = useState<BoostPad[]>(editMap?.boostPads ?? [])
  const [newPadX, setNewPadX] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const previewRef = useRef<HTMLCanvasElement>(null)

  const roadFunc = useCallback((x: number) => {
    return Math.sin(x * freq1) * amp1 + Math.sin(x * freq2) * amp2 + Math.cos(x * freq3) * amp3
  }, [amp1, freq1, amp2, freq2, amp3, freq3])

  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const cy = h / 2
    const scale = Math.min(w, h) * 0.004

    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = edgeColor
    ctx.lineWidth = 3
    ctx.shadowColor = edgeColor
    ctx.shadowBlur = 8
    ctx.beginPath()
    for (let px = 0; px < w; px++) {
      const worldX = (px / w) * finish
      const y = roadFunc(worldX) * scale + cy
      if (px === 0) ctx.moveTo(px, y - 15)
      else ctx.lineTo(px, y - 15)
    }
    ctx.stroke()
    for (let px = w - 1; px >= 0; px--) {
      const worldX = (px / w) * finish
      const y = roadFunc(worldX) * scale + cy
      ctx.lineTo(px, y + 15)
    }
    ctx.closePath()

    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, roadColor)
    grad.addColorStop(0.5, '#222244')
    grad.addColorStop(1, roadColor)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = centerColor
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let px = 0; px < w; px++) {
      const worldX = (px / w) * finish
      const y = roadFunc(worldX) * scale + cy
      if (px === 0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    for (const pad of boostPads) {
      const px = (pad.worldX / finish) * w
      const y = roadFunc(pad.worldX) * scale + cy
      ctx.fillStyle = 'rgba(255,220,0,0.8)'
      ctx.shadowColor = '#ffff00'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.moveTo(px + 6, y)
      ctx.lineTo(px - 4, y - 6)
      ctx.lineTo(px - 6, y - 6)
      ctx.lineTo(px - 6, y)
      ctx.lineTo(px - 6, y + 6)
      ctx.lineTo(px - 4, y + 6)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }, [amp1, freq1, amp2, freq2, amp3, freq3, finish, roadColor, edgeColor, centerColor, boostPads, roadFunc])

  const addPad = () => {
    const x = parseInt(newPadX)
    if (isNaN(x) || x < 0 || x > finish) return
    setBoostPads(p => [...p, { worldX: x, width: 60 }].sort((a, b) => a.worldX - b.worldX))
    setNewPadX('')
  }

  const removePad = (idx: number) => {
    setBoostPads(p => p.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const serialized: SerializedMap = {
      name: name.trim(),
      finish,
      roadColor: roadColor,
      edgeColor: edgeColor,
      centerColor: centerColor,
      poleColor: poleColor,
      bgColor1: bgColor1,
      bgColor2: bgColor2,
      amp1, freq1, amp2, freq2, amp3, freq3,
      boostPads,
    }
    saveCustomMap(serialized)
    setSaveMsg('Map saved!')
    setTimeout(() => setSaveMsg(''), 1500)
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>MAP EDITOR</div>
        <button style={backBtnStyle} onClick={onBack}>BACK</button>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitle}>TRACK INFO</div>
        <div style={rowStyle}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={labelStyle}>Name</span>
            <input style={inputStyle} value={name}
              onChange={e => setName(e.target.value)} placeholder="My Track" />
          </div>
          <div style={{ width: 160 }}>
            <span style={labelStyle}>Finish Distance (m)</span>
            <input type="number" style={inputStyle} value={finish}
              onChange={e => setFinish(Math.max(1000, parseInt(e.target.value) || 8000))} min={1000} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitle}>SINE WAVE LAYERS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          <div>
            <LayerSlider label="Layer 1 Amplitude" value={amp1} min={0} max={600} step={5} onChange={setAmp1} />
            <LayerSlider label="Layer 1 Frequency" value={freq1} min={0.001} max={0.05} step={0.001} onChange={setFreq1} />
          </div>
          <div>
            <LayerSlider label="Layer 2 Amplitude" value={amp2} min={0} max={600} step={5} onChange={setAmp2} />
            <LayerSlider label="Layer 2 Frequency" value={freq2} min={0.001} max={0.05} step={0.001} onChange={setFreq2} />
          </div>
          <div>
            <LayerSlider label="Layer 3 Amplitude" value={amp3} min={0} max={600} step={5} onChange={setAmp3} />
            <LayerSlider label="Layer 3 Frequency" value={freq3} min={0.001} max={0.05} step={0.001} onChange={setFreq3} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitle}>COLORS</div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={colorBoxStyle()}>
            <span>Road</span>
            <input type="color" style={colorInputStyle} value={roadColor} onChange={e => setRoadColor(e.target.value)} />
          </div>
          <div style={colorBoxStyle()}>
            <span>Edge</span>
            <input type="color" style={colorInputStyle} value={edgeColor} onChange={e => setEdgeColor(e.target.value)} />
          </div>
          <div style={colorBoxStyle()}>
            <span>Center</span>
            <input type="color" style={colorInputStyle} value={centerColor} onChange={e => setCenterColor(e.target.value)} />
          </div>
          <div style={colorBoxStyle()}>
            <span>Pole</span>
            <input type="color" style={colorInputStyle} value={poleColor} onChange={e => setPoleColor(e.target.value)} />
          </div>
          <div style={colorBoxStyle()}>
            <span>BG1</span>
            <input type="color" style={colorInputStyle} value={bgColor1} onChange={e => setBgColor1(e.target.value)} />
          </div>
          <div style={colorBoxStyle()}>
            <span>BG2</span>
            <input type="color" style={colorInputStyle} value={bgColor2} onChange={e => setBgColor2(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitle}>BOOST PADS</div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <input type="number" style={{ ...inputStyle, width: 140, marginBottom: 0 }}
            value={newPadX} onChange={e => setNewPadX(e.target.value)}
            placeholder="World X position" min={0} />
          <button style={btnStyle} onClick={addPad}>ADD PAD</button>
        </div>
        {boostPads.length === 0 && <span style={{ fontSize: '0.75rem', color: '#556' }}>No boost pads added yet.</span>}
        {boostPads.map((pad, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#ffff00' }}>Pad at x = {pad.worldX}</span>
            <button style={dangerBtnStyle} onClick={() => removePad(i)}>REMOVE</button>
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitle}>ROAD PREVIEW</div>
        <canvas ref={previewRef} width={600} height={200}
          style={{ width: '100%', maxWidth: 600, height: 140, borderRadius: 6, border: '1px solid #334', background: '#000' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button style={saveBtnStyle} onClick={handleSave}>SAVE MAP</button>
        {saveMsg && <span style={{ color: '#00ff88', fontSize: '0.9rem' }}>{saveMsg}</span>}
      </div>
    </div>
  )
}
