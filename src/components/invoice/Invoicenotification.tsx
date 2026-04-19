/**
 * InvoiceNotification
 *
 * Shows a popup when the logged-in user has invoices sent to their email
 * that they haven't seen yet. Shown once per session on login.
 *
 * Place this in: src/components/invoice/InvoiceNotification.tsx
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getAllInvoices, Invoice } from '@/services/mongoService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight } from 'lucide-react';

const SESSION_KEY = 'invoice_notification_shown';

const InvoiceNotification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [receivedInvoices, setReceivedInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!user) return;

    // Only show once per session
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) return;

    const checkInvoices = async () => {
      try {
        // Get ALL invoices and filter where receiver email matches logged in user
        const all = await getAllInvoices();
        const mine = all.filter(
          (inv) => inv.receiver.email.toLowerCase() === user.email.toLowerCase()
        );

        if (mine.length > 0) {
          setReceivedInvoices(mine);
          setOpen(true);
          sessionStorage.setItem(SESSION_KEY, 'true');
        }
      } catch (err) {
        console.warn('[InvoiceNotification] Failed to check invoices:', err);
      }
    };

    checkInvoices();
  }, [user]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const handleViewAll = () => {
    setOpen(false);
    navigate('/invoices');
  };

  const handleViewInvoice = (id: string) => {
    setOpen(false);
    navigate(`/invoices/${id}`);
  };

  if (receivedInvoices.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            You have {receivedInvoices.length} invoice{receivedInvoices.length > 1 ? 's' : ''} waiting
          </DialogTitle>
          <DialogDescription>
            The following invoices have been sent to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {receivedInvoices.map((invoice) => (
            <button
              key={invoice.id}
              onClick={() => handleViewInvoice(invoice.id)}
              className="w-full text-left rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{invoice.invoiceNumber}</span>
                    <Badge
                      variant="outline"
                      className={
                        invoice.status === 'paid'
                          ? 'text-green-600 border-green-300'
                          : invoice.status === 'overdue'
                          ? 'text-red-600 border-red-300'
                          : 'text-yellow-600 border-yellow-300'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">From: {invoice.sender.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(invoice.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
          <Button onClick={handleViewAll} className="gap-1">
            View All Invoices
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceNotification;