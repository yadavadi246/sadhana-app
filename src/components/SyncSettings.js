import { html, useState, useEffect } from '../html.js';
import { getSyncCode, setSyncCode, syncAllDaysWithCloud } from '../utils/sync.js';

export default function SyncSettings() {
  const [syncCode, setLocalSyncCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Custom Firebase configuration states
  const [customFirebase, setCustomFirebase] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // PWA installation states
  const [installPrompt, setInstallPrompt] = useState(window.deferredPrompt);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  useEffect(() => {
    setLocalSyncCode(getSyncCode());
    const savedCustom = localStorage.getItem('sadhana:custom_firebase') || '';
    setCustomFirebase(savedCustom);

    // Check if running in standalone mode (PWA active)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsAlreadyInstalled(!!isStandalone);

    const handlePrompt = () => {
      setInstallPrompt(window.deferredPrompt);
      console.log('SyncSettings captured updated install prompt!');
    };
    
    window.addEventListener('pwa-prompt-available', handlePrompt);
    return () => window.removeEventListener('pwa-prompt-available', handlePrompt);
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      alert('Sync Code copied to clipboard!');
    } catch(e) {
      alert(`Sync Code: ${syncCode}`);
    }
  };

  const handleLinkDevice = async () => {
    if (!inputCode || inputCode.trim().length < 8) {
      alert('Please enter a valid Sync Code (e.g. SDN-XXXX-XXXX)');
      return;
    }

    const confirmed = window.confirm(
      'Linking devices will merge your histories. If there is a conflict on a day, the latest modified entry will be kept.\n\nProceed?'
    );

    if (confirmed) {
      const success = setSyncCode(inputCode);
      if (success) {
        setLocalSyncCode(getSyncCode());
        setInputCode('');
        setStatus('Sync Code updated! Running merge sync...');
        await runTriggerSync();
      } else {
        alert('Invalid Sync Code format');
      }
    }
  };

  const runTriggerSync = async () => {
    setIsSyncing(true);
    setStatus('Initializing Sync...');
    
    const success = await syncAllDaysWithCloud((msg) => {
      setStatus(msg);
    });

    setIsSyncing(false);
    if (success) {
      setTimeout(() => setStatus('Sync completed successfully ✓'), 1500);
    }
  };

  const handleSaveCustomFirebase = () => {
    if (!customFirebase.trim()) {
      localStorage.removeItem('sadhana:custom_firebase');
      alert('Custom database config cleared. Reverted to shared sandbox database.');
      window.location.reload();
      return;
    }

    try {
      const parsed = JSON.parse(customFirebase);
      if (!parsed.apiKey || !parsed.projectId || !parsed.appId) {
        alert('Invalid Firebase configuration format. Must contain at least: apiKey, projectId, appId.');
        return;
      }
      localStorage.setItem('sadhana:custom_firebase', JSON.stringify(parsed));
      alert('Custom Firebase database credentials configured! App is reloading...');
      window.location.reload();
    } catch(e) {
      alert('Invalid JSON format. Please paste valid JSON credentials.');
    }
  };

  const handleInstallApp = async () => {
    const promptEvent = installPrompt || window.deferredPrompt;
    if (!promptEvent) {
      alert('Install prompt not triggered by browser yet. Please use the instructions below.');
      return;
    }
    
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    if (outcome === 'accepted') {
      window.deferredPrompt = null;
      setInstallPrompt(null);
      setIsAlreadyInstalled(true);
    }
  };

  return html`
    <div class="sync-settings">
      <div class="sync-header">
        <h2>App Installation & Sync</h2>
        <p class="sync-desc">Configure automatic database syncing and install the app onto your home screen for quick access.</p>
      </div>

      <!-- PWA DOWNLOAD APP SECTION -->
      <div class="sync-card pwa-download-card">
        <span class="card-label">Download App (One-Click)</span>
        <h3 class="download-title">Add to Home Screen</h3>
        <p class="card-hint" style=${{ marginBottom: '14px', fontSize: '13px' }}>
          Get instant startup, fullscreen standalone mode (no browser top bars), and offline storage by downloading the app directly to your home screen.
        </p>

        ${isAlreadyInstalled ? html`
          <div class="installed-success-tag">
            <span class="check-icon">✓</span> App Installed & Running Standalone
          </div>
        ` : installPrompt ? html`
          <button class="install-pwa-btn" onClick=${handleInstallApp} type="button">
            📥 Download & Install App
          </button>
        ` : html`
          <!-- Manual Guidelines card -->
          <div class="manual-install-guides">
            <div class="guide-item">
              <strong>Android (Chrome)</strong>
              <span>Tap the <strong>three dots</strong> in Chrome's top-right, then select <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</span>
            </div>
            <div class="guide-item" style=${{ borderTop: '1.2px solid rgba(42,33,24,0.06)', paddingTop: '10px', marginTop: '10px' }}>
              <strong>iPhone / iPad (Safari)</strong>
              <span>Tap the <strong>Share</strong> icon (square with arrow) at the bottom, then scroll down and select <strong>Add to Home Screen</strong>.</span>
            </div>
          </div>
        `}
      </div>

      <!-- Sync Code Display card -->
      <div class="sync-card">
        <span class="card-label">Your Device Sync Code</span>
        <div class="code-box">
          <span class="code-text" onClick=${handleCopyCode}>${syncCode}</span>
          <button class="copy-btn" onClick=${handleCopyCode} type="button">Copy</button>
        </div>
        <p class="card-hint">Write this down. Enter this code on your other devices to merge and link their databases.</p>
      </div>

      <!-- Input to Link Device -->
      <div class="link-card">
        <h3>Link Another Device</h3>
        <div class="link-input-group">
          <input
            type="text"
            placeholder="e.g. SDN-5A8F-9C1D"
            value=${inputCode}
            onInput=${(e) => setInputCode(e.target.value.toUpperCase())}
          />
          <button onClick=${handleLinkDevice} disabled=${isSyncing} type="button">
            Link Device
          </button>
        </div>
      </div>

      <!-- Manual Sync Trigger -->
      <div class="sync-trigger-section">
        <button
          class="sync-now-btn ${isSyncing ? 'syncing' : ''}"
          onClick=${runTriggerSync}
          disabled=${isSyncing}
          type="button"
        >
          ${isSyncing ? 'Synchronizing...' : 'Synchronize Now'}
        </button>
        
        ${status && html`
          <div class="sync-status-box">${status}</div>
        `}
      </div>

      <!-- Advanced: Custom Firebase DB credentials -->
      <div class="advanced-section">
        <button
          class="advanced-toggle"
          onClick=${() => setIsCustomOpen(!isCustomOpen)}
          type="button"
        >
          ${isCustomOpen ? '▼ Hide Advanced Database Setup' : '▶ Advanced: Private Database Connection'}
        </button>

        ${isCustomOpen && html`
          <div class="advanced-content">
            <p>By default, your data is synced securely using a shared cloud Firestore sandbox. If you want absolute data ownership, you can host your own private Firebase database and paste your Web App config JSON below:</p>
            <textarea
              placeholder='{\n  "apiKey": "YOUR_API_KEY",\n  "projectId": "YOUR_PROJECT_ID",\n  "appId": "YOUR_APP_ID"\n}'
              value=${customFirebase}
              onInput=${(e) => setCustomFirebase(e.target.value)}
              rows="6"
            ></textarea>
            <div class="btn-wrap">
              <button class="save-custom-btn" onClick=${handleSaveCustomFirebase} type="button">
                Save & Apply Config
              </button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}
