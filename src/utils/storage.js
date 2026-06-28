const STORAGE_PREFIX = 'sadhana:';
const STREAK_LOOKBACK_DAYS = 45;

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function displayDate(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function defaultData() {
  return {
    wakeHour: '',
    wakeMinute: '',
    shikshastakam: null,
    morningChanting: 0,
    mangalaAarti: null,
    morningClass: null,
    chanting: 0,
    hearingMinutes: '',
    hearingNote: '',
    readingMinutes: '',
    readingNote: '',
    daySleepMinutes: '',
    workMinutes: '',
    nightHour: '',
    nightMinute: '',
    nightPeriod: null
  };
}

export function loadDay(date) {
  const key = STORAGE_PREFIX + dateKey(date);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultData();
  } catch (e) {
    console.error('Failed to load sadhana data from localStorage', e);
    return defaultData();
  }
}

export function saveDay(date, data) {
  const key = STORAGE_PREFIX + dateKey(date);
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save sadhana data to localStorage', e);
    return false;
  }
}

export function resetDayData(date) {
  const key = STORAGE_PREFIX + dateKey(date);
  try {
    localStorage.removeItem(key);
    return defaultData();
  } catch (e) {
    console.error('Failed to reset day data', e);
    return defaultData();
  }
}

export function timeToMinutes(hour12, minute, period) {
  if (!hour12 || minute === '' || minute === undefined) return null;
  let h = parseInt(hour12, 10);
  const m = parseInt(minute, 10);
  if (period === 'PM') {
    if (h !== 12) h += 12;
  } else {
    if (h === 12) h = 0;
  }
  return h * 60 + m;
}

export function computeRestMinutes(prevNightData, todayWakeHour, todayWakeMinute) {
  if (!prevNightData || !prevNightData.nightHour || !prevNightData.nightMinute || !prevNightData.nightPeriod) return null;
  const bedMin = timeToMinutes(prevNightData.nightHour, prevNightData.nightMinute, prevNightData.nightPeriod);
  const wakeMin = timeToMinutes(todayWakeHour, todayWakeMinute, 'AM');
  if (bedMin === null || wakeMin === null) return null;
  let diff = (wakeMin + 1440 - bedMin) % 1440;
  if (diff === 0) diff = 1440;
  return diff;
}

export function formatHM(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '—';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function computeScore(d) {
  let score = 0;
  if (d.wakeHour) score += 5;
  if (d.shikshastakam === true) score += 10;
  const totalRounds = (Number(d.morningChanting) || 0) + (Number(d.chanting) || 0);
  score += Math.min(totalRounds / 16, 1) * 30;
  if (d.mangalaAarti === true) score += 10;
  if (d.morningClass === true) score += 10;
  const hearing = Number(d.hearingMinutes) || 0;
  score += Math.min(hearing / 30, 1) * 15;
  const reading = Number(d.readingMinutes) || 0;
  score += Math.min(reading / 20, 1) * 10;
  if (d.nightHour) score += 10;
  return Math.round(score);
}

export function hasAnySadhana(d) {
  if (!d) return false;
  return !!(
    d.wakeHour ||
    d.shikshastakam !== null ||
    (Number(d.morningChanting) || 0) > 0 ||
    d.mangalaAarti !== null ||
    d.morningClass !== null ||
    (Number(d.chanting) || 0) > 0 ||
    Number(d.hearingMinutes) > 0 ||
    Number(d.readingMinutes) > 0 ||
    d.nightHour
  );
}

export async function computeStreak(fromDate) {
  let count = 0;
  let cursor = new Date(fromDate);
  const todayData = loadDay(cursor);
  
  if (hasAnySadhana(todayData)) {
    count = 1;
  } else {
    cursor.setDate(cursor.getDate() - 1);
  }
  
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    if (count === 0 && i === 0) {
      // If today has no sadhana, check yesterday. If yesterday also has none, streak is 0.
      const yesterdayData = loadDay(cursor);
      if (!hasAnySadhana(yesterdayData)) break;
    }
    
    const d = loadDay(cursor);
    if (hasAnySadhana(d)) {
      if (count === 0) count = 1; // start counting from the first active day found
      else count++;
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function loadWeekScores(centerDate) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() - i);
    const data = loadDay(d);
    out.push({
      date: d,
      score: data ? computeScore(data) : 0,
      isToday: dateKey(d) === dateKey(centerDate)
    });
  }
  return out;
}

export function buildAchievements(data, streak) {
  const list = [];
  const totalRounds = (Number(data.morningChanting) || 0) + (Number(data.chanting) || 0);
  const wakeH = parseInt(data.wakeHour, 10);
  
  if (data.wakeHour && wakeH >= 3 && wakeH <= 5) {
    list.push({ icon: '🌅', label: 'Early Riser' });
  }
  if (totalRounds >= 64) {
    list.push({ icon: '📿', label: 'Deep Dive · 64 rounds' });
  } else if (totalRounds >= 16) {
    list.push({ icon: '📿', label: 'Full Rounds · 16+' });
  }
  if (Number(data.readingMinutes) >= 30) {
    list.push({ icon: '📖', label: 'Bookworm' });
  }
  if (Number(data.hearingMinutes) >= 30) {
    list.push({ icon: '👂', label: 'All Ears' });
  }
  if (data.shikshastakam === true && data.mangalaAarti === true && data.morningClass === true) {
    list.push({ icon: '✨', label: 'Full Morning' });
  }
  
  const score = computeScore(data);
  if (score >= 90) {
    list.push({ icon: '🏆', label: 'Perfect Day' });
  }
  if (streak >= 30) {
    list.push({ icon: '🔥', label: '30-Day Streak' });
  } else if (streak >= 7) {
    list.push({ icon: '🔥', label: '7-Day Streak' });
  } else if (streak >= 3) {
    list.push({ icon: '🔥', label: '3-Day Streak' });
  }
  return list;
}
