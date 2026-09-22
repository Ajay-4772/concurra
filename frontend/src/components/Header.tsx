import { RefreshCw } from 'lucide-react';
import { HealthState, ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  health: HealthState;
  onRefreshHealth: () => void;
  isChecking: boolean;
}

const VIEW_TITLES: Record<ViewMode, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'OPERATIONS OVERVIEW',
    subtitle: 'Real-time order throughput, processing state, and live inventory allocation',
  },
  orders: {
    title: 'ORDER REGISTRY',
    subtitle: 'Authoritative transaction ledger with lifecycle audit and state tracking',
  },
  inventory: {
    title: 'INVENTORY ALLOCATION',
    subtitle: 'PostgreSQL-backed stock levels and atomic conditional reservation states',
  },
  dlq: {
    title: 'DEAD LETTER QUEUE',
    subtitle: 'Exhausted retry records (max 3 attempts) requiring diagnostic review',
  },
  simulator: {
    title: 'CONCURRENCY SIMULATOR',
    subtitle: 'Multi-threaded stress verification and zero-overselling validation harness',
  },
};

export function Header({ currentView, health, onRefreshHealth, isChecking }: HeaderProps) {
  const meta = VIEW_TITLES[currentView];

  return (
    <header className="h-14 bg-[#0a0f1d] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <h1 className="text-sm font-bold tracking-wider text-slate-100 font-mono">
          {meta.title}
        </h1>
        <span className="text-slate-600">|</span>
        <p className="text-xs text-slate-400 hidden sm:block">
          {meta.subtitle}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Connection status badge */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="flex h-2 w-2 relative">
            {health.status === 'ONLINE' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            )}
          </span>
          <span className={health.status === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}>
            {health.status === 'ONLINE' ? `SYSTEM ONLINE` : 'AWAITING BACKEND CONNECTION'}
          </span>
          {health.latencyMs !== null && health.status === 'ONLINE' && (
            <span className="text-slate-500">({health.latencyMs}ms)</span>
          )}
        </div>

        <button
          onClick={onRefreshHealth}
          disabled={isChecking}
          title="Refresh connection status"
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  );
}
