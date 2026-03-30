import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InvoiceStatusBadgeProps {
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  className?: string;
}

const InvoiceStatusBadge = ({ status, className }: InvoiceStatusBadgeProps) => {
  const statusConfig = {
    draft: {
      label: 'Draft',
      className: 'bg-muted text-muted-foreground hover:bg-muted',
    },
    pending: {
      label: 'Pending',
      className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
    },
    paid: {
      label: 'Paid',
      className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    },
    overdue: {
      label: 'Overdue',
      className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-muted text-muted-foreground hover:bg-muted',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};

export default InvoiceStatusBadge;
