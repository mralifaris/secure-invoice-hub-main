/**
 * Sync Service
 *
 * Automatically syncs offline IndexedDB data to Firestore
 * when the internet connection is restored.
 *
 * Handles:
 * - Invoice sync (create / update / delete)
 * - Transaction history sync
 * - Activity log sync
 * - Real-time online/offline detection
 */

import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  db as offlineDB,
  getSyncQueue,
  clearSyncQueueItem,
  getUnsyncedInvoices,
  getAllTransactions,
  getAllLogs,
  type SyncQueueItem,
} from './offlinedb';

const firestore = getFirestore();
const auth = getAuth();

let isSyncing = false;

// ─── Main Sync Function ───────────────────────────────────────────────────────

export const syncToFirestore = async (): Promise<{ synced: number; failed: number }> => {
  if (isSyncing || !navigator.onLine) return { synced: 0, failed: 0 };
  if (!auth.currentUser) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    // 1. Process sync queue (generic operations)
    const queue = await getSyncQueue();
    for (const item of queue) {
      try {
        await processSyncQueueItem(item);
        await clearSyncQueueItem(item.id!);
        synced++;
      } catch {
        failed++;
      }
    }

    // 2. Sync unsynced invoices
    const unsyncedInvoices = await getUnsyncedInvoices();
    for (const invoice of unsyncedInvoices) {
      try {
        await setDoc(doc(firestore, 'invoices', invoice.id), {
          ...invoice,
          synced: true,
          syncedAt: serverTimestamp(),
        });
        await offlineDB.invoices.update(invoice.id, { synced: true });
        synced++;
      } catch {
        failed++;
      }
    }

    // 3. Sync unsynced transactions
    const allTx = await getAllTransactions();
    const unsyncedTx = allTx.filter((t) => !t.synced);
    for (const tx of unsyncedTx) {
      try {
        const ref = doc(collection(firestore, 'transactions'));
        await setDoc(ref, {
          ...tx,
          synced: true,
          timestamp: serverTimestamp(),
        });
        await offlineDB.transactions.update(tx.id!, { synced: true });
        synced++;
      } catch {
        failed++;
      }
    }

    // 4. Sync unsynced logs
    const allLogs = await getAllLogs();
    const unsyncedLogs = allLogs.filter((l) => !l.synced);
    for (const log of unsyncedLogs) {
      try {
        const ref = doc(collection(firestore, 'logs'));
        await setDoc(ref, {
          ...log,
          synced: true,
          timestamp: serverTimestamp(),
        });
        await offlineDB.logs.update(log.id!, { synced: true });
        synced++;
      } catch {
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  console.log(`[SyncService] Synced: ${synced}, Failed: ${failed}`);
  return { synced, failed };
};

// ─── Process individual sync queue item ──────────────────────────────────────

const processSyncQueueItem = async (item: SyncQueueItem): Promise<void> => {
  const ref = doc(firestore, item.collection, item.docId);

  switch (item.operation) {
    case 'create':
    case 'update':
      await setDoc(ref, { ...item.data, updatedAt: serverTimestamp() }, { merge: true });
      break;
    case 'delete':
      await deleteDoc(ref);
      break;
  }
};

// ─── Auto-sync on reconnect ───────────────────────────────────────────────────

let syncListener: (() => void) | null = null;

export const startSyncListener = (): void => {
  if (syncListener) return; // already listening

  const handler = async () => {
    if (navigator.onLine) {
      console.log('[SyncService] Back online — starting sync...');
      const result = await syncToFirestore();
      console.log(`[SyncService] Auto-sync complete:`, result);

      // Dispatch custom event so UI can react
      window.dispatchEvent(
        new CustomEvent('sync-complete', { detail: result })
      );
    }
  };

  window.addEventListener('online', handler);

  syncListener = () => {
    window.removeEventListener('online', handler);
    syncListener = null;
  };

  console.log('[SyncService] Sync listener started');
};

export const stopSyncListener = (): void => {
  syncListener?.();
};

// ─── Manual trigger (for UI button) ──────────────────────────────────────────

export const manualSync = async (): Promise<{ synced: number; failed: number }> => {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 };
  }
  return syncToFirestore();
};

// ─── Sync Status Hook helper ──────────────────────────────────────────────────

export const getSyncStatus = async (): Promise<{
  isOnline: boolean;
  pendingInvoices: number;
  pendingLogs: number;
  pendingTransactions: number;
}> => {
  const [invoices, transactions, logs] = await Promise.all([
    getUnsyncedInvoices(),
    getAllTransactions(),
    getAllLogs(),
  ]);

  return {
    isOnline: navigator.onLine,
    pendingInvoices: invoices.length,
    pendingTransactions: transactions.filter((t) => !t.synced).length,
    pendingLogs: logs.filter((l) => !l.synced).length,
  };
};