import { html } from '../html.js';

export default function BadgesRow({ badges = [] }) {
  if (badges.length === 0) {
    return html`<div class="badges-row" id="badgesRow" style=${{ minHeight: '0px', marginBottom: '0px' }}></div>`;
  }

  return html`
    <div class="badges-row" id="badgesRow">
      ${badges.map((b, i) => html`
        <div
          key=${b.label}
          class="badge"
          style=${{ animationDelay: `${i * 0.08}s` }}
        >
          <span>${b.icon}</span>
          <span>${b.label}</span>
        </div>
      `)}
    </div>
  `;
}
