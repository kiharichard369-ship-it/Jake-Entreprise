import React, { useState } from 'react';
import { Truck, TrendingUp, Download, Calendar, AlertCircle, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const weeklyData = [
  { day: 'Mon', mpesa: 12000, cash: 3300 },
  { day: 'Tue', mpesa: 14500, cash: 4200 },
  { day: 'Wed', mpesa: 9800,  cash: 2600 },
  { day: 'Thu', mpesa: 16200, cash: 5100 },
  { day: 'Fri', mpesa: 18500, cash: 6400 },
  { day: 'Sat', mpesa: 21000, cash: 7800 },
  { day: 'Sun', mpesa: 13200, cash: 3900 },
];

const hourlyData = [
  { time: '7AM', mpesa: 1800, cash: 600 },
  { time: '8AM', mpesa: 3200, cash: 900 },
  { time: '9AM', mpesa: 2800, cash: 800 },
  { time: '10AM', mpesa: 3600, cash: 1100 },
  { time: '11AM', mpesa: 2900, cash: 800 },
  { time: '12PM', mpesa: 1800, cash: 500 },
  { time: '1PM', mpesa: 2200, cash: 700 },
];

const drivers = [
  { name: 'Brian Njoroge', deliveries: 4, litres: 440, mpesa: 8400, cash: 2100, debts: 750 },
  { name: 'James Kiprop', deliveries: 3, litres: 280, mpesa: 6900, cash: 1200, debts: 0 },
];

const LOG_START = { opening: 6600, closing: 5880 };

export default function DeliveryRevenuePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const todayMpesa = drivers.reduce((s, d) => s + d.mpesa, 0);
  const todayCash  = drivers.reduce((s, d) => s + d.cash, 0);
  const todayTotal = todayMpesa + todayCash;
  const todayDebts = drivers.reduce((s, d) => s + d.debts, 0);
  const litresDelivered = LOG_START.opening - LOG_START.closing;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-delivery rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Delivery Revenue
            </h1>
            <p className="text-gray-500 text-sm">Water Delivery · Payments collected on route</p>
          </div>
        </div>
        <button className="btn-ghost gap-2"><Download size={15} /> Export CSV</button>
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar size={16} className="text-gray-400" />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-medium text-gray-700 outline-none bg-transparent" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['day', 'week'] as const).map((v) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${viewMode === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {v === 'day' ? 'Daily View' : '7-Day Trend'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Live Updates</span>
        </div>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">📱 M-Pesa</p>
          <p className="text-2xl font-black text-gray-900">KES {todayMpesa.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round((todayMpesa / todayTotal) * 100)}% of total</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">💵 Cash</p>
          <p className="text-2xl font-black text-gray-900">KES {todayCash.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round((todayCash / todayTotal) * 100)}% of total</p>
        </div>
        <div className="card p-5 border-l-4 border-teal-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <DollarSign size={11} /> Combined Total
          </p>
          <p className="text-2xl font-black text-teal-700">KES {todayTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{drivers.reduce((s, d) => s + d.deliveries, 0)} paid deliveries</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Truck size={11} /> Litres Delivered
          </p>
          <p className="text-2xl font-black text-blue-700">{litresDelivered.toLocaleString()}L</p>
          <p className="text-xs text-gray-400 mt-1">of {LOG_START.opening.toLocaleString()}L loaded</p>
        </div>
      </div>

      {/* Outstanding debt alert */}
      {todayDebts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800">Outstanding Debt Today</p>
              <p className="text-sm text-red-600">
                KES {todayDebts.toLocaleString()} in unpaid deliveries recorded today
              </p>
            </div>
          </div>
          <a href="/water/driver/debts" className="btn bg-red-600 text-white hover:bg-red-700 text-sm">View Debts</a>
        </div>
      )}

      {/* Lorry load section */}
      <div className="card p-6">
        <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={18} className="text-green-600" /> Lorry Load — {selectedDate}
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Opening Load', value: `${LOG_START.opening.toLocaleString()}L`, sub: 'Recorded at 07:00 AM', color: 'text-blue-700' },
            { label: 'Delivered Today', value: `${litresDelivered.toLocaleString()}L`, sub: 'Across all deliveries', color: 'text-green-700' },
            { label: 'Closing Load', value: `${LOG_START.closing.toLocaleString()}L`, sub: 'Recorded at 05:30 PM', color: 'text-gray-900' },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Load bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>0L</span>
            <span className="font-bold text-gray-700">{Math.round((LOG_START.closing / LOG_START.opening) * 100)}% remaining</span>
            <span>{LOG_START.opening.toLocaleString()}L</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${(LOG_START.closing / LOG_START.opening) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h3 className="font-black text-gray-900 mb-4">
          {viewMode === 'day' ? 'Revenue by Hour — Today' : '7-Day Revenue Trend'}
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          {viewMode === 'week' ? (
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => `KES ${Number(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="mpesa" name="M-Pesa" fill="#2E7D32" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cash" name="Cash" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: any) => `KES ${Number(v).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="mpesa" name="M-Pesa" stroke="#2E7D32" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="cash" name="Cash" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Driver breakdown table */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Driver Breakdown — Today</h3>
          <p className="text-xs text-gray-400 mt-0.5">Revenue and delivery performance per driver</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Driver', 'Deliveries', 'Litres Delivered', 'M-Pesa Collected', 'Cash Collected', 'Total', 'Debts'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.name} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {d.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-gray-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">{d.deliveries}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{d.litres.toLocaleString()}L</td>
                  <td className="px-5 py-4 font-bold text-green-700">KES {d.mpesa.toLocaleString()}</td>
                  <td className="px-5 py-4 font-bold text-amber-700">KES {d.cash.toLocaleString()}</td>
                  <td className="px-5 py-4 font-black text-gray-900">KES {(d.mpesa + d.cash).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    {d.debts > 0 ? (
                      <span className="badge badge-unpaid">KES {d.debts.toLocaleString()}</span>
                    ) : (
                      <span className="badge badge-paid">None</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-5 py-3 font-black text-gray-900 text-sm">TOTAL</td>
                <td className="px-5 py-3 font-black text-gray-900">{drivers.reduce((s, d) => s + d.deliveries, 0)}</td>
                <td className="px-5 py-3 font-black text-gray-900">{drivers.reduce((s, d) => s + d.litres, 0).toLocaleString()}L</td>
                <td className="px-5 py-3 font-black text-green-700">KES {todayMpesa.toLocaleString()}</td>
                <td className="px-5 py-3 font-black text-amber-700">KES {todayCash.toLocaleString()}</td>
                <td className="px-5 py-3 font-black text-gray-900">KES {todayTotal.toLocaleString()}</td>
                <td className="px-5 py-3">
                  {todayDebts > 0 && <span className="badge badge-unpaid">KES {todayDebts.toLocaleString()}</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
