import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, AlertCircle, DollarSign, Droplets, Flame, Truck, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { StatCard } from '../../components/shared/StatCard';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface ArmRevenue {
  mpesa: number;
  cash: number;
  total: number;
  txns: number;
}

interface PendingItem {
  id: string;
  type: string;
  detail: string;
  by: string;
  created_at: string;
  urgent: boolean;
  table: string;
}

interface DebtItem {
  id: string;
  customer: string;
  amount: number;
  product_description: string;
  driver: string;
  created_at: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function fetchArmRevenue(bizId: string): Promise<ArmRevenue> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('transactions')
    .select('payment_method, total')
    .eq('business_id', bizId)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (!data || data.length === 0) return { mpesa: 0, cash: 0, total: 0, txns: 0 };
  const mpesa = data.filter((t) => t.payment_method === 'mpesa').reduce((s, t) => s + Number(t.total), 0);
  const cash  = data.filter((t) => t.payment_method === 'cash').reduce((s, t) => s + Number(t.total), 0);
  return { mpesa, cash, total: mpesa + cash, txns: data.length };
}

export default function SuperAdminDashboard() {
  const [revenue, setRevenue] = useState<Record<string, ArmRevenue>>({
    water_retail: { mpesa: 0, cash: 0, total: 0, txns: 0 },
    rb:           { mpesa: 0, cash: 0, total: 0, txns: 0 },
    water_delivery: { mpesa: 0, cash: 0, total: 0, txns: 0 },
  });
  const [pendingItems, setPendingItems]   = useState<PendingItem[]>([]);
  const [debts, setDebts]                 = useState<DebtItem[]>([]);
  const [totalDebt, setTotalDebt]         = useState(0);
  const [activeStaff, setActiveStaff]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [lastRefresh, setLastRefresh]     = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Revenue for all 3 arms in parallel
      const [wr, rb, wd] = await Promise.all([
        fetchArmRevenue('water_retail'),
        fetchArmRevenue('rb'),
        fetchArmRevenue('water_delivery'),
      ]);
      setRevenue({ water_retail: wr, rb, water_delivery: wd });

      // 2. Pending approvals: stock_requests + refund_requests
      const [{ data: sr }, { data: rr }] = await Promise.all([
        supabase.from('stock_requests')
          .select('id, request_type, quantity, created_at, profiles!cashier_id(full_name), water_products(size_label)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('refund_requests')
          .select('id, amount, created_at, profiles!cashier_id(full_name), transactions(business_id)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const pending: PendingItem[] = [
        ...(sr || []).map((r: any) => ({
          id: r.id, table: 'stock_requests', urgent: false,
          type: 'Stock Request',
          detail: `${r.request_type === 'addition' ? '+' : '−'}${r.quantity} × ${r.water_products?.size_label || 'product'}`,
          by: r.profiles?.full_name || 'Cashier',
          created_at: r.created_at,
        })),
        ...(rr || []).map((r: any) => ({
          id: r.id, table: 'refund_requests', urgent: true,
          type: 'Refund Request',
          detail: `KES ${Number(r.amount).toLocaleString()} — ${r.transactions?.business_id?.replace(/_/g, ' ') || ''}`,
          by: r.profiles?.full_name || 'Cashier',
          created_at: r.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPendingItems(pending.slice(0, 6));

      // 3. Outstanding debts
      const { data: dd } = await supabase
        .from('delivery_debts')
        .select('id, amount_owed, product_description, created_at, customers(full_name), profiles!driver_id(full_name)')
        .eq('payment_status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(3);

      const debtList: DebtItem[] = (dd || []).map((d: any) => ({
        id: d.id,
        customer: d.customers?.full_name || 'Unknown',
        amount: Number(d.amount_owed),
        product_description: d.product_description,
        driver: d.profiles?.full_name || 'Driver',
        created_at: d.created_at,
      }));
      setDebts(debtList);

      // Total debt
      const { data: td } = await supabase
        .from('delivery_debts')
        .select('amount_owed')
        .eq('payment_status', 'unpaid');
      setTotalDebt((td || []).reduce((s, d) => s + Number(d.amount_owed), 0));

      // 4. Active staff count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      setActiveStaff(count || 0);

    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    load();
    // Realtime: refresh revenue on any new transaction
    const channel = supabase
      .channel('dashboard-transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
        fetchArmRevenue('water_retail').then((wr) => setRevenue((p) => ({ ...p, water_retail: wr })));
        fetchArmRevenue('rb').then((rb) => setRevenue((p) => ({ ...p, rb })));
        fetchArmRevenue('water_delivery').then((wd) => setRevenue((p) => ({ ...p, water_delivery: wd })));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const combinedTotal = revenue.water_retail.total + revenue.rb.total + revenue.water_delivery.total;
  const combinedTxns  = revenue.water_retail.txns + revenue.rb.txns + revenue.water_delivery.txns;

  const ARMS = [
    { id: 'water_retail',   name: 'Water Retail',          desc: 'Refill, bottles, caps & jerricans', Icon: Droplets, gradient: 'hero-water', path: '/water/admin/dashboard' },
    { id: 'rb',             name: 'Restaurant & Butchery', desc: 'Take-away chicken, processed & fries', Icon: Flame,   gradient: 'hero-rb',       path: '/rb/manager/dashboard' },
    { id: 'water_delivery', name: 'Water Delivery',        desc: 'Lorry dispatch, GPS & debt tracking', Icon: Truck,   gradient: 'hero-delivery', path: '/water/driver/dashboard' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>
            Operations Dashboard
          </h1>
          <p className="text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading}
            className="btn-ghost gap-1.5 text-sm disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Loading…' : `Updated ${timeAgo(lastRefresh.toISOString())}`}
          </button>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-emerald-700">Live</span>
          </div>
        </div>
      </div>

      {/* Combined stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Combined Revenue Today"
          value={loading ? '—' : `KES ${combinedTotal.toLocaleString()}`}
          icon={<DollarSign size={22} className="text-purple-600" />} iconBg="bg-purple-50" accent="border-purple-500" />
        <StatCard label="Total Transactions"
          value={loading ? '—' : combinedTxns}
          icon={<TrendingUp size={22} className="text-blue-600" />} iconBg="bg-blue-50" accent="border-blue-500" />
        <StatCard label="Outstanding Debts"
          value={loading ? '—' : `KES ${totalDebt.toLocaleString()}`}
          icon={<AlertCircle size={22} className="text-red-500" />} iconBg="bg-red-50" accent="border-red-400"
          sub={`${debts.length} records`} />
        <StatCard label="Active Staff"
          value={loading ? '—' : activeStaff}
          icon={<Users size={22} className="text-green-600" />} iconBg="bg-green-50" accent="border-green-500" />
      </div>

      {/* Business arm tiles */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4">Business Arms</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {ARMS.map((arm) => {
            const rev = revenue[arm.id];
            return (
              <div key={arm.id} className="card overflow-hidden">
                <div className={`${arm.gradient} p-5 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mb-3">
                        <arm.Icon size={20} />
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
                    {loading ? (
                      <div className="h-8 w-28 bg-white/10 rounded-lg animate-pulse mt-1" />
                    ) : (
                      <p className="text-3xl font-black mt-0.5">KES {rev.total.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'M-Pesa', val: rev.mpesa },
                    { label: 'Cash',   val: rev.cash },
                    { label: 'Txns',   val: rev.txns, isTxn: true },
                  ].map((s, i) => (
                    <div key={s.label} className={`text-center ${i === 1 ? 'border-x border-gray-100' : ''}`}>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      {loading
                        ? <div className="h-4 bg-gray-100 rounded animate-pulse mx-auto mt-1 w-16" />
                        : <p className="font-black text-sm text-gray-900">
                            {s.isTxn ? s.val : `KES ${s.val.toLocaleString()}`}
                          </p>
                      }
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Approvals + Debts */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Pending Approvals</h3>
            {!loading && <span className="badge badge-pending">{pendingItems.length} items</span>}
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-32" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                  </div>
                </div>
              ))
            ) : pendingItems.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-sm">No pending approvals</p>
            ) : (
              pendingItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.urgent ? 'bg-red-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.type}</p>
                    <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                    <p className="text-xs text-gray-400">{item.by} · {timeAgo(item.created_at)}</p>
                  </div>
                  <Link to={item.table === 'stock_requests' ? '/water/admin/stock-requests' : '/water/admin/refunds'}
                    className="btn text-xs py-1.5 px-3 bg-gray-900 text-white hover:bg-gray-700">
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Outstanding Debts</h3>
            <Link to="/super-admin/debts" className="text-xs text-blue-600 font-semibold hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-28" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-40" />
                  </div>
                </div>
              ))
            ) : debts.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-sm">No outstanding debts 🎉</p>
            ) : (
              debts.map((debt) => (
                <div key={debt.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-sm font-bold flex-shrink-0">
                    {debt.customer.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{debt.customer}</p>
                    <p className="text-xs text-gray-500">{debt.product_description} · {debt.driver}</p>
                    <p className="text-xs text-gray-400">{timeAgo(debt.created_at)}</p>
                  </div>
                  <span className="badge badge-unpaid">KES {debt.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          {!loading && totalDebt > 0 && (
            <div className="p-4 bg-red-50 border-t border-red-100 flex justify-between items-center">
              <span className="text-sm font-bold text-red-800">Total Outstanding</span>
              <span className="font-black text-red-700 text-lg">KES {totalDebt.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Branch',  icon: '🏪', path: '/super-admin/users',          color: 'bg-blue-50 hover:bg-blue-100 text-blue-800' },
            { label: 'Create User', icon: '👤', path: '/super-admin/users',          color: 'bg-purple-50 hover:bg-purple-100 text-purple-800' },
            { label: 'Edit Prices', icon: '💰', path: '/super-admin/prices',         color: 'bg-amber-50 hover:bg-amber-100 text-amber-800' },
            { label: 'GPS Map',     icon: '🗺️', path: '/water/driver/gps',          color: 'bg-green-50 hover:bg-green-100 text-green-800' },
          ].map((action) => (
            <Link key={action.label} to={action.path}
              className={`card p-4 flex items-center gap-3 transition-colors ${action.color} border-0 no-underline`}>
              <span className="text-2xl">{action.icon}</span>
              <span className="font-bold text-sm">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}