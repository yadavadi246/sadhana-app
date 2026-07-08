import { html, useState, useEffect, useMemo, useRef } from './html.js';
import {
  loadDay,
  saveDay,
  resetDayData,
  computeScore,
  computeStreak,
  computeRestMinutes,
  loadWeekScores,
  buildAchievements,
  dateKey
} from './utils/storage.js';

import { initSyncEngine, uploadDayToCloud, syncAllDaysWithCloud } from './utils/sync.js';

import Splash from './components/Splash.js';
import Hero from './components/Hero.js';
import StatsStrip from './components/StatsStrip.js';
import BadgesRow from './components/BadgesRow.js';
import WeeklyChart from './components/WeeklyChart.js';
import Timeline from './components/Timeline.js';
import ExportModal from './components/ExportModal.js';
import ReportCard from './components/ReportCard.js';

import JapaCounter from './components/JapaCounter.js';
import SyncSettings from './components/SyncSettings.js';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'japa' | 'sync'
  
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentData, setCurrentData] = useState(() => loadDay(new Date()));
  
  // High-overhead statistics updated asynchronously
  const [streak, setStreak] = useState(0);
  const [restMinutes, setRestMinutes] = useState(null);
  const [weekScores, setWeekScores] = useState([]);
  
  // Weather state from geolocation
  const [weather, setWeather] = useState(null);

  // Export states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const reportCardRef = useRef(null);

  // Status feedback toast state
  const [savedToast, setSavedToast] = useState({ show: false, text: '', isError: false });
  const toastTimeoutRef = useRef(null);

  // Helper to show a temporary feedback toast
  const triggerToast = (text, isError = false) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setSavedToast({ show: true, text, isError });
    toastTimeoutRef.current = setTimeout(() => {
      setSavedToast({ show: false, text: '', isError: false });
    }, 2000);
  };

  // 1. Initialize Sync Database & run silent background sync on launch
  useEffect(() => {
    initSyncEngine();
    syncAllDaysWithCloud(() => {});
  }, []);

  // 2. Fetch local weather using browser coordinates
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await res.json();
          if (data && data.current_weather) {
            const temp = data.current_weather.temperature;
            const code = data.current_weather.weathercode;
            
            // Map WMO weather codes to weather themes
            let type = 'clear';
            let icon = '☀️';
            let desc = 'Clear';
            
            if (code === 0) {
              type = temp > 32 ? 'hot' : 'clear';
              icon = temp > 32 ? '☀️🔥' : '☀️';
              desc = temp > 32 ? 'Sunny & Hot' : 'Clear Sky';
            } else if ([1, 2, 3].includes(code)) {
              type = 'cloudy';
              icon = '☁️';
              desc = 'Partly Cloudy';
            } else if ([45, 48].includes(code)) {
              type = 'cloudy';
              icon = '🌫️';
              desc = 'Foggy';
            } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
              type = 'rain';
              icon = '🌧️';
              desc = 'Rainy';
            } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
              type = 'snow';
              icon = '❄️';
              desc = 'Snowy';
            } else if ([95, 96, 99].includes(code)) {
              type = 'thunder';
              icon = '⛈️';
              desc = 'Thunderstorm';
            }
            
            setWeather({ type, temp, desc, icon });
          }
        } catch(e) {
          console.warn('Failed to fetch weather forecast details', e);
        }
      }, (err) => {
        console.warn('Geolocation access deferred or denied', err);
      });
    }
  }, []);

  // 3. Synchronously load data whenever selectedDate changes
  useEffect(() => {
    const data = loadDay(selectedDate);
    setCurrentData(data);
  }, [selectedDate]);

  // 4. Compute score reactively
  const score = useMemo(() => {
    return computeScore(currentData);
  }, [currentData]);

  // 5. Asynchronously load streaks, rest time, and weekly scores
  const refreshStats = async () => {
    const currentStreak = await computeStreak(selectedDate);
    setStreak(currentStreak);

    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevData = loadDay(prevDate);
    const rest = computeRestMinutes(prevData, currentData.wakeHour, currentData.wakeMinute);
    setRestMinutes(rest);

    const weekData = loadWeekScores(selectedDate);
    setWeekScores(weekData);
  };

  useEffect(() => {
    refreshStats();
  }, [selectedDate, currentData]);

  // 6. Achievement badges list
  const achievements = useMemo(() => {
    return buildAchievements(currentData, streak);
  }, [currentData, streak]);

  // Field change event handler + Auto-saving + Firebase Syncing
  const handleChangeField = (field, value) => {
    setCurrentData((prev) => {
      const enrichedData = { 
        ...prev, 
        [field]: value,
        lastModified: Date.now() // Merge Conflict timestamp marker
      };
      
      const success = saveDay(selectedDate, enrichedData);
      if (success) {
        triggerToast('Saved ✓');
        // Push local update to Firebase cloud Firestore asynchronously
        uploadDayToCloud(dateKey(selectedDate), enrichedData);
      } else {
        triggerToast('Could not save data', true);
      }
      return enrichedData;
    });
  };

  // Reset day handler
  const handleResetDay = () => {
    if (window.confirm('Are you sure you want to clear all data for this day?')) {
      const cleared = resetDayData(selectedDate);
      setCurrentData(cleared);
      triggerToast('Reset successfully');
    }
  };

  // Save Japa Counter rounds directly into Tracker
  const handleSaveJapaRounds = (targetField, count) => {
    const currentVal = Number(currentData[targetField]) || 0;
    handleChangeField(targetField, currentVal + count);
  };

  if (showSplash) {
    return html`<${Splash} onComplete=${() => setShowSplash(false)} />`;
  }

  return html`
    <div class="page">
      
      <!-- TAB VIEW ORCHESTRATION -->
      ${activeTab === 'tracker' && html`
        <div>
          <!-- Sky Hero Section (Day/Night & Weather animations) -->
          <${Hero}
            selectedDate=${selectedDate}
            setSelectedDate=${setSelectedDate}
            currentData=${currentData}
            onResetDay=${handleResetDay}
            savedToast=${savedToast}
            weatherInfo=${weather}
          />

          <!-- Circular Score ring, Streak counter, Sleep hours -->
          <${StatsStrip}
            score=${score}
            streak=${streak}
            restMinutes=${restMinutes}
          />

          <!-- Pop-up entry Badges -->
          <${BadgesRow}
            badges=${achievements}
          />

          <!-- Last 7 Days chart -->
          <${WeeklyChart}
            weekScores=${weekScores}
            onSelectDate=${setSelectedDate}
            onRefresh=${refreshStats}
          />

          <!-- Cycle Timeline checklists -->
          <${Timeline}
            currentData=${currentData}
            onChangeField=${handleChangeField}
            restMinutes=${restMinutes}
          />

          <!-- Submit Section -->
          <div class="submit-section">
            <button class="submit-btn" onClick=${() => setIsExportOpen(true)} type="button">
              Submit & download report
            </button>
            <div class="submit-hint">Saves today's entry and lets you choose a report format</div>
          </div>
        </div>
      `}

      ${activeTab === 'japa' && html`
        <${JapaCounter}
          onSaveRounds=${handleSaveJapaRounds}
        />
      `}

      ${activeTab === 'sync' && html`
        <${SyncSettings} />
      `}

      <!-- Offscreen Report Card for HTML2Canvas & jsPDF exports -->
      <${ReportCard}
        data=${currentData}
        score=${score}
        date=${selectedDate}
        reportRef=${reportCardRef}
      />

      <!-- Export formats popup modal overlay -->
      <${ExportModal}
        isOpen=${isExportOpen}
        onClose=${() => setIsExportOpen(false)}
        reportCardRef=${reportCardRef}
        dateStr=${dateKey(selectedDate)}
      />

      <!-- FIXED BOTTOM NAVIGATION BAR -->
      <div class="tab-bar">
        <button
          class="tab-btn ${activeTab === 'tracker' ? 'active' : ''}"
          onClick=${() => setActiveTab('tracker')}
          type="button"
        >
          <span class="tab-icon">📇</span>
          <span>Tracker</span>
        </button>
        <button
          class="tab-btn ${activeTab === 'japa' ? 'active' : ''}"
          onClick=${() => setActiveTab('japa')}
          type="button"
        >
          <span class="tab-icon">📿</span>
          <span>Japa</span>
        </button>
        <button
          class="tab-btn ${activeTab === 'sync' ? 'active' : ''}"
          onClick=${() => setActiveTab('sync')}
          type="button"
        >
          <span class="tab-icon">☁️</span>
          <span>Sync</span>
        </button>
      </div>
      
    </div>
  `;
}
