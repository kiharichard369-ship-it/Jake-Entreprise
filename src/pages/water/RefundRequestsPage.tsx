import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, CheckCircle, XCircle, Search, Loader2, RefreshCw, X, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface RefundRequest {
  id: string; transaction_id: string; receipt_ref: string;
  amount: number; reason: string; notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  cashier: string; cashier_id: string;
  item_summary: string; created_at: string;
  rejection_reason?: string;
}
interface MyTransaction {
  id: string; receipt_ref: string; total: number;
  created_at: string; item_summary: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// ── Cashier View ─────────────────────────────────────────────────────────────
function CashierView({ shopId, profileId }: { shopId: string; profileId: string }) {
  const [myTx, setMyTx]           = useState<MyTransaction[]>([]);
  const [myRefunds, setMyRefunds] = useState<RefundRequest[]>([]);
  const [selectedTx, setSelectedTx] = useState('');
  const [reason, setReason]       = useState('');
  const [notes, setNotes]         = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: txs }, { data: refs }] = await Promise.all([
      supabase.from('transactions')
        .select('id, receipt_ref, total, created_at')
        .eq('cashier_id', profileId).eq('status', 'completed')
        .order('created_at', { ascending: false }).limit(30),
      supabase.from('refund_requests')
        .select('id, transaction_id, amount, reason, notes, status, created_at, transactions(receipt_ref)')
        .eq('cashier_id', profileId)
        .order('created_at', { ascending: false }).limit(20),
    ]);

    // Get item summaries
    const txIds = (txs || []).map((t: any) => t.id);
    let itemMap: Record<string, string> = {};
    if (txIds.length > 0) {
      const { data: items } = await supabase.from('transaction_items')
        .select('transaction_id, product_name, qty').in('transaction_id', txIds);
      (items || []).forEach((i: any) => {
        itemMap[i.transaction_id] = itemMap[i.transaction_id]
          ? itemMap[i.transaction_id] + `, ${i.product_name} ×${i.qty}`
          : `${i.product_name} ×${i.qty}`;
      });
    }

    setMyTx((txs || []).map((t: any) => ({
      id: t.id, receipt_ref: t.receipt_ref, total: Number(t.total),
      created_at: t.created_at, item_summary: itemMap[t.id] || '—',
    })));
    setMyRefunds((refs || []).map((r: any) => ({
      id: r.id, transaction_id: r.transaction_id,
      receipt_ref: r.transactions?.receipt_ref || '—',
      amount: Number(r.amount), reason: r.reason, notes: r.notes,
      status: r.status, cashier: '', cashier_id: profileId,
      item_summary: '—', created_at: r.created_at,
    })));
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const selectedTransaction = myTx.find((t) => t.id === selectedTx);
  // Check if transaction already has a pending/approved refund
  const alreadyRefunded = myRefunds.some(
    (r) => r.transaction_id === selectedTx && (r.status === 'pending' || r.status === 'approved')
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedTx) e.tx = 'Select a transaction';
    if (!reason.trim()) e.reason = 'Reason is required';
    if (alreadyRefunded) e.tx = 'This transaction already has a pending or approved refund';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);

    const { error } = await supabase.from('refund_requests').insert({
      transaction_id: selectedTx,
      cashier_id: profileId,
      reason: reason.trim(),
      notes: notes.trim() || null,
      amount: selectedTransaction!.total,
      status: 'pending',
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }

    toast.success('Refund request submitted — admin will review shortly');
    setSelectedTx(''); setReason(''); setNotes(''); setErrors({});
    setSubmitting(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
          <RotateCcw size={18} className="text-blue-600" /> New Refund Request
        </h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
          ⚠️ Refund requests require admin approval. The amount is pre-filled from the original transaction total.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Transaction <span className="text-red-500">*</span></label>
            <select value={selectedTx}
              onChange={(e) => { setSelectedTx(e.target.value); setErrors((p) => ({ ...p, tx: '' })); }}
              className={`input-field ${errors.tx ? 'border-red-400' : ''}`}>
              <option value="">Select completed transaction…</option>
              {myTx.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.receipt_ref} — {t.item_summary.substring(0, 50)} — KES {t.total} ({timeAgo(t.created_at)})
                </option>
              ))}
            </select>
            {errors.tx && <p className="text-xs text-red-500 mt-1">{errors.tx}</p>}
          </div>

          {selectedTransaction && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Receipt</p><p className="font-bold font-mono">{selectedTransaction.receipt_ref}</p></div>
              <div><p className="text-xs text-gray-500">Items</p><p className="font-medium text-xs">{selectedTransaction.item_summary}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{fmt(selectedTransaction.created_at)}</p></div>
              <div>
                <p className="text-xs text-gray-500">Refund Amount</p>
                <p className="font-black text-xl text-green-700">KES {selectedTransaction.total.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">Read-only — full transaction amount</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason <span className="text-red-500">*</span></label>
            <textarea value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }}
              rows={3} className={`input-field resize-none ${errors.reason ? 'border-red-400' : ''}`}
              placeholder="Describe why this refund is needed…" />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Additional Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Any extra context…" />
          </div>

          <button type="submit" disabled={submitting || !selectedTx}
            className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2 disabled:opacity-60">
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit Refund Request'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">My Refund Requests</h3>
          <button onClick={load} className="btn-ghost gap-1.5 text-sm"><RefreshCw size={13} /></button>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : myRefunds.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">No refund requests yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {myRefunds.map((rf) => (
              <div key={rf.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm font-mono">{rf.receipt_ref}</p>
                  <p className="text-xs text-gray-600 mt-0.5">"{rf.reason}"</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={9} />{timeAgo(rf.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-gray-900">KES {rf.amount.toLocaleString()}</p>
                  <span className={`badge mt-1 ${rf.status === 'pending' ? 'badge-pending' : rf.status === 'approved' ? 'badge-paid' : 'badge-unpaid'}`}>
                    {rf.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin View ────────────────────────────────────────────────────────────────
function AdminView({ shopId, adminId }: { shopId: string; adminId: string }) {
  const [refunds, setRefunds]       = useState<RefundRequest[]>([]);
  const [filter, setFilter]         = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [rejectModal, setRejectModal] = useState<RefundRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('refund_requests')
      .select(`id, amount, reason, notes, status, created_at,
        profiles!cashier_id(id, full_name),
        transactions(id, receipt_ref, shop_id)`)
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }

    // Filter to this shop
    const filtered = (data || []).filter((r: any) => r.transactions?.shop_id === shopId);

    // Get item summaries
    const txIds = filtered.map((r: any) => r.transactions?.id).filter(Boolean);
    let itemMap: Record<string, string> = {};
    if (txIds.length > 0) {
      const { data: items } = await supabase.from('transaction_items')
        .select('transaction_id, product_name, qty').in('transaction_id', txIds);
      (items || []).forEach((i: any) => {
        itemMap[i.transaction_id] = itemMap[i.transaction_id]
          ? itemMap[i.transaction_id] + `, ${i.product_name} ×${i.qty}`
          : `${i.product_name} ×${i.qty}`;
      });
    }

    setRefunds(filtered.map((r: any) => ({
      id: r.id,
      transaction_id: r.transactions?.id || '',
      receipt_ref: r.transactions?.receipt_ref || '—',
      amount: Number(r.amount), reason: r.reason, notes: r.notes,
      status: r.status, created_at: r.created_at,
      cashier: r.profiles?.full_name || '—',
      cashier_id: r.profiles?.id || '',
      item_summary: itemMap[r.transactions?.id] || '—',
    })));
    setLoading(false);
  }, [shopId, filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (rf: RefundRequest) => {
    setProcessingId(rf.id);
    const now = new Date().toISOString();
    const { error } = await supabase.from('refund_requests').update({
      status: 'approved', reviewed_by: adminId, reviewed_at: now,
    }).eq('id', rf.id);
    if (error) { toast.error(error.message); setProcessingId(null); return; }
    // Mark original transaction as refunded
    await supabase.from('transactions').update({ status: 'refunded' }).eq('id', rf.transaction_id);
    // Notify cashier
    if (rf.cashier_id) {
      await supabase.from('notifications').insert({
        recipient_id: rf.cashier_id, type: 'refund_approved',
        title: 'Refund Approved',
        body: `Your refund of KES ${rf.amount.toLocaleString()} for ${rf.receipt_ref} has been approved.`,
      });
    }
    toast.success(`Refund approved — KES ${rf.amount.toLocaleString()}`);
    setProcessingId(null);
    load();
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) { toast.error('Enter a rejection reason'); return; }
    setProcessingId(rejectModal.id);
    const { error } = await supabase.from('refund_requests').update({
      status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    }).eq('id', rejectModal.id);
    if (error) { toast.error(error.message); setProcessingId(null); return; }
    if (rejectModal.cashier_id) {
      await supabase.from('notifications').insert({
        recipient_id: rejectModal.cashier_id, type: 'refund_rejected',
        title: 'Refund Rejected',
        body: `Your refund request for ${rejectModal.receipt_ref} was rejected. Reason: ${rejectReason}`,
      });
    }
    toast.success('Refund rejected');
    setRejectModal(null); setRejectReason(''); setProcessingId(null);
    load();
  };

  const displayed = refunds.filter((r) =>
    !search || r.receipt_ref.toLowerCase().includes(search.toLowerCase()) || r.cashier.toLowerCase().includes(search.toLowerCase())
  );
  const pendingKES  = refunds.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const approvedKES = refunds.filter((r) => r.status === 'approved').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending (KES)</p>
          <p className="text-2xl font-black text-amber-600 mt-1">KES {pendingKES.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{refunds.filter((r) => r.status === 'pending').length} requests</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-black text-green-600 mt-1">KES {approvedKES.toLocaleString()}</p>
        </div>
        <div className="card p-4 border-l-4 border-red-400">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-black text-red-600 mt-1">{refunds.filter((r) => r.status === 'rejected').length}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search receipt or cashier…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{f}</button>
          ))}
        </div>
        <button onClick={load} className="btn-ghost gap-1.5 text-sm"><RefreshCw size={13} /></button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{['Receipt', 'Cashier', 'Items', 'Reason', 'Amount', 'Status', 'Actions'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded-xl animate-pulse" /></td></tr>
            )) : displayed.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No refund requests found</td></tr>
            ) : displayed.map((rf) => (
              <tr key={rf.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3.5">
                  <p className="font-mono font-bold text-sm text-gray-900">{rf.receipt_ref}</p>
                  <p className="text-[10px] text-gray-400">{timeAgo(rf.created_at)}</p>
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-700">{rf.cashier}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[120px]"><p className="truncate">{rf.item_summary}</p></td>
                <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[140px]"><p className="truncate italic">"{rf.reason}"</p></td>
                <td className="px-4 py-3.5 font-black text-gray-900">KES {rf.amount.toLocaleString()}</td>
                <td className="px-4 py-3.5">
                  <span className={`badge ${rf.status === 'pending' ? 'badge-pending' : rf.status === 'approved' ? 'badge-paid' : 'badge-unpaid'}`}>{rf.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  {rf.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApprove(rf)} disabled={processingId === rf.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold disabled:opacity-60">
                        {processingId === rf.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                      </button>
                      <button onClick={() => setRejectModal(rf)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold">
                        <XCircle size={11} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-gray-900">Reject Refund</h2>
              <button onClick={() => setRejectModal(null)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">{rejectModal.receipt_ref} — KES {rejectModal.amount.toLocaleString()}</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              className="input-field resize-none w-full" placeholder="Rejection reason…" autoFocus />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectReason.trim() || !!processingId}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700 justify-center gap-2 disabled:opacity-60">
                {processingId && <Loader2 size={14} className="animate-spin" />} Reject
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RefundRequestsPage() {
  const { role, profile, shopId } = useAuth();
  const isAdmin = role === 'water_admin' || role === 'super_admin';

  if (!profile || !shopId) return (
    <div className="p-6 flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center"><RotateCcw size={20} className="text-white" /></div>
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Refund Requests</h1>
          <p className="text-gray-500 text-sm">{isAdmin ? 'Review and process refunds' : 'Initiate refund requests'}</p>
        </div>
      </div>
      {isAdmin
        ? <AdminView shopId={shopId} adminId={profile.id} />
        : <CashierView shopId={shopId} profileId={profile.id} />
      }
    </div>
  );
}