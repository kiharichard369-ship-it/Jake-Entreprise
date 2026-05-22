import React, { useState } from 'react';
import { DollarSign, Edit2, Save, History, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

const waterProducts = [
  { id: 'w1',  category: 'Refill',   size_label: '500ml',  price: 5,   shop: 'Main Branch' },
  { id: 'w2',  category: 'Refill',   size_label: '1L',     price: 10,  shop: 'Main Branch' },
  { id: 'w3',  category: 'Refill',   size_label: '1.5L',   price: 15,  shop: 'Main Branch' },
  { id: 'w4',  category: 'Refill',   size_label: '2L',     price: 20,  shop: 'Main Branch' },
  { id: 'w5',  category: 'Refill',   size_label: '3L',     price: 30,  shop: 'Main Branch' },
  { id: 'w6',  category: 'Refill',   size_label: '5L',     price: 40,  shop: 'Main Branch' },
  { id: 'w7',  category: 'Refill',   size_label: '10L',    price: 80,  shop: 'Main Branch' },
  { id: 'w8',  category: 'Refill',   size_label: '20L',    price: 150, shop: 'Main Branch' },
  { id: 'w9',  category: 'New',      size_label: '500ml',  price: 30,  shop: 'Main Branch' },
  { id: 'w10', category: 'New',      size_label: '1L',     price: 50,  shop: 'Main Branch' },
  { id: 'w11', category: 'New',      size_label: '5L',     price: 150, shop: 'Main Branch' },
  { id: 'w12', category: 'New',      size_label: '10L',    price: 280, shop: 'Main Branch' },
  { id: 'w13', category: 'New',      size_label: '20L',    price: 450, shop: 'Main Branch' },
  { id: 'w14', category: 'Caps',     size_label: 'Each',   price: 20,  shop: 'Main Branch' },
  { id: 'w15', category: 'PET',      size_label: '1L',     price: 40,  shop: 'Main Branch' },
  { id: 'w16', category: 'PET',      size_label: '5L',     price: 110, shop: 'Main Branch' },
  { id: 'w17', category: 'PET',      size_label: '10L',    price: 200, shop: 'Main Branch' },
  { id: 'w18', category: 'Jerrican', size_label: '5L',     price: 0,   shop: 'Main Branch' },
  { id: 'w19', category: 'Jerrican', size_label: '20L',    price: 0,   shop: 'Main Branch' },
];

const rbProducts = [
  { id: 'r1',  category: 'raw',    sub: 'Standard Chicken', name: 'Full Chicken (Capon)', price: 600 },
  { id: 'r2',  category: 'raw',    sub: 'Standard Chicken', name: 'Half Chicken',         price: 300 },
  { id: 'r3',  category: 'raw',    sub: 'Standard Chicken', name: 'Quarter Cut',          price: 150 },
  { id: 'r4',  category: 'raw',    sub: 'Marinated',        name: 'Full Chicken Marinated', price: 650 },
  { id: 'r5',  category: 'raw',    sub: 'Marinated',        name: 'Half Marinated',       price: 350 },
  { id: 'r6',  category: 'raw',    sub: 'Kienyeji',         name: 'Kienyeji Full',        price: 1000 },
  { id: 'r7',  category: 'raw',    sub: 'Kienyeji',         name: 'Kienyeji Half',        price: 500 },
  { id: 'r8',  category: 'raw',    sub: 'Offcuts',          name: 'Gizzards 1kg',         price: 550 },
  { id: 'r9',  category: 'raw',    sub: 'Offcuts',          name: 'Chicken Wings 1kg',    price: 750 },
  { id: 'r10', category: 'raw',    sub: 'Processed',        name: 'Smokies 5-pack',       price: 160 },
  { id: 'r11', category: 'raw',    sub: 'Processed',        name: 'Beef Sausages 6-pack', price: 240 },
  { id: 'r12', category: 'cooked', sub: 'Standard Chicken', name: 'Full Chicken Cooked',  price: 650 },
  { id: 'r13', category: 'cooked', sub: 'Standard Chicken', name: 'Half Chicken Cooked',  price: 350 },
  { id: 'r14', category: 'cooked', sub: 'Standard Chicken', name: 'Quarter Cut Cooked',   price: 180 },
  { id: 'r15', category: 'cooked', sub: 'Processed',        name: 'Cooked Smokies',       price: 40 },
  { id: 'r16', category: 'cooked', sub: 'Fries',            name: 'Fries Small',          price: 70 },
  { id: 'r17', category: 'cooked', sub: 'Fries',            name: 'Fries Medium',         price: 100 },
  { id: 'r18', category: 'cooked', sub: 'Fries',            name: 'Fries Large',          price: 150 },
];

const priceHistory = [
  { product: '20L Refill',       business: 'Water Retail', old_price: 130, new_price: 150, by: 'Super Admin Jake',   when: '3 days ago' },
  { product: 'Kienyeji Full',    business: 'R&B',          old_price: 900, new_price: 1000, by: 'Super Admin Jake',  when: '5 days ago' },
  { product: 'Full Chicken Cooked', business: 'R&B',       old_price: 600, new_price: 650, by: 'Super Admin Jake',   when: '1 week ago' },
  { product: '10L Refill',       business: 'Water Retail', old_price: 70,  new_price: 80,  by: 'Admin Samuel',       when: '2 weeks ago' },
];

export default function CrossBusinessPricePage() {
  const [activeTab, setActiveTab] = useState<'water' | 'rb'>('water');
  const [view, setView] = useState<'products' | 'history'>('products');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const waterCategories = Array.from(new Set(waterProducts.map((p) => p.category)));
  const rbCategories = Array.from(new Set(rbProducts.map((p) => p.category)));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const savePrice = (id: string, name: string, oldPrice: number) => {
    const newP = Number(editValue);
    if (!editValue || newP < 0) { toast.error('Enter a valid price'); return; }
    toast.success(`Price updated: ${name} → KES ${newP} (was KES ${oldPrice})`);
    setEditingId(null);
  };

  const applyBulkPrice = () => {
    if (!bulkPrice || Number(bulkPrice) < 0) { toast.error('Enter a valid price'); return; }
    toast.success(`Bulk update: ${selected.size} items set to KES ${bulkPrice}`);
    setSelected(new Set());
    setBulkPrice('');
    setShowBulkConfirm(false);
  };

  const renderWaterTable = (category: string) => {
    const items = waterProducts.filter((p) => p.category === category);
    const ids = items.map((p) => p.id);
    const allSel = ids.every((id) => selected.has(id));
    return (
      <div key={category} className="card overflow-hidden mb-4">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
          <button onClick={() => toggleSelectAll(ids)}
            className={`text-blue-600 hover:text-blue-800 ${allSel ? 'opacity-100' : 'opacity-40'}`}>
            {allSel ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          <span className="font-black text-gray-700 text-sm uppercase tracking-wider">{category}</span>
          <span className="badge bg-blue-100 text-blue-700 ml-1">{items.length}</span>
          <span className="text-xs text-gray-400 ml-auto">{ids.filter((id) => selected.has(id)).length} selected</span>
        </div>
        <table className="w-full">
          <thead><tr>
            {['', 'Size', 'Shop', 'Current Price', 'Actions'].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${selected.has(p.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="px-4 py-3 w-8">
                  <button onClick={() => toggleSelect(p.id)} className="text-blue-600">
                    {selected.has(p.id) ? <CheckSquare size={15} /> : <Square size={15} className="text-gray-300" />}
                  </button>
                </td>
                <td className="px-4 py-3 font-semibold text-sm text-gray-900">{p.size_label}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.shop}</td>
                <td className="px-4 py-3">
                  {editingId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                        className="input-field w-24 py-1 text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && savePrice(p.id, p.size_label, p.price)} />
                      <button onClick={() => savePrice(p.id, p.size_label, p.price)} className="text-green-600 hover:text-green-800 font-bold text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-gray-900 ${p.price === 0 ? 'text-amber-600' : ''}`}>
                        {p.price === 0 ? 'TBC' : `KES ${p.price}`}
                      </span>
                      <button onClick={() => { setEditingId(p.id); setEditValue(String(p.price)); }}
                        className="w-6 h-6 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center">
                        <Edit2 size={11} />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => { setEditingId(p.id); setEditValue(String(p.price)); }}
                    className="btn text-xs py-1 px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRBTable = (category: string) => {
    const subs = Array.from(new Set(rbProducts.filter((p) => p.category === category).map((p) => p.sub)));
    return subs.map((sub) => {
      const items = rbProducts.filter((p) => p.category === category && p.sub === sub);
      const ids = items.map((p) => p.id);
      return (
        <div key={sub} className="card overflow-hidden mb-3">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <button onClick={() => toggleSelectAll(ids)} className="text-orange-600">
              {ids.every((id) => selected.has(id)) ? <CheckSquare size={15} /> : <Square size={15} className="opacity-30" />}
            </button>
            <span className={`badge ${category === 'raw' ? 'badge-raw' : 'badge-cooked'}`}>{category}</span>
            <span className="font-bold text-gray-700 text-sm">{sub}</span>
          </div>
          <table className="w-full">
            <thead><tr>
              {['', 'Item', 'Current Price', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${selected.has(p.id) ? 'bg-orange-50/30' : ''}`}>
                  <td className="px-4 py-3 w-8">
                    <button onClick={() => toggleSelect(p.id)} className="text-orange-600">
                      {selected.has(p.id) ? <CheckSquare size={15} /> : <Square size={15} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-sm text-gray-900">{p.name}</td>
                  <td className="px-4 py-3">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                          className="input-field w-24 py-1 text-sm" autoFocus />
                        <button onClick={() => savePrice(p.id, p.name, p.price)} className="text-green-600 font-bold text-xs">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">KES {p.price.toLocaleString()}</span>
                        <button onClick={() => { setEditingId(p.id); setEditValue(String(p.price)); }}
                          className="w-6 h-6 text-gray-300 hover:text-orange-600 rounded flex items-center justify-center"><Edit2 size={11} /></button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditingId(p.id); setEditValue(String(p.price)); }}
                      className="btn text-xs py-1 px-2.5 bg-orange-50 text-orange-700 hover:bg-orange-100">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-admin rounded-xl flex items-center justify-center">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Price Management</h1>
            <p className="text-gray-500 text-sm">Super Admin · Cross-business price authority</p>
          </div>
        </div>
        <button onClick={() => setView(view === 'products' ? 'history' : 'products')} className="btn-ghost gap-2">
          <History size={15} /> {view === 'products' ? 'Price History' : 'Back to Products'}
        </button>
      </div>

      {view === 'history' ? (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-black text-gray-900">Global Price Change History</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {priceHistory.map((log, i) => (
              <div key={i} className="flex items-center gap-5 px-5 py-4">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0"><Edit2 size={14} className="text-purple-600" /></div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{log.product}</p>
                  <p className="text-xs text-gray-500">{log.business} · by {log.by} · {log.when}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-400 line-through">KES {log.old_price}</p>
                  <span className="text-gray-300">→</span>
                  <p className="font-black text-green-700">KES {log.new_price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Business tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {([['water', '💧 Water Retail'], ['rb', '🔥 R&B']] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSelected(new Set()); }}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all -mb-px ${activeTab === tab ? tab === 'water' ? 'border-blue-600 text-blue-700' : 'border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Bulk update bar */}
          {selected.size > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-4">
              <p className="font-bold text-purple-800 text-sm">{selected.size} items selected</p>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-purple-700 font-medium">Set price:</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">KES</span>
                  <input type="number" min="0" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)}
                    className="input-field pl-12 w-32 py-2 text-sm" placeholder="0" />
                </div>
                <button onClick={() => bulkPrice ? setShowBulkConfirm(true) : toast.error('Enter a price')}
                  className="btn bg-purple-600 text-white hover:bg-purple-700 text-sm gap-1.5"><Save size={13} /> Apply to All</button>
              </div>
              <button onClick={() => setSelected(new Set())} className="text-purple-500 hover:text-purple-800 text-sm font-bold">Clear</button>
            </div>
          )}

          {activeTab === 'water'
            ? waterCategories.map((cat) => renderWaterTable(cat))
            : rbCategories.map((cat) => <div key={cat}>{renderRBTable(cat)}</div>)
          }
        </>
      )}

      {/* Bulk confirm modal */}
      {showBulkConfirm && (
        <div className="modal-overlay" onClick={() => setShowBulkConfirm(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-2">Confirm Bulk Price Update</h2>
            <p className="text-gray-600 text-sm mb-5">
              You are about to update <strong>{selected.size} items</strong> to <strong>KES {bulkPrice}</strong>.
              This will be logged to the price change audit trail.
            </p>
            <div className="flex gap-3">
              <button onClick={applyBulkPrice} className="flex-1 btn bg-purple-600 text-white hover:bg-purple-700 justify-center">Confirm Update</button>
              <button onClick={() => setShowBulkConfirm(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
