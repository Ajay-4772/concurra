import { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  Lock
} from 'lucide-react';
import { InventoryItem } from '../types';

export function InventoryView() {
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  const inventoryItems: InventoryItem[] = [
    {
      productId: 'PROD-001',
      productName: 'High-Performance Node',
      category: 'Compute Infrastructure',
      available: 10,
      reserved: 0,
      total: 10,
      lowStockThreshold: 3,
      unitPrice: 450,
    },
    {
      productId: 'PROD-002',
      productName: 'Standard Storage Volume',
      category: 'Block Storage',
      available: 50,
      reserved: 0,
      total: 50,
      lowStockThreshold: 10,
      unitPrice: 85,
    },
    {
      productId: 'PROD-003',
      productName: 'Dedicated Network Interface',
      category: 'Network Fabric',
      available: 2,
      reserved: 0,
      total: 20,
      lowStockThreshold: 5,
      unitPrice: 120,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900 relative">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Inventory
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
          Authoritative stock allocation managed strictly by PostgreSQL
        </p>
      </div>

      {/* Inventory Table */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium text-right">Available</th>
                <th className="px-4 py-2 font-medium text-right">Reserved</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
                <th className="px-4 py-2 font-medium">Stock %</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
              {inventoryItems.map((item) => {
                const stockPercent = item.total > 0 ? Math.round((item.available / item.total) * 100) : 0;
                const isDepleted = item.available === 0;
                const isLowStock = item.available <= item.lowStockThreshold && !isDepleted;

                return (
                  <tr
                    key={item.productId}
                    onClick={() => setSelectedProduct(item)}
                    className="hover:bg-[#1a1a1a] dark:hover:bg-[#1a1a1a] light:hover:bg-zinc-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-200 dark:text-zinc-200 light:text-zinc-900">{item.productName}</div>
                      <div className="text-[10px] text-zinc-500">{item.productId}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-sans text-xs">{item.category}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">{item.available}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{item.reserved}</td>
                    <td className="px-4 py-3 text-right text-zinc-300 font-semibold">{item.total}</td>
                    <td className="px-4 py-3 w-48">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${
                              isDepleted ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500">{stockPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isDepleted ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-rose-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>Depleted</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Healthy</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-zinc-500 hover:text-zinc-300 p-1">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Inspector Drawer */}
      {selectedProduct && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#171717] dark:bg-[#171717] light:bg-white border-l border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900 animate-in slide-in-from-right duration-150">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] pb-3">
              <div>
                <span className="text-[11px] text-zinc-500 font-mono">STOCK ALLOCATION</span>
                <h2 className="text-base font-bold text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
                  {selectedProduct.productName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#222222] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Product SKU</span>
                <span className="text-zinc-200">{selectedProduct.productId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Available Stock</span>
                <span className="text-emerald-400 font-bold">{selectedProduct.available} units</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Reserved Quantity</span>
                <span className="text-zinc-400">{selectedProduct.reserved} units</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Total Capacity</span>
                <span className="text-zinc-200">{selectedProduct.total} units</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#222222]">
                <span className="text-zinc-500">Unit Price</span>
                <span className="text-zinc-200">${selectedProduct.unitPrice}</span>
              </div>
            </div>

            {/* SQL Atomic Guarantee Note */}
            <div className="p-3.5 rounded-lg bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#242424] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span>PostgreSQL Atomic Clause</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Inventory reservation executes in a single atomic SQL transaction avoiding dirty reads or negative balances:
              </p>
              <code className="text-[10px] font-mono text-emerald-400 block bg-[#0a0a0a] p-2 rounded border border-[#222222]">
                UPDATE inventory SET available = available - 1 WHERE product_id = '{selectedProduct.productId}' AND available &gt;= 1;
              </code>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2a2a2a] flex justify-end">
            <button
              onClick={() => setSelectedProduct(null)}
              className="px-3 py-1.5 rounded-md border border-[#2e2e2e] text-xs text-zinc-300 hover:bg-[#222222] transition"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
