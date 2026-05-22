import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Package, Plus, Edit2, ToggleLeft, ToggleRight, History, Search } from 'lucide-react';

const CATEGORIES = ['Refill', 'New', 'Caps', 'PET', 'Jerrican'];

const mockProducts = [
  { id: '1', size_label: '500ml', price: 5, current_stock: 200, status: 'active', category: 'Refill', updated_at: '10 min ago' },
  { id: '2', size_label: '1L', price: 10, current_stock: 150, status: 'active', category: 'Refill', updated_at: '10 min ago' },
  { id: '3', size_label: '1.5L', price: 15, current_stock: 120, status: 'active', category: 'Refill', updated_at: '10 min ago' },
  { id: '4', size_label: '2L', price: 20, current_stock: 80, status: 'active', category: 'Refill', updated_at: '10 min ago' },
  { id: '5', size_label: '3L', price: 30, current_stock: 60, status: 'active', category: 'Refill', updated_at: '1 hr ago' },
  { id: '6', size_label: '5L', price: 40, current_stock: 100, status: 'active', category: 'Refill', updated_at: '1 hr ago' },
  { id: '7', size_label: '10L', price: 80, current_stock: 40, status: 'active', category: 'Refill', updated_at: '2 hr ago' },
  { id: '8', size_label: '20L', price: 150, current_stock: 5, status: 'active', category: 'Refill', updated_at: '2 hr ago' },
  { id: '9', size_label: '500ml', price: 30, current_stock: 50, status: 'active', category: 'New', updated_at: '1 day ago' },
  { id: '10', size_label: '1L', price: 50, current_stock: 40, status: 'active', category: 'New', updated_at: '1 day ago' },
  { id: '11', size_label: '5L', price: 150, current_stock: 20, status: 'active', category: 'New', updated_at: '1 day ago' },
  { id: '12', size_label: '10L', price: 280, current_stock: 15, status: 'active', category: 'New', updated_at: '1 day ago' },
  { id: '13', size_label: '20L', price: 450, current_stock: 10, status: 'active', category: 'New', updated_at: '1 day ago' },
  { id: '14', size_label: 'Each', price: 20, current_stock: 500, status: 'active', category: 'Caps', updated_at: '2 days ago' },
  { id: '15', size_label: '1L', price: 40, current_stock: 30, status: 'active', category: 'PET', updated_at: '2 days ago' },
  { id: '16', size_label: '1.5L', price: 30, current_stock: 25, status: 'active', category: 'PET', updated_at: '2 days ago' },
  { id: '17', size_label: '5L', price: 110, current_stock: 20, status: 'active', category: 'PET', updated_at: '2 days ago' },
  { id: '18', size_label: '10L', price: 200, current_stock: 0, status: 'active', category: 'PET', updated_at: '2 days ago' },
  { id: '19', size_label: '20L', price: 300, current_stock: 8, status: 'active', category: 'PET', updated_at: '2 days ago' },
  { id: '20', size_label: '5L', price: 0, current_stock: 15, status: 'active', category: 'Jerrican', updated_at: '3 days ago' },
  { id: '21', size_label: '10L', price: 0, current_stock: 10, status: 'active', category: 'Jerrican', updated_at: '3 days ago' },
  { id: '22', size_label: '20L', price: 0, current_stock: 8, status: 'inactive', category: 'Jerrican', updated_at: '3 days ago' },
];

const priceHistory = [
  { product: '20L Refill', old_price: 130, new_price: 150, changed_by: 'Admin Samuel', when: '3 days ago' },
  { product: '10L Refill', old_price: 70, new_price: 80, changed_by: 'Admin Samuel', when: '1 week ago' },
  { product: '500ml New Bottle', old_price: 25, new_price: 30, changed_by: 'Super Admin Jake', when: '2 weeks ago' },
];

export default function WaterProductsPage() {
  const [activeTab, setActiveTab] = useState('Refill');
  const [activeView, setActiveView] = useState<'products' | 'history'>('products');
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const tabProducts = mockProducts.filter((p) => p.category === activeTab);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Products & Stock</h1>
            <p className="text-gray-500 text-sm">Water Retail · Price and inventory management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView(activeView === 'products' ? 'history' : 'products')}
            className="btn-ghost gap-2"
          >
            <History size={15} />{activeView === 'products' ? 'Price History' : 'Back to Products'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2">
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {activeView === 'products' ? (
        <>
          {/* Category tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {CATEGORIES.map((cat) => {
              const count = mockProducts.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`flex items-center gap-1.5 px-5 py-3 font-bold text-sm border-b-2 transition-all -mb-px ${
                    activeTab === cat ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {cat}
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${activeTab === cat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Products table */}
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Size / Label', 'Category', 'Price (KES)', 'Current Stock', 'Status', 'Last Updated', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabProducts.map((product) => (
                  <tr key={product.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-bold text-gray-900">{product.size_label}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-blue-100 text-blue-800">{product.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {editingPrice?.id === product.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingPrice.value}
                            onChange={(e) => setEditingPrice({ id: product.id, value: e.target.value })}
                            className="input-field w-24 py-1 text-sm"
                            autoFocus
                          />
                          <button onClick={() => setEditingPrice(null)} className="text-xs font-bold text-green-600 hover:text-green-800">Save</button>
                          <button onClick={() => setEditingPrice(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {product.price === 0 ? <span className="text-amber-600">TBC</span> : `KES ${product.price}`}
                          </span>
                          <button
                            onClick={() => setEditingPrice({ id: product.id, value: String(product.price) })}
                            className="w-6 h-6 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold text-sm ${product.current_stock === 0 ? 'text-red-600' : product.current_stock < 10 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {product.current_stock}
                        {product.current_stock === 0 && <span className="ml-2 badge badge-unpaid">OUT</span>}
                        {product.current_stock > 0 && product.current_stock < 10 && <span className="ml-2 badge badge-pending">LOW</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${product.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}>
                        {product.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {product.status}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{product.updated_at}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button className="btn text-xs py-1 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100">+ Add Stock</button>
                        <button className="btn text-xs py-1 px-3 bg-red-50 text-red-700 hover:bg-red-100">- Reduce</button>
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
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-black text-gray-900">Price Change History</h3>
            <p className="text-xs text-gray-400 mt-0.5">All price edits with before/after values and who made the change</p>
          </div>
          <div className="divide-y divide-gray-50">
            {priceHistory.map((log, i) => (
              <div key={i} className="flex items-center gap-5 px-5 py-4">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit2 size={15} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{log.product}</p>
                  <p className="text-xs text-gray-500">By {log.changed_by} · {log.when}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Old Price</p>
                    <p className="font-bold text-gray-500 line-through">KES {log.old_price}</p>
                  </div>
                  <span className="text-gray-300">→</span>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">New Price</p>
                    <p className="font-black text-green-700">KES {log.new_price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-5">Add New Product</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Size Label</label>
                  <input className="input-field" placeholder="e.g. 500ml, 1L, 20L" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Size in ml</label>
                  <input type="number" className="input-field" placeholder="e.g. 500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Category</label>
                  <select className="input-field">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Price (KES)</label>
                  <input type="number" className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 btn bg-blue-700 text-white hover:bg-blue-900 justify-center">Add Product</button>
                <button onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
