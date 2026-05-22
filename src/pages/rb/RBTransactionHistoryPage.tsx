import React, { useState } from 'react';
import { FileText, Search, Download, ChevronDown, ChevronUp, BarChart2, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface TxItem { name: string; category: 'raw' | 'cooked'; qty: number; unit_price: number; line_total: number; }
interface RBTx {
  id: string; receipt_ref: string; created_at: string; cashier: string;
  items: TxItem[]; subtotal: number; discount_amount: number; total: number;
  payment_method: 'mpesa' | 'cash'; status: string;
}

const mockTx: RBTx[] = [
  { id: 'r1', receipt_ref: 'RB-A1B2C3D4', created_at: '2026-05-16T11:05:00Z', cashier: 'Alice Moraa',   items: [{ name: 'Full Chicken Cooked', category: 'cooked', qty: 2, unit_price: 650, line_total: 1300 }, { name: 'Fries Large', category: 'cooked', qty: 2, unit_price: 150, line_total: 300 }], subtotal: 1600, discount_amount: 0,   total: 1600, payment_method: 'mpesa', status: 'completed' },
  { id: 'r2', receipt_ref: 'RB-E5F6G7H8', created_at: '2026-05-16T10:52:00Z', cashier: 'Bob Kimani',    items: [{ name: 'Half Chicken Raw',    category: 'raw',   qty: 3, unit_price: 300, line_total: 900  }, { name: 'Gizzards 1kg',        category: 'raw',   qty: 1, unit_price: 550, line_total: 550 }], subtotal: 1450, discount_amount: 0,   total: 1450, payment_method: 'cash', status: 'completed' },
  { id: 'r3', receipt_ref: 'RB-I9J0K1L2', created_at: '2026-05-16T10:30:00Z', cashier: 'Alice Moraa',   items: [{ name: 'Smokies 5-pack',       category: 'raw',   qty: 4, unit_price: 160, line_total: 640  }, { name: 'Beef Sausages 6-pack', category: 'raw',   qty: 2, unit_price: 240, line_total: 480 }], subtotal: 1120, discount_amount: 112, total: 1008, payment_method: 'mpesa', status: 'completed' },
  { id: 'r4', receipt_ref: 'RB-M3N4O5P6', created_at: '2026-05-16T10:05:00Z', cashier: 'Carol Njeri',   items: [{ name: 'Kienyeji Full',        category: 'raw',   qty: 1, unit_price: 1000, line_total: 1000 }, { name: 'Fries Medium',         category: 'cooked', qty: 2, unit_price: 100, line_total: 200 }], subtotal: 1200, discount_amount: 0,   total: 1200, payment_method: 'cash', status: 'completed' },
  { id: 'r5', receipt_ref: 'RB-Q7R8S9T0', created_at: '2026-05-15T14:30:00Z', cashier: 'Bob Kimani',    items: [{ name: 'Cooked Smokies',       category: 'cooked', qty: 10, unit_price: 40, line_total: 400 }, { name: 'Cooked Beef Sausages', category: 'cooked', qty: 8,  unit_price: 50, line_total: 400 }], subtotal: 800, discount_amount: 0,   total: 800,  payment_method: 'mpesa', status: 'completed' },
  { id: 'r6', receipt_ref: 'RB-U1V2W3X4', created_at: '2026-05-15T11:00:00Z', cashier: 'Alice Moraa',   items: [{ name: 'Quarter Cut Cooked',  category: 'cooked', qty: 4, unit_price: 180, line_total: 720 }], subtotal: 720, discount_amount: 0,   total: 720,  payment_method: 'mpesa', status: 'refunded' },
];

const dailyRevenue = [
  { day: 'Mon', mpesa: 22000, cash: 7800 },
  { day: 'Tue', mpesa: 28000, cash: 9200 },
  { day: 'Wed', mpesa: 19500, cash: 6100 },
  { day: 'Thu', mpesa: 31000, cash: 10500 },
  { day: 'Fri', mpesa: 38000, cash: 13200 },
  { day: 'Sat', mpesa: 44000, cash: 16800 },
  { day: 'Sun', mpesa: 26000, cash: 9400 },
];

const topItems = [
  { name: 'Full Chicken Cooked', raw: 0,  cooked: 24 },
  { name: 'Half Chicken Cooked', raw: 0,  cooked: 31 },
  { name: 'Gizzards 1kg',        raw: 18, cooked: 0 },
  { name: 'Fries Large',         raw: 0,  cooked: 38 },
  { name: 'Smokies 5-pack',      raw: 22, cooked: 0 },
];

const categoryData = [
  { name: 'RAW',   value: 45, color: '#F59E0B' },
  { name: 'COOKED', value: 55, color: '#FF7043' },
];

function fmt(d: string) { return new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

export default function RBTransactionHistoryPage() {
  const { role, profile } = useAuth();
  const isCashier = role === 'rb_cashier';

  const [search, setSearch] = useState('');
  const [cashierFilter, setCashierFilter] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | 'raw' | 'cooked'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'analytics'>('transactions');

  const cashiers = Array.from(new Set(mockTx.map((t) => t.cashier)));
  const data = isCashier ? mockTx.filter((t) => t.cashier === profile?.full_name) : mockTx;

  const filtered = data.filter((t) => {
    const matchSearch = !search || t.receipt_ref.toLowerCase().includes(search.toLowerCase()) || t.cashier.toLowerCase().includes(search.toLowerCase()) || t.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchCashier = !cashierFilter || t.cashier === cashierFilter;
    const matchCat = catFilter === 'all' || t.items.some((i) => i.category === catFilter);
    return matchSearch && matchCashier && matchCat;
  });

  const totalRevenue = filtered.reduce((s, t) => s + t.total, 0);
  const mpesaTotal   = filtered.filter((t) => t.payment_method === 'mpesa').reduce((s, t) => s + t.total, 0);
  const cashTotal    = filtered.filter((t) => t.payment_method === 'cash').reduce((s, t) => s + t.total, 0);

  const cashierSales = cashiers.map((c) => ({
    name: c.split(' ')[0],
    revenue: mockTx.filter((t) => t.cashier === c).reduce((s, t) => s + t.total, 0),
    sales: mockTx.filter((t) => t.cashier === c).length,
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-rb rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Transactions</h1>
            <p className="text-gray-500 text-sm">R&B Take-Away · {isCashier ? 'Your sales' : 'All sales'}</p>
          </div>
        </div>
        <button className="btn-ghost gap-2 text-sm"><Download size={14} /> Export CSV</button>
      </div>

      {/* Tabs — analytics hidden from cashier */}
      {!isCashier && (
        <div className="flex gap-2 border-b border-gray-200">
          {(['transactions', 'analytics'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm capitalize border-b-2 transition-all -mb-px ${activeTab === tab ? 'border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'analytics' ? <><BarChart2 size={15} />Analytics</> : <><FileText size={15} />Transactions</>}
            </button>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-orange-500">
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

      {activeTab === 'analytics' && !isCashier ? (
        <div className="space-y-6">
          {/* Revenue by day */}
          <div className="card p-5">
            <h3 className="font-black text-gray-900 mb-4">7-Day Revenue — M-Pesa vs Cash</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => `KES ${Number(v).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="mpesa" name="M-Pesa" fill="#BF360C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cash"  name="Cash"   fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Top items */}
            <div className="card p-5">
              <h3 className="font-black text-gray-900 mb-4">Top-Selling Items</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} width={130} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="raw"    name="RAW"    fill="#F59E0B" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="cooked" name="COOKED" fill="#FF7043" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category split + cashier performance */}
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="font-black text-gray-900 mb-3 text-sm">RAW vs COOKED Split</h3>
                <div className="flex items-center gap-4">
                  <PieChart width={100} height={100}>
                    <Pie data={categoryData} cx={50} cy={50} innerRadius={28} outerRadius={48} dataKey="value" paddingAngle={3}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="space-y-2">
                    {categoryData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm font-bold text-gray-700">{d.name}</span>
                        <span className="font-black text-gray-900 ml-auto">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-black text-gray-900 mb-3 text-sm">Sales by Cashier</h3>
                <div className="space-y-2">
                  {cashierSales.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${i === 0 ? 'bg-orange-500' : 'bg-gray-300'}`}>{i + 1}</span>
                      <span className="flex-1 text-sm font-medium text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.sales} sales</span>
                      <span className="font-black text-sm text-gray-900">KES {c.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search receipt, product…" className="input-field pl-9 text-sm" />
            </div>
            {!isCashier && (
              <select value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)} className="input-field w-40 text-sm">
                <option value="">All Cashiers</option>
                {cashiers.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(['all', 'raw', 'cooked'] as const).map((f) => (
                <button key={f} onClick={() => setCatFilter(f)}
                  className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${catFilter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {f}
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
                        <span className={`badge text-[10px] ${tx.status === 'completed' ? 'badge-paid' : 'badge-unpaid'}`}>{tx.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{tx.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{fmt(tx.created_at)}{!isCashier && ` · ${tx.cashier}`}</p>
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
                            <span className={`badge text-[10px] ${item.category === 'raw' ? 'badge-raw' : 'badge-cooked'}`}>{item.category}</span>
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
                      <button className="mt-3 btn text-xs py-1.5 px-3 bg-gray-900 text-white hover:bg-gray-700 gap-1">
                        <Printer size={12} /> Reprint Receipt
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
