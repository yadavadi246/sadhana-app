// Firebase Firestore Client-side Sync Controller for ESM environment
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Default Shared Firestore Sandbox Database
// Users can override this under Settings with their own private Firebase app
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBw-7JbK06sC8gNfF5aD3u9h1vXwY_Z1pA", 
  authDomain: "sadhana-sync-sandbox.firebaseapp.com",
  projectId: "sadhana-sync-sandbox",
  storageBucket: "sadhana-sync-sandbox.appspot.com",
  messagingSenderId: "385720194827",
  appId: "1:385720194827:web:2f0367a84bf1d82046bc5e"
};

let db = null;
let currentSyncCode = null;

// Initialize the Sync code and Database connection
export function initSyncEngine() {
  // 1. Get or create a random Sync Code (e.g. SDN-5A8F-9C1D)
  let code = localStorage.getItem('sadhana:sync_code');
  if (!code) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    const randPart = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    code = `SDN-${randPart()}-${randPart()}`;
    localStorage.setItem('sadhana:sync_code', code);
  }
  currentSyncCode = code;

  // 2. Load custom config if user provided one, otherwise use default
  let config = DEFAULT_FIREBASE_CONFIG;
  const customConfigRaw = localStorage.getItem('sadhana:custom_firebase');
  if (customConfigRaw) {
    try {
      config = JSON.parse(customConfigRaw);
    } catch(e) {
      console.error('Invalid custom firebase configuration, falling back to default', e);
    }
  }

  // 3. Connect to Firebase
  try {
    const app = initializeApp(config, 'sadhanaSyncApp');
    db = getFirestore(app);
    console.log('Firebase Sync Engine initialized successfully. Code:', currentSyncCode);
  } catch(e) {
    console.error('Failed to initialize Firebase database connection', e);
  }
}

export function getSyncCode() {
  if (!currentSyncCode) {
    initSyncEngine();
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

// Write the local updates to the outbox queue
function addToOutbox(dateKey, data) {
  try {
    const outbox = JSON.parse(localStorage.getItem('sadhana:outbox') || '{}');
    outbox[dateKey] = data;
    localStorage.setItem('sadhana:outbox', JSON.stringify(outbox));
  } catch(e) {
    console.error('Failed to update outbox cache', e);
  }
}

// Push local update to Firestore
export async function uploadDayToCloud(dateKey, data) {
  if (!db) initSyncEngine();
  if (!db) return false;

  // Track modification timestamp for merge conflict resolution
  const enrichedData = {
    ...data,
    lastModified: data.lastModified || Date.now()
  };

  try {
    const docRef = doc(db, 'sadhana_users', currentSyncCode, 'days', dateKey);
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

// Retrieve all records in cloud and run Last-Write-Wins merge
export async function syncAllDaysWithCloud(onStatusUpdate = () => {}) {
  if (!db) initSyncEngine();
  if (!db) {
    onStatusUpdate('Database not initialized');
    return false;
  }

  onStatusUpdate('Connecting to sync repository...');
  
  try {
    // 1. First push any pending outbox items
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
    const colRef = collection(db, 'sadhana_users', currentSyncCode, 'days');
    const querySnapshot = await getDocs(colRef);
    
    const cloudRecords = {};
    querySnapshot.forEach((docSnap) => {
      cloudRecords[docSnap.id] = docSnap.data();
    });

    onStatusUpdate('Merging histories...');
    let localChangedCount = 0;
    let cloudChangedCount = 0;

    // 3. Merge Loop
    // Loop through all keys in localstorage
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey.startsWith('sadhana:20')) { // Filter sadhana date records
        const dateKey = storageKey.replace('sadhana:', '');
        const localData = JSON.parse(localStorage.getItem(storageKey));
        const cloudData = cloudRecords[dateKey];

        const localTime = localData.lastModified || 0;
        
        if (!cloudData) {
          // Exists locally but not in cloud -> Upload to cloud
          await uploadDayToCloud(dateKey, localData);
          cloudChangedCount++;
        } else {
          const cloudTime = cloudData.lastModified || 0;
          if (localTime > cloudTime) {
            // Local is newer -> Upload to cloud
            await uploadDayToCloud(dateKey, localData);
            cloudChangedCount++;
          } else if (cloudTime > localTime) {
            // Cloud is newer -> Update local storage
            localStorage.setItem(storageKey, JSON.stringify(cloudData));
            localChangedCount++;
          }
          // Remove from cloud list so we know what remains
          delete cloudRecords[dateKey];
        }
      }
    }

    // Any remaining cloud records that aren't in local storage -> Download them
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
