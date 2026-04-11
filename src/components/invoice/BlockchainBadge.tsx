import { Badge } from '@/components/ui/badge';
import { Blocks, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BlockchainBadgeProps {
  hash: string;
  verified?: boolean;
  showFull?: boolean;
  className?: string;
}

const BlockchainBadge = ({ hash, verified = true, showFull = false, className }: BlockchainBadgeProps) => {
  // Always truncate in the badge — full hash is shown in tooltip
  const truncatedHash = `${hash.slice(0, 10)}...${hash.slice(-6)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 font-mono text-xs max-w-full overflow-hidden',
            verified
              ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
              : 'bg-muted text-muted-foreground',
            className
          )}
        >
          {verified ? (
            <CheckCircle2 className="h-3 w-3 shrink-0" />
          ) : (
            <Blocks className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{truncatedHash}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">Blockchain Hash</p>
          <p className="break-all font-mono text-xs">{hash}</p>
          {verified && (
            <p className="text-xs text-success">✓ Verified on blockchain</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default BlockchainBadge;