/**
 * Offline Database Service — Dexie.js (IndexedDB)
 *
 * Tables:
 * - users          → user profiles + roles
 * - invoices       → full invoice data
 * - transactions   → transaction records linked to invoices
 * - logs           → activity/event logs
 * - syncQueue      → pending items to sync when back online
 *
 * Install: npm install dexie
 */

import Dexie, { type Table } from 'dexie';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OfflineUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'business' | 'user';
  createdAt: string;
}

export interface OfflineInvoice {
  id: string;
  invoiceNumber: string;
  sender: { name: string; email: string; address: string };
  receiver: { name: string; email: string; address: string };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  blockchainHash: string;
  aiAnalysis: {
    fraudRisk: 'Low' | 'Medium' | 'High';
    confidence: number;
    reason: string;
  };
  synced?: boolean; // false = pending sync to Firestore
}

export interface OfflineTransaction {
  id?: number; // auto-increment
  invoiceId: string;
  userId: string;
  type: 'created' | 'updated' | 'status_change' | 'deleted' | 'payment';
  amount?: number;
  previousStatus?: string;
  newStatus?: string;
  note?: string;
  timestamp: string;
  synced?: boolean;
}

export interface OfflineLog {
  id?: number; // auto-increment
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  synced?: boolean;
}

export interface SyncQueueItem {
  id?: number;
  collection: 'users' | 'invoices' | 'transactions' | 'logs';
  operation: 'create' | 'update' | 'delete';
  docId: string;
  data: any;
  createdAt: string;
}

// ─── Dexie DB Class ──────────────────────────────────────────────────────────

class InvoiceHubDB extends Dexie {
  users!: Table<OfflineUser, string>;        // keyed by uid
  invoices!: Table<OfflineInvoice, string>;  // keyed by id
  transactions!: Table<OfflineTransaction, number>; // auto-increment
  logs!: Table<OfflineLog, number>;          // auto-increment
  syncQueue!: Table<SyncQueueItem, number>;  // auto-increment

  constructor() {
    super('InvoiceHubDB');

    this.version(1).stores({
      users: 'uid, email, role, createdAt',
      invoices: 'id, invoiceNumber, createdBy, status, createdAt, synced',
      transactions: '++id, invoiceId, userId, type, timestamp, synced',
      logs: '++id, userId, action, timestamp, synced',
      syncQueue: '++id, collection, operation, docId, createdAt',
    });
  }
}

export const db = new InvoiceHubDB();

// ─── User Operations ─────────────────────────────────────────────────────────

export const saveUserOffline = async (user: OfflineUser): Promise<void> => {
  await db.users.put(user);
};

export const getUserOffline = async (uid: string): Promise<OfflineUser | undefined> => {
  return db.users.get(uid);
};

export const getAllUsersOffline = async (): Promise<OfflineUser[]> => {
  return db.users.toArray();
};

// ─── Invoice Operations ──────────────────────────────────────────────────────

export const saveInvoiceOffline = async (invoice: OfflineInvoice): Promise<void> => {
  await db.invoices.put({ ...invoice, synced: false });
};

export const getInvoiceOffline = async (id: string): Promise<OfflineInvoice | undefined> => {
  return db.invoices.get(id);
};

export const getAllInvoicesOffline = async (userId?: string): Promise<OfflineInvoice[]> => {
  if (userId) {
    return db.invoices.where('createdBy').equals(userId).toArray();
  }
  return db.invoices.toArray();
};

export const updateInvoiceOffline = async (
  id: string,
  changes: Partial<OfflineInvoice>
): Promise<void> => {
  await db.invoices.update(id, { ...changes, synced: false });
};

export const deleteInvoiceOffline = async (id: string): Promise<void> => {
  await db.invoices.delete(id);
};

export const getUnsyncedInvoices = async (): Promise<OfflineInvoice[]> => {
  return db.invoices.where('synced').equals(0).toArray(); // Dexie stores false as 0
};

// ─── Transaction History ─────────────────────────────────────────────────────

export const addTransaction = async (
  tx: Omit<OfflineTransaction, 'id'>
): Promise<number> => {
  return db.transactions.add({ ...tx, synced: false });
};

export const getTransactionsByInvoice = async (
  invoiceId: string
): Promise<OfflineTransaction[]> => {
  return db.transactions.where('invoiceId').equals(invoiceId).toArray();
};

export const getTransactionsByUser = async (
  userId: string
): Promise<OfflineTransaction[]> => {
  return db.transactions.where('userId').equals(userId).toArray();
};

export const getAllTransactions = async (): Promise<OfflineTransaction[]> => {
  return db.transactions.orderBy('timestamp').reverse().toArray();
};

// ─── Activity Logs ───────────────────────────────────────────────────────────

export const addLog = async (log: Omit<OfflineLog, 'id'>): Promise<number> => {
  return db.logs.add({ ...log, synced: false });
};

export const getLogsByUser = async (userId: string): Promise<OfflineLog[]> => {
  return db.logs.where('userId').equals(userId).reverse().toArray();
};

export const getAllLogs = async (): Promise<OfflineLog[]> => {
  return db.logs.orderBy('timestamp').reverse().toArray();
};

// ─── Sync Queue ───────────────────────────────────────────────────────────────

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id'>): Promise<void> => {
  await db.syncQueue.add(item);
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  return db.syncQueue.toArray();
};

export const clearSyncQueueItem = async (id: number): Promise<void> => {
  await db.syncQueue.delete(id);
};

// ─── DB Stats (for admin dashboard) ─────────────────────────────────────────

export const getDBStats = async () => {
  const [users, invoices, transactions, logs, pending] = await Promise.all([
    db.users.count(),
    db.invoices.count(),
    db.transactions.count(),
    db.logs.count(),
    db.syncQueue.count(),
  ]);
  return { users, invoices, transactions, logs, pendingSyncItems: pending };
};

export default db;