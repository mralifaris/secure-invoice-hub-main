/**
 * AI Service (SIMULATED)
 * 
 * This service simulates AI/ML functionality for invoice analysis.
 * In a real implementation, this would connect to ML models or AI APIs.
 * 
 * Features:
 * - Fraud detection
 * - Duplicate invoice detection
 * - Risk scoring
 * - Anomaly detection
 */

import { Invoice } from './mongoService';

export interface AIAnalysisResult {
  fraudRisk: 'Low' | 'Medium' | 'High';
  confidence: number;
  reason: string;
  flags: string[];
  recommendations: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarInvoices: Array<{
    invoiceId: string;
    similarity: number;
    reason: string;
  }>;
}

export interface AnomalyReport {
  hasAnomalies: boolean;
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  overallScore: number;
}

/**
 * Simulated risk factors for fraud detection
 */
const riskFactors = {
  newSender: { weight: 15, message: 'First-time sender detected' },
  highAmount: { weight: 20, message: 'Transaction amount above average' },
  unusualItems: { weight: 10, message: 'Unusual item quantities or pricing' },
  rushPayment: { weight: 25, message: 'Short payment deadline detected' },
  inconsistentData: { weight: 30, message: 'Inconsistent sender/receiver data' },
};

/**
 * Analyze invoice for fraud risk
 * @param invoiceData - Invoice data to analyze
 * @returns AI analysis result
 */
export const analyzeInvoice = (invoiceData: {
  sender: { name: string; email: string };
  receiver: { name: string; email: string };
  total: number;
  items: Array<{ quantity: number; unitPrice: number }>;
  dueDate?: string;
  invoiceNumber?: string;
  existingInvoices?: Invoice[];
}): AIAnalysisResult => {
  const flags: string[] = [];
  let riskScore = 0;

  // Check for high amount (>$20,000)
  if (invoiceData.total > 20000) {
    riskScore += riskFactors.highAmount.weight;
    flags.push(riskFactors.highAmount.message);
  }

  // Check for unusual quantities
  const hasUnusualQuantity = invoiceData.items.some(
    (item) => item.quantity > 100 || item.unitPrice > 10000
  );
  if (hasUnusualQuantity) {
    riskScore += riskFactors.unusualItems.weight;
    flags.push(riskFactors.unusualItems.message);
  }

  // Check due date (if less than 3 days)
  if (invoiceData.dueDate) {
    const daysUntilDue = Math.ceil(
      (new Date(invoiceData.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue < 3 && daysUntilDue >= 0) {
      riskScore += riskFactors.rushPayment.weight;
      flags.push(riskFactors.rushPayment.message);
    }
  }

  // Check for new sender
  if (invoiceData.existingInvoices) {
    const senderExists = invoiceData.existingInvoices.some(
      (inv) => inv.sender.email === invoiceData.sender.email
    );
    if (!senderExists) {
      riskScore += riskFactors.newSender.weight;
      flags.push(riskFactors.newSender.message);
    }
  }

  // Determine risk level
  let fraudRisk: AIAnalysisResult['fraudRisk'] = 'Low';
  if (riskScore >= 40) {
    fraudRisk = 'High';
  } else if (riskScore >= 20) {
    fraudRisk = 'Medium';
  }

  // Calculate confidence (inverse of risk variability)
  const confidence = Math.max(70, 100 - riskScore);

  // Generate reason based on analysis
  let reason = 'Invoice pattern matches standard business transactions';
  if (fraudRisk === 'High') {
    reason = 'Multiple risk factors detected. Manual review recommended.';
  } else if (fraudRisk === 'Medium') {
    reason = 'Some unusual patterns detected. Verify sender authenticity.';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (fraudRisk !== 'Low') {
    recommendations.push('Verify sender identity through secondary channel');
    if (invoiceData.total > 10000) {
      recommendations.push('Request additional documentation for high-value transaction');
    }
  }
  recommendations.push('Store blockchain hash for future verification');

  return {
    fraudRisk,
    confidence,
    reason,
    flags,
    recommendations,
  };
};

/**
 * Check for duplicate invoices
 * @param invoiceData - Invoice to check
 * @param existingInvoices - Existing invoices to compare against
 * @returns Duplicate check result
 */
export const checkForDuplicates = async (
  invoiceData: {
    sender: { email: string };
    receiver: { email: string };
    total: number;
  },
  existingInvoices: Invoice[]
): Promise<DuplicateCheckResult> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const similarInvoices: DuplicateCheckResult['similarInvoices'] = [];

  existingInvoices.forEach((invoice) => {
    let similarity = 0;
    const reasons: string[] = [];

    // Check sender match
    if (invoice.sender.email === invoiceData.sender.email) {
      similarity += 30;
      reasons.push('Same sender');
    }

    // Check receiver match
    if (invoice.receiver.email === invoiceData.receiver.email) {
      similarity += 30;
      reasons.push('Same receiver');
    }

    // Check amount similarity (within 5%)
    const amountDiff = Math.abs(invoice.total - invoiceData.total) / invoice.total;
    if (amountDiff < 0.05) {
      similarity += 40;
      reasons.push('Similar amount');
    }

    if (similarity >= 60) {
      similarInvoices.push({
        invoiceId: invoice.invoiceNumber,
        similarity,
        reason: reasons.join(', '),
      });
    }
  });

  return {
    isDuplicate: similarInvoices.some((s) => s.similarity >= 90),
    similarInvoices,
  };
};

/**
 * Detect anomalies in invoice data
 * @param invoice - Invoice to analyze
 * @returns Anomaly report
 */
export const detectAnomalies = async (invoice: Invoice): Promise<AnomalyReport> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const anomalies: AnomalyReport['anomalies'] = [];

  // Check for weekend due date
  const dueDate = new Date(invoice.dueDate);
  if (dueDate.getDay() === 0 || dueDate.getDay() === 6) {
    anomalies.push({
      type: 'Unusual Due Date',
      severity: 'low',
      description: 'Due date falls on a weekend',
    });
  }

  // Check for very high tax rate
  const taxRate = (invoice.tax / invoice.subtotal) * 100;
  if (taxRate > 25) {
    anomalies.push({
      type: 'High Tax Rate',
      severity: 'medium',
      description: `Tax rate of ${taxRate.toFixed(1)}% is above typical threshold`,
    });
  }

  // Check for round number totals (potential red flag)
  if (invoice.total % 1000 === 0 && invoice.total > 5000) {
    anomalies.push({
      type: 'Round Number Total',
      severity: 'low',
      description: 'Exact round number totals are statistically uncommon',
    });
  }

  // Check for single item invoices with high value
  if (invoice.items.length === 1 && invoice.total > 10000) {
    anomalies.push({
      type: 'Single High-Value Item',
      severity: 'medium',
      description: 'Single-item invoices with high values require verification',
    });
  }

  const overallScore = Math.max(
    0,
    100 - anomalies.reduce((sum, a) => sum + (a.severity === 'high' ? 30 : a.severity === 'medium' ? 15 : 5), 0)
  );

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
    overallScore,
  };
};

/**
 * Get AI service status (simulated)
 */
export const getAIServiceStatus = async (): Promise<{
  status: 'online' | 'offline' | 'degraded';
  modelVersion: string;
  lastUpdated: string;
  accuracy: number;
}> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    status: 'online',
    modelVersion: 'FraudNet-v2.1.0',
    lastUpdated: '2024-01-15T00:00:00Z',
    accuracy: 94.7,
  };
};
