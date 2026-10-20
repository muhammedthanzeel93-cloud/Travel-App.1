/**
 * 4-Hour Offline Vault Manager using Browser IndexedDB
 * Caches boarding passes, railway tickets, routes, and itineraries for offline access.
 */

const DB_NAME = 'TravelPlatformOfflineVault';
const DB_VERSION = 1;
const STORE_TICKETS = 'offline_tickets';
const STORE_ITINERARIES = 'offline_itineraries';
const STORE_MUTATIONS = 'pending_sync_queue';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported or running server-side'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_TICKETS)) {
        db.createObjectStore(STORE_TICKETS, { keyPath: 'pnr' });
      }
      if (!db.objectStoreNames.contains(STORE_ITINERARIES)) {
        db.createObjectStore(STORE_ITINERARIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class OfflineVaultStorage {
  /**
   * Save ticket into the 4-Hour Offline Vault
   */
  public static async saveTicket(ticket: any): Promise<void> {
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_TICKETS, 'readwrite');
      const store = tx.objectStore(STORE_TICKETS);
      store.put({
        ...ticket,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      });
      return new Promise((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    } catch (err) {
      console.warn('[OFFLINE VAULT] IndexedDB save error:', err);
    }
  }

  /**
   * Retrieve all cached offline tickets
   */
  public static async getAllTickets(): Promise<any[]> {
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_TICKETS, 'readonly');
      const store = tx.objectStore(STORE_TICKETS);
      const req = store.getAll();

      return new Promise((res, rej) => {
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
    } catch (err) {
      console.warn('[OFFLINE VAULT] IndexedDB get error:', err);
      return [];
    }
  }

  /**
   * Enqueue mutation when offline for background synchronization
   */
  public static async queueOfflineMutation(action: string, payload: any): Promise<void> {
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);
      store.add({ action, payload, createdAt: new Date().toISOString() });
    } catch (err) {
      console.warn('[OFFLINE VAULT] Sync enqueue error:', err);
    }
  }
}
