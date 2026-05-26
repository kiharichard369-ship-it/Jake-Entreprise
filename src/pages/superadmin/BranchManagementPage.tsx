import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Edit2, UserX, UserCheck, MapPin,
  Loader2, RefreshCw, X, AlertCircle, Users, Package, TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface Shop {
  id: string;
  name: string;
  location: string | null;
  business_id: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface ShopStats {
  shop_id: string;
  staff_count: number;
  revenue_today: number;
  txns_today: number;
}

const BUSINESSES = [
  { id: 'water_retail',   label: 'Water Retail',          emoji: '💧', color: 'bg-blue-50 text-blue-700 border-blue-200',   gradient: 'hero-water'    },
  { id: 'rb',             label: 'Restaurant & Butchery',  emoji: '🔥', color: 'bg-orange-50 text-orange-700 border-orange-200', gradient: 'hero-rb'   },
  { id: 'water_delivery', label: 'Water Delivery',         emoji: '🚛', color: 'bg-green-50 text-green-700 border-green-200',  gradient: 'hero-delivery' },
];

function BizBadge({ bizId }: { bizId: string }) {
  const biz = BUSINESSES.find((b) => b.id === bizId);
  if (!biz) return null;
  return (
    <span className={`badge border text-[10px] ${biz.color}`}>
      {biz.emoji} {biz.label}
    </span>
  );
}

export default function BranchManagementPage() {
  const [shops, setShops]           = useState<Shop[]>([]);
  const [stats, setStats]           = useState<Record<string, ShopStats>>({});
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [bizFilter, setBizFilter]   = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', location: '', business_id: 'water_retail' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating]     = useState(false);

  // Edit modal
  const [editShop, setEditShop]     = useState<Shop | null>(null);
  const [editForm, setEditForm]     = useState({ name: '', location: '', business_id: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editing, setEditing]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('business_id')
      .order('name');

    if (error) { setLoadError(error.message); setLoading(false); return; }
    setShops((data || []) as Shop[]);

    // Load per-shop stats: staff count + today's revenue
    const shopIds = (data || []).map((s: any) => s.id);
    if (shopIds.length > 0) {
      const today = new Date().toISOString().split('T')[0];

      const [{ data: staffData }, { data: revenueData }] = await Promise.all([
        supabase.from('profiles')
          .select('shop_id')
          .in('shop_id', shopIds)
          .eq('status', 'active'),
        supabase.from('transactions')
          .select('shop_id, total')
          .in('shop_id', shopIds)
          .eq('status', 'completed')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
      ]);

      const statsMap: Record<string, ShopStats> = {};
      shopIds.forEach((id: string) => {
        statsMap[id] = { shop_id: id, staff_count: 0, revenue_today: 0, txns_today: 0 };
      });
      (staffData || []).forEach((s: any) => {
        if (statsMap[s.shop_id]) statsMap[s.shop_id].staff_count++;
      });
      (revenueData || []).forEach((t: any) => {
        if (statsMap[t.shop_id]) {
          statsMap[t.shop_id].revenue_today += Number(t.total);
          statsMap[t.shop_id].txns_today++;
        }
      });
      setStats(statsMap);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const validateCreate = () => {
    const e: Record<string, string> = {};
    if (!createForm.name.trim()) e.name = 'Branch name is required';
    if (!createForm.business_id) e.business_id = 'Select a business arm';
    return e;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);

    const { data, error } = await supabase.from('shops').insert({
      name:        createForm.name.trim(),
      location:    createForm.location.trim() || null,
      business_id: createForm.business_id,
      status:      'active',
    }).select('id, name').single();

    if (error) { toast.error(error.message); setCreating(false); return; }

    toast.success(`Branch "${createForm.name}" created successfully`);
    setShowCreate(false);
    setCreateForm({ name: '', location: '', business_id: 'water_retail' });
    setCreateErrors({});
    setCreating(false);
    load();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShop) return;
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) errs.name = 'Branch name is required';
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setEditing(true);

    const { error } = await supabase.from('shops').update({
      name:        editForm.name.trim(),
      location:    editForm.location.trim() || null,
      business_id: editForm.business_id,
    }).eq('id', editShop.id);

    if (error) { toast.error(error.message); setEditing(false); return; }

    toast.success(`${editForm.name} updated`);
    setEditShop(null);
    setEditErrors({});
    setEditing(false);
    load();
  };

  const handleToggleStatus = async (shop: Shop) => {
    setProcessingId(shop.id);
    const newStatus = shop.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('shops').update({ status: newStatus }).eq('id', shop.id);
    if (error) { toast.error(error.message); }
    else {
      toast.success(`${shop.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      setShops((prev) => prev.map((s) => s.id === shop.id ? { ...s, status: newStatus } : s));
    }
    setProcessingId(null);
  };

  const filtered = shops.filter((s) => {
    const matchBiz    = bizFilter === 'all' || s.business_id === bizFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchBiz && matchStatus;
  });

  const grouped = BUSINESSES.map((biz) => ({
    ...biz,
    shops: filtered.filter((s) => s.business_id === biz.id),
  })).filter((g) => bizFilter === 'all' || g.id === bizFilter);

  const activeCount   = shops.filter((s) => s.status === 'active').length;
  const inactiveCount = shops.filter((s) => s.status === 'inactive').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-admin rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>
              Branch Management
            </h1>
            <p className="text-gray-500 text-sm">Create and manage shop branches across all business arms</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="btn-ghost gap-1.5 text-sm disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button onClick={() => { setShowCreate(true); setCreateForm({ name: '', location: '', business_id: 'water_retail' }); setCreateErrors({}); }}
            className="btn bg-gray-900 text-white hover:bg-gray-700 gap-2">
            <Plus size={15} /> Add Branch
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Branches</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{shops.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active</p>
          <p className="text-3xl font-black text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="card p-4 border-l-4 border-gray-300">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive</p>
          <p className="text-3xl font-black text-gray-400 mt-1">{inactiveCount}</p>
        </div>
        <div className="card p-4 border-l-4 border-purple-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Arms</p>
          <p className="text-3xl font-black text-purple-700 mt-1">{BUSINESSES.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        {/* Business filter */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button onClick={() => setBizFilter('all')}
            className={`px-4 py-2 text-sm font-bold transition-colors ${bizFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            All
          </button>
          {BUSINESSES.map((b) => (
            <button key={b.id} onClick={() => setBizFilter(b.id)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${bizFilter === b.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {b.emoji} {b.id === 'water_retail' ? 'Water' : b.id === 'rb' ? 'R&B' : 'Delivery'}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['active', 'inactive', 'all'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-400 ml-auto">{filtered.length} branch{filtered.length !== 1 ? 'es' : ''}</p>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="card p-5 bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Failed to load branches</p>
            <p className="text-sm text-red-600">{loadError}</p>
            <button onClick={load} className="btn bg-red-600 text-white hover:bg-red-700 mt-3 text-sm gap-2">
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Grouped branch cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ id: bizId, label, emoji, gradient, shops: bizShops }) => (
            <div key={bizId}>
              {/* Business arm header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 ${gradient} rounded-lg flex items-center justify-center text-sm`}>
                  {emoji}
                </div>
                <h2 className="font-black text-gray-900">{label}</h2>
                <span className="badge bg-gray-100 text-gray-600">{bizShops.length}</span>
              </div>

              {bizShops.length === 0 ? (
                <div className="card p-8 text-center border-dashed border-2 border-gray-200">
                  <Building2 size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm font-medium">No branches for {label}</p>
                  <button
                    onClick={() => { setShowCreate(true); setCreateForm({ name: '', location: '', business_id: bizId }); setCreateErrors({}); }}
                    className="btn bg-gray-900 text-white hover:bg-gray-700 mt-3 text-sm gap-1.5 mx-auto">
                    <Plus size={13} /> Add First Branch
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bizShops.map((shop) => {
                    const s = stats[shop.id];
                    return (
                      <div key={shop.id} className={`card overflow-hidden ${shop.status === 'inactive' ? 'opacity-60' : ''}`}>
                        {/* Coloured top bar */}
                        <div className={`h-1.5 ${gradient}`} />

                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Building2 size={18} className="text-gray-500" />
                              </div>
                              <div>
                                <p className="font-black text-gray-900">{shop.name}</p>
                                <span className={`badge text-[10px] ${shop.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                                  {shop.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => { setEditShop(shop); setEditForm({ name: shop.name, location: shop.location || '', business_id: shop.business_id }); setEditErrors({}); }}
                                className="w-8 h-8 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg flex items-center justify-center transition-colors"
                                title="Edit">
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(shop)}
                                disabled={processingId === shop.id}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${shop.status === 'active' ? 'bg-gray-100 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 hover:bg-green-100 hover:text-green-700'}`}
                                title={shop.status === 'active' ? 'Deactivate' : 'Reactivate'}>
                                {processingId === shop.id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : shop.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />
                                }
                              </button>
                            </div>
                          </div>

                          {/* Location */}
                          {shop.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                              <MapPin size={11} className="flex-shrink-0" />
                              {shop.location}
                            </p>
                          )}

                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                                <Users size={11} />
                              </div>
                              <p className="font-black text-sm text-gray-900">{s?.staff_count ?? '—'}</p>
                              <p className="text-[10px] text-gray-400">Staff</p>
                            </div>
                            <div className="text-center border-x border-gray-100">
                              <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                                <TrendingUp size={11} />
                              </div>
                              <p className="font-black text-sm text-gray-900">{s?.txns_today ?? '—'}</p>
                              <p className="text-[10px] text-gray-400">Txns today</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                                <Package size={11} />
                              </div>
                              <p className="font-black text-sm text-gray-900">
                                {s ? `KES ${(s.revenue_today / 1000).toFixed(1)}k` : '—'}
                              </p>
                              <p className="text-[10px] text-gray-400">Revenue</p>
                            </div>
                          </div>

                          {/* Created date + ID */}
                          <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                            <p className="text-[10px] text-gray-400">
                              Created {new Date(shop.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-gray-300 font-mono truncate max-w-[100px]" title={shop.id}>
                              {shop.id.substring(0, 8)}…
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add branch tile */}
                  <button
                    onClick={() => { setShowCreate(true); setCreateForm({ name: '', location: '', business_id: bizId }); setCreateErrors({}); }}
                    className="card p-5 border-dashed border-2 border-gray-200 hover:border-gray-400 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-all min-h-[160px]">
                    <Plus size={24} />
                    <p className="text-sm font-bold">Add Branch</p>
                    <p className="text-xs text-center">{label}</p>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">Add New Branch</h2>
                <p className="text-gray-500 text-sm mt-0.5">Branch ID is auto-assigned by the database</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={createForm.name}
                  onChange={(e) => { setCreateForm((p) => ({ ...p, name: e.target.value })); setCreateErrors((p) => ({ ...p, name: '' })); }}
                  className={`input-field ${createErrors.name ? 'border-red-400' : ''}`}
                  placeholder="e.g. Milimani Branch, CBD Store"
                  autoFocus
                />
                {createErrors.name && <p className="text-xs text-red-500 mt-1">{createErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Location <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  value={createForm.location}
                  onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Milimani Estate, Nakuru"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Business Arm <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {BUSINESSES.map((biz) => (
                    <button key={biz.id} type="button"
                      onClick={() => { setCreateForm((p) => ({ ...p, business_id: biz.id })); setCreateErrors((p) => ({ ...p, business_id: '' })); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        createForm.business_id === biz.id
                          ? `border-gray-900 bg-gray-900 text-white`
                          : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}>
                      <span className="text-lg">{biz.emoji}</span>
                      {biz.label}
                      {createForm.business_id === biz.id && (
                        <span className="ml-auto text-xs font-normal opacity-70">Selected ✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {createErrors.business_id && <p className="text-xs text-red-500 mt-1">{createErrors.business_id}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                After creating this branch, go to <strong>User Management</strong> to assign staff members to it.
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={creating}
                  className="flex-1 btn bg-gray-900 text-white hover:bg-gray-700 justify-center gap-2 disabled:opacity-60">
                  {creating && <Loader2 size={15} className="animate-spin" />}
                  {creating ? 'Creating…' : 'Create Branch'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editShop && (
        <div className="modal-overlay" onClick={() => setEditShop(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">Edit Branch</h2>
                <p className="text-gray-400 font-mono text-xs mt-0.5">ID: {editShop.id}</p>
              </div>
              <button onClick={() => setEditShop(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Branch Name <span className="text-red-500">*</span></label>
                <input
                  value={editForm.name}
                  onChange={(e) => { setEditForm((p) => ({ ...p, name: e.target.value })); setEditErrors((p) => ({ ...p, name: '' })); }}
                  className={`input-field ${editErrors.name ? 'border-red-400' : ''}`}
                />
                {editErrors.name && <p className="text-xs text-red-500 mt-1">{editErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Location</label>
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Nakuru CBD"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Business Arm</label>
                <select value={editForm.business_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, business_id: e.target.value }))}
                  className="input-field">
                  {BUSINESSES.map((b) => (
                    <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editing}
                  className="flex-1 btn bg-gray-900 text-white hover:bg-gray-700 justify-center gap-2 disabled:opacity-60">
                  {editing && <Loader2 size={15} className="animate-spin" />}
                  {editing ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditShop(null)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}