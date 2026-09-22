import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ShoppingBag, CheckCircle2 } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductOption {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  price: number;
  availableQuantity: number;
}

export function NewOrderModal({ isOpen, onClose }: NewOrderModalProps) {
  const [customer, setCustomer] = useState('enterprise-client-1');
  const [productId, setProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      axios.get<ProductOption[]>('/api/inventory')
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setProducts(res.data);
            setProductId(res.data[0].productId);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const idempotencyKey = 'order-form-' + Date.now();

    try {
      const res = await axios.post(
        '/api/orders',
        {
          customerId: customer,
          items: [{ productId, quantity }],
        },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
        }
      );

      setSuccessMessage(`Order ${res.data.orderNumber} placed successfully!`);
      setTimeout(() => {
        setSubmitted(false);
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setSubmitted(false);
      setErrorMessage(err.response?.data?.message || 'Failed to place order.');
    }
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

        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border-b border-rose-900 text-rose-400 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/60 border-b border-emerald-900 text-emerald-400 text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-sans">Customer Identifier</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-sans">Catalog Item</label>
            <select
              value={productId}
              onChange={(e) => setProductId(parseInt(e.target.value))}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.productId} value={p.productId} className="bg-[#181818]">
                  {p.sku} — {p.productName} (${p.price.toFixed(2)}) [{p.availableQuantity} available]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-sans">Quantity</label>
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
              className="px-3 py-1.5 rounded-md border border-[#2e2e2e] text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="px-4 py-1.5 rounded-md bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {submitted ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
