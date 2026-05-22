import React, { useState } from 'react';
import { TrendingUp, Download, Calendar, Package, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RevenuePageProps {
  business: 'water_retail' | 'rb' | 'water_delivery';
}

const weeklyData = [
  { day: 'Mon', mpesa: 18200, cash: 6650 },
  { day: 'Tue', mpesa: 21500, cash: 8200 },
  { day: 'Wed', mpesa: 16800, cash: 5900 },
  { day: 'Thu', mpesa: 24300, cash: 9100 },
  { day: 'Fri', mpesa: 28900, cash: 11200 },
  { day: 'Sat', mpesa: 32100, cash: 14500 },
  { day: 'Sun', mpesa: 19400, cash: 7800 },
];

const stockSnapshot = {
  starting: [
    { product: '20L Refill', qty: 30 },
    { product: '10L Refill', qty: 45 },
    { product: '5L Refill', qty: 102 },
    { product: '1L Refill', qty: 155 },
    { product: '500ml Refill', qty: 205 },
    { product: '20L New Bottle', qty: 12 },
    { product: 'Caps', qty: 510 },
  ],
  finishing: [
    { product: '20L Refill', qty: 5 },
    { product: '10L Refill', qty: 38 },
    { product: '5L Refill', qty: 88 },
    { product: '1L Refill', qty: 131 },
    { product: '500ml Refill', qty: 172 },
    { product: '20L New Bottle', qty: 10 },
    { product: 'Caps', qty: 487 },
  ],
};

const themeConfig = {
  water_retail: { gradient: 'hero-water', color: '#1565C0', label: 'Water Retail', accent: 'text-blue-700' },
  rb: { gradient: 'hero-rb', color: '#BF360C', label: 'Restaurant & Butchery', accent: 'text-orange-700' },
  water_delivery: { gradient: 'hero-delivery', color: '#2E7D32', label: 'Water Delivery', accent: 'text-green-700' },
};

export default function RevenuePage({ business = 'water_retail' }: Partial<RevenuePageProps>) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const theme = themeConfig[business];

  const todayMpesa = 18200;
  const todayCash = 6650;
  const todayTotal = todayMpesa + todayCash;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${theme.gradient} rounded-xl flex items-center justify-center`}>
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Revenue Module</h1>
            <p className="text-gray-500 text-sm">{theme.label} · Daily financial overview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost gap-2"><Download size={15} /> Export CSV</button>
        </div>
      </div>

      {/* Date & Controls */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-medium text-gray-700 outline-none bg-transparent"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['day', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
                viewMode === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'day' ? 'Daily View' : '7-Day Trend'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Live Updates</span>
        </div>
      </div>

      {/* Revenue totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>📱</span> M-Pesa Revenue
          </p>
          <p className="text-3xl font-black text-gray-900">KES {todayMpesa.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round((todayMpesa / todayTotal) * 100)}% of total</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>💵</span> Cash Revenue
          </p>
          <p className="text-3xl font-black text-gray-900">KES {todayCash.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round((todayCash / todayTotal) * 100)}% of total</p>
        </div>
        <div className={`card p-5 border-l-4 ${theme.accent.replace('text-', 'border-')}`}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <DollarSign size={12} /> Combined Total
          </p>
          <p className={`text-3xl font-black ${theme.accent}`}>KES {todayTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">47 transactions today</p>
        </div>
      </div>

      {/* Chart */}
      {viewMode === 'week' && (
        <div className="card p-5">
          <h3 className="font-black text-gray-900 mb-4">7-Day Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => `KES ${Number(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="mpesa" name="M-Pesa" fill={theme.color} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cash" name="Cash" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="card p-5">
          <h3 className="font-black text-gray-900 mb-4">Revenue by Hour — Today</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[
              { time: '7AM', mpesa: 1200, cash: 400 },
              { time: '8AM', mpesa: 2800, cash: 900 },
              { time: '9AM', mpesa: 3500, cash: 1200 },
              { time: '10AM', mpesa: 4200, cash: 1500 },
              { time: '11AM', mpesa: 2100, cash: 800 },
              { time: '12PM', mpesa: 1800, cash: 600 },
              { time: '1PM', mpesa: 2600, cash: 1100 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: any) => `KES ${Number(v).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="mpesa" name="M-Pesa" stroke={theme.color} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="cash" name="Cash" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stock Snapshots */}
      <div className="grid md:grid-cols-2 gap-5">
        {(['starting', 'finishing'] as const).map((type) => (
          <div key={type} className="card">
            <div className={`p-4 border-b border-gray-100 flex items-center gap-2`}>
              <Package size={16} className={type === 'starting' ? 'text-blue-600' : 'text-green-600'} />
              <h3 className="font-black text-gray-900 text-sm capitalize">
                {type === 'starting' ? '🌅 Opening Stock' : '🌇 Closing Stock'}
              </h3>
              <span className="ml-auto text-xs text-gray-400">
                {type === 'starting' ? '07:00 AM' : '07:30 PM'}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {stockSnapshot[type].map((item) => {
                const startQty = stockSnapshot.starting.find((s) => s.product === item.product)?.qty || 0;
                const finishQty = stockSnapshot.finishing.find((f) => f.product === item.product)?.qty || 0;
                const sold = startQty - finishQty;
                return (
                  <div key={item.product} className="flex items-center gap-4 px-4 py-2.5">
                    <span className="flex-1 text-sm font-medium text-gray-800">{item.product}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-black text-gray-900 w-8 text-right">{item.qty}</span>
                      {type === 'finishing' && (
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {sold > 0 ? <span className="text-green-600 font-semibold">-{sold} sold</span> : '—'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Total units in stock</span>
              <span className="font-black text-gray-900">
                {stockSnapshot[type].reduce((s, i) => s + i.qty, 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
