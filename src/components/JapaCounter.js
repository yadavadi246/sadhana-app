import { html, useState, useEffect, useRef } from '../html.js';
import { playWoodClick, playBellChime, startTanpura, stopTanpura, setTanpuraVolume } from '../utils/audio.js';

export default function JapaCounter({ onSaveRounds }) {
  // Japa counter states
  const [bead, setBead] = useState(() => Number(localStorage.getItem('sadhana:japa_bead') || 0));
  const [round, setRound] = useState(() => Number(localStorage.getItem('sadhana:japa_round') || 0));
  
  // Customization configurations
  const [useVolumeKeys, setUseVolumeKeys] = useState(() => localStorage.getItem('sadhana:japa_vol_keys') === 'true');
  const [useAudio, setUseAudio] = useState(() => localStorage.getItem('sadhana:japa_audio') !== 'false');
  const [useVibe, setUseVibe] = useState(() => localStorage.getItem('sadhana:japa_vibe') !== 'false');
  
  // Tanpura drone console states
  const [isDronePlaying, setIsDronePlaying] = useState(false);
  const [droneVol, setDroneVol] = useState(0.2);
  const [dronePitch, setDronePitch] = useState('C');
  
  const beadClickRef = useRef(null);

  // Synchronize count to localStorage
  useEffect(() => {
    localStorage.setItem('sadhana:japa_bead', bead);
    localStorage.setItem('sadhana:japa_round', round);
  }, [bead, round]);

  // Save configs to localStorage
  useEffect(() => {
    localStorage.setItem('sadhana:japa_vol_keys', useVolumeKeys);
    localStorage.setItem('sadhana:japa_audio', useAudio);
    localStorage.setItem('sadhana:japa_vibe', useVibe);
  }, [useVolumeKeys, useAudio, useVibe]);

  // Adjust Tanpura volume on the fly
  useEffect(() => {
    setTanpuraVolume(droneVol);
  }, [droneVol]);

  // Safely stop Tanpura on unmount
  useEffect(() => {
    return () => {
      stopTanpura();
      setIsDronePlaying(false);
    };
  }, []);

  // 1. Increment Japa count
  const handleIncrement = () => {
    // Audio synthesis
    if (useAudio) {
      playWoodClick();
    }
    
    // Haptic feedback (short buzz)
    if (useVibe && navigator.vibrate) {
      navigator.vibrate(20);
    }
    
    // Scale animation of core button
    if (beadClickRef.current) {
      beadClickRef.current.style.transform = 'scale(0.93)';
      setTimeout(() => {
        if (beadClickRef.current) beadClickRef.current.style.transform = 'scale(1)';
      }, 80);
    }

    setBead((prevBead) => {
      let nextBead = prevBead + 1;
      if (nextBead >= 108) {
        // Round completion chime & haptics
        playBellChime();
        if (useVibe && navigator.vibrate) {
          navigator.vibrate([150, 100, 150]);
        }
        setRound((r) => r + 1);
        return 0;
      }
      return nextBead;
    });
  };

  const handleDecrement = () => {
    setBead((prevBead) => {
      if (prevBead === 0) {
        if (round > 0) {
          setRound((r) => r - 1);
          return 107;
        }
        return 0;
      }
      return prevBead - 1;
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset current rounds and beads to zero?')) {
      setBead(0);
      setRound(0);
    }
  };

  // 2. Volume button key listeners & spacebar hooks
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Spacebar
      if (e.code === 'Space') {
        e.preventDefault();
        handleIncrement();
      }
      // Arrow Up
      else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      }
      // Arrow Down
      else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
      // Volume Up / Down (if configured)
      else if (useVolumeKeys) {
        if (e.key === 'VolumeUp') {
          e.preventDefault();
          handleIncrement();
        } else if (e.key === 'VolumeDown') {
          e.preventDefault();
          handleDecrement();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [useVolumeKeys, useAudio, useVibe, round, bead]);

  // 3. Tanpura toggle handler
  const handleToggleDrone = () => {
    if (isDronePlaying) {
      stopTanpura();
      setIsDronePlaying(false);
    } else {
      startTanpura(droneVol, dronePitch);
      setIsDronePlaying(true);
    }
  };

  // 4. Save Rounds to main report
  const handleSaveToLog = () => {
    if (round === 0) {
      alert('You have 0 completed rounds. Chant a full round of 108 beads to save.');
      return;
    }
    
    const choice = window.confirm(
      `Save ${round} completed rounds to today's log?\n\nClick OK for Morning rounds, Cancel for Additional rounds.`
    );
    
    if (choice) {
      onSaveRounds('morningChanting', round);
      alert(`${round} rounds saved to Morning Chanting!`);
    } else {
      onSaveRounds('chanting', round);
      alert(`${round} rounds saved to Additional Chanting!`);
    }
    // Clear rounds after saving
    setRound(0);
    setBead(0);
  };

  // 5. Generate 108 Mala beads layout in dynamic circle path
  const malaBeads = Array.from({ length: 108 }).map((_, i) => {
    // Radius of circular string is 90 inside a 200x200 viewBox
    const angle = (i * 2 * Math.PI) / 108 - Math.PI / 2; // start from top (12 o'clock)
    const cx = 100 + 84 * Math.cos(angle);
    const cy = 100 + 84 * Math.sin(angle);
    
    let color = '#EFEADF'; // unchanted bead
    let size = 2.0;
    
    if (i < bead) {
      color = '#D4AF37'; // chanted bead (gold)
      size = 2.3;
    } else if (i === bead) {
      color = '#E8923A'; // active bead (saffron pulse)
      size = 3.5;
    }
    
    return html`
      <circle
        key=${i}
        cx=${cx}
        cy=${cy}
        r=${size}
        fill=${color}
        class=${i === bead ? 'japa-active-bead' : ''}
      />
    `;
  });

  return html`
    <div class="japa-container">
      
      <!-- Interactive Mālā Bead Ring -->
      <div class="japa-ring-wrap">
        <svg viewBox="0 0 200 200" class="japa-ring-svg">
          <!-- Circular string guide -->
          <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(216, 178, 90, 0.15)" stroke-width="1" />
          
          <!-- 108 beads -->
          ${malaBeads}
        </svg>

        <!-- Centered click button resembling the golden lotus logo -->
        <button
          ref=${beadClickRef}
          class="japa-click-btn"
          onClick=${handleIncrement}
          type="button"
          aria-label="Tap to count bead"
        >
          <!-- SVG Petal Ring inside Button -->
          <svg viewBox="0 0 100 100" class="btn-petals">
            ${Array.from({ length: 8 }).map((_, i) => html`
              <path
                key=${i}
                d="M 50,50 C 45,40 45,28 50,22 C 55,28 55,40 50,50 Z"
                fill="#C5993B"
                opacity="0.12"
                transform=${`rotate(${i * 45} 50 50)`}
              />
            `)}
          </svg>
          <div class="btn-bead-info">
            <span class="bead-fraction">${bead} / 108</span>
            <span class="bead-label">beads</span>
          </div>
        </button>
      </div>

      <!-- Rounds Display Banner -->
      <div class="japa-rounds-banner">
        <span class="rounds-text">Rounds: ${round}</span>
        <button class="japa-save-btn" onClick=${handleSaveToLog} type="button">
          Save to Log
        </button>
      </div>

      <!-- Controls Dashboard -->
      <div class="japa-console">
        <!-- Main volume / key config triggers -->
        <div class="console-row">
          <label class="config-label">
            <input
              type="checkbox"
              checked=${useAudio}
              onChange=${(e) => setUseAudio(e.target.checked)}
            />
            <span>Bead Sound</span>
          </label>
          <label class="config-label">
            <input
              type="checkbox"
              checked=${useVibe}
              onChange=${(e) => setUseVibe(e.target.checked)}
            />
            <span>Haptics</span>
          </label>
          <label class="config-label" title="Android volume buttons increment beads">
            <input
              type="checkbox"
              checked=${useVolumeKeys}
              onChange=${(e) => setUseVolumeKeys(e.target.checked)}
            />
            <span>Volume Keys</span>
          </label>
        </div>

        <!-- Tanpura Drone Console -->
        <div class="tanpura-panel">
          <div class="panel-header">
            <span>Tanpura Drone</span>
            <button
              class="drone-toggle-btn ${isDronePlaying ? 'playing' : ''}"
              onClick=${handleToggleDrone}
              type="button"
            >
              ${isDronePlaying ? 'Stop Drone' : 'Start Drone'}
            </button>
          </div>
          
          <div class="panel-controls" style=${{ opacity: isDronePlaying ? 1 : 0.6 }}>
            <div class="slider-control">
              <span class="slider-label">Volume</span>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value=${droneVol}
                onChange=${(e) => setDroneVol(parseFloat(e.target.value))}
                disabled=${!isDronePlaying}
              />
            </div>
            
            <div class="select-control">
              <span class="select-label">Scale/Key</span>
              <select
                value=${dronePitch}
                onChange=${(e) => {
                  setDronePitch(e.target.value);
                  if (isDronePlaying) {
                    stopTanpura();
                    startTanpura(droneVol, e.target.value);
                  }
                }}
                disabled=${!isDronePlaying}
              >
                ${['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'].map(key => html`
                  <option key=${key} value=${key}>${key}</option>
                `)}
              </select>
            </div>
          </div>
        </div>

        <div class="reset-wrap">
          <button class="japa-reset-link" onClick=${handleDecrement} type="button">Decrement (−1)</button>
          <span class="bullet-sep">·</span>
          <button class="japa-reset-link" onClick=${handleReset} type="button">Reset Counter</button>
        </div>
      </div>
      
    </div>
  `;
}
