import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight,
  Inbox,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { OrderStatus } from '../types';

interface OrderItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface OrderRecord {
  id: number;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
}

export function OrdersView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = { page, size: 20 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await axios.get<{ content: OrderRecord[]; totalPages: number; totalElements: number }>(
        '/api/orders',
        { params }
      );
      if (res.data) {
        setOrders(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

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

  const filteredOrders = orders.filter((ord) => {
    return (
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900 relative">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Orders
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
            Search and inspect order lifecycle transitions and audit details
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-3 py-1.5 rounded-md border border-[#2e2e2e] text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:border-zinc-400 focus:outline-none"
            >
              {statuses.map((st) => (
                <option key={st} value={st} className="bg-[#181818] text-zinc-200">
                  {st === 'ALL' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Showing {filteredOrders.length} of {totalElements} orders
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order Number</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Items</th>
                <th className="px-4 py-2.5 font-medium text-right">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-center">Retries</th>
                <th className="px-4 py-2.5 font-medium text-right">Created</th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 font-sans">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Inbox className="h-6 w-6 text-zinc-600" />
                      <p className="text-xs font-medium text-zinc-400">No orders found</p>
                      <p className="text-[11px] text-zinc-500">
                        {statusFilter !== 'ALL' ? `No orders in status ${statusFilter}` : 'Use the Concurrency Simulator to dispatch orders'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const itemCount = ord.items ? ord.items.reduce((s, it) => s + it.quantity, 0) : 0;
                  const itemSummary = ord.items && ord.items.length > 0 
                    ? `${ord.items[0].productName}${ord.items.length > 1 ? ` +${ord.items.length - 1} more` : ''}`
                    : '1 item';

                  return (
                    <tr 
                      key={ord.id} 
                      onClick={() => setSelectedOrder(ord)}
                      className="hover:bg-[#181818] cursor-pointer transition"
                    >
                      <td className="px-4 py-2.5 font-bold text-zinc-200">{ord.orderNumber}</td>
                      <td className="px-4 py-2.5 font-sans text-zinc-300">{ord.customerId}</td>
                      <td className="px-4 py-2.5 font-sans text-zinc-400">
                        {itemSummary} ({itemCount})
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-zinc-300">
                        ${ord.totalAmount ? ord.totalAmount.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="px-4 py-2.5 text-center text-zinc-400">{ord.retryCount}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-500 text-[10px]">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString() : '--'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button 
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                          title="Inspect Order"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa] border-t border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] flex items-center justify-between text-xs font-mono text-zinc-500">
          <div>Page {page + 1} of {Math.max(1, totalPages)} ({totalElements} total)</div>
          <div className="flex items-center space-x-1">
            <button 
              disabled={page <= 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="p-1 rounded text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed"
            >
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
                <span className="text-zinc-300 font-sans">{selectedOrder.customerId}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Total Amount</span>
                <span className="text-emerald-400 font-bold">${selectedOrder.totalAmount?.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Retry Count</span>
                <span className="text-zinc-200">{selectedOrder.retryCount} / 3</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Created At</span>
                <span className="text-zinc-400 text-[11px]">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Updated At</span>
                <span className="text-zinc-400 text-[11px]">{new Date(selectedOrder.updatedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                Line Items
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {selectedOrder.items && selectedOrder.items.map((it) => (
                  <div key={it.id} className="p-2 rounded bg-[#111111] border border-[#222222] flex justify-between items-center">
                    <div>
                      <div className="text-zinc-200 font-sans">{it.productName}</div>
                      <div className="text-[10px] text-zinc-500">Qty: {it.quantity}</div>
                    </div>
                    <div className="text-zinc-300 font-bold">${(it.unitPrice * it.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-sans">
                Execution Lifecycle
              </div>
              <div className="space-y-2 border-l-2 border-zinc-800 ml-2 pl-3 text-xs font-mono">
                <div className="relative">
                  <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div className="font-semibold text-zinc-300">Order Created</div>
                  <div className="text-[10px] text-zinc-500">Ingested and queued</div>
                </div>
                <div className="relative pt-2">
                  <div className="absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <div className="font-semibold text-zinc-300">Processing</div>
                  <div className="text-[10px] text-zinc-500">Executed on thread pool worker</div>
                </div>
                <div className="relative pt-2">
                  <div className="absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <div className="font-semibold text-zinc-300">PostgreSQL Atomic Reservation</div>
                  <div className="text-[10px] text-zinc-500">Row lock &amp; stock verification</div>
                </div>
                <div className="relative pt-2">
                  <div className={`absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full ${
                    selectedOrder.status === 'COMPLETED' ? 'bg-emerald-500' : selectedOrder.status === 'OUT_OF_STOCK' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  <div className="font-semibold text-zinc-300">
                    {selectedOrder.status}
                  </div>
                  <div className="text-[10px] text-zinc-500">Terminal transaction boundary</div>
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
