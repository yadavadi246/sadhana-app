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

import Hero from './components/Hero.js';
import StatsStrip from './components/StatsStrip.js';
import BadgesRow from './components/BadgesRow.js';
import WeeklyChart from './components/WeeklyChart.js';
import Timeline from './components/Timeline.js';
import ExportModal from './components/ExportModal.js';
import ReportCard from './components/ReportCard.js';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentData, setCurrentData] = useState(() => loadDay(new Date()));
  
  // High-overhead statistics updated asynchronously
  const [streak, setStreak] = useState(0);
  const [restMinutes, setRestMinutes] = useState(null);
  const [weekScores, setWeekScores] = useState([]);
  
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

  // 1. Synchronously load data whenever selectedDate changes
  useEffect(() => {
    const data = loadDay(selectedDate);
    setCurrentData(data);
  }, [selectedDate]);

  // 2. Compute score reactively
  const score = useMemo(() => {
    return computeScore(currentData);
  }, [currentData]);

  // 3. Asynchronously load streaks, rest time, and weekly scores
  const refreshStats = async () => {
    // 45-day streak calculation
    const currentStreak = await computeStreak(selectedDate);
    setStreak(currentStreak);

    // Compute yesterday's rest hours
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevData = loadDay(prevDate);
    const rest = computeRestMinutes(prevData, currentData.wakeHour, currentData.wakeMinute);
    setRestMinutes(rest);

    // Calculate score trends for last 7 days
    const weekData = loadWeekScores(selectedDate);
    setWeekScores(weekData);
  };

  useEffect(() => {
    refreshStats();
  }, [selectedDate, currentData]);

  // 4. Achievement badges list
  const achievements = useMemo(() => {
    return buildAchievements(currentData, streak);
  }, [currentData, streak]);

  // Field change event handler
  const handleChangeField = (field, value) => {
    setCurrentData((prev) => {
      const updated = { ...prev, [field]: value };
      const success = saveDay(selectedDate, updated);
      if (success) {
        triggerToast('Saved ✓');
      } else {
        triggerToast('Could not save data', true);
      }
      return updated;
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

  return html`
    <div class="page">
      <!-- Sky Hero Section -->
      <${Hero}
        selectedDate=${selectedDate}
        setSelectedDate=${setSelectedDate}
        currentData=${currentData}
        onResetDay=${handleResetDay}
        savedToast=${savedToast}
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

      <footer>✦ chant and be happy ✦</footer>
    </div>
  `;
}
