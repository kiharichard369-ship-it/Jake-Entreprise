import React, { useState, useEffect, useCallback } from 'react';
import { Package, CheckCircle, XCircle, Plus, Search, Loader2, RefreshCw, X, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type RequestType = 'addition' | 'reduction';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface StockRequest {
  id: string; product_id: string; product: string;
  qty: number; type: RequestType; reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  cashier: string; cashier_id: string;
  created_at: string; rejection_reason?: string;
}
interface WaterProduct { id: string; size_label: string; current_stock: number; }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CashierView({ shopId, profileId, profileName }: { shopId: string; profileId: string; profileName: string }) {
  const [products, setProducts]     = useState<WaterProduct[]>([]);
  const [myRequests, setMyRequests] = useState<StockRequest[]>([]);
  const [productId, setProductId]   = useState('');
  const [qty, setQty]               = useState('');
  const [requestType, setRequestType] = useState<RequestType>('addition');
  const [reason, setReason]         = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: reqs }] = await Promise.all([
      supabase.from('water_products').select('id, size_label, current_stock')
        .eq('shop_id', shopId).eq('status', 'active').order('size_label'),
      supabase.from('stock_requests')
        .select('id, product_id, quantity, request_type, reason, status, created_at, water_products(size_label)')
        .eq('cashier_id', profileId)
        .order('created_at', { ascending: false }).limit(20),
    ]);
    setProducts((prods || []) as WaterProduct[]);
    setMyRequests((reqs || []).map((r: any) => ({
      id: r.id, product_id: r.product_id, product: r.water_products?.size_label || '—',
      qty: r.quantity, type: r.request_type, reason: r.reason,
      status: r.status, cashier: profileName, cashier_id: profileId,
      created_at: r.created_at,
    })));
    setLoading(false);
  }, [shopId, profileId, profileName]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!productId) e.product = 'Select a product';
    if (!qty || Number(qty) <= 0) e.qty = 'Quantity must be greater than 0';
    if (requestType === 'reduction' && !reason.trim()) e.reason = 'Reason is required for reductions';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const { error } = await supabase.from('stock_requests').insert({
      shop_id: shopId, cashier_id: profileId,
      product_id: productId,
      quantity: Number(qty), request_type: requestType,
      reason: reason.trim() || null, status: 'pending',
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    // Notify admin
    await supabase.from('notifications').insert({
      recipient_id: profileId, // ideally water_admin id; using own as fallback
      type: 'stock_request_submitted',
      title: 'New Stock Request',
      body: `${requestType === 'addition' ? '+' : '−'}${qty} ${products.find(p => p.id === productId)?.size_label}`,
      link: '/water/admin/stock-requests',
    });
    toast.success('Request submitted — admin will review shortly');
    setProductId(''); setQty(''); setReason(''); setErrors({});
    setSubmitting(false);
    load();
  };

  const selected = products.find((p) => p.id === productId);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
          <Plus size={18} className="text-blue-600" /> New Stock Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Product</label>
              <select value={productId} onChange={(e) => { setProductId(e.target.value); setErrors((p) => ({ ...p, product: '' })); }}
                className={`input-field ${errors.product ? 'border-red-400' : ''}`}>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.size_label} (stock: {p.current_stock})</option>)}
              </select>
              {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Request Type</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['addition', 'reduction'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { setRequestType(t); setErrors((p) => ({ ...p, reason: '' })); }}
                    className={`flex-1 py-2.5 text-sm font-bold capitalize transition-colors ${requestType === t ? t === 'addition' ? 'bg-green-600 text-white' : 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {t === 'addition' ? '+ Addition' : '− Reduction'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Quantity {selected && <span className="text-gray-400 normal-case font-normal">(current stock: {selected.current_stock})</span>}
            </label>
            <input type="number" min="1" value={qty}
              onChange={(e) => { setQty(e.target.value); setErrors((p) => ({ ...p, qty: '' })); }}
              className={`input-field ${errors.qty ? 'border-red-400' : ''}`} placeholder="Enter quantity" />
            {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty}</p>}
          </div>
          {requestType === 'reduction' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason <span className="text-red-500">*</span></label>
              <textarea value={reason} onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }}
                rows={3} className={`input-field resize-none ${errors.reason ? 'border-red-400' : ''}`}
                placeholder="e.g. Bottles cracked, expired stock, inventory correction…" />
              {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2 disabled:opacity-60">
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">My Request History</h3>
          <button onClick={load} className="btn-ghost gap-1.5 text-sm"><RefreshCw size={13} /></button>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : myRequests.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">No requests yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {myRequests.map((req) => (
              <div key={req.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">{req.product}</p>
                    <span className={`badge text-[10px] ${req.type === 'addition' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {req.type === 'addition' ? `+${req.qty}` : `−${req.qty}`}
                    </span>
                  </div>
                  {req.reason && <p className="text-xs text-gray-500 italic">"{req.reason}"</p>}
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={9} />{timeAgo(req.created_at)}</p>
                </div>
                <span className={`badge flex-shrink-0 ${req.status === 'pending' ? 'badge-pending' : req.status === 'approved' ? 'badge-paid' : 'badge-unpaid'}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminView({ shopId, adminId }: { shopId: string; adminId: string }) {
  const [requests, setRequests]     = useState<StockRequest[]>([]);
  const [filter, setFilter]         = useState<StatusFilter>('pending');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [rejectModal, setRejectModal] = useState<StockRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('stock_requests')
      .select('id, product_id, quantity, request_type, reason, status, created_at, profiles!cashier_id(id, full_name), water_products(size_label)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    setRequests((data || []).map((r: any) => ({
      id: r.id, product_id: r.product_id,
      product: r.water_products?.size_label || '—',
      qty: r.quantity, type: r.request_type, reason: r.reason,
      status: r.status, created_at: r.created_at,
      cashier: r.profiles?.full_name || '—',
      cashier_id: r.profiles?.id || '',
    })));
    setLoading(false);
  }, [shopId, filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (req: StockRequest) => {
    setProcessingId(req.id);
    const now = new Date().toISOString();
    const { error } = await supabase.from('stock_requests').update({
      status: 'approved', reviewed_by: adminId, reviewed_at: now,
    }).eq('id', req.id);
    if (error) { toast.error(error.message); setProcessingId(null); return; }
    // Update stock
    const { data: wp } = await supabase.from('water_products').select('current_stock').eq('id', req.product_id).single();
    if (wp) {
      const delta = req.type === 'addition' ? req.qty : -req.qty;
      await supabase.from('water_products').update({
        current_stock: Math.max(0, (wp as any).current_stock + delta), updated_at: now,
      }).eq('id', req.product_id);
    }
    // Notify cashier
    if (req.cashier_id) {
      await supabase.from('notifications').insert({
        recipient_id: req.cashier_id, type: 'stock_approved',
        title: 'Stock Request Approved',
        body: `Your request for ${req.type === 'addition' ? '+' : '−'}${req.qty} ${req.product} was approved.`,
      });
    }
    toast.success('Request approved and stock updated');
    setProcessingId(null);
    load();
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) { toast.error('Enter a rejection reason'); return; }
    setProcessingId(rejectModal.id);
    const { error } = await supabase.from('stock_requests').update({
      status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    }).eq('id', rejectModal.id);
    if (error) { toast.error(error.message); setProcessingId(null); return; }
    if (rejectModal.cashier_id) {
      await supabase.from('notifications').insert({
        recipient_id: rejectModal.cashier_id, type: 'stock_rejected',
        title: 'Stock Request Rejected',
        body: `Your request for ${rejectModal.product} was rejected. Reason: ${rejectReason}`,
      });
    }
    toast.success('Request rejected');
    setRejectModal(null); setRejectReason(''); setProcessingId(null);
    load();
  };

  const filtered = requests.filter((r) =>
    !search || r.product.toLowerCase().includes(search.toLowerCase()) || r.cashier.toLowerCase().includes(search.toLowerCase())
  );
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Today</p>
          <p className="text-3xl font-black text-green-600 mt-1">
            {requests.filter((r) => r.status === 'approved' && r.created_at.startsWith(new Date().toISOString().split('T')[0])).length}
          </p>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Requests</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{requests.length}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search product or cashier…" value={search}
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
            <tr>{['Product', 'Cashier', 'Type', 'Qty', 'Reason', 'Submitted', 'Status', 'Actions'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded-xl animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No requests found</td></tr>
            ) : filtered.map((req) => (
              <tr key={req.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-semibold text-sm text-gray-900">{req.product}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{req.cashier}</td>
                <td className="px-4 py-3.5">
                  <span className={`badge text-[10px] ${req.type === 'addition' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{req.type}</span>
                </td>
                <td className="px-4 py-3.5 font-bold text-gray-900">{req.qty}</td>
                <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[150px]">
                  {req.reason ? <span className="italic">"{req.reason}"</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-400">{timeAgo(req.created_at)}</td>
                <td className="px-4 py-3.5">
                  <span className={`badge ${req.status === 'pending' ? 'badge-pending' : req.status === 'approved' ? 'badge-paid' : 'badge-unpaid'}`}>{req.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  {req.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApprove(req)} disabled={processingId === req.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold disabled:opacity-60">
                        {processingId === req.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                      </button>
                      <button onClick={() => setRejectModal(req)}
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
              <h2 className="text-xl font-black text-gray-900">Reject Request</h2>
              <button onClick={() => setRejectModal(null)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">{rejectModal.cashier} — {rejectModal.type} of {rejectModal.qty} × {rejectModal.product}</p>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                className="input-field resize-none" placeholder="Explain why this request is rejected…" autoFocus />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectReason.trim() || !!processingId}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700 justify-center gap-2 disabled:opacity-60">
                {processingId && <Loader2 size={14} className="animate-spin" />} Reject Request
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockRequestsPage() {
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
        <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center"><Package size={20} className="text-white" /></div>
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Stock Requests</h1>
          <p className="text-gray-500 text-sm">{isAdmin ? 'Review and approve stock changes' : 'Request stock additions or reductions'}</p>
        </div>
      </div>
      {isAdmin
        ? <AdminView shopId={shopId} adminId={profile.id} />
        : <CashierView shopId={shopId} profileId={profile.id} profileName={profile.full_name} />
      }
    </div>
  );
}