import { html } from '../html.js';

export default function Logo({ size = 200, className = '' }) {
  // Generate 24 gold beads arranged in a circle at radius 78
  const beads = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / 24;
    const cx = 100 + 78 * Math.cos(angle);
    const cy = 100 + 78 * Math.sin(angle);
    return html`
      <circle
        key=${i}
        cx=${cx}
        cy=${cy}
        r="3.5"
        fill="#C5993B"
        class="logo-bead"
        style=${{ transformOrigin: '100px 100px' }}
      />
    `;
  });

  // Generate 12 petals (6 gold, 6 cream alternating, rotated in 30 degree steps)
  const petals = Array.from({ length: 12 }).map((_, i) => {
    const angle = i * 30;
    const isCream = i % 2 !== 0;
    const fill = isCream ? '#FFFDF0' : '#D4AF37';
    // Inner cream petals are slightly scaled down and rotated to create depth
    const scale = isCream ? 'scale(0.85)' : 'scale(1)';
    return html`
      <path
        key=${i}
        d="M 100,100 C 90,82 90,56 100,44 C 110,56 110,82 100,100 Z"
        fill=${fill}
        transform="rotate(${angle} 100 100) ${scale}"
        class=${isCream ? 'logo-petal-cream' : 'logo-petal-gold'}
      />
    `;
  });

  return html`
    <svg
      width=${size}
      height=${size}
      viewBox="0 0 200 200"
      class="sadhana-logo ${className}"
      xmlns="http://www.w3.org/2000/svg"
      style=${{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <!-- Outer gold accent border -->
      <circle cx="100" cy="100" r="98" fill="none" stroke="#D4AF37" stroke-width="1.5" />
      
      <!-- Inner dark-blue shield base -->
      <circle cx="100" cy="100" r="95" fill="#1B183A" stroke="#100C24" stroke-width="2.5" />
      
      <!-- Gold circle line guides surrounding beads -->
      <circle cx="100" cy="100" r="87" fill="none" stroke="#C5993B" stroke-width="0.8" opacity="0.8" />
      <circle cx="100" cy="100" r="69" fill="none" stroke="#C5993B" stroke-width="0.8" opacity="0.8" />

      <!-- Ring of 24 beads -->
      <g class="logo-beads-group">
        ${beads}
      </g>

      <!-- Center gold ring -->
      <circle cx="100" cy="100" r="32" fill="none" stroke="#C5993B" stroke-width="1" opacity="0.6" />

      <!-- Center Saffron Lotus Flower -->
      <g class="logo-lotus-group" style=${{ transformOrigin: '100px 100px' }}>
        ${petals}
        <!-- Saffron core button with gold frame -->
        <circle cx="100" cy="100" r="14" fill="#E8923A" stroke="#D4AF37" stroke-width="2" />
        <circle cx="100" cy="100" r="8" fill="#F4B860" opacity="0.8" />
      </g>
    </svg>
  `;
}
