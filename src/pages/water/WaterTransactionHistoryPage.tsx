import React, { useState } from 'react';
import { FileText, Search, Download, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TxItem { name: string; category: string; qty: number; unit_price: number; line_total: number; }
interface Transaction {
  id: string; receipt_ref: string; created_at: string; cashier: string;
  items: TxItem[]; subtotal: number; discount_amount: number; total: number;
  payment_method: 'mpesa' | 'cash'; mpesa_ref: string | null; status: string;
}

const mockTx: Transaction[] = [
  { id: 't1', receipt_ref: 'RCP-A1B2C3D4', created_at: '2026-05-16T10:32:00Z', cashier: 'Janet Wanjiku',  items: [{ name: '5L Refill', category: 'Refill', qty: 4, unit_price: 40, line_total: 160 }, { name: '20L Refill', category: 'Refill', qty: 2, unit_price: 150, line_total: 300 }], subtotal: 460, discount_amount: 0,  total: 460, payment_method: 'mpesa', mpesa_ref: 'QAB123456', status: 'completed' },
  { id: 't2', receipt_ref: 'RCP-E5F6G7H8', created_at: '2026-05-16T10:15:00Z', cashier: 'Janet Wanjiku',  items: [{ name: '1L New Bottle', category: 'New', qty: 2, unit_price: 50, line_total: 100 }], subtotal: 100, discount_amount: 0, total: 100, payment_method: 'cash', mpesa_ref: null, status: 'completed' },
  { id: 't3', receipt_ref: 'RCP-I9J0K1L2', created_at: '2026-05-16T09:58:00Z', cashier: 'Peter Omondi',   items: [{ name: '20L Refill', category: 'Refill', qty: 5, unit_price: 150, line_total: 750 }], subtotal: 750, discount_amount: 75, total: 675, payment_method: 'mpesa', mpesa_ref: 'QCD789012', status: 'completed' },
  { id: 't4', receipt_ref: 'RCP-M3N4O5P6', created_at: '2026-05-16T09:40:00Z', cashier: 'Peter Omondi',   items: [{ name: 'PET 5L', category: 'PET', qty: 3, unit_price: 110, line_total: 330 }, { name: 'Caps', category: 'Caps', qty: 10, unit_price: 20, line_total: 200 }], subtotal: 530, discount_amount: 0, total: 530, payment_method: 'cash', mpesa_ref: null, status: 'completed' },
  { id: 't5', receipt_ref: 'RCP-Q7R8S9T0', created_at: '2026-05-15T14:22:00Z', cashier: 'Janet Wanjiku',  items: [{ name: '10L Refill', category: 'Refill', qty: 3, unit_price: 80, line_total: 240 }], subtotal: 240, discount_amount: 0, total: 240, payment_method: 'mpesa', mpesa_ref: 'QEF345678', status: 'refunded' },
  { id: 't6', receipt_ref: 'RCP-U1V2W3X4', created_at: '2026-05-15T11:05:00Z', cashier: 'Peter Omondi',   items: [{ name: '500ml Refill', category: 'Refill', qty: 20, unit_price: 5, line_total: 100 }], subtotal: 100, discount_amount: 0, total: 100, payment_method: 'cash', mpesa_ref: null, status: 'completed' },
];

function fmt(d: string) { return new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

export default function WaterTransactionHistoryPage() {
  const { role, profile } = useAuth();
  const isCashier = role === 'water_cashier';

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'mpesa' | 'cash'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const data = isCashier
    ? mockTx.filter((t) => t.cashier === profile?.full_name)
    : mockTx;

  const filtered = data.filter((t) => {
    const matchSearch = !search ||
      t.receipt_ref.toLowerCase().includes(search.toLowerCase()) ||
      t.cashier.toLowerCase().includes(search.toLowerCase()) ||
      t.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchMethod = methodFilter === 'all' || t.payment_method === methodFilter;
    const txDate = t.created_at.split('T')[0];
    const matchFrom = !dateFrom || txDate >= dateFrom;
    const matchTo = !dateTo || txDate <= dateTo;
    return matchSearch && matchMethod && matchFrom && matchTo;
  });

  const totalRevenue = filtered.reduce((s, t) => s + t.total, 0);
  const mpesaTotal  = filtered.filter((t) => t.payment_method === 'mpesa').reduce((s, t) => s + t.total, 0);
  const cashTotal   = filtered.filter((t) => t.payment_method === 'cash').reduce((s, t) => s + t.total, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Transactions</h1>
            <p className="text-gray-500 text-sm">Water Retail · {isCashier ? 'Your sales history' : 'All sales history'}</p>
          </div>
        </div>
        <button className="btn-ghost gap-2 text-sm"><Download size={14} /> Export CSV</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-gray-900 mt-1">KES {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{filtered.length} transactions</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">📱 M-Pesa</p>
          <p className="text-2xl font-black text-green-700 mt-1">KES {mpesaTotal.toLocaleString()}</p>
        </div>
        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">💵 Cash</p>
          <p className="text-2xl font-black text-amber-700 mt-1">KES {cashTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt, cashier, product…" className="input-field pl-9 text-sm" />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-36 text-sm" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-36 text-sm" />
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['all', 'mpesa', 'cash'] as const).map((m) => (
            <button key={m} onClick={() => setMethodFilter(m)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${methodFilter === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {m === 'all' ? 'All' : m === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="card divide-y divide-gray-50">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No transactions found</p>
          </div>
        )}
        {filtered.map((tx) => {
          const expanded = expandedId === tx.id;
          return (
            <div key={tx.id}>
              <button onClick={() => setExpandedId(expanded ? null : tx.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${tx.payment_method === 'mpesa' ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {tx.payment_method === 'mpesa' ? '📱' : '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm text-gray-900 font-mono">{tx.receipt_ref}</p>
                    <span className={`badge text-[10px] ${tx.status === 'completed' ? 'badge-paid' : tx.status === 'refunded' ? 'badge-unpaid' : 'badge-pending'}`}>{tx.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{tx.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{fmt(tx.created_at)} · {isCashier ? '' : `Cashier: ${tx.cashier} · `}{tx.mpesa_ref || ''}</p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div>
                    {tx.discount_amount > 0 && <p className="text-xs text-gray-400 line-through">KES {tx.subtotal.toLocaleString()}</p>}
                    <p className="font-black text-gray-900">KES {tx.total.toLocaleString()}</p>
                  </div>
                  {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                </div>
              </button>

              {expanded && (
                <div className="px-5 pb-4 bg-gray-50/60 border-t border-gray-100">
                  <div className="mt-3 space-y-1">
                    {tx.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="badge bg-blue-50 text-blue-700 text-[10px]">{item.category}</span>
                        <span className="flex-1 text-gray-700">{item.name}</span>
                        <span className="text-gray-500">{item.qty} × KES {item.unit_price}</span>
                        <span className="font-bold text-gray-900 w-20 text-right">KES {item.line_total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>KES {tx.subtotal.toLocaleString()}</span></div>
                    {tx.discount_amount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>−KES {tx.discount_amount.toLocaleString()}</span></div>}
                    <div className="flex justify-between font-black text-gray-900"><span>Total</span><span>KES {tx.total.toLocaleString()}</span></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn text-xs py-1.5 px-3 bg-gray-900 text-white hover:bg-gray-700 gap-1">
                      <Printer size={12} /> Reprint Receipt
                    </button>
                    {!isCashier && tx.status === 'completed' && (
                      <button className="btn text-xs py-1.5 px-3 bg-red-50 text-red-700 hover:bg-red-100">Request Refund</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
