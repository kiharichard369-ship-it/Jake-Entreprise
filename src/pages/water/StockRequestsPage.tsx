import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Package, CheckCircle, XCircle, Plus, Search, Filter, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { supabase } from '../../lib/supabase';

type RequestType = 'addition' | 'reduction';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

// Mock product list for cashier dropdown (replace with Supabase query)
const mockProducts = [
  { id: 'p1', size_label: '500ml Refill', current_stock: 200 },
  { id: 'p2', size_label: '1L Refill', current_stock: 150 },
  { id: 'p3', size_label: '5L Refill', current_stock: 100 },
  { id: 'p4', size_label: '10L Refill', current_stock: 40 },
  { id: 'p5', size_label: '20L Refill', current_stock: 5 },
  { id: 'p6', size_label: '20L New Bottle', current_stock: 10 },
  { id: 'p7', size_label: 'Caps', current_stock: 500 },
  { id: 'p8', size_label: 'PET 5L', current_stock: 20 },
  { id: 'p9', size_label: 'PET 10L', current_stock: 0 },
];

const mockRequests = [
  { id: 'r1', product: '20L Refill', product_id: 'p5', qty: 50, type: 'addition', reason: null, status: 'pending', cashier: 'Janet Wanjiku', created_at: '2026-05-16T09:15:00Z' },
  { id: 'r2', product: 'PET 10L', product_id: 'p9', qty: 20, type: 'addition', reason: null, status: 'pending', cashier: 'Peter Omondi', created_at: '2026-05-16T08:40:00Z' },
  { id: 'r3', product: '500ml Refill', product_id: 'p1', qty: 10, type: 'reduction', reason: 'Bottles cracked — damaged during transit', status: 'approved', cashier: 'Janet Wanjiku', created_at: '2026-05-15T14:20:00Z', reviewed_by: 'Admin Samuel', reviewed_at: '2026-05-15T14:45:00Z' },
  { id: 'r4', product: '1L Refill', product_id: 'p2', qty: 5, type: 'reduction', reason: 'Customer returned defective bottles', status: 'rejected', cashier: 'Peter Omondi', created_at: '2026-05-15T11:10:00Z', reviewed_by: 'Admin Samuel', reviewed_at: '2026-05-15T11:30:00Z', rejection_reason: 'Insufficient evidence of defect. Please provide photo.' },
  { id: 'r5', product: '5L Refill', product_id: 'p3', qty: 100, type: 'addition', reason: null, status: 'approved', cashier: 'Janet Wanjiku', created_at: '2026-05-14T10:00:00Z', reviewed_by: 'Admin Samuel', reviewed_at: '2026-05-14T10:30:00Z' },
];

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Cashier request form ─────────────────────────────────────────────────────
function CashierRequestView() {
  const { profile } = useAuth();
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('addition');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProduct = mockProducts.find((p) => p.id === productId);
  const myRequests = mockRequests.filter((r) => r.cashier === profile?.full_name);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!productId) e.product = 'Please select a product';
    if (!qty || Number(qty) <= 0) e.qty = 'Quantity must be greater than 0';
    if (requestType === 'reduction' && !reason.trim()) e.reason = 'Reason is required for stock reductions';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API
    toast.success('Stock request submitted. Admin will review shortly.');
    setProductId(''); setQty(''); setReason(''); setErrors({});
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Request form */}
      <div className="card p-6">
        <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
          <Plus size={18} className="text-blue-600" /> New Stock Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Product</label>
              <select
                value={productId}
                onChange={(e) => { setProductId(e.target.value); setErrors((p) => ({ ...p, product: '' })); }}
                className={`input-field ${errors.product ? 'border-red-400 focus:ring-red-200 focus:border-red-500' : ''}`}
              >
                <option value="">Select product…</option>
                {mockProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.size_label} (stock: {p.current_stock})
                  </option>
                ))}
              </select>
              {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Request Type</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['addition', 'reduction'] as RequestType[]).map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => { setRequestType(t); setErrors((p) => ({ ...p, reason: '' })); }}
                    className={`flex-1 py-2.5 text-sm font-bold capitalize transition-colors ${
                      requestType === t
                        ? t === 'addition' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'addition' ? '+ Addition' : '− Reduction'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Quantity {selectedProduct && <span className="text-gray-400 normal-case font-normal">(current stock: {selectedProduct.current_stock})</span>}
            </label>
            <input
              type="number" min="1" value={qty}
              onChange={(e) => { setQty(e.target.value); setErrors((p) => ({ ...p, qty: '' })); }}
              placeholder="Enter quantity"
              className={`input-field ${errors.qty ? 'border-red-400' : ''}`}
            />
            {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty}</p>}
          </div>

          {requestType === 'reduction' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }}
                placeholder="e.g. Bottles cracked, expired stock, inventory correction…"
                rows={3}
                className={`input-field resize-none ${errors.reason ? 'border-red-400' : ''}`}
              />
              {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={submitting}
              className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2 disabled:opacity-60"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
            <p className="text-xs text-gray-400">Admin will be notified immediately</p>
          </div>
        </form>
      </div>

      {/* My request history */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">My Request History</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {myRequests.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">No requests yet</p>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-sm">{req.product}</p>
                      <span className={`badge text-[10px] ${req.type === 'addition' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {req.type === 'addition' ? `+${req.qty}` : `−${req.qty}`}
                      </span>
                    </div>
                    {req.reason && <p className="text-xs text-gray-500 mb-1">"{req.reason}"</p>}
                    {req.status === 'rejected' && (req as any).rejection_reason && (
                      <div className="flex items-start gap-1.5 mt-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <XCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{(req as any).rejection_reason}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(req.created_at)}
                    </p>
                  </div>
                  <span className={`badge flex-shrink-0 ${
                    req.status === 'pending' ? 'badge-pending' :
                    req.status === 'approved' ? 'badge-paid' : 'badge-unpaid'
                  }`}>{req.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin approval view ──────────────────────────────────────────────────────
function AdminRequestView() {
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<typeof mockRequests[0] | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = mockRequests.filter((r) => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search || r.product.toLowerCase().includes(search.toLowerCase()) || r.cashier.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = mockRequests.filter((r) => r.status === 'pending').length;
  const approvedToday = mockRequests.filter((r) => r.status === 'approved').length;

  const handleApprove = async (req: typeof mockRequests[0]) => {
    setProcessing(req.id);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`Stock request approved — ${req.type === 'addition' ? '+' : '−'}${req.qty} ${req.product}`);
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
    setProcessing(rejectModal.id);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Request rejected. Cashier has been notified.');
    setRejectModal(null); setRejectReason(''); setProcessing(null);
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
          <p className="text-xs text-gray-400">awaiting review</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Today</p>
          <p className="text-3xl font-black text-green-600 mt-1">{approvedToday}</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total This Week</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{mockRequests.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search product or cashier…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Requests table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Product', 'Cashier', 'Type', 'Qty', 'Reason', 'Requested', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr key={req.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-semibold text-sm text-gray-900">{req.product}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{req.cashier}</td>
                <td className="px-4 py-3.5">
                  <span className={`badge text-[10px] ${req.type === 'addition' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {req.type}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-bold text-gray-900">{req.qty}</td>
                <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[150px]">
                  {req.reason || <span className="text-gray-300 italic">—</span>}
                  {req.status === 'rejected' && (req as any).rejection_reason && (
                    <p className="text-red-500 mt-1">Rejected: {(req as any).rejection_reason}</p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-400">{timeAgo(req.created_at)}</td>
                <td className="px-4 py-3.5">
                  <span className={`badge ${
                    req.status === 'pending' ? 'badge-pending' :
                    req.status === 'approved' ? 'badge-paid' : 'badge-unpaid'
                  }`}>{req.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={processing === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                      >
                        {processing === req.id ? <span className="w-3 h-3 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : <CheckCircle size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectModal(req)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                  {req.status !== 'pending' && (
                    <span className="text-xs text-gray-400">
                      by {(req as any).reviewed_by || '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No requests found</p>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Reject Request</h2>
            <p className="text-gray-500 text-sm mb-4">
              {rejectModal.cashier} — {rejectModal.type} of {rejectModal.qty} × {rejectModal.product}
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request is being rejected…"
                rows={3}
                className="input-field resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectReason.trim() || !!processing}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700 justify-center disabled:opacity-60">
                {processing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Reject Request
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page wrapper ─────────────────────────────────────────────────────────────
export default function StockRequestsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'water_admin' || role === 'super_admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
          <Package size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Stock Requests
          </h1>
          <p className="text-gray-500 text-sm">
            {isAdmin ? 'Review and approve stock additions and reductions' : 'Request stock changes — admin approval required'}
          </p>
        </div>
      </div>

      {isAdmin ? <AdminRequestView /> : <CashierRequestView />}
    </div>
  );
}
