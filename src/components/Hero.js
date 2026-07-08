import { html, useState, useEffect } from '../html.js';
import { displayDate, dateKey } from '../utils/storage.js';

export default function Hero({ 
  selectedDate, 
  setSelectedDate, 
  currentData, 
  onResetDay, 
  savedToast,
  weatherInfo 
}) {
  const [stars, setStars] = useState([]);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  // Keep current hour updated for sky transition
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate random twinkling stars for night overlay
  useEffect(() => {
    const starList = [];
    for (let i = 0; i < 15; i++) {
      starList.push({
        id: i,
        left: `${Math.random() * 95 + 2}%`,
        top: `${Math.random() * 90 + 5}px`,
        delay: `${Math.random() * 3}s`
      });
    }
    setStars(starList);
  }, []);

  // 1. Determine sky time-of-day theme
  // Dawn: 4-6, Morning: 6-11, Afternoon: 11-16, Evening: 16-19, Night: 19-4
  let skyTheme = 'sky-night';
  if (currentHour >= 4 && currentHour < 6) skyTheme = 'sky-dawn';
  else if (currentHour >= 6 && currentHour < 11) skyTheme = 'sky-morning';
  else if (currentHour >= 11 && currentHour < 16) skyTheme = 'sky-afternoon';
  else if (currentHour >= 16 && currentHour < 19) skyTheme = 'sky-evening';

  // 2. Determine weather overlay conditions
  const weatherType = weatherInfo?.type || 'clear'; // 'clear' | 'rain' | 'snow' | 'cloudy' | 'thunder' | 'hot'
  const temp = weatherInfo?.temp;

  // 3. Compute sun position based on wake-up hour (range 1-12 AM) or current hour
  const wakeH = parseInt(currentData.wakeHour, 10);
  let ratio = 0.35; // Default sun height
  if (!isNaN(wakeH)) {
    // If wakeHour is filled, map 3 AM - 10 AM range to 0 - 1 progress
    ratio = Math.min(Math.max((wakeH - 3) / 7, 0), 1);
  }
  const sunX = `${18 + ratio * 64}%`;
  const sunY = `${75 - Math.sin(ratio * Math.PI) * 45}px`;

  // Date Navigation handlers
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
      const [year, month, day] = e.target.value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  };

  // Weather particle generators
  const renderRain = () => {
    return Array.from({ length: 28 }).map((_, i) => html`
      <div
        key=${i}
        class="rain-drop"
        style=${{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 1.5}s`,
          animationDuration: `${0.7 + Math.random() * 0.5}s`
        }}
      ></div>
    `);
  };

  const renderSnow = () => {
    return Array.from({ length: 20 }).map((_, i) => html`
      <div
        key=${i}
        class="snowflake"
        style=${{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3.5 + Math.random() * 3}s`,
          transform: `scale(${0.3 + Math.random() * 0.8})`
        }}
      >❄</div>
    `);
  };

  return html`
    <div class="hero ${skyTheme} ${weatherType === 'thunder' ? 'thunder-active' : ''}" id="heroEl">
      
      <!-- Weather & Particles Layer -->
      <div class="sky-layer">
        
        <!-- Twinkling stars (Only visible during dawn/night/evening) -->
        ${(skyTheme === 'sky-night' || skyTheme === 'sky-dawn' || skyTheme === 'sky-evening') && stars.map(s => html`
          <div
            key=${s.id}
            class="star"
            style=${{ left: s.left, top: s.top, animationDelay: s.delay }}
          ></div>
        `)}

        <!-- Standard drifting clouds -->
        <div class="cloud" style=${{ top: '15px', left: '-90px', animationDelay: '0s', opacity: weatherType === 'cloudy' ? 0.6 : 0.2 }}></div>
        <div class="cloud" style=${{ top: '55px', left: '-90px', animationDelay: '8s', transform: 'scale(0.7)', opacity: weatherType === 'cloudy' ? 0.6 : 0.2 }}></div>
        
        <!-- Additional heavy clouds if overcast -->
        ${weatherType === 'cloudy' && html`
          <div class="cloud" style=${{ top: '35px', left: '-90px', animationDelay: '4s', transform: 'scale(1.2)', opacity: 0.7 }}></div>
          <div class="cloud" style=${{ top: '80px', left: '-90px', animationDelay: '12s', transform: 'scale(0.8)', opacity: 0.6 }}></div>
        `}

        <!-- Dynamic Rain particles -->
        ${weatherType === 'rain' && renderRain()}

        <!-- Dynamic Snow particles -->
        ${weatherType === 'snow' && renderSnow()}

        <!-- Heatwave overlay (ripple distortion) -->
        ${weatherType === 'hot' && html`<div class="heatwave-overlay"></div>`}
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

      <!-- Header contents -->
      <div class="hero-top-info">
        <div class="eyebrow">Sadhana Card</div>
        ${weatherInfo && html`
          <div class="weather-pill" title=${`Location weather: ${weatherInfo.desc}`}>
            <span>${weatherInfo.icon}</span>
            <span>${temp !== undefined ? `${Math.round(temp)}°C` : ''}</span>
          </div>
        `}
      </div>
      
      <h1 class="hero-date" id="heroDate">${displayDate(selectedDate)}</h1>
      
      <!-- Date Picker navigation bar -->
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

      <!-- Toast panel -->
      <div class="hero-foot">
        <button class="reset-link" onClick=${onResetDay} type="button">Reset this day</button>
        <div class="saved-toast ${savedToast.show ? 'show' : ''} ${savedToast.isError ? 'error' : ''}">
          ${savedToast.text}
        </div>
      </div>
    </div>
  `;
}
