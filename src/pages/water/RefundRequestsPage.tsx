import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RotateCcw, CheckCircle, XCircle, Search, Receipt, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

type RefundStatus = 'all' | 'pending' | 'approved' | 'rejected';

const mockTransactions = [
  { id: 'tx1', receipt_ref: 'RCP-A1B2C3D4', items: '5L Refill ×4, 20L Refill ×2', total: 760, created_at: '2026-05-16T10:15:00Z', cashier: 'Janet Wanjiku', method: 'mpesa' },
  { id: 'tx2', receipt_ref: 'RCP-E5F6G7H8', items: '1L New Bottle ×2', total: 100, created_at: '2026-05-16T09:30:00Z', cashier: 'Janet Wanjiku', method: 'cash' },
  { id: 'tx3', receipt_ref: 'RCP-I9J0K1L2', items: '20L Refill ×3', total: 450, created_at: '2026-05-15T14:00:00Z', cashier: 'Peter Omondi', method: 'mpesa' },
];

const mockRefunds = [
  { id: 'rf1', receipt_ref: 'RCP-M3N4O5P6', items: '10L Refill ×1', amount: 80, reason: 'Customer received wrong product size', status: 'pending', cashier: 'Janet Wanjiku', created_at: '2026-05-16T11:00:00Z' },
  { id: 'rf2', receipt_ref: 'RCP-Q7R8S9T0', items: 'PET 5L ×2', amount: 220, reason: 'Bottles were already cracked on delivery', status: 'approved', cashier: 'Peter Omondi', created_at: '2026-05-15T13:00:00Z', reviewed_by: 'Admin Samuel', reviewed_at: '2026-05-15T13:25:00Z' },
  { id: 'rf3', receipt_ref: 'RCP-U1V2W3X4', items: 'Caps ×5', amount: 100, reason: 'Customer changed mind', status: 'rejected', cashier: 'Janet Wanjiku', created_at: '2026-05-14T16:00:00Z', reviewed_by: 'Admin Samuel', reviewed_at: '2026-05-14T16:20:00Z', rejection_reason: 'Change of mind is not grounds for refund per policy.' },
];

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CashierRefundView() {
  const { profile } = useAuth();
  const [selectedTx, setSelectedTx] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = mockTransactions.find((t) => t.id === selectedTx);
  const myRefunds = mockRefunds.filter((r) => r.cashier === profile?.full_name);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedTx) e.tx = 'Please select a transaction';
    if (!reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Refund request submitted. Admin will review shortly.');
    setSelectedTx(''); setReason(''); setNotes(''); setErrors({});
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
          <RotateCcw size={18} className="text-blue-600" /> New Refund Request
        </h2>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Refund requests require admin approval. The amount is pre-filled from the original transaction and cannot be changed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Select Transaction</label>
            <select
              value={selectedTx}
              onChange={(e) => { setSelectedTx(e.target.value); setErrors((p) => ({ ...p, tx: '' })); }}
              className={`input-field ${errors.tx ? 'border-red-400' : ''}`}
            >
              <option value="">Select a completed transaction…</option>
              {mockTransactions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.receipt_ref} — {t.items} — KES {t.total} ({timeAgo(t.created_at)})
                </option>
              ))}
            </select>
            {errors.tx && <p className="text-xs text-red-500 mt-1">{errors.tx}</p>}
          </div>

          {selected && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 text-xs">Receipt</span><p className="font-bold font-mono">{selected.receipt_ref}</p></div>
              <div><span className="text-gray-500 text-xs">Items</span><p className="font-medium">{selected.items}</p></div>
              <div><span className="text-gray-500 text-xs">Payment</span><p className="font-medium capitalize">{selected.method}</p></div>
              <div>
                <span className="text-gray-500 text-xs">Refund Amount</span>
                <p className="font-black text-xl text-green-700">KES {selected.total.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">Read-only — full transaction amount</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }}
              placeholder="Describe why this refund is needed…"
              rows={3}
              className={`input-field resize-none ${errors.reason ? 'border-red-400' : ''}`}
            />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Additional Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Any extra context for the admin…" />
          </div>

          <button type="submit" disabled={submitting || !selectedTx}
            className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2 disabled:opacity-60">
            {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit Refund Request'}
          </button>
        </form>
      </div>

      {/* My refund history */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">My Refund Requests</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {myRefunds.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">No refund requests yet</p>
          ) : (
            myRefunds.map((rf) => (
              <div key={rf.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-sm font-mono">{rf.receipt_ref}</p>
                      <p className="text-xs text-gray-500">{rf.items}</p>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">"{rf.reason}"</p>
                    {rf.status === 'rejected' && (rf as any).rejection_reason && (
                      <div className="flex items-start gap-1.5 p-2 bg-red-50 rounded-lg border border-red-100 mt-1">
                        <XCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{(rf as any).rejection_reason}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(rf.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-gray-900">KES {rf.amount.toLocaleString()}</p>
                    <span className={`badge mt-1 ${
                      rf.status === 'pending' ? 'badge-pending' :
                      rf.status === 'approved' ? 'badge-paid' : 'badge-unpaid'
                    }`}>{rf.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminRefundView() {
  const [filter, setFilter] = useState<RefundStatus>('pending');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<typeof mockRefunds[0] | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = mockRefunds.filter((r) => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search || r.receipt_ref.toLowerCase().includes(search.toLowerCase()) || r.cashier.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingKES = mockRefunds.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const approvedKES = mockRefunds.filter((r) => r.status === 'approved').reduce((s, r) => s + r.amount, 0);

  const handleApprove = async (rf: typeof mockRefunds[0]) => {
    setProcessing(rf.id);
    await new Promise((r) => setTimeout(r, 700));
    toast.success(`Refund approved — KES ${rf.amount.toLocaleString()} for ${rf.receipt_ref}`);
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
    setProcessing(rejectModal.id);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Refund rejected. Cashier has been notified.');
    setRejectModal(null); setRejectReason(''); setProcessing(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending (KES)</p>
          <p className="text-2xl font-black text-amber-600 mt-1">KES {pendingKES.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{mockRefunds.filter((r) => r.status === 'pending').length} requests</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved This Month</p>
          <p className="text-2xl font-black text-green-600 mt-1">KES {approvedKES.toLocaleString()}</p>
        </div>
        <div className="card p-4 border-l-4 border-red-400">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-black text-red-600 mt-1">{mockRefunds.filter((r) => r.status === 'rejected').length}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search receipt or cashier…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['pending', 'approved', 'rejected', 'all'] as RefundStatus[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{['Receipt Ref', 'Cashier', 'Items', 'Reason', 'Amount', 'Status', 'Actions'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((rf) => (
              <tr key={rf.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3.5">
                  <p className="font-mono font-bold text-sm text-gray-900">{rf.receipt_ref}</p>
                  <p className="text-[10px] text-gray-400">{timeAgo(rf.created_at)}</p>
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-700">{rf.cashier}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600">{rf.items}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[160px]">
                  {rf.reason}
                  {rf.status === 'rejected' && (rf as any).rejection_reason && (
                    <p className="text-red-500 text-[10px] mt-1">↳ {(rf as any).rejection_reason}</p>
                  )}
                </td>
                <td className="px-4 py-3.5 font-black text-gray-900">KES {rf.amount.toLocaleString()}</td>
                <td className="px-4 py-3.5">
                  <span className={`badge ${rf.status === 'pending' ? 'badge-pending' : rf.status === 'approved' ? 'badge-paid' : 'badge-unpaid'}`}>{rf.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  {rf.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(rf)} disabled={processing === rf.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold disabled:opacity-60">
                        {processing === rf.id ? <span className="w-3 h-3 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : <CheckCircle size={12} />} Approve
                      </button>
                      <button onClick={() => setRejectModal(rf)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">by {(rf as any).reviewed_by}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-gray-400"><p className="font-medium">No refund requests found</p></div>}
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Reject Refund</h2>
            <p className="text-gray-500 text-sm mb-4">{rejectModal.receipt_ref} — KES {rejectModal.amount.toLocaleString()}</p>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this refund is being rejected…" rows={3} className="input-field resize-none" autoFocus />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectReason.trim() || !!processing}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700 justify-center disabled:opacity-60">Reject Refund</button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RefundRequestsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'water_admin' || role === 'super_admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
          <RotateCcw size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Refund Requests
          </h1>
          <p className="text-gray-500 text-sm">{isAdmin ? 'Review and process customer refunds' : 'Initiate refund requests — admin approval required'}</p>
        </div>
      </div>
      {isAdmin ? <AdminRefundView /> : <CashierRefundView />}
    </div>
  );
}
