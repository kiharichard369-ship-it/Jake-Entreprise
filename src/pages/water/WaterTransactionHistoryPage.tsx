import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Download, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface TxItem { name: string; category: string; qty: number; unit_price: number; line_total: number; }
interface Transaction {
  id: string; receipt_ref: string; created_at: string; cashier: string;
  items: TxItem[]; subtotal: number; discount_amount: number; total: number;
  payment_method: 'mpesa' | 'cash'; status: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function WaterTransactionHistoryPage() {
  const { role, profile, shopId } = useAuth();
  const isCashier = role === 'water_cashier';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'mpesa' | 'cash'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopId && !isCashier) return;
    setLoading(true);

    let q = supabase.from('transactions')
      .select('id, receipt_ref, created_at, total, subtotal, discount_amount, payment_method, status, profiles!cashier_id(full_name)')
      .eq('business_id', 'water_retail')
      .order('created_at', { ascending: false })
      .limit(150);

    if (shopId)   q = q.eq('shop_id', shopId);
    if (isCashier && profile) q = q.eq('cashier_id', profile.id);
    if (methodFilter !== 'all') q = q.eq('payment_method', methodFilter);
    if (dateFrom)  q = q.gte('created_at', `${dateFrom}T00:00:00`);
    if (dateTo)    q = q.lte('created_at', `${dateTo}T23:59:59`);

    const { data: txData, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }

    const txIds = (txData || []).map((t: any) => t.id);
    let itemsMap: Record<string, TxItem[]> = {};
    if (txIds.length > 0) {
      const { data: items } = await supabase.from('transaction_items')
        .select('transaction_id, product_name, category, qty, unit_price, line_total')
        .in('transaction_id', txIds);
      (items || []).forEach((i: any) => {
        if (!itemsMap[i.transaction_id]) itemsMap[i.transaction_id] = [];
        itemsMap[i.transaction_id].push({
          name: i.product_name, category: i.category || '—',
          qty: i.qty, unit_price: Number(i.unit_price), line_total: Number(i.line_total),
        });
      });
    }

    setTransactions((txData || []).map((t: any) => ({
      id: t.id, receipt_ref: t.receipt_ref, created_at: t.created_at,
      cashier: t.profiles?.full_name || '—',
      items: itemsMap[t.id] || [],
      subtotal: Number(t.subtotal || t.total),
      discount_amount: Number(t.discount_amount || 0),
      total: Number(t.total),
      payment_method: t.payment_method,
      status: t.status,
    })));
    setLoading(false);
  }, [shopId, isCashier, profile, methodFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter((t) =>
    !search ||
    t.receipt_ref.toLowerCase().includes(search.toLowerCase()) ||
    t.cashier.toLowerCase().includes(search.toLowerCase()) ||
    t.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = filtered.reduce((s, t) => s + t.total, 0);
  const mpesaTotal   = filtered.filter((t) => t.payment_method === 'mpesa').reduce((s, t) => s + t.total, 0);
  const cashTotal    = filtered.filter((t) => t.payment_method === 'cash').reduce((s, t) => s + t.total, 0);

  const exportCSV = () => {
    const rows = [
      ['Receipt Ref', 'Date', 'Cashier', 'Items', 'Subtotal', 'Discount', 'Total', 'Method', 'Status'],
      ...filtered.map((t) => [
        t.receipt_ref, fmt(t.created_at), t.cashier,
        t.items.map((i) => `${i.name} x${i.qty}`).join(' | '),
        t.subtotal, t.discount_amount, t.total, t.payment_method, t.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `water-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Transactions</h1>
            <p className="text-gray-500 text-sm">Water Retail · {isCashier ? 'Your sales' : 'All sales'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="btn-ghost gap-1.5 text-sm disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button onClick={exportCSV} className="btn-ghost gap-2 text-sm"><Download size={14} /> Export CSV</button>
        </div>
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
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
              </div>
              <div className="h-5 bg-gray-100 rounded animate-pulse w-20" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No transactions found</p>
          </div>
        ) : filtered.map((tx) => {
          const expanded = expandedId === tx.id;
          return (
            <div key={tx.id}>
              <button onClick={() => setExpandedId(expanded ? null : tx.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${tx.payment_method === 'mpesa' ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {tx.payment_method === 'mpesa' ? '📱' : '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-sm text-gray-900 font-mono">{tx.receipt_ref}</p>
                    <span className={`badge text-[10px] ${tx.status === 'completed' ? 'badge-paid' : tx.status === 'refunded' ? 'badge-unpaid' : 'badge-pending'}`}>
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {tx.items.map((i) => `${i.name} ×${i.qty}`).join(', ') || '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {fmt(tx.created_at)}{!isCashier && ` · ${tx.cashier}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div>
                    {tx.discount_amount > 0 && (
                      <p className="text-xs text-gray-400 line-through">KES {tx.subtotal.toLocaleString()}</p>
                    )}
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
                        <span className="text-gray-500">{item.qty} × KES {item.unit_price.toLocaleString()}</span>
                        <span className="font-bold text-gray-900 w-24 text-right">KES {item.line_total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span><span>KES {tx.subtotal.toLocaleString()}</span>
                    </div>
                    {tx.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span><span>−KES {tx.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-gray-900">
                      <span>Total</span><span>KES {tx.total.toLocaleString()}</span>
                    </div>
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