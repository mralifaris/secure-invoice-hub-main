/**
 * Invoice Data Service
 *
 * MONGODB ONLY — all calls go to Express API (localhost:3001)
 * which connects to MongoDB at localhost:27017
 */

import { generateBlockchainHash } from './blockchainService';
import { analyzeInvoice } from './aiService';

const MONGO_API = 'http://localhost:3001/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  sender: { name: string; email: string; address: string };
  receiver: { name: string; email: string; address: string };
  items: InvoiceItem[];
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
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

const apiGet = async (path: string): Promise<any> => {
  const res = await fetch(`${MONGO_API}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.statusText}`);
  return res.json();
};

const apiPost = async (path: string, data: any): Promise<any> => {
  const res = await fetch(`${MONGO_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.statusText}`);
  return res.json();
};

const apiPatch = async (path: string, data: any): Promise<any> => {
  const res = await fetch(`${MONGO_API}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.statusText}`);
  return res.json();
};

const apiDelete = async (path: string): Promise<any> => {
  const res = await fetch(`${MONGO_API}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.statusText}`);
  return res.json();
};

// ─── GET ALL INVOICES ─────────────────────────────────────────────────────────
// Fetches invoices where user is sender (userId) OR receiver (receiverEmail)
// Admin: no filters → sees all

export const getAllInvoices = async (
  userId?: string,
  receiverEmail?: string
): Promise<Invoice[]> => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (receiverEmail) params.append('receiverEmail', receiverEmail);
  const query = params.toString();
  return apiGet(`/invoices${query ? `?${query}` : ''}`);
};

// ─── GET INVOICE BY ID ────────────────────────────────────────────────────────

export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    return await apiGet(`/invoices/${id}`);
  } catch {
    return null;
  }
};

// ─── GET INVOICE STATS ────────────────────────────────────────────────────────

export const getInvoiceStats = async (
  userId?: string,
  receiverEmail?: string
): Promise<{
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalRevenue: number;
  pendingRevenue: number;
}> => {
  try {
    const invoices = await getAllInvoices(userId, receiverEmail);
    return {
      total: invoices.length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      pending: invoices.filter((i) => i.status === 'pending').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      totalRevenue: invoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.total, 0),
      pendingRevenue: invoices
        .filter((i) => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.total, 0),
    };
  } catch {
    return { total: 0, paid: 0, pending: 0, overdue: 0, totalRevenue: 0, pendingRevenue: 0 };
  }
};

// ─── CREATE INVOICE ───────────────────────────────────────────────────────────

export const createInvoice = async (
  invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'blockchainHash' | 'aiAnalysis'>,
  userId: string
): Promise<Invoice> => {
  const all = await getAllInvoices();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`;

  const blockchainHash = generateBlockchainHash({
    invoiceNumber,
    sender: invoiceData.sender,
    receiver: invoiceData.receiver,
    total: invoiceData.total,
    timestamp: new Date().toISOString(),
  });

  const aiAnalysis = analyzeInvoice({
    ...invoiceData,
    invoiceNumber,
    existingInvoices: all,
  });

  const now = new Date().toISOString();
  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv_${Date.now()}`,
    invoiceNumber,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    blockchainHash,
    aiAnalysis,
  };

  return apiPost('/invoices', newInvoice);
};

// ─── UPDATE INVOICE STATUS ────────────────────────────────────────────────────

export const updateInvoiceStatus = async (
  id: string,
  status: Invoice['status'],
  userId?: string
): Promise<Invoice | null> => {
  try {
    return await apiPatch(`/invoices/${id}/status`, { status, userId });
  } catch {
    return null;
  }
};

// ─── DELETE INVOICE ───────────────────────────────────────────────────────────

export const deleteInvoice = async (id: string, userId?: string): Promise<boolean> => {
  try {
    const path = userId ? `/invoices/${id}?userId=${userId}` : `/invoices/${id}`;
    await apiDelete(path);
    return true;
  } catch {
    return false;
  }
};