import React, { useState } from 'react';
import { Users, Plus, Search, Phone, MapPin, CreditCard, ChevronRight, Edit2, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  customer_type: 'walk_in' | 'delivery';
  credit_balance: number;
  created_at: string;
  total_transactions: number;
  last_transaction: string;
}

const mockCustomers: Customer[] = [
  { id: 'c1', full_name: 'Kamau Peter', phone: '0712345678', location: 'Milimani Estate', customer_type: 'delivery', credit_balance: 0, created_at: '2026-01-15', total_transactions: 24, last_transaction: '2026-05-14' },
  { id: 'c2', full_name: 'Grace Njeri', phone: '0722111222', location: 'Section 58', customer_type: 'delivery', credit_balance: 750, created_at: '2026-02-08', total_transactions: 18, last_transaction: '2026-05-16' },
  { id: 'c3', full_name: 'David Ochieng', phone: '0733999888', location: 'Pipeline', customer_type: 'delivery', credit_balance: 0, created_at: '2026-01-22', total_transactions: 30, last_transaction: '2026-05-15' },
  { id: 'c4', full_name: 'Mary Achieng', phone: '0700123456', location: 'Kaptembwo', customer_type: 'delivery', credit_balance: 200, created_at: '2026-03-10', total_transactions: 12, last_transaction: '2026-05-12' },
  { id: 'c5', full_name: 'John Muthoni', phone: '0799777666', location: 'Naka Estate', customer_type: 'walk_in', credit_balance: 0, created_at: '2026-04-01', total_transactions: 7, last_transaction: '2026-05-10' },
  { id: 'c6', full_name: 'Alice Moraa', phone: '0711555444', location: 'Lanet', customer_type: 'delivery', credit_balance: 0, created_at: '2026-02-20', total_transactions: 15, last_transaction: '2026-05-13' },
  { id: 'c7', full_name: 'Brian Chesire', phone: '0756321654', location: 'Langalanga', customer_type: 'walk_in', credit_balance: 100, created_at: '2026-03-14', total_transactions: 9, last_transaction: '2026-05-15' },
];

const txHistory = [
  { receipt: 'RCP-A1B2C3D4', items: '20L Refill ×5', amount: 750, method: 'mpesa', date: '2026-05-14' },
  { receipt: 'RCP-E5F6G7H8', items: '20L Refill ×6', amount: 900, method: 'cash', date: '2026-05-10' },
  { receipt: 'RCP-I9J0K1L2', items: '20L Refill ×4', amount: 600, method: 'mpesa', date: '2026-05-05' },
];

function validateKenyanPhone(phone: string) {
  return /^(\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''));
}

