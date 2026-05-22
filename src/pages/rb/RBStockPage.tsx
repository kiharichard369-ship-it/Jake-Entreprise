import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Package, Plus, Edit2, History, ChevronDown } from 'lucide-react';

const rbStock = {
  raw: [
    { id: 'r1', name: 'Full Chicken (Capon)', sub_category: 'Standard Chicken', unit: 'pc', price: 600, stock: 12, status: 'active' },
    { id: 'r2', name: 'Half Chicken', sub_category: 'Standard Chicken', unit: 'pc', price: 300, stock: 8, status: 'active' },
    { id: 'r3', name: 'Quarter Cut', sub_category: 'Standard Chicken', unit: 'pc', price: 150, stock: 15, status: 'active' },
    { id: 'r4', name: 'Full Chicken (Marinated)', sub_category: 'Marinated', unit: 'pc', price: 650, stock: 6, status: 'active' },
    { id: 'r5', name: 'Half Chicken (Marinated)', sub_category: 'Marinated', unit: 'pc', price: 350, stock: 5, status: 'active' },
    { id: 'r6', name: 'Quarter Cut (Marinated)', sub_category: 'Marinated', unit: 'pc', price: 200, stock: 10, status: 'active' },
    { id: 'r7', name: 'Kienyeji Full', sub_category: 'Kienyeji', unit: 'pc', price: 1000, stock: 4, status: 'active' },
    { id: 'r8', name: 'Kienyeji Half', sub_category: 'Kienyeji', unit: 'pc', price: 500, stock: 3, status: 'active' },
    { id: 'r9', name: 'Gizzards 1kg', sub_category: 'Offcuts', unit: 'kg', price: 550, stock: 2, status: 'active' },
    { id: 'r10', name: 'Chicken Liver 1kg', sub_category: 'Offcuts', unit: 'kg', price: 400, stock: 5, status: 'active' },
    { id: 'r11', name: 'Chicken Wings 1kg', sub_category: 'Offcuts', unit: 'kg', price: 750, stock: 8, status: 'active' },
    { id: 'r12', name: 'Thighs on Bone 1kg', sub_category: 'Offcuts', unit: 'kg', price: 850, stock: 6, status: 'active' },
    { id: 'r13', name: 'Drumsticks 1kg', sub_category: 'Offcuts', unit: 'kg', price: 750, stock: 7, status: 'active' },
    { id: 'r14', name: 'Boneless Breast', sub_category: 'Offcuts', unit: 'pc', price: 750, stock: 4, status: 'active' },
    { id: 'r15', name: 'Breast on Bone 1kg', sub_category: 'Offcuts', unit: 'kg', price: 600, stock: 5, status: 'active' },
    { id: 'r16', name: 'Smokies 5-pack', sub_category: 'Processed', unit: 'pack', price: 160, stock: 20, status: 'active' },
    { id: 'r17', name: 'Beef Sausages 6-pack', sub_category: 'Processed', unit: 'pack', price: 240, stock: 15, status: 'active' },
    { id: 'r18', name: 'Pet Food 1kg', sub_category: 'Processed', unit: 'kg', price: 170, stock: 10, status: 'active' },
  ],
  cooked: [
    { id: 'c1', name: 'Full Chicken Cooked', sub_category: 'Standard Chicken', unit: 'pc', price: 650, stock: 1, status: 'active' },
    { id: 'c2', name: 'Half Chicken Cooked', sub_category: 'Standard Chicken', unit: 'pc', price: 350, stock: 6, status: 'active' },
    { id: 'c3', name: 'Quarter Cut Cooked', sub_category: 'Standard Chicken', unit: 'pc', price: 180, stock: 10, status: 'active' },
    { id: 'c4', name: 'Cooked Smokies', sub_category: 'Processed', unit: 'pc', price: 40, stock: 30, status: 'active' },
    { id: 'c5', name: 'Cooked Beef Sausages', sub_category: 'Processed', unit: 'pc', price: 50, stock: 25, status: 'active' },
    { id: 'c6', name: 'Fries Small', sub_category: 'Fries', unit: 'pc', price: 70, stock: 50, status: 'active' },
    { id: 'c7', name: 'Fries Medium', sub_category: 'Fries', unit: 'pc', price: 100, stock: 50, status: 'active' },
    { id: 'c8', name: 'Fries Large', sub_category: 'Fries', unit: 'pc', price: 150, stock: 5, status: 'active' },
  ],
};

