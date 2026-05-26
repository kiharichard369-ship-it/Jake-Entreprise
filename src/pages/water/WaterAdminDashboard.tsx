import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, AlertCircle, DollarSign, CheckCircle, XCircle, RefreshCw, Loader2, Clock } from 'lucide-react';
import { StatCard } from '../../components/shared/StatCard';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface TodayRevenue { mpesa: number; cash: number; total: number; txns: number; }
interface RecentTx { id: string; receipt_ref: string; created_at: string; total: number; payment_method: string; cashier: string; item_summary: string; }
interface LowStock { id: string; size_label: string; current_stock: number; category: string; }
interface PendingReq { id: string; product: string; qty: number; type: string; reason: string | null; cashier: string; created_at: string; }

export default function WaterAdminDashboard() {
  const { shopId } = useAuth();
  const [revenue, setRevenue]         = useState<TodayRevenue>({ mpesa: 0, cash: 0, total: 0, txns: 0 });
  const [recentTx, setRecentTx]       = useState<RecentTx[]>([]);
  const [lowStock, setLowStock]       = useState<LowStock[]>([]);
  const [pending, setPending]         = useState<PendingReq[]>([]);
  const [loading, setLoading]         = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dayOpen, setDayOpen]         = useState(false);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [
      { data: txData },
      { data: lowData },
      { data: reqData },
      { data: logData },
    ] = await Promise.all([
      supabase.from('transactions')
        .select('id, receipt_ref, created_at, total, payment_method, cashier_id, profiles!cashier_id(full_name)')
        .eq('shop_id', shopId).eq('status', 'completed')
        .gte('created_at', `${today}T00:00:00`).lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false }),
      supabase.from('water_products')
        .select('id, size_label, current_stock, water_stock_categories(name)')
        .eq('shop_id', shopId).eq('status', 'active').lt('current_stock', 10)
        .order('current_stock', { ascending: true }).limit(5),
      supabase.from('stock_requests')
        .select('id, quantity, request_type, reason, created_at, profiles!cashier_id(full_name), water_products(size_label)')
        .eq('shop_id', shopId).eq('status', 'pending')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('driver_daily_logs')
        .select('id').eq('log_date', today).limit(1),
    ]);

    // Revenue
    const txs = txData || [];
    const mpesa = txs.filter((t: any) => t.payment_method === 'mpesa').reduce((s: number, t: any) => s + Number(t.total), 0);
    const cash  = txs.filter((t: any) => t.payment_method === 'cash').reduce((s: number, t: any) => s + Number(t.total), 0);
    setRevenue({ mpesa, cash, total: mpesa + cash, txns: txs.length });

    // Fetch items for recent tx summary
    const txIds = txs.slice(0, 10).map((t: any) => t.id);
    let itemsMap: Record<string, string> = {};
    if (txIds.length > 0) {
      const { data: items } = await supabase.from('transaction_items')
        .select('transaction_id, product_name, qty').in('transaction_id', txIds);
      (items || []).forEach((i: any) => {
        const key = i.transaction_id;
        itemsMap[key] = itemsMap[key] ? itemsMap[key] + `, ${i.product_name} ×${i.qty}` : `${i.product_name} ×${i.qty}`;
      });
    }

    setRecentTx(txs.slice(0, 8).map((t: any) => ({
      id: t.id, receipt_ref: t.receipt_ref, created_at: t.created_at,
      total: Number(t.total), payment_method: t.payment_method,
      cashier: t.profiles?.full_name || '—',
      item_summary: itemsMap[t.id] || '—',
    })));

    setLowStock((lowData || []).map((p: any) => ({
      id: p.id, size_label: p.size_label, current_stock: p.current_stock,
      category: p.water_stock_categories?.name || '—',
    })));

    setPending((reqData || []).map((r: any) => ({
      id: r.id, qty: r.quantity, type: r.request_type, reason: r.reason,
      product: r.water_products?.size_label || '—',
      cashier: r.profiles?.full_name || '—',
      created_at: r.created_at,
    })));

    setDayOpen((logData || []).length > 0);
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    load();
    if (!shopId) return;
    const channel = supabase.channel('water-admin-txns')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `shop_id=eq.${shopId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, shopId]);

  const handleApprove = async (req: PendingReq) => {
    setProcessingId(req.id);
    const { error: reqErr } = await supabase.from('stock_requests').update({
      status: 'approved', reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);
    if (reqErr) { toast.error(reqErr.message); setProcessingId(null); return; }
    const delta = req.type === 'addition' ? req.qty : -req.qty;
    await supabase.rpc('increment_stock', { row_id: req.id, delta }) ||
      await supabase.from('water_products').select('id, current_stock').limit(1); // fallback handled below
    // Direct update
    const { data: prod } = await supabase.from('stock_requests').select('product_id').eq('id', req.id).single();
    if (prod) {
      await supabase.from('water_products').update({
        current_stock: supabase.rpc as any,
      });
      // Simpler approach: get current stock then add
      const { data: wp } = await supabase.from('water_products').select('current_stock').eq('id', (prod as any).product_id).single();
      if (wp) {
        await supabase.from('water_products').update({ current_stock: Math.max(0, (wp as any).current_stock + delta) }).eq('id', (prod as any).product_id);
      }
    }
    toast.success('Stock request approved');
    setPending((p) => p.filter((r) => r.id !== req.id));
    setProcessingId(null);
    load();
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from('stock_requests').update({
      status: 'rejected', reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Request rejected'); setPending((p) => p.filter((r) => r.id !== id)); }
    setProcessingId(null);
  };

  const fmt = (d: string) => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">💧</div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Water Retail</h1>
            <p className="text-gray-500 text-sm">Admin Dashboard · {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="btn-ghost gap-1.5 text-sm disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
          {!dayOpen
            ? <button onClick={() => toast('Use the Revenue page to open the business day')} className="btn bg-blue-700 text-white hover:bg-blue-900">Open Business Day</button>
            : <button className="btn-ghost text-sm border-red-200 text-red-600 hover:bg-red-50">Close Day</button>
          }
        </div>
      </div>

      {/* Revenue hero */}
      <div className="relative rounded-2xl overflow-hidden h-36 hero-water">
        <img src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1200&q=80&fit=crop"
          alt="Water" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30" />
        <div className="relative p-6 text-white">
          <p className="text-white/70 text-sm uppercase tracking-widest font-bold">Today's Performance</p>
          {loading
            ? <div className="h-10 w-48 bg-white/20 rounded-xl animate-pulse mt-1" />
            : <p className="text-4xl font-black">KES {revenue.total.toLocaleString()}</p>
          }
          <p className="text-white/60 text-sm mt-1">
            {loading ? '…' : `${revenue.txns} transactions · M-Pesa: KES ${revenue.mpesa.toLocaleString()} · Cash: KES ${revenue.cash.toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="M-Pesa Today"    value={loading ? '—' : `KES ${revenue.mpesa.toLocaleString()}`}    icon={<DollarSign size={20} className="text-green-600" />}  iconBg="bg-green-50"  accent="border-green-500" />
        <StatCard label="Cash Today"      value={loading ? '—' : `KES ${revenue.cash.toLocaleString()}`}     icon={<DollarSign size={20} className="text-amber-600" />}  iconBg="bg-amber-50"  accent="border-amber-500" />
        <StatCard label="Transactions"    value={loading ? '—' : revenue.txns}                               icon={<TrendingUp size={20} className="text-blue-600" />}   iconBg="bg-blue-50"   accent="border-blue-500" />
        <StatCard label="Low Stock Items" value={loading ? '—' : lowStock.length}                            icon={<AlertCircle size={20} className="text-red-500" />}   iconBg="bg-red-50"    accent="border-red-400"  sub="Need restocking" />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Recent transactions */}
        <div className="md:col-span-2 card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Recent Transactions</h3>
            <Link to="/water/admin/transactions" className="text-xs text-blue-600 font-semibold hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-36" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-52" />
                </div>
                <div className="h-5 bg-gray-100 rounded animate-pulse w-20" />
              </div>
            )) : recentTx.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-sm">No transactions today yet</p>
            ) : recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${tx.payment_method === 'mpesa' ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {tx.payment_method === 'mpesa' ? '📱' : '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 font-mono">{tx.receipt_ref}</p>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock size={10} />{fmt(tx.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{tx.item_summary}</p>
                  <p className="text-xs text-gray-400">{tx.cashier}</p>
                </div>
                <p className="font-black text-gray-900 flex-shrink-0">KES {tx.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Low stock */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">⚠️ Low Stock Alerts</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : lowStock.length === 0 ? (
              <p className="p-4 text-center text-green-600 text-sm font-medium">All stock levels OK ✓</p>
            ) : lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.size_label}</p>
                  <p className="text-xs text-gray-400">{p.category}</p>
                </div>
                <span className={`badge ${p.current_stock === 0 ? 'badge-unpaid' : 'badge-pending'}`}>
                  {p.current_stock === 0 ? 'OUT' : `${p.current_stock} left`}
                </span>
              </div>
            ))}
          </div>

          {/* Pending stock requests */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">📋 Pending Requests</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : pending.length === 0 ? (
              <p className="p-4 text-center text-gray-400 text-sm">No pending requests</p>
            ) : pending.map((req) => (
              <div key={req.id} className="px-4 py-3 border-t border-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-700">
                    {req.type === 'addition' ? `+${req.qty}` : `−${req.qty}`} × {req.product}
                  </p>
                  <span className="badge badge-pending">Pending</span>
                </div>
                <p className="text-xs text-gray-500">by {req.cashier}</p>
                {req.reason && <p className="text-xs text-gray-400 italic mt-0.5">"{req.reason}"</p>}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleApprove(req)} disabled={processingId === req.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 disabled:opacity-60">
                    {processingId === req.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                  </button>
                  <button onClick={() => handleReject(req.id)} disabled={processingId === req.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-60">
                    <XCircle size={11} /> Reject
                  </button>
                </div>
              </div>
            ))}
            {pending.length > 0 && (
              <div className="p-3 border-t border-gray-100">
                <Link to="/water/admin/stock-requests" className="text-xs text-blue-600 font-semibold hover:underline">
                  View all stock requests →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}