export default function CustomerManagementPage() {
  const { role } = useAuth();
  const isAdmin = role === 'water_admin' || role === 'super_admin' || role === 'driver' || role === 'rb_manager';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'walk_in' | 'delivery'>('all');
  const [creditFilter, setCreditFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', location: '', customer_type: 'walk_in' as 'walk_in' | 'delivery' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const filtered = mockCustomers.filter((c) => {
    const matchSearch = !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchType = typeFilter === 'all' || c.customer_type === typeFilter;
    const matchCredit = !creditFilter || c.credit_balance > 0;
    return matchSearch && matchType && matchCredit;
  });

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Name is required';
    if (form.phone && !validateKenyanPhone(form.phone)) e.phone = 'Enter a valid Kenyan phone number (07XX or 01XX)';
    return e;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success(`Customer "${form.full_name}" added successfully`);
    setShowAddModal(false);
    setForm({ full_name: '', phone: '', location: '', customer_type: 'walk_in' });
    setFormErrors({});
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Customers</h1>
            <p className="text-gray-500 text-sm">Walk-in and delivery customer records</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn bg-blue-700 text-white hover:bg-blue-900 gap-2">
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="card px-4 py-2.5 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Users size={15} className="text-blue-600" /></div>
          <div><p className="text-xs text-gray-500">Total Customers</p><p className="font-black text-gray-900">{mockCustomers.length}</p></div>
        </div>
        <div className="card px-4 py-2.5 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><CreditCard size={15} className="text-green-600" /></div>
          <div><p className="text-xs text-gray-500">With Credit Balance</p><p className="font-black text-gray-900">{mockCustomers.filter((c) => c.credit_balance > 0).length}</p></div>
        </div>
        <div className="card px-4 py-2.5 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center"><MapPin size={15} className="text-orange-600" /></div>
          <div><p className="text-xs text-gray-500">Delivery Customers</p><p className="font-black text-gray-900">{mockCustomers.filter((c) => c.customer_type === 'delivery').length}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['all', 'walk_in', 'delivery'] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${typeFilter === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {t === 'all' ? 'All' : t === 'walk_in' ? 'Walk-in' : 'Delivery'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <input type="checkbox" checked={creditFilter} onChange={(e) => setCreditFilter(e.target.checked)} className="accent-blue-600" />
          <span className="text-sm font-medium text-gray-700">Has credit balance</span>
        </label>
      </div>

      {/* Customer cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <button key={c.id} onClick={() => setDetailCustomer(c)}
            className="card p-4 text-left hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${c.customer_type === 'delivery' ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                {c.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{c.full_name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`badge text-[10px] ${c.customer_type === 'delivery' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {c.customer_type === 'walk_in' ? 'Walk-in' : 'Delivery'}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
            </div>
            <div className="space-y-1.5">
              {c.phone && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone size={11} />{c.phone}</p>
              )}
              {c.location && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin size={11} />{c.location}</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400">Transactions</p>
                <p className="font-bold text-sm text-gray-900">{c.total_transactions}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">Credit Balance</p>
                <p className={`font-black text-sm ${c.credit_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {c.credit_balance > 0 ? `KES ${c.credit_balance.toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No customers found</p>
        </div>
      )}

      {/* Customer Detail Modal */}
      {detailCustomer && (
        <div className="modal-overlay" onClick={() => setDetailCustomer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`p-6 text-white ${detailCustomer.customer_type === 'delivery' ? 'hero-delivery' : 'hero-water'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
                    {detailCustomer.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-black text-xl">{detailCustomer.full_name}</h2>
                    <p className="text-white/70 text-sm capitalize">{detailCustomer.customer_type.replace('_', '-')} customer</p>
                    <p className="text-white/60 text-xs mt-0.5">Since {detailCustomer.created_at}</p>
                  </div>
                </div>
                <button onClick={() => setDetailCustomer(null)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5">
                {[
                  { label: 'Phone', value: detailCustomer.phone || '—' },
                  { label: 'Location', value: detailCustomer.location || '—' },
                  { label: 'Transactions', value: detailCustomer.total_transactions },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-white/60 text-xs uppercase tracking-wider">{s.label}</p>
                    <p className="font-bold text-sm mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Credit balance */}
              <div className={`p-4 rounded-xl border ${detailCustomer.credit_balance > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Credit Balance</p>
                    <p className={`font-black text-2xl mt-0.5 ${detailCustomer.credit_balance > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      KES {detailCustomer.credit_balance.toLocaleString()}
                    </p>
                    {detailCustomer.credit_balance > 0 && (
                      <p className="text-xs text-green-600 mt-0.5">Available to apply at next transaction</p>
                    )}
                  </div>
                  {detailCustomer.credit_balance > 0 && (
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CreditCard size={22} className="text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Recent transactions */}
              <div>
                <h3 className="font-black text-gray-900 text-sm mb-3">Recent Transactions</h3>
                <div className="space-y-2">
                  {txHistory.map((tx, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${tx.method === 'mpesa' ? 'bg-green-50' : 'bg-amber-50'}`}>
                        {tx.method === 'mpesa' ? '📱' : '💵'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-gray-500">{tx.receipt}</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{tx.items}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm text-gray-900">KES {tx.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">{tx.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                {isAdmin && (
                  <>
                    <button className="btn-ghost gap-2 text-sm"><Edit2 size={14} /> Edit Details</button>
                    <button className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 gap-2 text-sm"><UserX size={14} /> Deactivate</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-5">Add New Customer</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input value={form.full_name} onChange={(e) => { setForm((p) => ({ ...p, full_name: e.target.value })); setFormErrors((p) => ({ ...p, full_name: '' })); }}
                  className={`input-field ${formErrors.full_name ? 'border-red-400' : ''}`} placeholder="e.g. John Kamau" />
                {formErrors.full_name && <p className="text-xs text-red-500 mt-1">{formErrors.full_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input value={form.phone} onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setFormErrors((p) => ({ ...p, phone: '' })); }}
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
                <button type="submit" disabled={saving} className="flex-1 btn bg-blue-700 text-white hover:bg-blue-900 justify-center gap-2 disabled:opacity-60">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Adding…' : 'Add Customer'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
