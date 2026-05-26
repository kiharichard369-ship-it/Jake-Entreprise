import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Minus, ChevronDown, ChevronUp, Loader2, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface CreditRecord {
  id: string; date: string; type: 'overpayment' | 'applied' | 'manual_adjustment';
  amount: number; balance_after: number; staff: string;
  transaction_ref: string | null; notes: string | null;
}
interface CustomerCredit {
  id: string; full_name: string; phone: string | null;
  credit_balance: number; history: CreditRecord[];
}

const TYPE_CONFIG = {
  overpayment:       { label: 'Overpayment',   bg: 'bg-green-100 text-green-800',  sign: '+' },
  applied:           { label: 'Applied',        bg: 'bg-blue-100 text-blue-800',    sign: '−' },
  manual_adjustment: { label: 'Manual Adj.',    bg: 'bg-purple-100 text-purple-800', sign: '±' },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function CustomerCreditsPage() {
  const { shopId, businessId, profile } = useAuth();
  const [customers, setCustomers]       = useState<CustomerCredit[]>([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [creditOnly, setCreditOnly]     = useState(true);
  const [adjustModal, setAdjustModal]   = useState<CustomerCredit | null>(null);
  const [adjustType, setAdjustType]     = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [saving, setSaving]             = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('customers').select('id, full_name, phone, credit_balance').order('credit_balance', { ascending: false });
    if (shopId) q = q.eq('shop_id', shopId);
    else if (businessId) q = q.eq('business_id', businessId);
    if (creditOnly) q = q.gt('credit_balance', 0);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    setCustomers((data || []).map((c: any) => ({
      id: c.id, full_name: c.full_name, phone: c.phone,
      credit_balance: Number(c.credit_balance), history: [],
    })));
    setLoading(false);
  }, [shopId, businessId, creditOnly]);

  useEffect(() => { load(); }, [load]);

  const loadHistory = async (customerId: string) => {
    if (expandedId === customerId) { setExpandedId(null); return; }
    setExpandedId(customerId);
    setHistoryLoading(customerId);
    const { data } = await supabase.from('customer_credits')
      .select('id, type, amount, balance_after, notes, created_at, profiles!staff_id(full_name), transactions(receipt_ref)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false }).limit(20);
    const history: CreditRecord[] = (data || []).map((h: any) => ({
      id: h.id, date: h.created_at, type: h.type,
      amount: Number(h.amount), balance_after: Number(h.balance_after),
      staff: h.profiles?.full_name || '—',
      transaction_ref: h.transactions?.receipt_ref || null,
      notes: h.notes,
    }));
    setCustomers((prev) => prev.map((c) => c.id === customerId ? { ...c, history } : c));
    setHistoryLoading(null);
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal || !profile) return;
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!adjustReason.trim()) { toast.error('Reason is required'); return; }
    if (adjustType === 'deduct' && amount > adjustModal.credit_balance) {
      toast.error(`Cannot deduct more than current balance (KES ${adjustModal.credit_balance.toLocaleString()})`);
      return;
    }
    setSaving(true);
    const delta = adjustType === 'add' ? amount : -amount;
    const newBalance = Math.max(0, adjustModal.credit_balance + delta);

    // Update customers.credit_balance
    const { error: custErr } = await supabase.from('customers')
      .update({ credit_balance: newBalance }).eq('id', adjustModal.id);
    if (custErr) { toast.error(custErr.message); setSaving(false); return; }

    // Insert customer_credits record
    const { error: credErr } = await supabase.from('customer_credits').insert({
      customer_id: adjustModal.id,
      type: 'manual_adjustment',
      amount: delta,
      balance_after: newBalance,
      notes: adjustReason.trim(),
      staff_id: profile.id,
    });
    if (credErr) { toast.error(credErr.message); setSaving(false); return; }

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: profile.id,
      action_type: 'credit_manual_adjustment',
      entity_type: 'customer',
      entity_id: adjustModal.id,
      old_value: { credit_balance: adjustModal.credit_balance },
      new_value: { credit_balance: newBalance, reason: adjustReason },
      business_id: businessId || 'water_retail',
    });

    toast.success(`Credit ${adjustType === 'add' ? 'added' : 'deducted'} — KES ${amount.toLocaleString()} for ${adjustModal.full_name}`);
    setAdjustModal(null); setAdjustAmount(''); setAdjustReason('');
    setSaving(false);
    load();
  };

  const totalCredit = customers.reduce((s, c) => s + c.credit_balance, 0);
  const withCredit  = customers.filter((c) => c.credit_balance > 0).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center"><CreditCard size={20} className="text-white" /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>Customer Credits</h1>
            <p className="text-gray-500 text-sm">Overpayments and credit balances</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost gap-1.5 text-sm disabled:opacity-50">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </button>
      </div>

      {/* Cross-channel note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <strong>Cross-Channel Policy (Confirmed):</strong> Credit earned at Water Retail can be applied to Water Delivery transactions. The same customer record is used across both channels.
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Credit Held</p>
          <p className="text-3xl font-black text-green-600">KES {totalCredit.toLocaleString()}</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customers With Credit</p>
          <p className="text-3xl font-black text-blue-700">{withCredit}</p>
        </div>
        <div className="card p-5 border-l-4 border-purple-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Avg Balance</p>
          <p className="text-3xl font-black text-purple-700">
            KES {withCredit > 0 ? Math.round(totalCredit / withCredit).toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* Filter */}
      <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
        <input type="checkbox" checked={creditOnly} onChange={(e) => setCreditOnly(e.target.checked)} className="accent-blue-600" />
        <span className="text-sm font-medium text-gray-700">Show only customers with active balance</span>
      </label>

      {/* Customer list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}</div>
      ) : customers.length === 0 ? (
        <div className="card p-12 text-center text-gray-400"><CreditCard size={40} className="mx-auto mb-3 opacity-20" /><p>No credit records found</p></div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => {
            const isExpanded = expandedId === customer.id;
            return (
              <div key={customer.id} className="card overflow-hidden">
                <button onClick={() => loadHistory(customer.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    {customer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{customer.full_name}</p>
                    <p className="text-xs text-gray-400">{customer.phone || '—'}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</p>
                    <p className={`font-black text-lg ${customer.credit_balance > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                      KES {customer.credit_balance.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); setAdjustModal(customer); setAdjustType('add'); setAdjustAmount(''); setAdjustReason(''); }}
                      className="btn text-xs py-1.5 px-3 bg-purple-50 text-purple-700 hover:bg-purple-100">Adjust</button>
                    {historyLoading === customer.id
                      ? <Loader2 size={16} className="text-gray-400 animate-spin" />
                      : isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <h4 className="font-bold text-sm text-gray-700">Credit History</h4>
                    </div>
                    {customer.history.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-gray-400 text-center">No credit history yet</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {customer.history.map((h) => {
                          const cfg = TYPE_CONFIG[h.type];
                          return (
                            <div key={h.id} className="flex items-center gap-4 px-5 py-3.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${cfg.bg}`}>
                                {cfg.sign}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`badge text-[10px] ${cfg.bg}`}>{cfg.label}</span>
                                  {h.transaction_ref && <span className="font-mono text-[10px] text-gray-400">{h.transaction_ref}</span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">by {h.staff}</p>
                                {h.notes && <p className="text-xs text-gray-400 italic">"{h.notes}"</p>}
                                <p className="text-[10px] text-gray-400">{timeAgo(h.date)}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`font-black ${h.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {h.amount > 0 ? '+' : ''}KES {Math.abs(h.amount).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-gray-400">Bal: KES {h.balance_after.toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900">Manual Credit Adjustment</h2>
              <button onClick={() => setAdjustModal(null)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15} /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              {adjustModal.full_name} · Current: <strong>KES {adjustModal.credit_balance.toLocaleString()}</strong>
            </p>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Adjustment Type</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {(['add', 'deduct'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setAdjustType(t)}
                      className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${adjustType === t ? t === 'add' ? 'bg-green-600 text-white' : 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {t === 'add' ? <><Plus size={14} /> Add Credit</> : <><Minus size={14} /> Deduct Credit</>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Amount (KES) <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)}
                  className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason <span className="text-red-500">*</span></label>
                <textarea value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} rows={3}
                  className="input-field resize-none" placeholder="Reason for this manual adjustment…" />
              </div>
              {adjustAmount && Number(adjustAmount) > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-500">Balance after:</p>
                  <p className="font-black text-lg text-gray-900">
                    KES {Math.max(0, adjustModal.credit_balance + (adjustType === 'add' ? 1 : -1) * Number(adjustAmount)).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className={`flex-1 btn justify-center gap-2 text-white disabled:opacity-60 ${adjustType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? 'Saving…' : `${adjustType === 'add' ? 'Add' : 'Deduct'} Credit`}
                </button>
                <button type="button" onClick={() => setAdjustModal(null)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}