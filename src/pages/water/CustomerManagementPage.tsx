import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Users, Plus, Search, Phone, MapPin, CreditCard, ChevronRight, Edit2, Loader2, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Customer {
  id: string; full_name: string; phone: string | null; location: string | null;
  customer_type: 'walk_in' | 'delivery'; credit_balance: number; created_at: string;
  business_id: string | null; shop_id: string | null;
}
interface TxSummary {
  id: string; receipt_ref: string; total: number;
  payment_method: string; created_at: string; item_summary: string;
}

function validatePhone(phone: string) {
  return /^(\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''));
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function CustomerManagementPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { shopId, businessId, profile } = useAuth();
  const [customers, setCustomers]       = useState<Customer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState<'all' | 'walk_in' | 'delivery'>('all');
  const [creditFilter, setCreditFilter] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailTx, setDetailTx]         = useState<TxSummary[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal]       = useState<Customer | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', location: '', customer_type: 'walk_in' as 'walk_in' | 'delivery' });
  const [formErrors, setFormErrors]     = useState<Record<string, string>>({});
  const [saving, setSaving]             = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('customers').select('*').order('full_name');
    if (shopId) q = q.eq('shop_id', shopId);
    else if (businessId) q = q.eq('business_id', businessId);
    const { data, error } = await q;
    if (error) { toast.error(error.message); }
    else setCustomers((data || []) as Customer[]);
    setLoading(false);
  }, [shopId, businessId]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (c: Customer) => {
    setDetailCustomer(c);
    setDetailLoading(true);
    const { data: txs } = await supabase.from('transactions')
      .select('id, receipt_ref, total, payment_method, created_at')
      .eq('customer_id', c.id)
      .order('created_at', { ascending: false }).limit(20);
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
    setDetailTx((txs || []).map((t: any) => ({
      id: t.id, receipt_ref: t.receipt_ref, total: Number(t.total),
      payment_method: t.payment_method,
      created_at: t.created_at, item_summary: itemMap[t.id] || '—',
    })));
    setDetailLoading(false);
  };

  const validateForm = (f: typeof form) => {
    const e: Record<string, string> = {};
    if (!f.full_name.trim()) e.full_name = 'Name is required';
    if (f.phone && !validatePhone(f.phone)) e.phone = 'Enter a valid Kenyan phone number (07XX or 01XX)';
    return e;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      location: form.location.trim() || null,
      customer_type: form.customer_type,
      business_id: businessId || 'water_retail',
      shop_id: shopId || null,
      credit_balance: 0,
    };
    const { error } = await supabase.from('customers').insert(payload);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(`${form.full_name} added`);
    setShowAddModal(false);
    setForm({ full_name: '', phone: '', location: '', customer_type: 'walk_in' });
    setFormErrors({});
    load();
    setSaving(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    const { error } = await supabase.from('customers').update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      location: form.location.trim() || null,
      customer_type: form.customer_type,
    }).eq('id', editModal.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success('Customer updated');
    setEditModal(null);
    setFormErrors({});
    setDetailCustomer(null);
    load();
    setSaving(false);
  };

  const filtered = customers.filter((c) => {
    const matchSearch = !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search);
    const matchType   = typeFilter === 'all' || c.customer_type === typeFilter;
    const matchCredit = !creditFilter || c.credit_balance > 0;
    return matchSearch && matchType && matchCredit;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center"><Users size={20} className="text-white" /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Customers</h1>
            <p className="text-gray-500 text-sm">Walk-in and delivery customer records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="btn-ghost gap-1.5 text-sm disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button onClick={() => { setShowAddModal(true); setForm({ full_name: '', phone: '', location: '', customer_type: 'walk_in' }); setFormErrors({}); }}
            className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2"><Plus size={15} /> Add Customer</button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total', val: customers.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'With Credit', val: customers.filter((c) => c.credit_balance > 0).length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Delivery', val: customers.filter((c) => c.customer_type === 'delivery').length, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Walk-in', val: customers.filter((c) => c.customer_type === 'walk_in').length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className={`card px-4 py-2.5 flex items-center gap-3 ${s.bg}`}>
            <p className={`font-black text-xl ${s.color}`}>{s.val}</p>
            <p className="text-sm font-medium text-gray-700">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or phone…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['all', 'walk_in', 'delivery'] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${typeFilter === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {t === 'all' ? 'All' : t === 'walk_in' ? 'Walk-in' : 'Delivery'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
          <input type="checkbox" checked={creditFilter} onChange={(e) => setCreditFilter(e.target.checked)} className="accent-blue-600" />
          <span className="text-sm font-medium text-gray-700">Has credit balance</span>
        </label>
      </div>

      {/* Customer grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-20" /><p className="font-medium">No customers found</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => openDetail(c)}
              className="card p-4 text-left hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${c.customer_type === 'delivery' ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{c.full_name}</p>
                  <span className={`badge text-[10px] ${c.customer_type === 'delivery' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {c.customer_type === 'walk_in' ? 'Walk-in' : 'Delivery'}
                  </span>
                </div>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
              <div className="space-y-1">
                {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone size={11} />{c.phone}</p>}
                {c.location && <p className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin size={11} />{c.location}</p>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Since {new Date(c.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</p>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Credit</p>
                  <p className={`font-black text-sm ${c.credit_balance > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                    {c.credit_balance > 0 ? `KES ${c.credit_balance.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailCustomer && (
        <div className="modal-overlay" onClick={() => setDetailCustomer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 text-white ${detailCustomer.customer_type === 'delivery' ? 'hero-delivery' : 'hero-water'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
                    {detailCustomer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-black text-xl">{detailCustomer.full_name}</h2>
                    <p className="text-white/70 text-sm capitalize">{detailCustomer.customer_type.replace('_', '-')} customer</p>
                    <p className="text-white/50 text-xs mt-0.5">Since {new Date(detailCustomer.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <button onClick={() => setDetailCustomer(null)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div><p className="text-white/60 text-xs">Phone</p><p className="font-bold text-sm mt-0.5">{detailCustomer.phone || '—'}</p></div>
                <div><p className="text-white/60 text-xs">Location</p><p className="font-bold text-sm mt-0.5 truncate">{detailCustomer.location || '—'}</p></div>
                <div>
                  <p className="text-white/60 text-xs">Credit Balance</p>
                  <p className={`font-black text-xl mt-0.5 ${detailCustomer.credit_balance > 0 ? 'text-green-300' : 'text-white/40'}`}>
                    {detailCustomer.credit_balance > 0 ? `KES ${detailCustomer.credit_balance.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <h3 className="font-black text-gray-900 text-sm">Recent Transactions</h3>
              {detailLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : detailTx.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {detailTx.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${tx.payment_method === 'mpesa' ? 'bg-green-50' : 'bg-amber-50'}`}>
                        {tx.payment_method === 'mpesa' ? '📱' : '💵'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-gray-500">{tx.receipt_ref}</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{tx.item_summary}</p>
                        <p className="text-[10px] text-gray-400">{timeAgo(tx.created_at)}</p>
                      </div>
                      <p className="font-black text-sm text-gray-900 flex-shrink-0">KES {tx.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => {
                  setEditModal(detailCustomer);
                  setForm({ full_name: detailCustomer.full_name, phone: detailCustomer.phone || '', location: detailCustomer.location || '', customer_type: detailCustomer.customer_type });
                  setFormErrors({});
                }} className="btn-ghost gap-2 text-sm"><Edit2 size={14} /> Edit Details</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditModal(null); }}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">{editModal ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => { setShowAddModal(false); setEditModal(null); }} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>
            <form onSubmit={editModal ? handleEdit : handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input value={form.full_name}
                  onChange={(e) => { setForm((p) => ({ ...p, full_name: e.target.value })); setFormErrors((p) => ({ ...p, full_name: '' })); }}
                  className={`input-field ${formErrors.full_name ? 'border-red-400' : ''}`} placeholder="e.g. John Kamau" />
                {formErrors.full_name && <p className="text-xs text-red-500 mt-1">{formErrors.full_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input value={form.phone}
                  onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setFormErrors((p) => ({ ...p, phone: '' })); }}
                  className={`input-field ${formErrors.phone ? 'border-red-400' : ''}`} placeholder="07XX XXX XXX" />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Location</label>
                <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  className="input-field" placeholder="e.g. Milimani Estate, Nakuru" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Customer Type</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {(['walk_in', 'delivery'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, customer_type: t }))}
                      className={`flex-1 py-2.5 text-sm font-bold capitalize transition-colors ${form.customer_type === t ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {t === 'walk_in' ? '🚶 Walk-in' : '🚛 Delivery'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 btn bg-blue-700 text-white hover:bg-blue-900 justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? 'Saving…' : editModal ? 'Save Changes' : 'Add Customer'}
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); setEditModal(null); }} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}