import { html } from '../html.js';
import { formatHM } from '../utils/storage.js';

export default function StatsStrip({ score, streak, restMinutes }) {
  const circumference = 144;
  const dashOffset = circumference - (circumference * score) / 100;

  return html`
    <div class="stats-strip">
      <!-- Score Circle Card -->
      <div class="stat-card">
        <div class="ring-wrap">
          <svg viewBox="0 0 56 56">
            <circle class="ring-bg" cx="28" cy="28" r="23"></circle>
            <circle
              class="ring-fg"
              id="scoreRing"
              cx="28"
              cy="28"
              r="23"
              style=${{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
            ></circle>
          </svg>
          <div class="ring-label" id="scoreLabel">${score}</div>
        </div>
        <div class="stat-title">Sādhanā score</div>
      </div>

      <!-- Streak Flame Card -->
      <div class="stat-card">
        <div class="flame">🔥</div>
        <div class="stat-value" id="streakValue">
          ${streak !== undefined ? `${streak} ${streak === 1 ? 'day' : 'days'}` : '…'}
        </div>
        <div class="stat-title">Streak</div>
      </div>

      <!-- Last Rest Card -->
      <div class="stat-card">
        <div style=${{ fontSize: '26px' }}>🌙</div>
        <div class="stat-value" id="restValue">
          ${restMinutes !== null ? formatHM(restMinutes) : '—'}
        </div>
        <div class="stat-title">Last rest</div>
      </div>
    </div>
  `;
}
