import { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewOrderModal({ isOpen, onClose }: NewOrderModalProps) {
  const [customer, setCustomer] = useState('enterprise-client-1');
  const [productId, setProductId] = useState('PROD-001');
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#171717] dark:bg-[#171717] light:bg-white border border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] rounded-xl shadow-2xl overflow-hidden font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5]">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Create New Order</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#222222] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Customer Identifier</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Catalog Item</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
            >
              <option value="PROD-001">PROD-001 — High-Performance Compute Node</option>
              <option value="PROD-002">PROD-002 — Standard Storage Volume</option>
              <option value="PROD-003">PROD-003 — Dedicated Network Interface</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-100 light:bg-zinc-900 text-zinc-900 dark:text-zinc-900 light:text-white font-medium hover:opacity-90 transition"
            >
              {submitted ? 'Queuing Order...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
