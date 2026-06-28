import { html } from '../html.js';
import { formatHM } from '../utils/storage.js';

// Helper to pad numbers
function pad(n) {
  return String(n).padStart(2, '0');
}

// Generate array of options
const hoursOptions = Array.from({ length: 12 }, (_, i) => pad(i + 1));
const minutesOptions = Array.from({ length: 60 }, (_, i) => pad(i));

export default function Timeline({ currentData, onChangeField, restMinutes }) {
  
  // Custom input handlers
  const handleToggle = (field, value) => {
    onChangeField(field, value);
  };

  const handleSelect = (field, value) => {
    onChangeField(field, value);
  };

  const handleStep = (field, currentVal, delta) => {
    const nextVal = Math.max(0, Math.min(64, (Number(currentVal) || 0) + delta));
    onChangeField(field, nextVal);
  };

  const handleInputChange = (field, val, maxDigits = 4) => {
    const cleanVal = val.replace(/[^0-9]/g, '').slice(0, maxDigits);
    onChangeField(field, cleanVal);
  };

  const handleTextChange = (field, val) => {
    onChangeField(field, val);
  };

  return html`
    <div class="timeline" id="timeline">

      <!-- BEFORE DAWN GROUP -->
      <div class="group-label">Before Dawn</div>

      <!-- Wake-up Time Row -->
      <div class="row" data-field="wakeTime">
        <div class="bead-col">
          <div class="bead ${currentData.wakeHour ? 'bead-done' : ''}" id="beadWake"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Wake-up time</div>
              <div class="sublabel">Rising for sādhana</div>
            </div>
            <div class="time-control">
              <select
                id="wakeHour"
                value=${currentData.wakeHour}
                onChange=${(e) => handleSelect('wakeHour', e.target.value)}
              >
                <option value="">--</option>
                ${hoursOptions.map(h => html`<option key=${h} value=${h}>${h}</option>`)}
              </select>
              <span class="colon">:</span>
              <select
                id="wakeMinute"
                value=${currentData.wakeMinute}
                onChange=${(e) => handleSelect('wakeMinute', e.target.value)}
              >
                <option value="">--</option>
                ${minutesOptions.map(m => html`<option key=${m} value=${m}>${m}</option>`)}
              </select>
              <span class="am-badge">AM</span>
            </div>
          </div>
          <div id="restChipWrap">
            ${restMinutes !== null && html`
              <span class="rest-chip">Rested ${formatHM(restMinutes)}</span>
            `}
          </div>
        </div>
      </div>

      <!-- Śikṣāṣṭakam Row -->
      <div class="row" data-field="shikshastakam">
        <div class="bead-col">
          <div class="bead ${currentData.shikshastakam === true ? 'bead-done' : ''}" id="beadShiksha"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Śikṣāṣṭakam</div>
              <div class="sublabel">Recited today?</div>
            </div>
            <div class="toggle" id="shikshastakamToggle">
              <button
                class="yes ${currentData.shikshastakam === true ? 'active' : ''}"
                type="button"
                onClick=${() => handleToggle('shikshastakam', true)}
              >Yes</button>
              <button
                class="no ${currentData.shikshastakam === false ? 'active' : ''}"
                type="button"
                onClick=${() => handleToggle('shikshastakam', false)}
              >No</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Morning Chanting Row -->
      <div class="row" data-field="morningChanting">
        <div class="bead-col">
          <div
            class="bead bead-accent ${(Number(currentData.morningChanting) || 0) > 0 ? 'bead-done' : ''}"
            id="beadMorningChanting"
          ></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Morning chanting</div>
              <div class="sublabel">Japa rounds (0–64)</div>
            </div>
            <div class="stepper">
              <button
                id="morningChantingMinus"
                type="button"
                aria-label="Decrease"
                onClick=${() => handleStep('morningChanting', currentData.morningChanting, -1)}
              >−</button>
              <input
                id="morningChantingValue"
                type="number"
                min="0"
                max="64"
                inputmode="numeric"
                value=${currentData.morningChanting}
                onChange=${(e) => {
                  const val = Math.max(0, Math.min(64, Number(e.target.value) || 0));
                  onChangeField('morningChanting', val);
                }}
              />
              <button
                id="morningChantingPlus"
                type="button"
                aria-label="Increase"
                onClick=${() => handleStep('morningChanting', currentData.morningChanting, 1)}
              >+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MORNING GROUP -->
      <div class="group-label">Morning</div>

      <!-- Maṅgala Ārati Row -->
      <div class="row" data-field="mangalaAarti">
        <div class="bead-col">
          <div class="bead ${currentData.mangalaAarti === true ? 'bead-done' : ''}" id="beadMangala"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Maṅgala Ārati</div>
              <div class="sublabel">Attended?</div>
            </div>
            <div class="toggle" id="mangalaAartiToggle">
              <button
                class="yes ${currentData.mangalaAarti === true ? 'active' : ''}"
                type="button"
                onClick=${() => handleToggle('mangalaAarti', true)}
              >Yes</button>
              <button
                class="no ${currentData.mangalaAarti === false ? 'active' : ''}"
                type="button"
                onClick=${() => handleToggle('mangalaAarti', false)}
              >No</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Morning Class Row -->
      <div class="row" data-field="morningClass">
        <div class="bead-col">
          <div class="bead ${currentData.morningClass === true ? 'bead-done' : ''}" id="beadClass"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Morning class</div>
              <div class="sublabel">Attended?</div>
            </div>
            <div class="toggle" id="morningClassToggle">
              <button
                class="yes ${currentData.morningClass === true ? 'active' : ''}"
                type="button"
                onClick=${() => handleToggle('morningClass', true)}
              >Yes</button>
              <button
                class="no ${currentData.morningClass === false ? 'active' : ''}"
                type="button"
                onClick=${() => handleToggle('morningClass', false)}
              >No</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Chanting Row -->
      <div class="row" data-field="chanting">
        <div class="bead-col">
          <div
            class="bead bead-accent ${(Number(currentData.chanting) || 0) > 0 ? 'bead-done' : ''}"
            id="beadChanting"
          ></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Chanting</div>
              <div class="sublabel">Additional rounds (0–64)</div>
            </div>
            <div class="stepper">
              <button
                id="chantingMinus"
                type="button"
                aria-label="Decrease"
                onClick=${() => handleStep('chanting', currentData.chanting, -1)}
              >−</button>
              <input
                id="chantingValue"
                type="number"
                min="0"
                max="64"
                inputmode="numeric"
                value=${currentData.chanting}
                onChange=${(e) => {
                  const val = Math.max(0, Math.min(64, Number(e.target.value) || 0));
                  onChangeField('chanting', val);
                }}
              />
              <button
                id="chantingPlus"
                type="button"
                aria-label="Increase"
                onClick=${() => handleStep('chanting', currentData.chanting, 1)}
              >+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- DAY GROUP -->
      <div class="group-label">Day</div>

      <!-- Hearing Row -->
      <div class="row" data-field="hearing">
        <div class="bead-col">
          <div class="bead ${Number(currentData.hearingMinutes) > 0 ? 'bead-done' : ''}" id="beadHearing"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Hearing</div>
              <div class="sublabel">Class / kīrtan / kathā</div>
            </div>
            <div class="minutes-control">
              <input
                id="hearingMinutes"
                type="number"
                min="0"
                max="9999"
                inputmode="numeric"
                placeholder="0"
                value=${currentData.hearingMinutes}
                onInput=${(e) => handleInputChange('hearingMinutes', e.target.value)}
              />
              <span class="min-suffix">min</span>
            </div>
          </div>
          <div class="note-row">
            <textarea
              id="hearingNote"
              class="note-input"
              rows="2"
              placeholder="What did you hear? (optional)"
              value=${currentData.hearingNote}
              onInput=${(e) => handleTextChange('hearingNote', e.target.value)}
            ></textarea>
            <div class="note-hint">One item per line</div>
          </div>
        </div>
      </div>

      <!-- Reading Row -->
      <div class="row" data-field="reading">
        <div class="bead-col">
          <div class="bead ${Number(currentData.readingMinutes) > 0 ? 'bead-done' : ''}" id="beadReading"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Reading</div>
              <div class="sublabel">Śāstra / books</div>
            </div>
            <div class="minutes-control">
              <input
                id="readingMinutes"
                type="number"
                min="0"
                max="9999"
                inputmode="numeric"
                placeholder="0"
                value=${currentData.readingMinutes}
                onInput=${(e) => handleInputChange('readingMinutes', e.target.value)}
              />
              <span class="min-suffix">min</span>
            </div>
          </div>
          <div class="note-row">
            <textarea
              id="readingNote"
              class="note-input"
              rows="2"
              placeholder="What did you read? (optional)"
              value=${currentData.readingNote}
              onInput=${(e) => handleTextChange('readingNote', e.target.value)}
            ></textarea>
            <div class="note-hint">One item per line</div>
          </div>
        </div>
      </div>

      <!-- Day Sleep Row -->
      <div class="row" data-field="daySleep">
        <div class="bead-col">
          <div class="bead ${Number(currentData.daySleepMinutes) > 0 ? 'bead-done' : ''}" id="beadDaySleep"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Day sleep</div>
              <div class="sublabel">Rest during the day</div>
            </div>
            <div class="minutes-control">
              <input
                id="daySleepMinutes"
                type="number"
                min="0"
                max="9999"
                inputmode="numeric"
                placeholder="0"
                value=${currentData.daySleepMinutes}
                onInput=${(e) => handleInputChange('daySleepMinutes', e.target.value)}
              />
              <span class="min-suffix">min</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Work Row -->
      <div class="row" data-field="work">
        <div class="bead-col">
          <div class="bead ${Number(currentData.workMinutes) > 0 ? 'bead-done' : ''}" id="beadWork"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Work</div>
              <div class="sublabel">Service / occupation</div>
            </div>
            <div class="minutes-control">
              <input
                id="workMinutes"
                type="number"
                min="0"
                max="9999"
                inputmode="numeric"
                placeholder="0"
                value=${currentData.workMinutes}
                onInput=${(e) => handleInputChange('workMinutes', e.target.value)}
              />
              <span class="min-suffix">min</span>
            </div>
          </div>
        </div>
      </div>

      <!-- NIGHT GROUP -->
      <div class="group-label">Night</div>

      <!-- Night Sleep Row -->
      <div class="row" data-field="nightSleep">
        <div class="bead-col">
          <div class="bead ${currentData.nightHour ? 'bead-done' : ''}" id="beadNight"></div>
        </div>
        <div class="row-content">
          <div class="row-main">
            <div class="label-block">
              <div class="label">Night sleep</div>
              <div class="sublabel">Time to bed</div>
            </div>
            <div class="time-control">
              <select
                id="nightHour"
                value=${currentData.nightHour}
                onChange=${(e) => handleSelect('nightHour', e.target.value)}
              >
                <option value="">--</option>
                ${hoursOptions.map(h => html`<option key=${h} value=${h}>${h}</option>`)}
              </select>
              <span class="colon">:</span>
              <select
                id="nightMinute"
                value=${currentData.nightMinute}
                onChange=${(e) => handleSelect('nightMinute', e.target.value)}
              >
                <option value="">--</option>
                ${minutesOptions.map(m => html`<option key=${m} value=${m}>${m}</option>`)}
              </select>
              <div class="toggle" id="nightPeriodToggle">
                <button
                  class="am ${currentData.nightPeriod === 'AM' ? 'active' : ''}"
                  type="button"
                  onClick=${() => handleToggle('nightPeriod', 'AM')}
                >AM</button>
                <button
                  class="pm ${currentData.nightPeriod === 'PM' ? 'active' : ''}"
                  type="button"
                  onClick=${() => handleToggle('nightPeriod', 'PM')}
                >PM</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
