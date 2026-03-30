/**
 * MongoDB Service (SIMULATED)
 * 
 * This service simulates MongoDB database operations for invoice management.
 * In a real implementation, this would connect to a MongoDB backend.
 * 
 * Features:
 * - CRUD operations for invoices
 * - Query and filtering
 * - Data persistence via localStorage
 */

import { generateBlockchainHash } from './blockchainService';
import { analyzeInvoice } from './aiService';

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
  sender: {
    name: string;
    email: string;
    address: string;
  };
  receiver: {
    name: string;
    email: string;
    address: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Firebase user ID
  blockchainHash: string;
  aiAnalysis: {
    fraudRisk: 'Low' | 'Medium' | 'High';
    confidence: number;
    reason: string;
  };
}

const INVOICES_KEY = 'mongo_invoices';

// Initialize with dummy invoices
const initializeInvoices = (): void => {
  const existing = localStorage.getItem(INVOICES_KEY);
  if (!existing) {
    const dummyInvoices: Invoice[] = [
      {
        id: 'inv_001',
        invoiceNumber: 'INV-2024-001',
        sender: {
          name: 'Tech Solutions Ltd',
          email: 'billing@techsolutions.com',
          address: '123 Business Park, London, UK',
        },
        receiver: {
          name: 'Global Corp Inc',
          email: 'accounts@globalcorp.com',
          address: '456 Corporate Ave, New York, USA',
        },
        items: [
          { id: 'item_1', description: 'Software Development Services', quantity: 40, unitPrice: 150, total: 6000 },
          { id: 'item_2', description: 'Cloud Infrastructure Setup', quantity: 1, unitPrice: 2500, total: 2500 },
        ],
        subtotal: 8500,
        tax: 1700,
        total: 10200,
        status: 'paid',
        dueDate: '2024-02-15',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-02-10T14:30:00Z',
        createdBy: 'user_123',
        blockchainHash: '0x7F3A9C2E1B5D4F8A6E2C1B9D3F7A5E8C2D4B6A9F1E3C5D7B9A2F4E6C8D1B3A5',
        aiAnalysis: { fraudRisk: 'Low', confidence: 95, reason: 'Invoice pattern matches previous records from this sender' },
      },
      {
        id: 'inv_002',
        invoiceNumber: 'INV-2024-002',
        sender: {
          name: 'Design Agency Pro',
          email: 'invoices@designpro.io',
          address: '789 Creative Street, San Francisco, USA',
        },
        receiver: {
          name: 'StartUp Ventures',
          email: 'finance@startupventures.com',
          address: '321 Innovation Hub, Austin, USA',
        },
        items: [
          { id: 'item_3', description: 'Brand Identity Package', quantity: 1, unitPrice: 5000, total: 5000 },
          { id: 'item_4', description: 'Website UI/UX Design', quantity: 1, unitPrice: 8000, total: 8000 },
          { id: 'item_5', description: 'Marketing Collateral', quantity: 1, unitPrice: 2000, total: 2000 },
        ],
        subtotal: 15000,
        tax: 1500,
        total: 16500,
        status: 'pending',
        dueDate: '2024-03-01',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-01T09:00:00Z',
        createdBy: 'user_123',
        blockchainHash: '0x2A4B6C8D0E2F4A6B8C0D2E4F6A8B0C2D4E6F8A0B2C4D6E8F0A2B4C6D8E0F2A4',
        aiAnalysis: { fraudRisk: 'Low', confidence: 92, reason: 'Standard service invoice with verified recipient' },
      },
      {
        id: 'inv_003',
        invoiceNumber: 'INV-2024-003',
        sender: {
          name: 'Quick Supplies Co',
          email: 'orders@quicksupplies.com',
          address: '555 Warehouse District, Chicago, USA',
        },
        receiver: {
          name: 'Retail Chain Ltd',
          email: 'purchasing@retailchain.co.uk',
          address: '888 High Street, Manchester, UK',
        },
        items: [
          { id: 'item_6', description: 'Office Supplies Bulk Order', quantity: 500, unitPrice: 25, total: 12500 },
        ],
        subtotal: 12500,
        tax: 2500,
        total: 15000,
        status: 'overdue',
        dueDate: '2024-01-30',
        createdAt: '2024-01-05T11:30:00Z',
        updatedAt: '2024-02-15T08:00:00Z',
        createdBy: 'user_456',
        blockchainHash: '0x9C1D3E5F7A9B1C3D5E7F9A1B3C5D7E9F1A3B5C7D9E1F3A5B7C9D1E3F5A7B9C1D',
        aiAnalysis: { fraudRisk: 'Medium', confidence: 78, reason: 'Unusual quantity for first-time transaction' },
      },
      {
        id: 'inv_004',
        invoiceNumber: 'INV-2024-004',
        sender: {
          name: 'Consulting Group International',
          email: 'billing@cgintl.com',
          address: '999 Financial District, Singapore',
        },
        receiver: {
          name: 'Manufacturing Excellence',
          email: 'ap@mfgexcellence.com',
          address: '111 Industrial Zone, Tokyo, Japan',
        },
        items: [
          { id: 'item_7', description: 'Strategic Consulting - Q1', quantity: 120, unitPrice: 200, total: 24000 },
          { id: 'item_8', description: 'Market Research Report', quantity: 1, unitPrice: 5000, total: 5000 },
        ],
        subtotal: 29000,
        tax: 2900,
        total: 31900,
        status: 'pending',
        dueDate: '2024-03-15',
        createdAt: '2024-02-20T15:00:00Z',
        updatedAt: '2024-02-20T15:00:00Z',
        createdBy: 'user_123',
        blockchainHash: '0x4E6F8A0B2C4D6E8F0A2B4C6D8E0F2A4B6C8D0E2F4A6B8C0D2E4F6A8B0C2D4E6',
        aiAnalysis: { fraudRisk: 'Low', confidence: 89, reason: 'Recurring client with established payment history' },
      },
    ];
    localStorage.setItem(INVOICES_KEY, JSON.stringify(dummyInvoices));
  }
};

