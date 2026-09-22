import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Terminal, 
  Boxes,
  Activity,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardMetrics {
  totalOrders: number;
  pending: number;
  processing: number;
  completed: number;
  outOfStock: number;
  retrying: number;
  failed: number;
  deadLettered: number;
  totalAvailableStock: number;
  totalReservedStock: number;
  activeWorkerThreads: number;
  queueDepth: number;
}

interface OrderItemSummary {
  id: number;
  orderNumber: string;
  customerId: string;
  status: any;
  totalAmount: number;
  retryCount: number;
  createdAt: string;
  items: Array<{ productId: number; productName: string; quantity: number }>;
}

interface InventoryRecord {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  price: number;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
}

interface LiveEvent {
  id: string;
  timestamp: string;
  type: string;
  details: string;
}

export function DashboardView() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrders: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    outOfStock: 0,
    retrying: 0,
    failed: 0,
    deadLettered: 0,
    totalAvailableStock: 0,
    totalReservedStock: 0,
    activeWorkerThreads: 0,
    queueDepth: 0,
  });

  const [orders, setOrders] = useState<OrderItemSummary[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, oRes, iRes] = await Promise.all([
        axios.get<DashboardMetrics>('/api/dashboard/metrics'),
        axios.get<{ content: OrderItemSummary[] }>('/api/orders?size=8'),
        axios.get<InventoryRecord[]>('/api/inventory'),
      ]);

      if (mRes.data) setMetrics(mRes.data);
      if (oRes.data?.content) setOrders(oRes.data.content);
      if (iRes.data) setInventory(iRes.data);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);

    // SSE connection for real-time live events
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');

      eventSource.addEventListener('CONNECTED', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setLiveEvents((prev) => [
          { id: 'conn-' + Date.now(), timestamp: new Date().toLocaleTimeString(), type: 'CONNECTED', details: data.message },
          ...prev.slice(0, 30),
        ]);
      });

      eventSource.addEventListener('ORDER_EVENT', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setLiveEvents((prev) => [
          { id: 'ev-' + Date.now() + Math.random(), timestamp: new Date().toLocaleTimeString(), type: data.type, details: `Order ${data.orderNumber}: ${data.details}` },
          ...prev.slice(0, 30),
        ]);
        fetchData();
      });

      eventSource.addEventListener('INVENTORY_UPDATED', () => {
        fetchData();
      });

      eventSource.addEventListener('SIMULATION_COMPLETED', () => {
        fetchData();
      });

      eventSource.addEventListener('DEMO_RESET', () => {
        fetchData();
      });
    } catch {
      // fallback to polling
    }

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  const statusChartData = [
    { name: 'Pending', count: metrics.pending },
    { name: 'Processing', count: metrics.processing },
    { name: 'Completed', count: metrics.completed },
    { name: 'Out of Stock', count: metrics.outOfStock },
    { name: 'Retrying', count: metrics.retrying },
    { name: 'DLQ', count: metrics.deadLettered },
  ];

  const statCards = [
    { label: 'Total Orders', value: metrics.totalOrders, sub: 'authoritative ledger' },
    { label: 'Processing', value: metrics.processing, sub: `${metrics.activeWorkerThreads} active threads` },
    { label: 'Completed', value: metrics.completed, sub: 'fulfilled safely' },
    { label: 'Out of Stock', value: metrics.outOfStock, sub: 'safely rejected' },
    { label: 'Failed', value: metrics.failed, sub: 'transient errors' },
    { label: 'DLQ', value: metrics.deadLettered, sub: 'retries exhausted' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
      
      {/* Top Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
            Real-time order processing and operational telemetry
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-1.5 rounded-md border border-[#2e2e2e] text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Counters Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((m) => (
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
            <span className="text-[11px] text-zinc-500 font-mono">{metrics.processing} in worker pool</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
                <tr>
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-center">Retry</th>
                  <th className="px-4 py-2 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 font-sans">
                      <p className="text-xs font-medium text-zinc-400">No orders in database</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Start a simulation or submit an order to observe live concurrency.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#181818] transition">
                      <td className="px-4 py-2.5 font-bold text-zinc-200">{ord.orderNumber}</td>
                      <td className="px-4 py-2.5 font-sans text-zinc-400">{ord.customerId}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="px-4 py-2.5 text-center text-zinc-400">{ord.retryCount}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-500 text-[10px]">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString() : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Live Activity Stream (Console style) */}
        <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                Live SSE Telemetry
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">● Active</span>
          </div>

          <div className="p-3 flex-1 flex flex-col justify-between space-y-3 font-mono text-[11px]">
            <div className="space-y-2 overflow-y-auto max-h-80">
              {liveEvents.length === 0 ? (
                <div className="p-3 rounded bg-[#0d0d0d] border border-[#222222] text-zinc-500 text-center">
                  Listening for real-time SSE events...
                </div>
              ) : (
                liveEvents.map((ev) => (
                  <div 
                    key={ev.id}
                    className="p-2 rounded bg-[#0d0d0d] border border-[#222222] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500">{ev.timestamp}</span>
                      <span className="text-emerald-400 font-semibold">{ev.type}</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] font-sans">
                      {ev.details}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#222222] text-[10px] text-zinc-500 text-center font-sans">
              Streamed via Spring SseEmitter (/api/events/stream)
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
          <span className="text-[10px] text-zinc-500 font-mono">{metrics.totalOrders} Total Recorded</span>
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
              <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="h-4 w-4 text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
              PostgreSQL Inventory State
            </h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Total Available: {metrics.totalAvailableStock}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
              <tr>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium text-right">Price</th>
                <th className="px-4 py-2 font-medium text-right">Available</th>
                <th className="px-4 py-2 font-medium text-right">Reserved</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
              {inventory.map((item) => (
                <tr key={item.productId} className="hover:bg-[#181818] transition">
                  <td className="px-4 py-2.5 font-bold text-zinc-300">{item.sku}</td>
                  <td className="px-4 py-2.5 font-sans text-zinc-200">{item.productName}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-400">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-400">{item.availableQuantity}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-500">{item.reservedQuantity}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">{item.totalQuantity}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 font-mono text-[10px] ${
                      item.availableQuantity > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.availableQuantity > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span>{item.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
