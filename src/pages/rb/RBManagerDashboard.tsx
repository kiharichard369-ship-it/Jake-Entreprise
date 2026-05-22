import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TrendingUp, Package, AlertCircle, DollarSign, Flame } from 'lucide-react';
import { StatCard } from '../../components/shared/StatCard';
import { Link } from 'react-router-dom';

const recentSales = [
  { id: 'RB-001', time: '11:05 AM', items: 'Full Chicken Cooked x2, Fries Large x2', cashier: 'Alice', amount: 1600, method: 'mpesa' },
  { id: 'RB-002', time: '10:52 AM', items: 'Half Chicken Raw x3, Gizzards 1kg', cashier: 'Bob', amount: 1450, method: 'cash' },
  { id: 'RB-003', time: '10:30 AM', items: 'Smokies 5-pack x4, Beef Sausages x2', cashier: 'Alice', amount: 1120, method: 'mpesa' },
  { id: 'RB-004', time: '10:05 AM', items: 'Kienyeji Full x1, Fries Medium x2', cashier: 'Carol', amount: 1200, method: 'cash' },
];

const lowStockItems = [
  { product: 'Gizzards 1kg', stock: 2, category: 'raw' },
  { product: 'Full Chicken Cooked', stock: 1, category: 'cooked' },
  { product: 'Fries Large', stock: 5, category: 'cooked' },
];

export default function RBManagerDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 hero-rb rounded-xl flex items-center justify-center">
              <Flame size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Restaurant & Butchery</h1>
          </div>
          <p className="text-gray-500">Manager Dashboard · {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn bg-orange-600 text-white hover:bg-orange-700">Open Business Day</button>
          <button className="btn-ghost">Close Day</button>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden h-36 hero-rb">
        <img
          src="https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=1200&q=80&fit=crop"
          alt="Restaurant kitchen"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
        />
        <div className="relative p-6 text-white">
          <p className="text-white/70 text-sm uppercase tracking-widest font-bold">Today's Revenue</p>
          <p className="text-4xl font-black mt-1">KES 38,450</p>
          <p className="text-white/60 text-sm mt-1">62 transactions · M-Pesa: KES 29,100 · Cash: KES 9,350</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="M-Pesa Today" value="KES 29,100" icon={<DollarSign size={20} className="text-green-600" />} iconBg="bg-green-50" accent="border-green-500" trend={22} />
        <StatCard label="Cash Today" value="KES 9,350" icon={<DollarSign size={20} className="text-amber-600" />} iconBg="bg-amber-50" accent="border-amber-500" />
        <StatCard label="Items Sold" value="89" icon={<TrendingUp size={20} className="text-orange-600" />} iconBg="bg-orange-50" accent="border-orange-400" trend={18} />
        <StatCard label="Low Stock" value={lowStockItems.length} icon={<AlertCircle size={20} className="text-red-500" />} iconBg="bg-red-50" accent="border-red-400" sub="items" />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Recent sales */}
        <div className="md:col-span-2 card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Recent Sales</h3>
            <Link to="/rb/manager/transactions" className="text-xs text-orange-600 font-semibold hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSales.map((tx) => (
              <div key={tx.id} className="flex items-start gap-4 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${tx.method === 'mpesa' ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {tx.method === 'mpesa' ? '📱' : '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-gray-900">{tx.id}</p>
                    <span className="text-xs text-gray-400">{tx.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{tx.items}</p>
                  <p className="text-xs text-gray-400">Cashier: {tx.cashier}</p>
                </div>
                <p className="font-black text-gray-900">KES {tx.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Low stock */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">⚠️ Low Stock</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {lowStockItems.map((item) => (
                <div key={item.product} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.product}</p>
                    <span className={`badge ${item.category === 'raw' ? 'badge-raw' : 'badge-cooked'}`}>{item.category}</span>
                  </div>
                  <span className={`badge ${item.stock === 0 ? 'badge-unpaid' : 'badge-pending'}`}>
                    {item.stock === 0 ? 'OUT' : `${item.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="card p-4 space-y-2">
            <h3 className="font-black text-gray-900 text-sm mb-3">Quick Actions</h3>
            {[
              { label: '🥩 Manage Stock & Prices', path: '/rb/manager/stock' },
              { label: '👥 Cashier Management', path: '/rb/manager/cashiers' },
              { label: '📊 Revenue Reports', path: '/rb/manager/revenue' },
              { label: '📋 Full Transaction History', path: '/rb/manager/transactions' },
            ].map((link) => (
              <Link key={link.path} to={link.path} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 text-sm font-semibold transition-colors no-underline">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stock breakdown */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Today's Stock Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">RAW and COOKED are tracked separately</p>
        </div>
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {[
            { cat: 'RAW', color: 'text-amber-700 bg-amber-50', items: [
              { name: 'Standard Chicken (Full)', opening: 20, sold: 5, remaining: 15 },
              { name: 'Marinated Chicken (Half)', opening: 15, sold: 8, remaining: 7 },
              { name: 'Gizzards 1kg', opening: 10, sold: 8, remaining: 2 },
              { name: 'Kienyeji Full', opening: 8, sold: 3, remaining: 5 },
            ]},
            { cat: 'COOKED', color: 'text-orange-700 bg-orange-50', items: [
              { name: 'Full Chicken (Capon)', opening: 12, sold: 11, remaining: 1 },
              { name: 'Half Chicken Cooked', opening: 20, sold: 14, remaining: 6 },
              { name: 'Fries Large', opening: 30, sold: 25, remaining: 5 },
              { name: 'Smokies Cooked', opening: 50, sold: 32, remaining: 18 },
            ]},
          ].map((section) => (
            <div key={section.cat} className="p-5">
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 ${section.color}`}>
                {section.cat}
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                        <span>Open: {item.opening}</span>
                        <span>Sold: {item.sold}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-sm ${item.remaining <= 2 ? 'text-red-600' : 'text-gray-900'}`}>{item.remaining}</span>
                      <p className="text-[10px] text-gray-400">left</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
