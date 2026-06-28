import { html, useState, useEffect } from '../html.js';
import { displayDate, dateKey } from '../utils/storage.js';

export default function Hero({ selectedDate, setSelectedDate, currentData, onResetDay, savedToast }) {
  // Generate random stars for the background
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const starList = [];
    for (let i = 0; i < 10; i++) {
      starList.push({
        id: i,
        left: `${Math.random() * 94 + 2}%`,
        top: `${Math.random() * 70 + 4}px`,
        delay: `${Math.random() * 3}s`
      });
    }
    setStars(starList);
  }, []);

  // Compute sun position based on wake-up hour (range 1-12)
  const h = parseInt(currentData.wakeHour, 10);
  let ratio = 0.3; // Default sun position if no wake time is set
  if (!isNaN(h)) {
    // Clamp between 3 AM and 10 AM for nice dawn/morning visual track
    ratio = Math.min(Math.max((h - 1) / 11, 0), 1);
  }
  const sunX = `${18 + ratio * 64}%`;
  const sunY = `${70 - Math.sin(ratio * Math.PI) * 50}px`;

  // Date handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e) => {
    if (e.target.value) {
      // Split YYYY-MM-DD to avoid timezone issues
      const [year, month, day] = e.target.value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  };

  // Generate sun rays (8 rays rotating)
  const rays = Array.from({ length: 8 }).map((_, i) => html`
    <span key=${i} style=${{ transform: `rotate(${i * 45}deg) translate(-50%, -50%)` }}></span>
  `);

  return html`
    <div class="hero" id="heroEl">
      <div class="sky-layer" id="skyLayer">
        <!-- Twinkling Stars -->
        ${stars.map(s => html`
          <div
            key=${s.id}
            class="star"
            style=${{ left: s.left, top: s.top, animationDelay: s.delay }}
          ></div>
        `)}
        <!-- Drifting Clouds -->
        <div class="cloud" style=${{ top: '18px', left: '-90px', animationDelay: '0s' }}></div>
        <div class="cloud" style=${{ top: '60px', left: '-90px', animationDelay: '9s', transform: 'scale(0.7)' }}></div>
      </div>
      
      <!-- Sun Arc Track -->
      <div class="sun-track">
        <div class="sun-wrap" id="sunWrap" style=${{ '--sun-x': sunX, '--sun-y': sunY }}>
          <div class="sun-glow"></div>
          <div class="sun-rays" id="sunRays">
            ${Array.from({ length: 8 }).map((_, i) => html`
              <span key=${i} style=${{ transform: `translate(-50%, -50%) rotate(${i * 45}deg)` }}></span>
            `)}
          </div>
          <div class="sun-core"></div>
        </div>
      </div>

      <!-- Hero Header -->
      <div class="eyebrow">Sādhanā Report</div>
      <h1 class="hero-date" id="heroDate">${displayDate(selectedDate)}</h1>
      
      <!-- Date Navigation Controls -->
      <div class="date-nav">
        <button class="nav-btn" onClick=${handlePrevDay} aria-label="Previous day">‹</button>
        <div class="date-pill-wrap">
          <button class="date-pill-label" id="dateLabel" type="button">
            ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </button>
          <input
            type="date"
            id="datePicker"
            class="date-pill-input"
            aria-label="Choose date"
            value=${dateKey(selectedDate)}
            onChange=${handleDateChange}
          />
        </div>
        <button class="nav-btn" onClick=${handleNextDay} aria-label="Next day">›</button>
        <button class="today-btn" onClick=${handleToday} type="button">Today</button>
      </div>

      <!-- Reset & Status Toast -->
      <div class="hero-foot">
        <button class="reset-link" onClick=${onResetDay} type="button">Reset this day</button>
        <div class="saved-toast ${savedToast.show ? 'show' : ''} ${savedToast.isError ? 'error' : ''}">
          ${savedToast.text}
        </div>
      </div>
    </div>
  `;
}
