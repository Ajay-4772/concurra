import { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight,
  Inbox
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Order, OrderStatus } from '../types';

export function OrdersView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Baseline mock data for interactive exploration while real backend orders await Phase 2
  const sampleOrders: Order[] = [
    {
      id: 'ord-001',
      orderNumber: 'ORD-10001',
      customer: 'enterprise-client-alpha',
      product: 'PROD-001 (Compute Node)',
      quantity: 1,
      status: 'COMPLETED',
      retryCount: 0,
      totalAmount: 450,
      createdAt: '14:40:12.105',
      updatedAt: '14:40:12.158',
      items: [{ productId: 'PROD-001', productName: 'High-Performance Node', quantity: 1, unitPrice: 450 }]
    },
    {
      id: 'ord-002',
      orderNumber: 'ORD-10002',
      customer: 'cloud-services-corp',
      product: 'PROD-001 (Compute Node)',
      quantity: 1,
      status: 'OUT_OF_STOCK',
      retryCount: 0,
      totalAmount: 450,
      createdAt: '14:40:12.110',
      updatedAt: '14:40:12.135',
      items: [{ productId: 'PROD-001', productName: 'High-Performance Node', quantity: 1, unitPrice: 450 }]
    }
  ];

  const statuses: (OrderStatus | 'ALL')[] = [
    'ALL',
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'OUT_OF_STOCK',
    'RETRYING',
    'FAILED',
    'DEAD_LETTERED',
  ];

  const filteredOrders = sampleOrders.filter((ord) => {
    const matchesSearch = 
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900 relative">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
          Search and inspect order lifecycle transitions and audit details
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search orders or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="flex items-center space-x-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:border-zinc-400 focus:outline-none font-mono"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-zinc-500 font-mono">
          Showing {filteredOrders.length} orders
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
              <tr>
                <th className="px-4 py-2 font-medium">Order ID</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 font-medium text-right">Qty</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-center">Retries</th>
                <th className="px-4 py-2 font-medium text-right">Timestamp</th>
                <th className="px-4 py-2 font-medium text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-zinc-500 font-sans">
                    <div className="space-y-1">
                      <Inbox className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-400">No orders found</p>
                      <p className="text-[11px] text-zinc-500">Orders submitted via API will be displayed here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-[#1a1a1a] dark:hover:bg-[#1a1a1a] light:hover:bg-zinc-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-bold text-zinc-200 dark:text-zinc-200 light:text-zinc-900">{ord.orderNumber}</td>
                    <td className="px-4 py-3 text-zinc-400 font-sans">{ord.customer}</td>
                    <td className="px-4 py-3 text-zinc-300 font-sans">{ord.product}</td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-200">{ord.quantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-500">{ord.retryCount}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-[11px]">{ord.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-zinc-500 hover:text-zinc-300 p-1">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa] border-t border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] flex items-center justify-between text-xs font-mono text-zinc-500">
          <div>Page 1 of 1 ({filteredOrders.length} total)</div>
          <div className="flex items-center space-x-1">
            <button disabled className="p-1 rounded text-zinc-600 cursor-not-allowed">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button disabled className="p-1 rounded text-zinc-600 cursor-not-allowed">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right-side Sliding Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#171717] dark:bg-[#171717] light:bg-white border-l border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900 animate-in slide-in-from-right duration-150">
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] pb-3">
              <div>
                <span className="text-[11px] text-zinc-500 font-mono">ORDER DETAIL</span>
                <h2 className="text-base font-bold font-mono text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#222222] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status & Core Info */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Status</span>
                <StatusBadge status={selectedOrder.status} size="md" />
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Customer</span>
                <span className="text-zinc-300 font-sans">{selectedOrder.customer}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Product Item</span>
                <span className="text-zinc-300 font-sans">{selectedOrder.product}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Quantity</span>
                <span className="text-zinc-200 font-bold">{selectedOrder.quantity} units</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Retry Count</span>
                <span className="text-zinc-200">{selectedOrder.retryCount} / 3</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Created At</span>
                <span className="text-zinc-400 text-[11px]">{selectedOrder.createdAt}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Updated At</span>
                <span className="text-zinc-400 text-[11px]">{selectedOrder.updatedAt}</span>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Execution Timeline
              </div>
              <div className="space-y-2 border-l-2 border-zinc-800 ml-2 pl-3 text-xs font-mono">
                <div className="relative">
                  <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div className="font-semibold text-zinc-300">Order Created</div>
                  <div className="text-[10px] text-zinc-500">Ingested via API</div>
                </div>
                <div className="relative pt-2">
                  <div className="absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <div className="font-semibold text-zinc-300">Processing</div>
                  <div className="text-[10px] text-zinc-500">Assigned to thread pool worker</div>
                </div>
                <div className="relative pt-2">
                  <div className="absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <div className="font-semibold text-zinc-300">Inventory Check</div>
                  <div className="text-[10px] text-zinc-500">PostgreSQL atomic conditional update</div>
                </div>
                <div className="relative pt-2">
                  <div className="absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div className="font-semibold text-zinc-300">
                    {selectedOrder.status === 'COMPLETED' ? 'Completed' : 'Out of Stock'}
                  </div>
                  <div className="text-[10px] text-zinc-500">Terminal lifecycle state reached</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2a2a2a] flex justify-end">
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-3 py-1.5 rounded-md border border-[#2e2e2e] text-xs text-zinc-300 hover:bg-[#222222] transition"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
