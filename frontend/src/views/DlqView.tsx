import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X,
  Inbox,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

interface DeadLetterItem {
  id: number;
  orderId: number;
  orderNumber: string;
  reason: string;
  payload: string;
  retryCount: number;
  failedAt: string;
}

export function DlqView() {
  const [dlqRecords, setDlqRecords] = useState<DeadLetterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [actionDoneMessage, setActionDoneMessage] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'retry' | 'resolve';
    record: DeadLetterItem;
  } | null>(null);

  const fetchDlq = async () => {
    try {
      setLoading(true);
      const res = await axios.get<{ content: DeadLetterItem[] }>('/api/dlq');
      if (res.data?.content) {
        setDlqRecords(res.data.content);
      }
    } catch (e) {
      console.error('Failed to load DLQ records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDlq();
  }, []);

  const handleSimulateFault = async () => {
    try {
      setSimulating(true);
      setActionDoneMessage('Dispatched test order with transient gateway fault. Running 3 exponential backoff retries...');
      await axios.post('/api/dlq/simulate');
      // Wait for the 3 retries (50ms + 100ms + 200ms + DB commits) to exhaust
      setTimeout(() => {
        fetchDlq();
        setSimulating(false);
        setActionDoneMessage('Order exhausted 3 retries and safely quarantined into Dead Letter Queue!');
        setTimeout(() => setActionDoneMessage(null), 5000);
      }, 1200);
    } catch (err: any) {
      setActionDoneMessage(`Failed to trigger simulated fault: ${err.message}`);
      setSimulating(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'retry') {
        await axios.post(`/api/dlq/${confirmAction.record.id}/retry`);
        setActionDoneMessage(`Order ${confirmAction.record.orderNumber} re-queued for execution!`);
      } else {
        await axios.post(`/api/dlq/${confirmAction.record.id}/resolve`);
        setActionDoneMessage(`Order ${confirmAction.record.orderNumber} resolved and cleared.`);
      }
      setConfirmAction(null);
      fetchDlq();
      setTimeout(() => setActionDoneMessage(null), 3000);
    } catch (err: any) {
      setActionDoneMessage(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900 relative">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Dead Letter Queue
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
            Orders requiring diagnostic review after exhausting 3 retry attempts on transient faults
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateFault}
            disabled={simulating}
            className="px-3 py-1.5 rounded-md bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 hover:text-rose-100 hover:bg-rose-900/50 flex items-center space-x-1.5 transition-colors"
          >
            <AlertTriangle className={`h-3 w-3 ${simulating ? 'animate-spin text-rose-400' : 'text-rose-400'}`} />
            <span>{simulating ? 'Simulating Retries...' : '⚡ Simulate Fault Order'}</span>
          </button>
          <button
            onClick={fetchDlq}
            disabled={loading}
            className="px-3 py-1.5 rounded-md border border-[#2e2e2e] text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionDoneMessage && (
        <div className="p-3 rounded-md bg-[#181818] border border-zinc-700 text-xs text-emerald-400 font-mono flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionDoneMessage}</span>
        </div>
      )}

      {/* DLQ Diagnostics Table */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order Number</th>
                <th className="px-4 py-2.5 font-medium">Failure Reason</th>
                <th className="px-4 py-2.5 font-medium text-center">Retries</th>
                <th className="px-4 py-2.5 font-medium">Failed At</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
              {dlqRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-zinc-500 font-sans">
                    <div className="space-y-1">
                      <Inbox className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-400">Dead Letter Queue is empty</p>
                      <p className="text-[11px] text-zinc-500">Zero orders have exceeded the 3-attempt retry limit.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                dlqRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#181818] transition">
                    <td className="px-4 py-3 font-bold text-zinc-200">{rec.orderNumber}</td>
                    <td className="px-4 py-3 text-rose-400 max-w-xs truncate text-[11px]" title={rec.reason}>
                      {rec.reason}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400">{rec.retryCount} / 3</td>
                    <td className="px-4 py-3 text-zinc-500 text-[11px]">
                      {rec.failedAt ? new Date(rec.failedAt).toLocaleString() : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status="DEAD_LETTERED" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setConfirmAction({ type: 'retry', record: rec })}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-[#2e2e2e] text-emerald-400 hover:bg-[#222222] transition"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'resolve', record: rec })}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-[#2e2e2e] text-zinc-400 hover:bg-[#222222] transition"
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
                Confirm {confirmAction.type === 'retry' ? 'Re-Queue' : 'Resolution'}
              </h3>
              <button onClick={() => setConfirmAction(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              {confirmAction.type === 'retry'
                ? `Are you sure you want to requeue order ${confirmAction.record.orderNumber} for execution? The order retry counter will reset to 0.`
                : `Are you sure you want to dismiss and clear DLQ record for order ${confirmAction.record.orderNumber}?`}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 rounded border border-[#2e2e2e] text-xs font-mono text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 rounded bg-emerald-500 text-zinc-950 font-semibold text-xs font-mono hover:bg-emerald-400 transition"
              >
                Confirm {confirmAction.type === 'retry' ? 'Retry' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
