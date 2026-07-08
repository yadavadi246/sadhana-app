// Synthesized Web Audio Engine for Sadhana Card PWA
let audioCtx = null;
let tanpuraInterval = null;
let activeTanpuraNodes = [];
let tanpuraVolumeNode = null;
let currentPitch = 130.81; // C3 root

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Tibetan Singing Bowl Synth (Intro Screen)
export function playTibetanBowl() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 4.0;
  
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.4, now + 0.5); // Smooth attack
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  masterGain.connect(ctx.destination);

  // Frequencies: Fundamental C3 (130.81Hz) + metallic overtones
  const partials = [
    { freq: 130.81, gain: 0.5, lfo: 1.2 },  // Fundamental
    { freq: 261.63, gain: 0.3, lfo: 2.1 },  // Octave
    { freq: 392.44, gain: 0.25, lfo: 0.8 }, // Fifth
    { freq: 523.25, gain: 0.15, lfo: 3.3 }, // Octave 2
    { freq: 659.25, gain: 0.1, lfo: 1.5 },  // Third
    { freq: 880.00, gain: 0.05, lfo: 0.5 }  // Ringing overtone
  ];

  partials.forEach((p) => {
    // Main Oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now);

    // Bandpass filter to make it warmer
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(p.freq, now);
    filter.Q.setValueAtTime(25, now);

    // Modulate gain for the "beating" (wah-wah) bowl texture
    const pGain = ctx.createGain();
    pGain.gain.setValueAtTime(p.gain, now);

    // LFO to create metallic beating effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(p.lfo, now);
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.12 * p.gain, now); // scale modulation

    lfo.connect(lfoGain);
    lfoGain.connect(pGain.gain); // Modulate gain node

    // Connect node chain
    osc.connect(filter);
    filter.connect(pGain);
    pGain.connect(masterGain);

    // Start oscillations
    osc.start(now);
    lfo.start(now);
    
    osc.stop(now + duration);
    lfo.stop(now + duration);
  });
}

// 2. High-Fidelity Wooden Japa Bead Click
export function playWoodClick() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Primary knock (main click)
  const primaryGain = ctx.createGain();
  primaryGain.gain.setValueAtTime(0.3, now);
  primaryGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(1100, now);
  osc1.frequency.exponentialRampToValueAtTime(300, now + 0.02);

  const filter1 = ctx.createBiquadFilter();
  filter1.type = 'bandpass';
  filter1.frequency.setValueAtTime(1100, now);
  filter1.Q.setValueAtTime(18, now);

  osc1.connect(filter1);
  filter1.connect(primaryGain);
  primaryGain.connect(ctx.destination);

  // Secondary knock (delayed 6ms, simulates wood sliding on string)
  const secondaryGain = ctx.createGain();
  secondaryGain.gain.setValueAtTime(0, now);
  secondaryGain.gain.setValueAtTime(0.12, now + 0.006);
  secondaryGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(950, now + 0.006);
  osc2.frequency.exponentialRampToValueAtTime(250, now + 0.022);

  const filter2 = ctx.createBiquadFilter();
  filter2.type = 'bandpass';
  filter2.frequency.setValueAtTime(950, now + 0.006);
  filter2.Q.setValueAtTime(14, now + 0.006);

  osc2.connect(filter2);
  filter2.connect(secondaryGain);
  secondaryGain.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.03);
  osc2.start(now + 0.006);
  osc2.stop(now + 0.03);
}

// 3. Bell Chime (108 Japa Bead round completion)
export function playBellChime() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 2.0;

  // Chord frequencies: C5, E5, G5, C6 (major arpeggio)
  const freqs = [523.25, 659.25, 783.99, 1046.50];

  freqs.forEach((freq, idx) => {
    const timeOffset = idx * 0.08;
    const strikeTime = now + timeOffset;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, strikeTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.setValueAtTime(0.18, strikeTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, strikeTime + duration - timeOffset);

    // Highpass filter for crisp bell ringing
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(300, strikeTime);

    osc.connect(hp);
    hp.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(strikeTime);
    osc.stop(strikeTime + duration);
  });
}

// 4. Tanpura Meditative Drone Synthesizer
// Plucks strings sequentially in a loop: Pa (5th) -> Sa (8ve) -> Sa (8ve) -> Sa (Root)
export function startTanpura(volume = 0.3, pitchName = 'C') {
  if (tanpuraInterval) return;
  
  const ctx = getAudioContext();
  
  // Set root frequency based on scale selection
  const pitchMap = {
    'A': 110.00, 'A#': 116.54, 'B': 123.47, 'C': 130.81, 
    'C#': 138.59, 'D': 146.83, 'D#': 155.56, 'E': 164.81, 
    'F': 174.61, 'F#': 185.00, 'G': 196.00, 'G#': 207.65
  };
  currentPitch = pitchMap[pitchName] || 130.81;

  // Master volume node for Tanpura
  tanpuraVolumeNode = ctx.createGain();
  tanpuraVolumeNode.gain.setValueAtTime(volume, ctx.currentTime);
  tanpuraVolumeNode.connect(ctx.destination);

  let currentString = 0;
  
  const pluckString = () => {
    const now = ctx.currentTime;
    const pluckDuration = 2.4;
    
    // Frequencies: Pa (5th), Sa (High Octave), Sa (High Octave), Sa (Root Low)
    const root = currentPitch;
    const fifth = root * 1.5;
    const octave = root * 2.0;
    
    const stringFreqs = [fifth, octave, octave, root];
    const freq = stringFreqs[currentString];
    
    // Synthesis engine: Sawtooth filtered down to sound like string vibration
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    
    // Buzz generator: Add wave distortion to emulate Jawari bridge
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(15);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    // Envelope to sweep filter down for string pluck pluck sound
    filter.frequency.exponentialRampToValueAtTime(180, now + pluckDuration);
    filter.Q.setValueAtTime(4, now);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.08); // plucking attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + pluckDuration);
    
    osc.connect(shaper);
    shaper.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(tanpuraVolumeNode);
    
    osc.start(now);
    osc.stop(now + pluckDuration);
    
    // Keep reference so we can terminate it immediately on stop
    activeTanpuraNodes.push(osc);
    
    currentString = (currentString + 1) % 4;
  };

  // Schedule pluck immediately
  pluckString();
  
  // Pluck another string every 900ms
  tanpuraInterval = setInterval(pluckString, 900);
}

export function stopTanpura() {
  if (tanpuraInterval) {
    clearInterval(tanpuraInterval);
    tanpuraInterval = null;
  }
  
  activeTanpuraNodes.forEach(node => {
    try { node.stop(); } catch(e) {}
  });
  activeTanpuraNodes = [];
  
  if (tanpuraVolumeNode) {
    tanpuraVolumeNode.disconnect();
    tanpuraVolumeNode = null;
  }
}

export function setTanpuraVolume(volume) {
  if (tanpuraVolumeNode) {
    const ctx = getAudioContext();
    tanpuraVolumeNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
  }
}

// Helper to create soft wave distortion curves
function makeDistortionCurve(amount) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
