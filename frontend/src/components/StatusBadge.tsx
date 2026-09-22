import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClasses} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>COMPLETED</span>
        </span>
      );
    case 'PROCESSING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClasses} bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20`}>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>PROCESSING</span>
        </span>
      );
    case 'RETRYING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClasses} bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`}>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>RETRYING</span>
        </span>
      );
    case 'OUT_OF_STOCK':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClasses} bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`}>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>OUT_OF_STOCK</span>
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClasses} bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`}>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <span>FAILED</span>
        </span>
      );
    case 'DEAD_LETTERED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClasses} bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-800/30`}>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          <span>DEAD_LETTERED</span>
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${sizeClasses} bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20`}>
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          <span>PENDING</span>
        </span>
      );
  }
}