export default function RBStockPage() {
  const [activeTab, setActiveTab] = useState<'raw' | 'cooked'>('raw');
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<{ id: string; name: string; action: 'add' | 'reduce' } | null>(null);

  const items = rbStock[activeTab];
  const subCategories = Array.from(new Set(items.map((i) => i.sub_category)));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-rb rounded-xl flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Stock & Prices</h1>
            <p className="text-gray-500 text-sm">Restaurant & Butchery · RAW and COOKED managed separately</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn bg-orange-600 text-white hover:bg-orange-700 gap-2">
          <Plus size={15} /> Add Stock Item
        </button>
      </div>

      {/* RAW / COOKED tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['raw', 'cooked'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex items-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-wider border-b-2 transition-all -mb-px ${
              activeTab === cat
                ? cat === 'raw' ? 'border-amber-500 text-amber-700' : 'border-orange-500 text-orange-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className={`badge ${cat === 'raw' ? 'badge-raw' : 'badge-cooked'}`}>{cat}</span>
            {rbStock[cat].length} items
          </button>
        ))}
      </div>

      {/* Group by sub-category */}
      {subCategories.map((sub) => {
        const subItems = items.filter((i) => i.sub_category === sub);
        return (
          <div key={sub} className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="font-black text-gray-700 text-sm uppercase tracking-wider">{sub}</span>
              <span className="badge bg-gray-200 text-gray-600">{subItems.length}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  {['Item', 'Category', 'Unit', 'Price (KES)', 'Current Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-semibold text-sm text-gray-900">{item.name}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${activeTab === 'raw' ? 'badge-raw' : 'badge-cooked'}`}>{activeTab}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-5 py-3">
                      {editingPrice?.id === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingPrice.value}
                            onChange={(e) => setEditingPrice({ id: item.id, value: e.target.value })}
                            className="input-field w-24 py-1 text-sm"
                            autoFocus
                          />
                          <button onClick={() => setEditingPrice(null)} className="text-xs font-bold text-green-600">Save</button>
                          <button onClick={() => setEditingPrice(null)} className="text-xs text-gray-400">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">KES {item.price.toLocaleString()}</span>
                          <button
                            onClick={() => setEditingPrice({ id: item.id, value: String(item.price) })}
                            className="w-6 h-6 text-gray-300 hover:text-orange-600 hover:bg-orange-50 rounded flex items-center justify-center transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-bold text-sm ${item.stock === 0 ? 'text-red-600' : item.stock <= 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {item.stock} {item.unit}
                        {item.stock === 0 && <span className="ml-1 badge badge-unpaid">OUT</span>}
                        {item.stock > 0 && item.stock <= 3 && <span className="ml-1 badge badge-pending">LOW</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${item.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{item.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setShowStockModal({ id: item.id, name: item.name, action: 'add' })}
                          className="btn text-xs py-1 px-2.5 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => setShowStockModal({ id: item.id, name: item.name, action: 'reduce' })}
                          className="btn text-xs py-1 px-2.5 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          - Reduce
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-5">Add New Stock Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Item Name</label>
                <input className="input-field" placeholder="e.g. Full Chicken (Capon)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Category</label>
                  <select className="input-field">
                    <option value="raw">RAW</option>
                    <option value="cooked">COOKED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Sub-Category</label>
                  <input className="input-field" placeholder="e.g. Standard Chicken" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Unit</label>
                  <select className="input-field">
                    <option value="piece">Piece</option>
                    <option value="kg">KG</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Price (KES)</label>
                  <input type="number" className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 btn bg-orange-600 text-white hover:bg-orange-700 justify-center">Add Item</button>
                <button onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Add/Reduce Modal */}
      {showStockModal && (
        <div className="modal-overlay" onClick={() => setShowStockModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">
              {showStockModal.action === 'add' ? '+ Record Stock Arrival' : '- Manual Stock Reduction'}
            </h2>
            <p className="text-gray-500 text-sm mb-5">{showStockModal.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Quantity</label>
                <input type="number" className="input-field" placeholder="0" min="1" />
              </div>
              {showStockModal.action === 'add' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Supplier (optional)</label>
                  <input className="input-field" placeholder="Supplier name" />
                </div>
              )}
              {showStockModal.action === 'reduce' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason (required)</label>
                  <textarea className="input-field resize-none" rows={3} placeholder="e.g. Spoilage, damage, correction..." />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button className={`flex-1 btn justify-center ${showStockModal.action === 'add' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                  {showStockModal.action === 'add' ? 'Record Arrival' : 'Reduce Stock'}
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
