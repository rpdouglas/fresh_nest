// Simple native IndexedDB wrapper for queueing photo uploads when offline
export interface QueuedPhoto {
  id: string; // unique identifier (UUID)
  jobId: string;
  taskId: string;
  blob: Blob;
  capturedAt: string; // ISO string
  geoLat: number | null;
  geoLng: number | null;
  geoTagged: boolean;
  staffId: string;
}

const DB_NAME = 'freshnest_fsm_offline';
const STORE_NAME = 'photo_uploads';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB open error'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addQueuedPhoto(photo: QueuedPhoto): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(photo);
    tx.oncomplete = () => resolve();
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB add error'));
  });
}

export async function getQueuedPhotos(): Promise<QueuedPhoto[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB getAll error'));
  });
}

export async function deleteQueuedPhoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    tx.oncomplete = () => resolve();
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB delete error'));
  });
}

