import { html, useEffect, useState } from '../html.js';
import Logo from './Logo.js';
import { playTibetanBowl } from '../utils/audio.js';

export default function Splash({ onComplete }) {
  const [fadeClass, setFadeClass] = useState('splash-active');

  useEffect(() => {
    // 1. Play synthesized Tibetan singing bowl chime on load
    try {
      playTibetanBowl();
    } catch(e) {
      console.warn('Audio synthesis deferred until user interaction', e);
    }

    // 2. Trigger fade out at 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeClass('splash-fade-out');
    }, 1500);

    // 3. Unmount completely at 2.0 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return html`
    <div class="splash-overlay ${fadeClass}">
      <div class="splash-content">
        <!-- Logo with nested rotation classes in CSS -->
        <${Logo} size="150" className="splash-logo-anim" />
        
        <!-- App Title with fade-in effect -->
        <h1 class="splash-title">Sadhana Card</h1>
        <p class="splash-subtitle">harer nāmaiva kevalam</p>
      </div>
    </div>
  `;
}
