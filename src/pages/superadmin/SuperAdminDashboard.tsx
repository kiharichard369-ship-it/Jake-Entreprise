import React from 'react';
import { TrendingUp, Users, AlertCircle, DollarSign, Droplets, Flame, Truck, ArrowRight } from 'lucide-react';
import { StatCard } from '../../components/shared/StatCard';
import { Link } from 'react-router-dom';

const businessArms = [
  {
    name: 'Water Retail',
    desc: 'Refill, new bottles, caps & jerricans',
    icon: Droplets,
    gradient: 'hero-water',
    todayRevenue: 'KES 24,850',
    mpesa: 'KES 18,200',
    cash: 'KES 6,650',
    transactions: 47,
    path: '/water/admin/dashboard',
    accent: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-800',
  },
  {
    name: 'Restaurant & Butchery',
    desc: 'Take-away chicken, processed & fries',
    icon: Flame,
    gradient: 'hero-rb',
    todayRevenue: 'KES 38,450',
    mpesa: 'KES 29,100',
    cash: 'KES 9,350',
    transactions: 62,
    path: '/rb/manager/dashboard',
    accent: 'border-orange-400',
    badge: 'bg-orange-100 text-orange-800',
  },
  {
    name: 'Water Delivery',
    desc: 'Lorry dispatch, GPS & debt tracking',
    icon: Truck,
    gradient: 'hero-delivery',
    todayRevenue: 'KES 15,300',
    mpesa: 'KES 12,000',
    cash: 'KES 3,300',
    transactions: 18,
    path: '/water/driver/dashboard',
    accent: 'border-green-400',
    badge: 'bg-green-100 text-green-800',
  },
];

export default function SuperAdminDashboard() {
  const combinedRevenue = 24850 + 38450 + 15300;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Operations Dashboard
          </h1>
          <p className="text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-emerald-700">All Systems Operational</span>
        </div>
      </div>

      {/* Combined stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Combined Revenue Today"
          value={`KES ${combinedRevenue.toLocaleString()}`}
          icon={<DollarSign size={22} className="text-purple-600" />}
          iconBg="bg-purple-50"
          accent="border-purple-500"
          trend={12}
          sub="vs yesterday"
        />
        <StatCard
          label="Total Transactions"
          value="127"
          icon={<TrendingUp size={22} className="text-blue-600" />}
          iconBg="bg-blue-50"
          accent="border-blue-500"
          trend={8}
        />
        <StatCard
          label="Outstanding Debts"
          value="KES 4,500"
          icon={<AlertCircle size={22} className="text-red-500" />}
          iconBg="bg-red-50"
          accent="border-red-400"
          sub="3 records"
        />
        <StatCard
          label="Active Staff Today"
          value="9"
          icon={<Users size={22} className="text-green-600" />}
          iconBg="bg-green-50"
          accent="border-green-500"
        />
      </div>

      {/* Business arm tiles */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4">Business Arms</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {businessArms.map((arm) => {
            const Icon = arm.icon;
            return (
              <div key={arm.name} className="card overflow-hidden">
                {/* Gradient header */}
                <div className={`${arm.gradient} p-5 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mb-3">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-black text-lg leading-tight">{arm.name}</h3>
                      <p className="text-white/60 text-xs mt-0.5">{arm.desc}</p>
                    </div>
                    <Link to={arm.path} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="mt-4">
                    <p className="text-white/60 text-xs uppercase tracking-wider">Today's Revenue</p>
                    <p className="text-3xl font-black mt-0.5">{arm.todayRevenue}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">M-Pesa</p>
                    <p className="font-black text-sm text-gray-900">{arm.mpesa}</p>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <p className="text-xs text-gray-500">Cash</p>
                    <p className="font-black text-sm text-gray-900">{arm.cash}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Txns</p>
                    <p className="font-black text-sm text-gray-900">{arm.transactions}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Approvals + Debts */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Pending approvals */}
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Pending Approvals</h3>
            <span className="badge badge-pending">3 items</span>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { type: 'Stock Request', detail: 'Water Retail — 500 x 20L bottles', by: 'Cashier Janet', time: '10 min ago', urgent: false },
              { type: 'Refund Request', detail: 'R&B — KES 350 (Half Chicken)', by: 'Cashier Mike', time: '25 min ago', urgent: true },
              { type: 'Stock Reduction', detail: 'Water Retail — 50 x 1L (damaged)', by: 'Admin Sam', time: '1 hr ago', urgent: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-2 h-2 rounded-full ${item.urgent ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.type}</p>
                  <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                  <p className="text-xs text-gray-400">{item.by} · {item.time}</p>
                </div>
                <button className="btn text-xs py-1.5 px-3 bg-gray-900 text-white hover:bg-gray-700">Review</button>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding debts */}
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Outstanding Debts</h3>
            <Link to="/super-admin/debts" className="text-xs text-blue-600 font-semibold hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { customer: 'Kamau Peter', amount: 'KES 1,800', product: '12 x 20L Water', driver: 'Driver Brian', date: 'Today' },
              { customer: 'Grace Njeri', amount: 'KES 1,500', product: '10 x 20L Water', driver: 'Driver Brian', date: 'Yesterday' },
              { customer: 'David Ochieng', amount: 'KES 1,200', product: '8 x 20L Water', driver: 'Driver James', date: '3 days ago' },
            ].map((debt, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-sm font-bold flex-shrink-0">
                  {debt.customer.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{debt.customer}</p>
                  <p className="text-xs text-gray-500">{debt.product} · {debt.driver}</p>
                  <p className="text-xs text-gray-400">{debt.date}</p>
                </div>
                <div className="text-right">
                  <span className="badge badge-unpaid">{debt.amount}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-red-50 border-t border-red-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-red-800">Total Outstanding</span>
              <span className="font-black text-red-700 text-lg">KES 4,500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Branch', icon: '🏪', path: '/super-admin/users', color: 'bg-blue-50 hover:bg-blue-100 text-blue-800' },
            { label: 'Create User', icon: '👤', path: '/super-admin/users', color: 'bg-purple-50 hover:bg-purple-100 text-purple-800' },
            { label: 'Edit Prices', icon: '💰', path: '/super-admin/prices', color: 'bg-amber-50 hover:bg-amber-100 text-amber-800' },
            { label: 'GPS Map', icon: '🗺️', path: '/water/driver/gps', color: 'bg-green-50 hover:bg-green-100 text-green-800' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className={`card p-4 flex items-center gap-3 transition-colors ${action.color} border-0 no-underline`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="font-bold text-sm">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
