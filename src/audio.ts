export function playSpinSound() {
  try {
    const ctx = new AudioContext()
    const sr = ctx.sampleRate
    const buf = ctx.createBuffer(1, (sr * 2.5) | 0, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const filt = ctx.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.setValueAtTime(1200, ctx.currentTime)
    filt.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 2.4)
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.35, ctx.currentTime)
    ng.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.4)
    noise.connect(filt); filt.connect(ng); ng.connect(ctx.destination)
    noise.start()
    const notes = [523, 659, 784, 880, 784, 659, 523, 440]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'; osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.28
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.2, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.22)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.28)
    })
  } catch {}
}

// Sad wah-wah trombone for black ring
export function playSadSound() {
  try {
    const ctx = new AudioContext()
    const notes = [349, 311, 277, 233] // F Eb Db Bb descending
    const dur = 0.4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      // Vibrato
      const lfo = ctx.createOscillator()
      const lfoG = ctx.createGain()
      lfo.frequency.value = 6; lfoG.gain.value = 10
      lfo.connect(lfoG); lfoG.connect(osc.frequency)
      const t = ctx.currentTime + i * dur
      g.gain.setValueAtTime(0.3, t)
      g.gain.linearRampToValueAtTime(0.35, t + 0.05)
      g.gain.exponentialRampToValueAtTime(0.01, t + dur * 0.9)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t); osc.stop(t + dur)
      lfo.start(t); lfo.stop(t + dur)
    })
  } catch {}
}

// Triumphant ascending fanfare for win
export function playWinSound() {
  try {
    const ctx = new AudioContext()
    const notes = [523, 659, 784, 1047, 1319, 1568] // C5 E5 G5 C6 E6 G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.17
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.4, start + 0.01)
      gain.gain.setValueAtTime(0.4, start + 0.13)
      gain.gain.linearRampToValueAtTime(0, start + 0.17)
      osc.start(start)
      osc.stop(start + 0.17)
    })
  } catch {}
}

// Mario-style ascending jingle for Pick Any
export function playPickAnySound() {
  try {
    const ctx = new AudioContext()
    const notes = [523, 659, 784, 1047, 1319] // C E G C5 E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'square'; osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.09
      g.gain.setValueAtTime(0.15, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.09)
    })
  } catch {}
}
