import { RefreshCw, Sun, Moon } from 'lucide-react';
import { HealthState, ViewMode } from '../types';

interface TopBarProps {
  currentView: ViewMode;
  health: HealthState;
  onRefreshHealth: () => void;
  isChecking: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const VIEW_HEADINGS: Record<ViewMode, string> = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  inventory: 'Inventory',
  dlq: 'Dead Letter Queue',
  simulator: 'Concurrency Simulator',
};

export function TopBar({
  currentView,
  health,
  onRefreshHealth,
  isChecking,
  theme,
  onToggleTheme,
}: TopBarProps) {
  const isOnline = health.status === 'ONLINE';

  return (
    <header className="h-12 border-b border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-[#ffffff] px-6 flex items-center justify-between shrink-0">
      {/* Page Title */}
      <div className="flex items-center space-x-3">
        <h2 className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 light:text-zinc-900 tracking-tight">
          {VIEW_HEADINGS[currentView]}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Connection state */}
        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className={isOnline ? 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700' : 'text-amber-500'}>
            {isOnline ? 'Live' : 'Awaiting connection'}
          </span>
          {isOnline && health.latencyMs !== null && (
            <span className="text-zinc-500 text-[10px]">({health.latencyMs}ms)</span>
          )}
        </div>

        {/* Refresh probe button */}
        <button
          onClick={onRefreshHealth}
          disabled={isChecking}
          title="Refresh backend status"
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 dark:hover:text-zinc-200 light:hover:text-zinc-800 hover:bg-[#1a1a1a] dark:hover:bg-[#1a1a1a] light:hover:bg-zinc-100 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin text-zinc-300' : ''}`} />
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 dark:hover:text-zinc-200 light:hover:text-zinc-800 hover:bg-[#1a1a1a] dark:hover:bg-[#1a1a1a] light:hover:bg-zinc-100 transition"
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5 text-zinc-400 hover:text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-900" />
          )}
        </button>
      </div>
    </header>
  );
}
