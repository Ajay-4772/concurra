import { useEffect, useState } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { NewOrderModal } from './components/NewOrderModal';
import { SettingsModal } from './components/SettingsModal';
import { DashboardView } from './views/DashboardView';
import { OrdersView } from './views/OrdersView';
import { InventoryView } from './views/InventoryView';
import { DlqView } from './views/DlqView';
import { SimulatorView } from './views/SimulatorView';
import { HealthState, ViewMode } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [health, setHealth] = useState<HealthState>({
    status: 'AWAITING_CONNECTION',
    service: 'OrderFlow',
    latencyMs: null,
    postgres: 'AWAITING_CONNECTION',
    redis: 'AWAITING_CONNECTION',
    processor: 'AWAITING_CONNECTION',
    sse: 'AWAITING_CONNECTION',
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  useEffect(() => {
    // Set default dark mode
    document.documentElement.classList.add('dark');
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      const res = await axios.get<{ status: string; service: string }>('/api/health', {
        timeout: 2500,
      });
      const elapsed = Math.round(performance.now() - start);

      if (res.data?.status === 'UP') {
        setHealth({
          status: 'ONLINE',
          service: res.data.service || 'OrderFlow',
          latencyMs: elapsed,
          postgres: 'ONLINE',
          redis: 'ONLINE',
          processor: 'ONLINE',
          sse: 'STANDBY',
        });
      } else {
        setHealth((prev) => ({
          ...prev,
          status: 'OFFLINE',
          latencyMs: null,
        }));
      }
    } catch {
      setHealth({
        status: 'AWAITING_CONNECTION',
        service: 'OrderFlow',
        latencyMs: null,
        postgres: 'AWAITING_CONNECTION',
        redis: 'AWAITING_CONNECTION',
        processor: 'AWAITING_CONNECTION',
        sse: 'AWAITING_CONNECTION',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`h-screen w-screen flex overflow-hidden font-sans select-none ${
      theme === 'dark' ? 'bg-[#0f0f0f] text-[#f4f4f5]' : 'bg-[#ffffff] text-[#18181b]'
    }`}>
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        health={health}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Compact Top Bar */}
        <TopBar
          currentView={currentView}
          health={health}
          onRefreshHealth={checkHealth}
          isChecking={isChecking}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'orders' && <OrdersView />}
          {currentView === 'inventory' && <InventoryView />}
          {currentView === 'dlq' && <DlqView />}
          {currentView === 'simulator' && <SimulatorView />}
        </main>
      </div>

      {/* Modals */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