// Get all invoices from storage
const getInvoicesFromStorage = (): Invoice[] => {
  initializeInvoices();
  const invoices = localStorage.getItem(INVOICES_KEY);
  return invoices ? JSON.parse(invoices) : [];
};

// Save invoices to storage
const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

/**
 * Get all invoices
 * @param userId - Optional filter by user ID
 * @returns Promise with array of invoices
 */
export const getAllInvoices = async (userId?: string): Promise<Invoice[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const invoices = getInvoicesFromStorage();
  if (userId) {
    return invoices.filter((inv) => inv.createdBy === userId);
  }
  return invoices;
};

/**
 * Get invoice by ID
 * @param id - Invoice ID
 * @returns Promise with invoice or null
 */
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const invoices = getInvoicesFromStorage();
  return invoices.find((inv) => inv.id === id || inv.invoiceNumber === id) || null;
};

/**
 * Create new invoice
 * @param invoiceData - Partial invoice data
 * @param userId - Creating user ID
 * @returns Promise with created invoice
 */
export const createInvoice = async (
  invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'blockchainHash' | 'aiAnalysis'>,
  userId: string
): Promise<Invoice> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const invoices = getInvoicesFromStorage();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
  
  // Generate blockchain hash for the invoice
  const blockchainHash = generateBlockchainHash({
    invoiceNumber,
    sender: invoiceData.sender,
    receiver: invoiceData.receiver,
    total: invoiceData.total,
    timestamp: new Date().toISOString(),
  });

  // Run AI analysis on the invoice
  const aiAnalysis = analyzeInvoice({
    ...invoiceData,
    invoiceNumber,
    existingInvoices: invoices,
  });

  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv_${Date.now()}`,
    invoiceNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
    blockchainHash,
    aiAnalysis,
  };

  invoices.push(newInvoice);
  saveInvoices(invoices);

  return newInvoice;
};

/**
 * Update invoice status
 * @param id - Invoice ID
 * @param status - New status
 * @returns Promise with updated invoice
 */
export const updateInvoiceStatus = async (
  id: string,
  status: Invoice['status']
): Promise<Invoice | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const invoices = getInvoicesFromStorage();
  const index = invoices.findIndex((inv) => inv.id === id);

  if (index === -1) return null;

  invoices[index] = {
    ...invoices[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  saveInvoices(invoices);
  return invoices[index];
};

/**
 * Delete invoice
 * @param id - Invoice ID
 * @returns Promise with success boolean
 */
export const deleteInvoice = async (id: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const invoices = getInvoicesFromStorage();
  const filteredInvoices = invoices.filter((inv) => inv.id !== id);

  if (filteredInvoices.length === invoices.length) return false;

  saveInvoices(filteredInvoices);
  return true;
};

/**
 * Get invoice statistics
 * @returns Promise with statistics object
 */
export const getInvoiceStats = async (): Promise<{
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalRevenue: number;
  pendingRevenue: number;
}> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const invoices = getInvoicesFromStorage();

  return {
    total: invoices.length,
    paid: invoices.filter((inv) => inv.status === 'paid').length,
    pending: invoices.filter((inv) => inv.status === 'pending').length,
    overdue: invoices.filter((inv) => inv.status === 'overdue').length,
    totalRevenue: invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingRevenue: invoices
      .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
  };
};

// Initialize invoices on module load
initializeInvoices();
