import { useState } from 'react';
import { 
  X,
  Inbox
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { DeadLetterRecord } from '../types';

export function DlqView() {
  const [dlqRecords] = useState<DeadLetterRecord[]>([
    {
      id: 'dlq-1',
      orderNumber: 'ORD-99042',
      customer: 'internal-stress-runner',
      failureReason: 'ConnectionPoolTimeoutException: Acquired Hikari connection timed out after 3 retries',
      retryCount: 3,
      createdAt: '14:38:02.941',
      status: 'DEAD_LETTERED',
    },
  ]);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'retry' | 'resolve';
    record: DeadLetterRecord;
  } | null>(null);

  const [actionDoneMessage, setActionDoneMessage] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    setActionDoneMessage(
      `Action '${confirmAction.type.toUpperCase()}' dispatched for ${confirmAction.record.orderNumber}. (Engine integration wired in Phase 2)`
    );
    setConfirmAction(null);
    setTimeout(() => setActionDoneMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900 relative">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Dead Letter Queue
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
          Orders requiring diagnostic review after exhausting 3 retry attempts on transient faults
        </p>
      </div>

      {actionDoneMessage && (
        <div className="p-3 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-emerald-400 font-mono">
          {actionDoneMessage}
        </div>
      )}

      {/* DLQ Diagnostics Table */}
      <div className="border border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#141414] dark:bg-[#141414] light:bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-b border-[#262626] dark:border-[#262626] light:border-[#e5e5e5] bg-[#111111] dark:bg-[#111111] light:bg-[#fafafa]">
              <tr>
                <th className="px-4 py-2 font-medium">Order Number</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Failure Reason</th>
                <th className="px-4 py-2 font-medium text-center">Retries</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50 dark:divide-[#262626]/50 light:divide-zinc-200">
              {dlqRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-zinc-500 font-sans">
                    <div className="space-y-1">
                      <Inbox className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-400">Dead Letter Queue is empty</p>
                      <p className="text-[11px] text-zinc-500">Zero orders have exceeded the 3-attempt retry limit.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                dlqRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#181818] dark:hover:bg-[#181818] light:hover:bg-zinc-50 transition">
                    <td className="px-4 py-3 font-bold text-zinc-200 dark:text-zinc-200 light:text-zinc-900">{rec.orderNumber}</td>
                    <td className="px-4 py-3 text-zinc-400 font-sans">{rec.customer}</td>
                    <td className="px-4 py-3 text-rose-400/90 max-w-xs truncate text-[11px]" title={rec.failureReason}>
                      {rec.failureReason}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400">{rec.retryCount} / 3</td>
                    <td className="px-4 py-3 text-zinc-500 text-[11px]">{rec.createdAt}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setConfirmAction({ type: 'retry', record: rec })}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-zinc-300 text-zinc-300 hover:bg-[#222222] transition"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'resolve', record: rec })}
                          className="px-2.5 py-1 rounded text-[11px] font-mono border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-zinc-300 text-zinc-300 hover:bg-[#222222] transition"
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

      {/* Confirmation Dialog Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#171717] dark:bg-[#171717] light:bg-white border border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e5e5e5] rounded-xl shadow-2xl p-5 space-y-4 font-sans text-zinc-100 dark:text-zinc-100 light:text-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Confirm {confirmAction.type === 'retry' ? 'Requeue' : 'Resolution'}
              </h3>
              <button
                onClick={() => setConfirmAction(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Are you sure you want to {confirmAction.type} order <span className="text-zinc-200 font-mono font-semibold">{confirmAction.record.orderNumber}</span>?
              {confirmAction.type === 'retry' && ' This will reset the retry counter and re-inject the transaction into the thread pool.'}
              {confirmAction.type === 'resolve' && ' This will mark the failure as acknowledged and archive the dead-letter record.'}
            </p>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 rounded-md border border-[#2e2e2e] text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-100 light:bg-zinc-900 text-zinc-900 dark:text-zinc-900 light:text-white font-medium text-xs hover:opacity-90 transition"
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
