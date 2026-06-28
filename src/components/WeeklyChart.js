import { html } from '../html.js';
import { dateKey } from '../utils/storage.js';

export default function WeeklyChart({ weekScores = [], onSelectDate, onRefresh }) {
  const getShortDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
  };

  return html`
    <div class="week-card">
      <div class="week-title">
        <span>Last 7 days</span>
        <button class="week-refresh" onClick=${onRefresh} type="button">refresh</button>
      </div>
      <div class="week-bars" id="weekBars">
        ${weekScores.map((day) => {
          const isToday = day.isToday;
          return html`
            <div
              key=${dateKey(day.date)}
              class="week-bar-col"
              onClick=${() => onSelectDate(day.date)}
              title=${`Score: ${day.score} on ${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            >
              <div
                class="week-bar ${isToday ? 'is-today' : ''}"
                style=${{ height: `${day.score}%` }}
              ></div>
              <span class="week-bar-label">${getShortDayName(day.date)}</span>
            </div>
          `;
        })}
      </div>
    </div>
  `;
}
