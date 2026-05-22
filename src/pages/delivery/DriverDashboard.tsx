import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Truck, MapPin, AlertCircle, Package, DollarSign, Clock, CheckCircle, Plus, Navigation } from 'lucide-react';
import { StatCard } from '../../components/shared/StatCard';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DayOpenForm { opening_load: string; opening_mileage: string; }

const todayDeliveries = [
  { id: 'DLV-001', customer: 'Kamau Peter',  location: 'Milimani Estate', product: '6 × 20L', amount: 900,  status: 'delivered',  dispatch: '08:30', delivery: '09:15', payment: 'paid' },
  { id: 'DLV-002', customer: 'Grace Njeri',   location: 'Section 58',      product: '5 × 20L', amount: 750,  status: 'delivered',  dispatch: '09:45', delivery: '10:30', payment: 'unpaid' },
  { id: 'DLV-003', customer: 'David Ochieng', location: 'Pipeline',         product: '10 × 20L', amount: 1500, status: 'dispatched', dispatch: '11:00', delivery: '—',     payment: 'paid' },
  { id: 'DLV-004', customer: 'Mary Achieng',  location: 'Kaptembwo',        product: '4 × 20L',  amount: 600,  status: 'pending',    dispatch: '—',     delivery: '—',     payment: 'paid' },
];

const statusColors: Record<string, string> = {
  delivered:  'badge-paid',
  dispatched: 'badge-pending',
  pending:    'bg-gray-100 text-gray-600 badge',
  returned:   'badge-active',
};

