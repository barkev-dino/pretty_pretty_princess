export function playSpinSound() {
  try {
    const ctx = new AudioContext()
    const sr = ctx.sampleRate

    // Whoosh: band-pass filtered noise that slows down
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
    noise.connect(filt)
    filt.connect(ng)
    ng.connect(ctx.destination)
    noise.start()

    // Carnival melody: C E G A G E C A
    const notes = [523, 659, 784, 880, 784, 659, 523, 440]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.28
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.28)
    })
  } catch {
    // AudioContext blocked (e.g. no user interaction) — silently skip
  }
}
