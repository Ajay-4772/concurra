import { useState } from 'react';
import { 
  Terminal, 
  Boxes,
  Activity
} from 'lucide-react';
import { InventoryItem, DomainEvent } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function DashboardView() {
  // Baseline initial catalog items for display
  const [inventory] = useState<InventoryItem[]>([
    { productId: 'PROD-001', productName: 'High-Performance Node', available: 10, reserved: 0, total: 10, lowStockThreshold: 3, unitPrice: 450 },
    { productId: 'PROD-002', productName: 'Standard Storage Volume', available: 50, reserved: 0, total: 50, lowStockThreshold: 10, unitPrice: 85 },
    { productId: 'PROD-003', productName: 'Dedicated Network Interface', available: 20, reserved: 0, total: 20, lowStockThreshold: 5, unitPrice: 120 },
  ]);

  // Live activity stream events placeholder (structured like an engineering terminal)
  const events: DomainEvent[] = [
    { id: 'ev-1', timestamp: '14:42:01.042', type: 'SYSTEM_BOOT', details: 'OrderFlow modular monolith initialized with Hikari pool' },
    { id: 'ev-2', timestamp: '14:42:01.055', type: 'FLYWAY_MIGRATION', details: 'Applied baseline schema V1__init.sql' },
    { id: 'ev-3', timestamp: '14:42:01.072', type: 'REDIS_CONNECTED', details: 'Redis 7 ping confirmed on port 6379' },
    { id: 'ev-4', timestamp: '14:42:01.088', type: 'THREAD_POOL_READY', details: 'ThreadPoolTaskExecutor (core: 5, max: 10, queue: 100) ready' },
  ];

  // Minimal chart data showing throughput / state breakdown
  const statusChartData = [
    { name: 'Pending', count: 0 },
    { name: 'Processing', count: 0 },
    { name: 'Completed', count: 0 },
    { name: 'Out of Stock', count: 0 },
    { name: 'Retrying', count: 0 },
    { name: 'DLQ', count: 0 },
  ];

  const metrics = [
    { label: 'Total Orders', value: '0', sub: 'authoritative ledger' },
    { label: 'Processing', value: '0', sub: 'in thread pool' },
    { label: 'Completed', value: '0', sub: 'fulfilled safely' },
    { label: 'Out of Stock', value: '0', sub: 'safely rejected' },
    { label: 'Failed', value: '0', sub: 'transient errors' },
    { label: 'DLQ', value: '0', sub: 'retries exhausted' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
      
      {/* Top Section Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
          Real-time order processing and operational telemetry
        </p>
      </div>

      {/* Metric Counters — Clean horizontal ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-3.5 rounded-lg border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white"
          >
            <div className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 font-medium">
              {m.label}
            </div>
            <div className="text-2xl font-semibold font-mono tracking-tight my-1 text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
              {m.value}
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-500 light:text-zinc-400 font-mono">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main Split: Live Orders Table (Left) & Activity Stream (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Live Orders Table */}
        <div className="lg:col-span-2 border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-zinc-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                Live Orders
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">0 active in queue</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
                <tr>
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium text-right">Qty</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-center">Retry</th>
                  <th className="px-4 py-2 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 font-sans">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
                        No orders currently processing
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Launch the Concurrency Simulator or create a new order to observe live state transitions.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Live Activity Stream (Console style) */}
        <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-zinc-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                Live Activity
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Stream Console</span>
          </div>

          <div className="p-3 flex-1 flex flex-col justify-between space-y-3 font-mono text-[11px]">
            <div className="space-y-2 overflow-y-auto max-h-80">
              {events.map((ev) => (
                <div 
                  key={ev.id}
                  className="p-2.5 rounded bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-50 border border-[#222222] dark:border-[#222222] light:border-zinc-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">{ev.timestamp}</span>
                    <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700 font-semibold">{ev.type}</span>
                  </div>
                  <div className="text-zinc-400 text-[11px] font-sans">
                    {ev.details}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#222222] text-[10px] text-zinc-500 text-center font-sans">
              Real-time events will stream continuously via Server-Sent Events (SSE)
            </div>
          </div>
        </div>

      </div>

      {/* Minimal Recharts Distribution */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
            Lifecycle State Distribution
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">0 Total Recorded</span>
        </div>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderColor: '#27272a', 
                  borderRadius: '6px', 
                  fontSize: '11px',
                  color: '#fff' 
                }} 
              />
              <Bar dataKey="count" fill="#3f3f46" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Section — Clean Table */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="h-4 w-4 text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
              Inventory State
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">PostgreSQL Source of Truth</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
              <tr>
                <th className="px-4 py-2 font-medium">Product ID</th>
                <th className="px-4 py-2 font-medium">Product Name</th>
                <th className="px-4 py-2 font-medium text-right">Available</th>
                <th className="px-4 py-2 font-medium text-right">Reserved</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
                <th className="px-4 py-2 font-medium">Stock Level</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
              {inventory.map((item) => {
                const stockPercent = item.total > 0 ? Math.round((item.available / item.total) * 100) : 0;
                return (
                  <tr key={item.productId} className="hover:bg-[#181818] dark:hover:bg-[#181818] light:hover:bg-zinc-50 transition">
                    <td className="px-4 py-2.5 font-bold text-zinc-300 dark:text-zinc-300 light:text-zinc-800">{item.productId}</td>
                    <td className="px-4 py-2.5 font-sans text-zinc-200 dark:text-zinc-200 light:text-zinc-900">{item.productName}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-400">{item.available}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">{item.reserved}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">{item.total}</td>
                    <td className="px-4 py-2.5 w-44">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 rounded-full h-1 overflow-hidden">
                          <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${stockPercent}%` }} />
                        </div>
                        <span className="text-[10px] text-zinc-500">{stockPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>Healthy</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
