import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AlertCircle, CheckCircle, Filter, Download, Search, MapPin, Phone } from 'lucide-react';

const mockDebts = [
  { id: 'd1', date: '2026-05-15', customer: 'Grace Njeri', location: 'Section 58', phone: '0712 345 678', driver: 'Brian Njoroge', product: '5 x 20L Water', amount: 750, status: 'unpaid', trip_id: 'DLV-002' },
  { id: 'd2', date: '2026-05-14', customer: 'Kamau Peter', location: 'Milimani', phone: '0722 111 222', driver: 'Brian Njoroge', product: '12 x 20L Water', amount: 1800, status: 'unpaid', trip_id: 'DLV-007' },
  { id: 'd3', date: '2026-05-14', customer: 'David Ochieng', location: 'Pipeline', phone: '0733 999 888', driver: 'James Kiprop', product: '8 x 20L Water', amount: 1200, status: 'unpaid', trip_id: 'DLV-009' },
  { id: 'd4', date: '2026-05-12', customer: 'Mary Achieng', location: 'Kaptembwo', phone: '0700 123 456', driver: 'Brian Njoroge', product: '6 x 20L Water', amount: 900, status: 'paid', trip_id: 'DLV-003', paid_at: '2026-05-13', collected_by: 'Brian Njoroge' },
  { id: 'd5', date: '2026-05-11', customer: 'John Muthoni', location: 'Naka', phone: '0799 777 666', driver: 'James Kiprop', product: '10 x 20L Water', amount: 1500, status: 'paid', trip_id: 'DLV-001', paid_at: '2026-05-12', collected_by: 'Admin Samuel' },
];

export default function DebtManagementPage() {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [search, setSearch] = useState('');
  const [markPaidModal, setMarkPaidModal] = useState<typeof mockDebts[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const filtered = mockDebts.filter((d) => {
    const matchFilter = filter === 'all' || d.status === filter;
    const matchSearch = !search || d.customer.toLowerCase().includes(search.toLowerCase()) || d.driver.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalOutstanding = mockDebts.filter((d) => d.status === 'unpaid').reduce((s, d) => s + d.amount, 0);
  const totalCollectedMonth = mockDebts.filter((d) => d.status === 'paid').reduce((s, d) => s + d.amount, 0);
  const unpaidCount = mockDebts.filter((d) => d.status === 'unpaid').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-delivery rounded-xl flex items-center justify-center">
            <AlertCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Debt Management</h1>
            <p className="text-gray-500 text-sm">Water Delivery · Unpaid deliveries tracker</p>
          </div>
        </div>
        <button className="btn-ghost gap-2">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-red-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Outstanding</p>
          <p className="text-3xl font-black text-red-600">KES {totalOutstanding.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{unpaidCount} unpaid records</p>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Collected This Month</p>
          <p className="text-3xl font-black text-green-600">KES {totalCollectedMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{mockDebts.filter((d) => d.status === 'paid').length} records settled</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recovery Rate</p>
          <p className="text-3xl font-black text-blue-700">
            {Math.round((totalCollectedMonth / (totalOutstanding + totalCollectedMonth)) * 100)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">of all deliveries paid</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['all', 'unpaid', 'paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Debt records table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Customer', 'Driver', 'Product & Qty', 'Amount', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((debt) => (
              <tr key={debt.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3.5 text-sm text-gray-600">{debt.date}</td>
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-sm text-gray-900">{debt.customer}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{debt.location}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{debt.phone}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{debt.driver}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{debt.product}</td>
                <td className="px-5 py-3.5">
                  <p className={`font-black text-lg ${debt.status === 'unpaid' ? 'text-red-600' : 'text-green-700'}`}>
                    KES {debt.amount.toLocaleString()}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <div>
                    <span className={`badge ${debt.status === 'unpaid' ? 'badge-unpaid' : 'badge-paid'}`}>{debt.status}</span>
                    {debt.status === 'paid' && (
                      <p className="text-[10px] text-gray-400 mt-1">Paid {debt.paid_at}<br />by {debt.collected_by}</p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {debt.status === 'unpaid' && (
                    <button
                      onClick={() => setMarkPaidModal(debt)}
                      className="btn bg-green-600 text-white hover:bg-green-700 text-xs py-1.5 gap-1"
                    >
                      <CheckCircle size={12} /> Mark Paid
                    </button>
                  )}
                  {debt.status === 'paid' && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <CheckCircle size={12} /> Settled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
            <p>No records found</p>
          </div>
        )}
      </div>

      {/* Mark as Paid Modal */}
      {markPaidModal && (
        <div className="modal-overlay" onClick={() => setMarkPaidModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-2">Mark Debt as Paid</h2>
            <p className="text-gray-500 text-sm mb-5">Confirm payment received for this delivery</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-bold">{markPaidModal.customer}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Product</span><span className="font-bold">{markPaidModal.product}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Driver</span><span className="font-bold">{markPaidModal.driver}</span></div>
              <div className="flex justify-between text-lg"><span className="text-gray-500">Amount</span><span className="font-black text-green-700">KES {markPaidModal.amount.toLocaleString()}</span></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Collected By</label>
                <input className="input-field" placeholder="Staff member who collected payment" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button className="flex-1 btn bg-green-600 text-white hover:bg-green-700 justify-center gap-2">
                <CheckCircle size={15} /> Confirm Payment
              </button>
              <button onClick={() => setMarkPaidModal(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