export default function DriverDashboard() {
  const [dayOpen, setDayOpen] = useState(false);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [form, setForm] = useState<DayOpenForm>({ opening_load: '', opening_mileage: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateOpenDay = () => {
    const e: Record<string, string> = {};
    if (!form.opening_load || Number(form.opening_load) <= 0) e.opening_load = 'Enter lorry load in litres';
    if (Number(form.opening_load) > 6600) e.opening_load = 'Maximum lorry capacity is 6,600L';
    if (!form.opening_mileage || Number(form.opening_mileage) < 0) e.opening_mileage = 'Enter opening mileage';
    return e;
  };

  const handleOpenDay = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateOpenDay();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setDayOpen(true);
    setShowOpenForm(false);
    toast.success('Business day opened. Opening load and mileage recorded.');
    setSaving(false);
  };

  const deliveredCount = todayDeliveries.filter((d) => d.status === 'delivered').length;
  const unpaidCount    = todayDeliveries.filter((d) => d.payment === 'unpaid').length;
  const totalRevenue   = todayDeliveries.filter((d) => d.status === 'delivered' && d.payment === 'paid').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 hero-delivery rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>
              Water Delivery
            </h1>
          </div>
          <p className="text-gray-500 ml-0">Driver Dashboard · {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          {!dayOpen ? (
            <button onClick={() => setShowOpenForm(true)}
              className="btn bg-green-600 text-white hover:bg-green-700 text-base py-3 px-6 shadow-lg gap-2">
              <Truck size={18} /> Open Day
            </button>
          ) : (
            <button className="btn bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
              Close Day
            </button>
          )}
        </div>
      </div>

      {/* Day not open warning */}
      {!dayOpen && !showOpenForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-800">Day Not Opened</p>
            <p className="text-sm text-amber-600">Please open the business day before recording deliveries. Tap "Open Day" to log your opening lorry load and mileage.</p>
          </div>
        </div>
      )}

      {/* Open Day Form */}
      {showOpenForm && !dayOpen && (
        <div className="card p-6 border-2 border-green-200">
          <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Truck size={18} className="text-green-600" /> Open Business Day
          </h2>
          <form onSubmit={handleOpenDay} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Opening Lorry Load (Litres) <span className="text-red-500">*</span>
                </label>
                <input type="number" min="1" max="6600"
                  value={form.opening_load}
                  onChange={(e) => { setForm((p) => ({ ...p, opening_load: e.target.value })); setFormErrors((p) => ({ ...p, opening_load: '' })); }}
                  className={`input-field ${formErrors.opening_load ? 'border-red-400' : ''}`}
                  placeholder="e.g. 6600" />
                {formErrors.opening_load && <p className="text-xs text-red-500 mt-1">{formErrors.opening_load}</p>}
                <p className="text-xs text-gray-400 mt-1">Max capacity: 6,600L</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Opening Mileage (km) <span className="text-red-500">*</span>
                </label>
                <input type="number" min="0"
                  value={form.opening_mileage}
                  onChange={(e) => { setForm((p) => ({ ...p, opening_mileage: e.target.value })); setFormErrors((p) => ({ ...p, opening_mileage: '' })); }}
                  className={`input-field ${formErrors.opening_mileage ? 'border-red-400' : ''}`}
                  placeholder="e.g. 45230" />
                {formErrors.opening_mileage && <p className="text-xs text-red-500 mt-1">{formErrors.opening_mileage}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="btn bg-green-600 text-white hover:bg-green-700 gap-2 disabled:opacity-60">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Opening…' : 'Confirm & Open Day'}
              </button>
              <button type="button" onClick={() => setShowOpenForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Hero strip — only when day open */}
      {dayOpen && (
        <div className="relative rounded-2xl overflow-hidden h-36 hero-delivery">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&fit=crop"
            alt="Water delivery truck"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
          />
          <div className="relative p-6 text-white grid grid-cols-4 gap-4">
            {[
              { label: 'Opening Load',   value: `${form.opening_load}L` },
              { label: 'Delivered',      value: '220L' },
              { label: 'Remaining',      value: `${Number(form.opening_load) - 220}L` },
              { label: 'Deliveries',     value: `${deliveredCount}/${todayDeliveries.length}` },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-white/60 text-xs uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-black mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Revenue Today" value={`KES ${totalRevenue.toLocaleString()}`} icon={<DollarSign size={20} className="text-green-600" />} iconBg="bg-green-50" accent="border-green-500" />
        <StatCard label="Unpaid Deliveries" value={unpaidCount} icon={<AlertCircle size={20} className="text-red-500" />} iconBg="bg-red-50" accent="border-red-400" sub={unpaidCount > 0 ? 'Debt recorded' : 'All clear'} />
        <StatCard label="Deliveries Done" value={`${deliveredCount}/${todayDeliveries.length}`} icon={<CheckCircle size={20} className="text-blue-600" />} iconBg="bg-blue-50" accent="border-blue-500" />
        <StatCard label="GPS Status" value="Connected" icon={<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />} iconBg="bg-green-50" accent="border-green-400" />
      </div>

      {/* Delivery list & quick actions */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Today's deliveries */}
        <div className="md:col-span-2 card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Today's Deliveries</h3>
            <Link to="/water/driver/deliveries"
              className="btn bg-green-600 text-white hover:bg-green-700 text-sm py-1.5 gap-1.5">
              <Plus size={14} /> New Delivery
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayDeliveries.map((del) => (
              <div key={del.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{del.customer}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{del.location}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={statusColors[del.status]}>{del.status}</span>
                        <span className={`badge text-[10px] ${del.payment === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>{del.payment}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                      <span>📦 {del.product}</span>
                      <span>💰 KES {del.amount.toLocaleString()}</span>
                      {del.dispatch !== '—' && <span><Clock size={10} className="inline mr-0.5" />{del.dispatch}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link to="/water/driver/deliveries" className="text-sm text-green-600 font-semibold hover:text-green-800">
              View full delivery recording page →
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="card p-4 space-y-2">
            <h3 className="font-black text-gray-900 text-sm mb-3">Quick Actions</h3>
            {[
              { icon: '🚛', label: 'Record Delivery',  path: '/water/driver/deliveries', color: 'bg-green-50 hover:bg-green-100 text-green-800' },
              { icon: '📍', label: 'View GPS Map',     path: '/water/driver/gps',        color: 'bg-blue-50 hover:bg-blue-100 text-blue-800' },
              { icon: '⚠️', label: 'Record Debt',      path: '/water/driver/debts',      color: 'bg-red-50 hover:bg-red-100 text-red-800' },
              { icon: '💸', label: 'Log Expense',      path: '/water/driver/expenses',   color: 'bg-amber-50 hover:bg-amber-100 text-amber-800' },
            ].map((a) => (
              <Link key={a.label} to={a.path}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors no-underline ${a.color}`}>
                <span className="text-lg">{a.icon}</span>{a.label}
              </Link>
            ))}
          </div>

          {/* Debt alert */}
          {unpaidCount > 0 && (
            <div className="card p-4 bg-red-50 border border-red-200">
              <h3 className="font-black text-red-800 text-sm mb-2">
                ⚠️ Open Debts Today ({unpaidCount})
              </h3>
              <div className="space-y-2">
                {todayDeliveries.filter((d) => d.payment === 'unpaid').map((d) => (
                  <div key={d.id} className="p-3 bg-white rounded-xl border border-red-100">
                    <p className="font-bold text-sm text-gray-900">{d.customer}</p>
                    <p className="text-xs text-gray-500">{d.product} · {d.location}</p>
                    <p className="font-black text-red-700 mt-1">KES {d.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <Link to="/water/driver/debts" className="mt-3 block text-xs text-red-700 font-bold hover:text-red-900">
                View debt management →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
