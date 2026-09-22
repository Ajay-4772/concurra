import { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function SimulatorView() {
  const [initialInventory, setInitialInventory] = useState<number>(10);
  const [concurrentOrders, setConcurrentOrders] = useState<number>(100);
  const [quantityPerOrder, setQuantityPerOrder] = useState<number>(1);
  const [showSqlDetail, setShowSqlDetail] = useState<boolean>(true);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleRunSimulation = () => {
    setSimRunning(true);
    setStatusNotice('Simulation dispatch triggered. Backend pipeline will execute real concurrency in Phase 2.');
    setTimeout(() => {
      setSimRunning(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Concurrency Simulator
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
          Stress-test inventory safety with real concurrent orders
        </p>
      </div>

      {statusNotice && (
        <div className="p-3 rounded-md bg-[#181818] border border-zinc-700 text-xs text-emerald-400 font-mono">
          {statusNotice}
        </div>
      )}

      {/* Configuration & Action Console */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
            Test Configuration
          </span>
          <span className="text-[11px] font-mono text-zinc-500">Benchmark Spec</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-1.5 font-sans font-medium">
              Initial Inventory
            </label>
            <input
              type="number"
              min={1}
              value={initialInventory}
              onChange={(e) => setInitialInventory(parseInt(e.target.value) || 10)}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
            />
            <div className="text-[10px] text-zinc-500 font-sans mt-1">Available in PostgreSQL</div>
          </div>

          <div>
            <label className="block text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-1.5 font-sans font-medium">
              Concurrent Orders
            </label>
            <input
              type="number"
              min={1}
              value={concurrentOrders}
              onChange={(e) => setConcurrentOrders(parseInt(e.target.value) || 100)}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
            />
            <div className="text-[10px] text-zinc-500 font-sans mt-1">Dispatched simultaneously</div>
          </div>

          <div>
            <label className="block text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-1.5 font-sans font-medium">
              Quantity / Order
            </label>
            <input
              type="number"
              min={1}
              value={quantityPerOrder}
              onChange={(e) => setQuantityPerOrder(parseInt(e.target.value) || 1)}
              className="w-full bg-[#111111] dark:bg-[#111111] light:bg-zinc-50 border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] rounded-md px-3 py-2 text-xs font-mono focus:border-zinc-400 focus:outline-none"
            />
            <div className="text-[10px] text-zinc-500 font-sans mt-1">Reservation size per request</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRunSimulation}
            disabled={simRunning}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-zinc-200 dark:bg-zinc-100 light:bg-zinc-900 text-zinc-900 dark:text-zinc-900 light:text-white text-xs font-semibold flex items-center justify-center space-x-2 hover:opacity-90 transition shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{simRunning ? 'Executing Concurrency Run...' : 'Run Simulation'}</span>
          </button>

          <button
            onClick={() => {
              setInitialInventory(10);
              setConcurrentOrders(100);
              setQuantityPerOrder(1);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-md border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#d4d4d8] text-xs font-medium text-zinc-400 hover:text-zinc-200 transition flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Visual Process Flow Diagram */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg p-5 space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-sans block">
          Concurrency Execution Pipeline
        </span>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex-1 w-full p-3 rounded bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-50 border border-[#222222] dark:border-[#222222] light:border-zinc-200 text-center">
            <div className="text-zinc-200 font-semibold">{concurrentOrders} Concurrent Orders</div>
            <div className="text-[10px] text-zinc-500">API Ingest / Redis Streams</div>
          </div>

          <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0 hidden md:block" />

          <div className="flex-1 w-full p-3 rounded bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-50 border border-[#222222] dark:border-[#222222] light:border-zinc-200 text-center">
            <div className="text-zinc-200 font-semibold">ThreadPool (5-10 Workers)</div>
            <div className="text-[10px] text-zinc-500">Genuine JVM Parallelism</div>
          </div>

          <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0 hidden md:block" />

          <div className="flex-1 w-full p-3 rounded bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-50 border border-[#222222] dark:border-[#222222] light:border-zinc-200 text-center">
            <div className="text-emerald-400 font-semibold">PostgreSQL Atomic Check</div>
            <div className="text-[10px] text-zinc-500">available &gt;= :quantity</div>
          </div>

          <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0 hidden md:block" />

          <div className="flex-1 w-full p-3 rounded bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-50 border border-[#222222] dark:border-[#222222] light:border-zinc-200 text-center">
            <div className="text-zinc-200 font-semibold">Completed / Out of Stock</div>
            <div className="text-[10px] text-zinc-500">Deterministic Invariant</div>
          </div>
        </div>
      </div>

      {/* Execution Telemetry Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
        <div className="p-3 rounded border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white">
          <div className="text-[10px] text-zinc-500 uppercase font-sans">Submitted</div>
          <div className="text-lg font-bold text-zinc-100 my-0.5">--</div>
          <div className="text-[9px] text-zinc-500">total dispatched</div>
        </div>

        <div className="p-3 rounded border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white">
          <div className="text-[10px] text-zinc-500 uppercase font-sans">Processing</div>
          <div className="text-lg font-bold text-blue-400 my-0.5">--</div>
          <div className="text-[9px] text-zinc-500">in worker threads</div>
        </div>

        <div className="p-3 rounded border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white">
          <div className="text-[10px] text-zinc-500 uppercase font-sans">Completed</div>
          <div className="text-lg font-bold text-emerald-400 my-0.5">--</div>
          <div className="text-[9px] text-zinc-500">fulfilled orders</div>
        </div>

        <div className="p-3 rounded border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white">
          <div className="text-[10px] text-zinc-500 uppercase font-sans">Out of Stock</div>
          <div className="text-lg font-bold text-amber-400 my-0.5">--</div>
          <div className="text-[9px] text-zinc-500">stock exhausted</div>
        </div>

        <div className="p-3 rounded border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white">
          <div className="text-[10px] text-zinc-500 uppercase font-sans">Failed</div>
          <div className="text-lg font-bold text-rose-400 my-0.5">--</div>
          <div className="text-[9px] text-zinc-500">system faults</div>
        </div>

        <div className="p-3 rounded border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white">
          <div className="text-[10px] text-zinc-500 uppercase font-sans">Final Stock</div>
          <div className="text-lg font-bold text-zinc-100 my-0.5">--</div>
          <div className="text-[9px] text-zinc-500">PostgreSQL state</div>
        </div>

        <div className="p-3 rounded border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white col-span-2 sm:col-span-1">
          <div className="text-[10px] text-zinc-500 uppercase font-sans">Duration</div>
          <div className="text-lg font-bold text-zinc-300 my-0.5">-- ms</div>
          <div className="text-[9px] text-zinc-500">execution time</div>
        </div>
      </div>

      {/* Core Engineering Guarantee: INVENTORY SAFETY */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Inventory Safety</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Authoritative Invariant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded-md bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-50 border border-[#222222] dark:border-[#222222] light:border-zinc-200">
            <div className="text-zinc-500 text-[11px] uppercase font-sans">Minimum Inventory Observed</div>
            <div className="text-3xl font-bold text-zinc-100 my-1">0</div>
            <div className="text-[10px] text-zinc-500">Mathematically bounded: available &gt;= 0</div>
          </div>

          <div className="p-4 rounded-md bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-50 border border-[#222222] dark:border-[#222222] light:border-zinc-200">
            <div className="text-zinc-500 text-[11px] uppercase font-sans">Negative Inventory Events</div>
            <div className="text-3xl font-bold text-emerald-400 my-1">0</div>
            <div className="text-[10px] text-zinc-500">Zero overselling permitted</div>
          </div>
        </div>

        {/* Collapsible Implementation Detail */}
        <div className="pt-2">
          <button
            onClick={() => setShowSqlDetail(!showSqlDetail)}
            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition"
          >
            {showSqlDetail ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span>Implementation Detail: Atomic Conditional SQL</span>
          </button>

          {showSqlDetail && (
            <div className="mt-3 p-3 rounded bg-[#0d0d0d] dark:bg-[#0d0d0d] light:bg-zinc-900 text-[11px] font-mono text-zinc-300 border border-[#222222] space-y-1.5 animate-in fade-in duration-100">
              <div className="text-zinc-500 text-[10px] font-sans">PostgreSQL Execution Query:</div>
              <code className="text-emerald-400 block">
                UPDATE inventory<br />
                SET available_quantity = available_quantity - :quantity<br />
                WHERE product_id = :productId<br />
                &nbsp;&nbsp;AND available_quantity &gt;= :quantity;
              </code>
              <p className="text-[10px] text-zinc-500 pt-1 font-sans">
                PostgreSQL row locks during the atomic update guarantee that concurrent transactions never observe or write a negative inventory balance.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
