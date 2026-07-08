import { render } from 'preact';
import { html } from './html.js';
import App from './App.js';

// Get target mounting element
const rootElement = document.getElementById('root');

if (rootElement) {
  // Clear any loading state markup
  rootElement.innerHTML = '';
  // Render the application
  render(html`<${App} />`, rootElement);
}

// Fade out and remove static splash screen
window.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    // Play Tibetan singing bowl on first interaction to avoid browser autoplay blocks
    const playBowlSound = async () => {
      try {
        const { playTibetanBowl } = await import('./utils/audio.js');
        playTibetanBowl();
      } catch (e) {
        console.warn('Bowl sound synthesis failed', e);
      }
      // Remove listeners once sound plays
      document.removeEventListener('click', playBowlSound);
      document.removeEventListener('keydown', playBowlSound);
      document.removeEventListener('touchstart', playBowlSound);
    };

    document.addEventListener('click', playBowlSound);
    document.addEventListener('keydown', playBowlSound);
    document.addEventListener('touchstart', playBowlSound);

    // Attempt direct load play (works on some browsers/standalone PWA modes)
    setTimeout(async () => {
      try {
        const { playTibetanBowl } = await import('./utils/audio.js');
        playTibetanBowl();
      } catch (e) {}
    }, 100);

    // Fade out after 1.8s
    setTimeout(() => {
      splash.classList.add('splash-fade-out');
      // Completely remove from DOM after transition completes
      setTimeout(() => splash.remove(), 400);
    }, 1800);
  }
});
