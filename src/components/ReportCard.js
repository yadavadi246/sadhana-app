import { html } from '../html.js';
import { displayDate } from '../utils/storage.js';

export default function ReportCard({ data, score, date, reportRef }) {
  const renderYesNo = (val) => {
    if (val === true) return 'Yes';
    if (val === false) return 'No';
    return '—';
  };

  const renderTime = (hour, minute, period) => {
    if (!hour) return '—';
    return `${hour}:${minute || '00'} ${period || ''}`;
  };

  const renderNotes = (noteText) => {
    if (!noteText) return null;
    return noteText
      .split('\n')
      .filter((line) => line.trim())
      .map((line, index) => html`
        <div key=${index} class="rc-note-line">• ${line}</div>
      `);
  };

  return html`
    <div class="report-card" id="reportCard" ref=${reportRef}>
      <div class="rc-hero">
        <div class="rc-eyebrow">Sādhanā Report</div>
        <div class="rc-date" id="rcDate">${displayDate(date)}</div>
        <div class="rc-score" id="rcScore">Score: ${score}/100</div>
      </div>
      <div class="rc-body" id="rcBody">
        <div class="rc-group">Before Dawn</div>
        <div class="rc-row">
          <span class="rc-label">Wake-up time</span>
          <span class="rc-value">${renderTime(data.wakeHour, data.wakeMinute, 'AM')}</span>
        </div>
        <div class="rc-row">
          <span class="rc-label">Śikṣāṣṭakam</span>
          <span class="rc-value">${renderYesNo(data.shikshastakam)}</span>
        </div>
        <div class="rc-row">
          <span class="rc-label">Morning chanting</span>
          <span class="rc-value">${data.morningChanting || 0} rounds</span>
        </div>

        <div class="rc-group">Morning</div>
        <div class="rc-row">
          <span class="rc-label">Maṅgala Ārati</span>
          <span class="rc-value">${renderYesNo(data.mangalaAarti)}</span>
        </div>
        <div class="rc-row">
          <span class="rc-label">Morning class</span>
          <span class="rc-value">${renderYesNo(data.morningClass)}</span>
        </div>
        <div class="rc-row">
          <span class="rc-label">Chanting</span>
          <span class="rc-value">${data.chanting || 0} rounds</span>
        </div>

        <div class="rc-group">Day & Night</div>
        <div class="rc-row">
          <span class="rc-label">Hearing</span>
          <span class="rc-value">${data.hearingMinutes ? `${data.hearingMinutes} min` : '—'}</span>
        </div>
        ${renderNotes(data.hearingNote)}
        
        <div class="rc-row">
          <span class="rc-label">Reading</span>
          <span class="rc-value">${data.readingMinutes ? `${data.readingMinutes} min` : '—'}</span>
        </div>
        ${renderNotes(data.readingNote)}

        <div class="rc-row">
          <span class="rc-label">Day sleep</span>
          <span class="rc-value">${data.daySleepMinutes ? `${data.daySleepMinutes} min` : '—'}</span>
        </div>
        <div class="rc-row">
          <span class="rc-label">Work</span>
          <span class="rc-value">${data.workMinutes ? `${data.workMinutes} min` : '—'}</span>
        </div>
        <div class="rc-row">
          <span class="rc-label">Night sleep</span>
          <span class="rc-value">${renderTime(data.nightHour, data.nightMinute, data.nightPeriod)}</span>
        </div>
      </div>
      <div class="rc-foot">✦ chant and be happy ✦</div>
    </div>
  `;
}
