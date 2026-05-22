import React, { useState } from 'react';
import { Users, Plus, UserX, UserCheck, KeyRound, TrendingUp, ShoppingBag } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Cashier {
  id: string; full_name: string; email: string;
  status: 'active' | 'inactive'; last_login: string | null;
  sales_today: number; revenue_today: number;
  sales_week: number; revenue_week: number;
}

const MAX_CASHIERS = 6;

const mockCashiers: Cashier[] = [
  { id: 'c1', full_name: 'Alice Moraa',   email: 'alice@enterprise.co.ke',  status: 'active',   last_login: '2026-05-16T09:15:00Z', sales_today: 18, revenue_today: 14200, sales_week: 87,  revenue_week: 68400 },
  { id: 'c2', full_name: 'Bob Kimani',    email: 'bob@enterprise.co.ke',    status: 'active',   last_login: '2026-05-16T09:30:00Z', sales_today: 15, revenue_today: 12800, sales_week: 71,  revenue_week: 59200 },
  { id: 'c3', full_name: 'Carol Njeri',   email: 'carol@enterprise.co.ke',  status: 'active',   last_login: '2026-05-16T10:00:00Z', sales_today: 12, revenue_today: 9600,  sales_week: 58,  revenue_week: 44100 },
  { id: 'c4', full_name: 'David Ochieng', email: 'david@enterprise.co.ke',  status: 'inactive', last_login: '2026-05-10T14:00:00Z', sales_today: 0,  revenue_today: 0,     sales_week: 0,   revenue_week: 0 },
];

function timeAgo(d: string | null) {
  if (!d) return 'Never';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function RBCashierManagementPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>(mockCashiers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const activeCount = cashiers.filter((c) => c.status === 'active').length;
  const atLimit = activeCount >= MAX_CASHIERS;
  const bestToday = [...cashiers].filter((c) => c.status === 'active').sort((a, b) => b.revenue_today - a.revenue_today)[0];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (atLimit) { toast.error(`Maximum ${MAX_CASHIERS} cashiers allowed`); return; }
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    const newCashier: Cashier = {
      id: `c${Date.now()}`, full_name: form.full_name, email: form.email,
      status: 'active', last_login: null,
      sales_today: 0, revenue_today: 0, sales_week: 0, revenue_week: 0,
    };
    setCashiers((prev) => [...prev, newCashier]);
    toast.success(`${form.full_name} added as R&B cashier`);
    setShowAddModal(false);
    setForm({ full_name: '', email: '', password: '' });
    setFormErrors({});
    setSaving(false);
  };

  const toggleStatus = async (cashier: Cashier) => {
    if (cashier.status === 'inactive' && atLimit) {
      toast.error(`Cannot reactivate — already at ${MAX_CASHIERS} active cashiers`);
      return;
    }
    setProcessing(cashier.id);
    await new Promise((r) => setTimeout(r, 500));
    setCashiers((prev) => prev.map((c) => c.id === cashier.id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
    toast.success(`${cashier.full_name} ${cashier.status === 'active' ? 'deactivated' : 'reactivated'}`);
    setProcessing(null);
  };

  const handleResetPassword = async (cashier: Cashier) => {
    setProcessing(cashier.id);
    await new Promise((r) => setTimeout(r, 500));
    toast.success(`Password reset email sent to ${cashier.email}`);
    setProcessing(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-rb rounded-xl flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Cashier Management</h1>
            <p className="text-gray-500 text-sm">R&B Take-Away · Max {MAX_CASHIERS} active cashiers</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} disabled={atLimit}
          className="btn bg-orange-600 text-white hover:bg-orange-700 gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={15} /> Add Cashier
        </button>
      </div>

      {/* Capacity bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-gray-900 text-sm">Cashier Slots</p>
          <span className={`font-black text-lg ${atLimit ? 'text-red-600' : 'text-gray-900'}`}>{activeCount} / {MAX_CASHIERS}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${atLimit ? 'bg-red-500' : activeCount >= 4 ? 'bg-amber-500' : 'bg-orange-500'}`}
            style={{ width: `${(activeCount / MAX_CASHIERS) * 100}%` }} />
        </div>
        {atLimit && (
          <p className="text-xs text-red-600 font-semibold mt-1.5">⚠️ Maximum capacity reached. Deactivate a cashier before adding a new one.</p>
        )}
      </div>

      {/* Best performer today */}
      {bestToday && bestToday.revenue_today > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🏆</div>
          <div>
            <p className="font-bold text-orange-800 text-sm">Top Performer Today</p>
            <p className="text-orange-700">{bestToday.full_name} · <span className="font-black">KES {bestToday.revenue_today.toLocaleString()}</span> · {bestToday.sales_today} sales</p>
          </div>
        </div>
      )}

      {/* Cashier cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {cashiers.map((cashier) => (
          <div key={cashier.id} className={`card overflow-hidden ${cashier.status === 'inactive' ? 'opacity-60' : ''}`}>
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${cashier.status === 'active' ? 'bg-gradient-to-br from-orange-500 to-orange-700' : 'bg-gray-300'}`}>
                  {cashier.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-gray-900">{cashier.full_name}</p>
                    <span className={`badge text-[10px] ${cashier.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{cashier.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{cashier.email}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Last login: {timeAgo(cashier.last_login)}</p>
                </div>
              </div>

              {/* Performance stats */}
              {cashier.status === 'active' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider flex items-center gap-1"><ShoppingBag size={9} /> Today</p>
                    <p className="font-black text-orange-900 mt-0.5">{cashier.sales_today} sales</p>
                    <p className="text-xs text-orange-700">KES {cashier.revenue_today.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><TrendingUp size={9} /> This Week</p>
                    <p className="font-black text-gray-900 mt-0.5">{cashier.sales_week} sales</p>
                    <p className="text-xs text-gray-600">KES {cashier.revenue_week.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => toggleStatus(cashier)} disabled={processing === cashier.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-60 ${
                    cashier.status === 'active'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}>
                  {processing === cashier.id
                    ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    : cashier.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                  {cashier.status === 'active' ? 'Deactivate' : 'Reactivate'}
                </button>
                <button onClick={() => handleResetPassword(cashier)} disabled={processing === cashier.id}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors">
                  <KeyRound size={12} /> Reset PW
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Cashier Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Add New Cashier</h2>
            <p className="text-gray-500 text-sm mb-5">
              Slots available: <strong className="text-orange-700">{MAX_CASHIERS - activeCount}</strong> of {MAX_CASHIERS}
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input value={form.full_name} onChange={(e) => { setForm((p) => ({ ...p, full_name: e.target.value })); setFormErrors((p) => ({ ...p, full_name: '' })); }}
                  className={`input-field ${formErrors.full_name ? 'border-red-400' : ''}`} placeholder="e.g. Jane Wanjiku" />
                {formErrors.full_name && <p className="text-xs text-red-500 mt-1">{formErrors.full_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFormErrors((p) => ({ ...p, email: '' })); }}
                  className={`input-field ${formErrors.email ? 'border-red-400' : ''}`} placeholder="jane@enterprise.co.ke" />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Temporary Password <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setFormErrors((p) => ({ ...p, password: '' })); }}
                  className={`input-field ${formErrors.password ? 'border-red-400' : ''}`} placeholder="Min 8 characters" />
                {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
                The cashier will receive a welcome email with login instructions. They can only access the R&B POS screen.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || atLimit} className="flex-1 btn bg-orange-600 text-white hover:bg-orange-700 justify-center gap-2 disabled:opacity-60">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Creating…' : 'Create Cashier Account'}
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
