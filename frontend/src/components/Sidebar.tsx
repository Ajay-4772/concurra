import { 
  LayoutGrid, 
  ListOrdered, 
  Package, 
  AlertOctagon, 
  Zap, 
  Plus, 
  PanelLeftClose, 
  PanelLeft, 
  Settings as SettingsIcon,
  CircleDot
} from 'lucide-react';
import { HealthState, ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenNewOrder: () => void;
  onOpenSettings: () => void;
  health: HealthState;
}

interface NavItem {
  id: ViewMode;
  label: string;
  icon: typeof LayoutGrid;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'orders', label: 'Orders', icon: ListOrdered },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'dlq', label: 'Dead Letter Queue', icon: AlertOctagon },
  { id: 'simulator', label: 'Concurrency Simulator', icon: Zap, badge: 'TEST' },
];

export function Sidebar({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  onOpenNewOrder,
  onOpenSettings,
  health,
}: SidebarProps) {
  const isOnline = health.status === 'ONLINE';

  return (
    <aside
      className={`h-full border-r border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#f7f7f7] text-[#f4f4f5] dark:text-[#f4f4f5] light:text-[#18181b] flex flex-col justify-between shrink-0 transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Header & Actions */}
      <div className="p-3 space-y-3">
        {/* Brand / Title & Collapse Toggle */}
        <div className="flex items-center justify-between px-2 h-9">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-md bg-[#242424] dark:bg-[#242424] light:bg-[#e4e4e7] flex items-center justify-center text-emerald-400">
                <CircleDot className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-xs tracking-wider font-mono">
                CONCURRA
              </span>
            </div>
          ) : (
            <div className="mx-auto text-emerald-400">
              <CircleDot className="h-4 w-4" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f1f] dark:hover:bg-[#1f1f1f] light:hover:bg-[#eaeaea] transition"
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* + New Order Action Button */}
        <div>
          <button
            onClick={onOpenNewOrder}
            title="Create new order"
            className={`w-full flex items-center rounded-md border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-white text-xs font-medium hover:bg-[#222222] dark:hover:bg-[#222222] light:hover:bg-zinc-50 transition shadow-sm ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2'
            }`}
          >
            <Plus className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-300 light:text-zinc-700" />
            {!collapsed && <span>New Order</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-0.5 pt-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-md text-xs font-medium transition ${
                  collapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
                } ${
                  isActive
                    ? 'bg-[#222222] dark:bg-[#222222] light:bg-zinc-200/70 text-white dark:text-white light:text-zinc-900 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 dark:hover:text-zinc-200 light:hover:text-zinc-800 hover:bg-[#191919] dark:hover:bg-[#191919] light:hover:bg-zinc-100'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between text-left">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1 rounded bg-[#2a2a2a] text-zinc-400 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom of Sidebar: Compact System Status & Settings */}
      <div className="p-3 border-t border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] space-y-2">
        {/* System status dots */}
        {!collapsed ? (
          <div className="px-2 py-2 rounded bg-[#161616] dark:bg-[#161616] light:bg-white border border-[#242424] dark:border-[#242424] light:border-[#e5e5e5] space-y-1.5 text-[11px] font-mono">
            <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider font-semibold">
              System Status
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="flex items-center space-x-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700">Postgres</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700">Redis</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-sky-500' : 'bg-amber-500'}`} />
                <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700">Processor</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-sky-500' : 'bg-amber-500'}`} />
                <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700">SSE</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 space-y-1.5" title="Infrastructure Status">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Workspace Settings"
          className={`w-full flex items-center rounded-md text-xs text-zinc-400 hover:text-zinc-200 dark:hover:text-zinc-200 light:hover:text-zinc-800 hover:bg-[#191919] dark:hover:bg-[#191919] light:hover:bg-zinc-100 transition ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
          }`}
        >
          <SettingsIcon className="h-4 w-4 text-zinc-500 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
