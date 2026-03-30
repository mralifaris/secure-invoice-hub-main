import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  risk: 'Low' | 'Medium' | 'High';
  showIcon?: boolean;
  className?: string;
}

const RiskBadge = ({ risk, showIcon = true, className }: RiskBadgeProps) => {
  const riskConfig = {
    Low: {
      label: 'Low Risk',
      icon: ShieldCheck,
      className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    },
    Medium: {
      label: 'Medium Risk',
      icon: Shield,
      className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
    },
    High: {
      label: 'High Risk',
      icon: ShieldAlert,
      className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    },
  };

  const config = riskConfig[risk];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1', config.className, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

export default RiskBadge;
