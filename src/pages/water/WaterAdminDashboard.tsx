import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TrendingUp, Package, AlertCircle, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '../../components/shared/StatCard';
import { Link } from 'react-router-dom';

const recentTransactions = [
  { id: 'WTR-001', time: '10:32 AM', items: '5L Refill x4, 20L Refill x2', cashier: 'Janet', amount: 460, method: 'mpesa' },
  { id: 'WTR-002', time: '10:15 AM', items: '1L New Bottle x2', cashier: 'Janet', amount: 100, method: 'cash' },
  { id: 'WTR-003', time: '09:58 AM', items: '20L Refill x5', cashier: 'Peter', amount: 750, method: 'mpesa' },
  { id: 'WTR-004', time: '09:40 AM', items: 'PET 5L x3, Caps x10', cashier: 'Peter', amount: 530, method: 'cash' },
];

const stockAlerts = [
  { product: '20L Refill', stock: 5, threshold: 20 },
  { product: 'PET 10L Bottle', stock: 0, threshold: 10 },
  { product: '10L New Bottle', stock: 3, threshold: 10 },
];

export default function WaterAdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
              <span className="text-xl">💧</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Water Retail</h1>
          </div>
          <p className="text-gray-500 ml-13">Admin Dashboard · {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn bg-blue-700 text-white hover:bg-blue-900">Open Business Day</button>
          <button className="btn-ghost">Close Day</button>
        </div>
      </div>

      {/* Banner image */}
      <div className="relative rounded-2xl overflow-hidden h-36 hero-water">
        <img
          src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1200&q=80&fit=crop"
          alt="Water retail"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="relative p-6 text-white">
          <p className="text-white/70 text-sm uppercase tracking-widest font-bold">Today's Performance</p>
          <p className="text-4xl font-black mt-1">KES 24,850</p>
          <p className="text-white/60 text-sm mt-1">47 transactions · M-Pesa: KES 18,200 · Cash: KES 6,650</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="M-Pesa Today" value="KES 18,200" icon={<DollarSign size={20} className="text-green-600" />} iconBg="bg-green-50" accent="border-green-500" trend={15} />
        <StatCard label="Cash Today" value="KES 6,650" icon={<DollarSign size={20} className="text-amber-600" />} iconBg="bg-amber-50" accent="border-amber-500" />
        <StatCard label="Transactions" value="47" icon={<TrendingUp size={20} className="text-blue-600" />} iconBg="bg-blue-50" accent="border-blue-500" trend={8} />
        <StatCard label="Low Stock Items" value={stockAlerts.length} icon={<AlertCircle size={20} className="text-red-500" />} iconBg="bg-red-50" accent="border-red-400" sub="Need restocking" />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Recent Transactions */}
        <div className="md:col-span-2 card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Recent Transactions</h3>
            <Link to="/water/admin/transactions" className="text-xs text-blue-600 font-semibold hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${tx.method === 'mpesa' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {tx.method === 'mpesa' ? '📱' : '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{tx.id}</p>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{tx.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{tx.items}</p>
                  <p className="text-xs text-gray-400">Cashier: {tx.cashier}</p>
                </div>
                <p className="font-black text-gray-900">KES {tx.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts & Quick Actions */}
        <div className="space-y-4">
          {/* Stock alerts */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">⚠️ Low Stock Alerts</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {stockAlerts.map((a) => (
                <div key={a.product} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.product}</p>
                    <p className="text-xs text-gray-400">Min: {a.threshold} units</p>
                  </div>
                  <span className={`badge ${a.stock === 0 ? 'badge-unpaid' : 'badge-pending'}`}>
                    {a.stock === 0 ? 'OUT' : a.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending requests */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">📋 Pending Requests</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { type: 'Stock Addition', by: 'Janet', item: '500 x 20L Refill', status: 'pending' },
                { type: 'Refund', by: 'Peter', item: 'KES 100 — 1L New', status: 'pending' },
              ].map((req, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-700">{req.type}</p>
                    <span className="badge badge-pending">Pending</span>
                  </div>
                  <p className="text-xs text-gray-500">{req.item} · by {req.by}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
