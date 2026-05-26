import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Package, Plus, Edit2, ToggleLeft, ToggleRight, History, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Product {
  id: string; size_label: string; price: number; current_stock: number;
  status: 'active' | 'inactive'; category: string; category_id: string | null; updated_at: string;
}
interface PriceLog {
  id: string; product: string; old_price: number; new_price: number; by: string; when: string;
}

const CATEGORIES = ['Refill', 'New', 'Caps', 'PET', 'Jerrican'];

export default function WaterProductsPage() {
  const { shopId, profile } = useAuth();
  const [products, setProducts]   = useState<Product[]>([]);
  const [priceLog, setPriceLog]   = useState<PriceLog[]>([]);
  const [catMap, setCatMap]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('Refill');
  const [activeView, setActiveView] = useState<'products' | 'history'>('products');
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string; old: number } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<{ id: string; name: string; action: 'add' | 'reduce' } | null>(null);
  const [stockQty, setStockQty]   = useState('');
  const [stockReason, setStockReason] = useState('');
  const [saving, setSaving]       = useState(false);
  const [addForm, setAddForm]     = useState({ size_label: '', size_ml: '', price: '', category: 'Refill' });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);

    // Load categories first
    const { data: cats } = await supabase.from('water_stock_categories')
      .select('id, name').eq('shop_id', shopId);
    const map: Record<string, string> = {};
    const nameToId: Record<string, string> = {};
    (cats || []).forEach((c: any) => { map[c.id] = c.name; nameToId[c.name] = c.id; });
    setCatMap(map);

    const { data: prods, error } = await supabase.from('water_products')
      .select('id, size_label, price, current_stock, status, category_id, updated_at')
      .eq('shop_id', shopId)
      .order('price', { ascending: true });

    if (error) { toast.error(error.message); setLoading(false); return; }

    setProducts((prods || []).map((p: any) => ({
      id: p.id, size_label: p.size_label, price: Number(p.price),
      current_stock: p.current_stock, status: p.status,
      category: map[p.category_id] || 'Refill', category_id: p.category_id,
      updated_at: p.updated_at,
    })));
    setLoading(false);
  }, [shopId]);

  const loadHistory = useCallback(async () => {
    if (!shopId) return;
    const { data } = await supabase.from('audit_log')
      .select('id, old_value, new_value, created_at, entity_id, profiles!user_id(full_name)')
      .eq('action_type', 'price_change')
      .eq('business_id', 'water_retail')
      .order('created_at', { ascending: false })
      .limit(30);
    if (!data) return;
    const prodIds = Array.from(new Set(data.map((l: any) => l.entity_id)));
    let nameMap: Record<string, string> = {};
    if (prodIds.length > 0) {
      const { data: ps } = await supabase.from('water_products').select('id, size_label').in('id', prodIds);
      (ps || []).forEach((p: any) => { nameMap[p.id] = p.size_label; });
    }
    setPriceLog(data.map((l: any) => ({
      id: l.id,
      product: nameMap[l.entity_id] || 'Unknown product',
      old_price: l.old_value?.price || 0,
      new_price: l.new_value?.price || 0,
      by: l.profiles?.full_name || '—',
      when: new Date(l.created_at).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    })));
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  const savePrice = async (prod: Product) => {
    if (!editingPrice || !profile) return;
    const newPrice = Number(editingPrice.value);
    if (isNaN(newPrice) || newPrice < 0) { toast.error('Enter a valid price'); return; }
    setProcessingId(prod.id);

    const { error } = await supabase.from('water_products')
      .update({ price: newPrice, updated_at: new Date().toISOString() }).eq('id', prod.id);
    if (error) { toast.error(error.message); setProcessingId(null); return; }

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: profile.id, action_type: 'price_change',
      entity_type: 'water_product', entity_id: prod.id,
      old_value: { price: editingPrice.old }, new_value: { price: newPrice },
      business_id: 'water_retail', shop_id: shopId,
    });

    toast.success(`Price updated: ${prod.size_label} → KES ${newPrice}`);
    setEditingPrice(null);
    setProcessingId(null);
    setProducts((p) => p.map((x) => x.id === prod.id ? { ...x, price: newPrice } : x));
  };

  const toggleStatus = async (prod: Product) => {
    setProcessingId(prod.id);
    const newStatus = prod.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('water_products').update({ status: newStatus }).eq('id', prod.id);
    if (error) toast.error(error.message);
    else setProducts((p) => p.map((x) => x.id === prod.id ? { ...x, status: newStatus } : x));
    setProcessingId(null);
  };

  const handleStockUpdate = async () => {
    if (!showStockModal || !profile) return;
    const qty = Number(stockQty);
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return; }
    if (showStockModal.action === 'reduce' && !stockReason.trim()) { toast.error('Reason is required for reductions'); return; }
    setSaving(true);

    const prod = products.find((p) => p.id === showStockModal.id);
    if (!prod) { setSaving(false); return; }
    const delta = showStockModal.action === 'add' ? qty : -qty;
    const newStock = Math.max(0, prod.current_stock + delta);

    const { error } = await supabase.from('water_products')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', showStockModal.id);

    if (error) { toast.error(error.message); setSaving(false); return; }

    await supabase.from('audit_log').insert({
      user_id: profile.id,
      action_type: showStockModal.action === 'add' ? 'stock_addition' : 'stock_reduction',
      entity_type: 'water_product', entity_id: showStockModal.id,
      old_value: { stock: prod.current_stock }, new_value: { stock: newStock, reason: stockReason },
      business_id: 'water_retail', shop_id: shopId,
    });

    if (showStockModal.action === 'reduce') {
      await supabase.from('notifications').insert({
        recipient_id: profile.id, type: 'manual_stock_reduction',
        title: 'Stock Reduction',
        body: `${prod.size_label}: −${qty} units. Reason: ${stockReason}`,
      });
    }

    toast.success(`Stock ${showStockModal.action === 'add' ? 'added' : 'reduced'}: ${showStockModal.name}`);
    setProducts((p) => p.map((x) => x.id === showStockModal.id ? { ...x, current_stock: newStock } : x));
    setShowStockModal(null); setStockQty(''); setStockReason('');
    setSaving(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!addForm.size_label.trim()) errs.size_label = 'Size label is required';
    if (!addForm.price || Number(addForm.price) < 0) errs.price = 'Enter a valid price';
    if (Object.keys(errs).length) { setAddErrors(errs); return; }
    setSaving(true);

    // Get or create category
    let catId: string | null = null;
    const existingCat = Object.entries(catMap).find(([, name]) => name === addForm.category);
    if (existingCat) {
      catId = existingCat[0];
    } else {
      const { data: newCat } = await supabase.from('water_stock_categories')
        .insert({ name: addForm.category, shop_id: shopId }).select('id').single();
      if (newCat) catId = (newCat as any).id;
    }

    const { error } = await supabase.from('water_products').insert({
      shop_id: shopId, category_id: catId,
      size_label: addForm.size_label.trim(),
      size_ml: addForm.size_ml ? Number(addForm.size_ml) : null,
      price: Number(addForm.price), current_stock: 0, status: 'active',
    });

    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success(`${addForm.size_label} added to ${addForm.category}`);
    setShowAddModal(false);
    setAddForm({ size_label: '', size_ml: '', price: '', category: 'Refill' });
    setAddErrors({});
    load();
    setSaving(false);
  };

  const tabProducts = products.filter((p) => p.category === activeTab);
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center"><Package size={20} className="text-white" /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Products & Stock</h1>
            <p className="text-gray-500 text-sm">Water Retail · Price and inventory management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setActiveView(activeView === 'products' ? 'history' : 'products'); if (activeView === 'products') loadHistory(); }}
            className="btn-ghost gap-2"><History size={15} />{activeView === 'products' ? 'Price History' : 'Back'}</button>
          <button onClick={() => setShowAddModal(true)} className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2"><Plus size={15} /> Add Product</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3"><Loader2 size={24} className="animate-spin text-blue-600" /><span className="text-gray-500">Loading products…</span></div>
      ) : activeView === 'products' ? (
        <>
          {/* Category tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {CATEGORIES.map((cat) => {
              const cnt = products.filter((p) => p.category === cat).length;
              return (
                <button key={cat} onClick={() => setActiveTab(cat)}
                  className={`flex items-center gap-1.5 px-5 py-3 font-bold text-sm border-b-2 transition-all -mb-px ${activeTab === cat ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {cat}
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${activeTab === cat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{cnt}</span>
                </button>
              );
            })}
          </div>

          {/* Products table */}
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>{['Size / Label', 'Price (KES)', 'Stock', 'Status', 'Updated', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {tabProducts.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No products in this category yet</td></tr>
                )}
                {tabProducts.map((prod) => (
                  <tr key={prod.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-bold text-gray-900">{prod.size_label}</td>
                    <td className="px-5 py-3.5">
                      {editingPrice?.id === prod.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={editingPrice.value}
                            onChange={(e) => setEditingPrice((p) => p ? { ...p, value: e.target.value } : p)}
                            className="input-field w-24 py-1 text-sm" autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && savePrice(prod)}
                          />
                          <button onClick={() => savePrice(prod)} disabled={processingId === prod.id}
                            className="text-xs font-bold text-green-600 hover:text-green-800 disabled:opacity-50">
                            {processingId === prod.id ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                          </button>
                          <button onClick={() => setEditingPrice(null)} className="text-xs text-gray-400">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${prod.price === 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                            {prod.price === 0 ? 'TBC' : `KES ${prod.price}`}
                          </span>
                          <button onClick={() => setEditingPrice({ id: prod.id, value: String(prod.price), old: prod.price })}
                            className="w-6 h-6 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center">
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold text-sm ${prod.current_stock === 0 ? 'text-red-600' : prod.current_stock < 10 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {prod.current_stock}
                        {prod.current_stock === 0 && <span className="ml-1 badge badge-unpaid">OUT</span>}
                        {prod.current_stock > 0 && prod.current_stock < 10 && <span className="ml-1 badge badge-pending">LOW</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleStatus(prod)} disabled={processingId === prod.id}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${prod.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}>
                        {processingId === prod.id ? <Loader2 size={14} className="animate-spin" /> : prod.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {prod.status}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{timeAgo(prod.updated_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setShowStockModal({ id: prod.id, name: prod.size_label, action: 'add' }); setStockQty(''); setStockReason(''); }}
                          className="btn text-xs py-1 px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100">+ Add</button>
                        <button onClick={() => { setShowStockModal({ id: prod.id, name: prod.size_label, action: 'reduce' }); setStockQty(''); setStockReason(''); }}
                          className="btn text-xs py-1 px-2.5 bg-red-50 text-red-700 hover:bg-red-100">− Reduce</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Price History */
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Price Change History</h3>
            <button onClick={loadHistory} className="btn-ghost gap-1.5 text-sm"><RefreshCw size={13} />Refresh</button>
          </div>
          {priceLog.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">No price changes recorded yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {priceLog.map((log) => (
                <div key={log.id} className="flex items-center gap-5 px-5 py-4">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Edit2 size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{log.product}</p>
                    <p className="text-xs text-gray-500">by {log.by} · {log.when}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-400 line-through text-sm">KES {log.old_price}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-black text-green-700">KES {log.new_price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Size Label <span className="text-red-500">*</span></label>
                  <input value={addForm.size_label} onChange={(e) => { setAddForm((p) => ({ ...p, size_label: e.target.value })); setAddErrors((p) => ({ ...p, size_label: '' })); }}
                    className={`input-field ${addErrors.size_label ? 'border-red-400' : ''}`} placeholder="e.g. 500ml, 20L" />
                  {addErrors.size_label && <p className="text-xs text-red-500 mt-1">{addErrors.size_label}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Size in ml</label>
                  <input type="number" value={addForm.size_ml} onChange={(e) => setAddForm((p) => ({ ...p, size_ml: e.target.value }))}
                    className="input-field" placeholder="e.g. 500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))} className="input-field">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Price (KES) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" value={addForm.price} onChange={(e) => { setAddForm((p) => ({ ...p, price: e.target.value })); setAddErrors((p) => ({ ...p, price: '' })); }}
                    className={`input-field ${addErrors.price ? 'border-red-400' : ''}`} placeholder="0" />
                  {addErrors.price && <p className="text-xs text-red-500 mt-1">{addErrors.price}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 btn bg-blue-700 text-white hover:bg-blue-900 justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 size={15} className="animate-spin" />}{saving ? 'Adding…' : 'Add Product'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Add/Reduce Modal */}
      {showStockModal && (
        <div className="modal-overlay" onClick={() => setShowStockModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900">
                {showStockModal.action === 'add' ? '+ Record Stock Arrival' : '− Manual Stock Reduction'}
              </h2>
              <button onClick={() => setShowStockModal(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">{showStockModal.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Quantity <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="input-field" placeholder="0" autoFocus />
              </div>
              {showStockModal.action === 'reduce' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason <span className="text-red-500">*</span></label>
                  <textarea value={stockReason} onChange={(e) => setStockReason(e.target.value)} rows={3}
                    className="input-field resize-none" placeholder="e.g. Damaged, expired, inventory correction…" />
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={handleStockUpdate} disabled={saving}
                  className={`flex-1 btn justify-center gap-2 text-white disabled:opacity-60 ${showStockModal.action === 'add' ? 'bg-blue-700 hover:bg-blue-900' : 'bg-red-600 hover:bg-red-700'}`}>
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? 'Saving…' : showStockModal.action === 'add' ? 'Record Arrival' : 'Reduce Stock'}
                </button>
                <button onClick={() => setShowStockModal(null)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}