// Dynamic Firebase Imports to prevent script blocks / adblocker crashes
let firebaseAppModule = null;
let firebaseFirestoreModule = null;

let db = null;
let currentSyncCode = null;

// Default Shared Firestore Sandbox Database
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBw-7JbK06sC8gNfF5aD3u9h1vXwY_Z1pA", 
  authDomain: "sadhana-sync-sandbox.firebaseapp.com",
  projectId: "sadhana-sync-sandbox",
  storageBucket: "sadhana-sync-sandbox.appspot.com",
  messagingSenderId: "385720194827",
  appId: "1:385720194827:web:2f0367a84bf1d82046bc5e"
};

// Initialize the Sync code and Database connection
export async function initSyncEngine() {
  // 1. Get or create a random Sync Code (e.g. SDN-5A8F-9C1D)
  let code = localStorage.getItem('sadhana:sync_code');
  if (!code) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randPart = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    code = `SDN-${randPart()}-${randPart()}`;
    localStorage.setItem('sadhana:sync_code', code);
  }
  currentSyncCode = code;

  if (db) return db;

  // 2. Load custom config if user provided one
  let config = DEFAULT_FIREBASE_CONFIG;
  const customConfigRaw = localStorage.getItem('sadhana:custom_firebase');
  if (customConfigRaw) {
    try {
      config = JSON.parse(customConfigRaw);
    } catch(e) {
      console.error('Invalid custom firebase configuration, falling back to default', e);
    }
  }

  // 3. Dynamic import of Firebase SDKs
  try {
    firebaseAppModule = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    firebaseFirestoreModule = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    
    const app = firebaseAppModule.initializeApp(config, 'sadhanaSyncApp');
    db = firebaseFirestoreModule.getFirestore(app);
    console.log('Firebase Sync Engine initialized via dynamic imports. Code:', currentSyncCode);
    return db;
  } catch(e) {
    console.warn('Failed to dynamically load or initialize Firebase. App will operate in offline LocalStorage mode.', e);
    return null;
  }
}

export function getSyncCode() {
  if (!currentSyncCode) {
    // Generate code synchronously so we can return it instantly
    let code = localStorage.getItem('sadhana:sync_code');
    if (!code) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const randPart = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      code = `SDN-${randPart()}-${randPart()}`;
      localStorage.setItem('sadhana:sync_code', code);
    }
    currentSyncCode = code;
  }
  return currentSyncCode;
}

export function setSyncCode(code) {
  if (code && code.trim().length > 4) {
    localStorage.setItem('sadhana:sync_code', code.trim().toUpperCase());
    currentSyncCode = code.trim().toUpperCase();
    return true;
  }
  return false;
}

function addToOutbox(dateKey, data) {
  try {
    const outbox = JSON.parse(localStorage.getItem('sadhana:outbox') || '{}');
    outbox[dateKey] = data;
    localStorage.setItem('sadhana:outbox', JSON.stringify(outbox));
  } catch(e) {
    console.error('Failed to update outbox cache', e);
  }
}

export async function uploadDayToCloud(dateKey, data) {
  const activeDb = db || await initSyncEngine();
  if (!activeDb || !firebaseFirestoreModule) {
    // Save to local outbox queue to sync later when online/available
    addToOutbox(dateKey, { ...data, lastModified: data.lastModified || Date.now() });
    return false;
  }

  const { doc, setDoc } = firebaseFirestoreModule;
  const enrichedData = {
    ...data,
    lastModified: data.lastModified || Date.now()
  };

  try {
    const docRef = doc(activeDb, 'sadhana_users', currentSyncCode, 'days', dateKey);
    await setDoc(docRef, enrichedData);
    
    // Remove from outbox if successful
    const outbox = JSON.parse(localStorage.getItem('sadhana:outbox') || '{}');
    if (outbox[dateKey]) {
      delete outbox[dateKey];
      localStorage.setItem('sadhana:outbox', JSON.stringify(outbox));
    }
    return true;
  } catch(e) {
    console.warn('Sync upload offline. Queueing update to outbox.', e);
    addToOutbox(dateKey, enrichedData);
    return false;
  }
}

export async function syncAllDaysWithCloud(onStatusUpdate = () => {}) {
  const activeDb = db || await initSyncEngine();
  if (!activeDb || !firebaseFirestoreModule) {
    onStatusUpdate('Sync failed: Firebase modules unreachable (adblocker or offline).');
    return false;
  }

  const { doc, setDoc, getDocs, collection } = firebaseFirestoreModule;
  onStatusUpdate('Connecting to sync repository...');
  
  try {
    // 1. Push pending outbox items
    const outbox = JSON.parse(localStorage.getItem('sadhana:outbox') || '{}');
    const outboxKeys = Object.keys(outbox);
    if (outboxKeys.length > 0) {
      onStatusUpdate(`Uploading ${outboxKeys.length} pending local changes...`);
      for (const key of outboxKeys) {
        await uploadDayToCloud(key, outbox[key]);
      }
    }

    // 2. Fetch all days from Firestore
    onStatusUpdate('Downloading cloud records...');
    const colRef = collection(activeDb, 'sadhana_users', currentSyncCode, 'days');
    const querySnapshot = await getDocs(colRef);
    
    const cloudRecords = {};
    querySnapshot.forEach((docSnap) => {
      cloudRecords[docSnap.id] = docSnap.data();
    });

    onStatusUpdate('Merging histories...');
    let localChangedCount = 0;
    let cloudChangedCount = 0;

    // 3. Merge Loop
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey.startsWith('sadhana:20')) {
        const dateKey = storageKey.replace('sadhana:', '');
        const localData = JSON.parse(localStorage.getItem(storageKey));
        const cloudData = cloudRecords[dateKey];

        const localTime = localData.lastModified || 0;
        
        if (!cloudData) {
          await uploadDayToCloud(dateKey, localData);
          cloudChangedCount++;
        } else {
          const cloudTime = cloudData.lastModified || 0;
          if (localTime > cloudTime) {
            await uploadDayToCloud(dateKey, localData);
            cloudChangedCount++;
          } else if (cloudTime > localTime) {
            localStorage.setItem(storageKey, JSON.stringify(cloudData));
            localChangedCount++;
          }
          delete cloudRecords[dateKey];
        }
      }
    }

    // Download any remaining cloud records
    const remainingCloudKeys = Object.keys(cloudRecords);
    for (const dateKey of remainingCloudKeys) {
      localStorage.setItem(`sadhana:${dateKey}`, JSON.stringify(cloudRecords[dateKey]));
      localChangedCount++;
    }

    onStatusUpdate(`Sync Complete! Local: ${localChangedCount} updated. Cloud: ${cloudChangedCount} updated.`);
    return true;

  } catch(e) {
    console.error('Failed to sync with cloud database', e);
    onStatusUpdate(`Sync failed: offline or database unreachable.`);
    return false;
  }
}
