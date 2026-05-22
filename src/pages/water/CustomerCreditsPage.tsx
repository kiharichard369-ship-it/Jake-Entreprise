import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CreditCard, Plus, Minus, ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface CreditRecord {
  id: string;
  date: string;
  type: 'overpayment' | 'applied' | 'manual_adjustment';
  amount: number;
  balance_after: number;
  staff: string;
  transaction_ref: string | null;
  notes: string | null;
}

interface CustomerCredit {
  id: string;
  full_name: string;
  phone: string;
  credit_balance: number;
  last_overpayment: string | null;
  last_applied: string | null;
  history: CreditRecord[];
}

const mockCreditData: CustomerCredit[] = [
  {
    id: 'c2', full_name: 'Grace Njeri', phone: '0722111222', credit_balance: 750,
    last_overpayment: '2026-05-16', last_applied: null,
    history: [
      { id: 'h1', date: '2026-05-16T10:30:00Z', type: 'overpayment', amount: 750, balance_after: 750, staff: 'Cashier Janet', transaction_ref: 'RCP-A1B2C3D4', notes: 'Customer paid KES 1500 for KES 750 delivery' },
    ],
  },
  {
    id: 'c4', full_name: 'Mary Achieng', phone: '0700123456', credit_balance: 200,
    last_overpayment: '2026-05-12', last_applied: '2026-05-14',
    history: [
      { id: 'h2', date: '2026-05-12T14:00:00Z', type: 'overpayment', amount: 500, balance_after: 500, staff: 'Cashier Peter', transaction_ref: 'RCP-B2C3D4E5', notes: null },
      { id: 'h3', date: '2026-05-14T09:30:00Z', type: 'applied', amount: -300, balance_after: 200, staff: 'Cashier Janet', transaction_ref: 'RCP-F6G7H8I9', notes: 'Applied at POS' },
    ],
  },
  {
    id: 'c7', full_name: 'Brian Chesire', phone: '0756321654', credit_balance: 100,
    last_overpayment: null, last_applied: null,
    history: [
      { id: 'h4', date: '2026-05-15T11:00:00Z', type: 'manual_adjustment', amount: 100, balance_after: 100, staff: 'Admin Samuel', transaction_ref: null, notes: 'Goodwill credit for inconvenience on delivery #DLV-010' },
    ],
  },
];

const TYPE_CONFIG = {
  overpayment:        { label: 'Overpayment', bg: 'bg-green-100 text-green-800', sign: '+' },
  applied:            { label: 'Applied', bg: 'bg-blue-100 text-blue-800', sign: '−' },
  manual_adjustment:  { label: 'Manual Adj.', bg: 'bg-purple-100 text-purple-800', sign: '±' },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CustomerCreditsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'water_admin' || role === 'super_admin';

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creditOnlyFilter, setCreditOnlyFilter] = useState(true);
  const [adjustModal, setAdjustModal] = useState<CustomerCredit | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [saving, setSaving] = useState(false);

  const displayed = creditOnlyFilter ? mockCreditData.filter((c) => c.credit_balance > 0) : mockCreditData;
  const totalCredit = mockCreditData.reduce((s, c) => s + c.credit_balance, 0);
  const customersWithCredit = mockCreditData.filter((c) => c.credit_balance > 0).length;
  const appliedThisMonth = mockCreditData.flatMap((c) => c.history).filter((h) => h.type === 'applied').reduce((s, h) => s + Math.abs(h.amount), 0);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || Number(adjustAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!adjustReason.trim()) { toast.error('Reason is required'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success(`Credit ${adjustType === 'add' ? 'added' : 'deducted'} — KES ${Number(adjustAmount).toLocaleString()} for ${adjustModal?.full_name}`);
    setAdjustModal(null); setAdjustAmount(''); setAdjustReason('');
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-water rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Customer Credits</h1>
            <p className="text-gray-500 text-sm">Overpayments and credit balances</p>
          </div>
        </div>
      </div>

      {/* Cross-channel note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-800 text-sm">Cross-Channel Credit Policy (Confirmed)</p>
          <p className="text-xs text-blue-700 mt-0.5">Credit earned at Water Retail can be applied to Water Delivery transactions. The same customer record is used across both channels.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Credit Held</p>
          <p className="text-3xl font-black text-green-600">KES {totalCredit.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Across all customers</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customers With Credit</p>
          <p className="text-3xl font-black text-blue-700">{customersWithCredit}</p>
        </div>
        <div className="card p-5 border-l-4 border-purple-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Applied This Month</p>
          <p className="text-3xl font-black text-purple-700">KES {appliedThisMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <input type="checkbox" checked={creditOnlyFilter} onChange={(e) => setCreditOnlyFilter(e.target.checked)} className="accent-blue-600" />
          <span className="text-sm font-medium text-gray-700">Show only customers with active balance</span>
        </label>
        <p className="text-xs text-gray-400">{displayed.length} customers shown</p>
      </div>

      {/* Customer credit list */}
      <div className="space-y-3">
        {displayed.map((customer) => {
          const isExpanded = expandedId === customer.id;
          return (
            <div key={customer.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {customer.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{customer.full_name}</p>
                  <p className="text-xs text-gray-400">{customer.phone}</p>
                </div>
                <div className="grid grid-cols-3 gap-6 text-right mr-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</p>
                    <p className={`font-black ${customer.credit_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      KES {customer.credit_balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Last Overpayment</p>
                    <p className="font-semibold text-sm text-gray-700">{customer.last_overpayment || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Last Applied</p>
                    <p className="font-semibold text-sm text-gray-700">{customer.last_applied || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAdjustModal(customer); setAdjustType('add'); }}
                      className="btn text-xs py-1.5 px-3 bg-purple-50 text-purple-700 hover:bg-purple-100"
                    >
                      Adjust
                    </button>
                  )}
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {/* Expanded history */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h4 className="font-bold text-sm text-gray-700">Credit History</h4>
                  </div>
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
                            {h.notes && <p className="text-xs text-gray-400 italic mt-0.5">"{h.notes}"</p>}
                            <p className="text-[10px] text-gray-400">{timeAgo(h.date)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-black ${h.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {h.amount > 0 ? '+' : ''}KES {Math.abs(h.amount).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400">Balance: KES {h.balance_after.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Adjustment Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Manual Credit Adjustment</h2>
            <p className="text-gray-500 text-sm mb-4">{adjustModal.full_name} · Current balance: <strong>KES {adjustModal.credit_balance.toLocaleString()}</strong></p>

            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Adjustment Type</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {(['add', 'deduct'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setAdjustType(t)}
                      className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        adjustType === t ? t === 'add' ? 'bg-green-600 text-white' : 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}>
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
                <textarea value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}
                  rows={3} className="input-field resize-none" placeholder="Reason for manual credit adjustment…" />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="text-gray-500">Balance after adjustment:</p>
                <p className="font-black text-lg text-gray-900">
                  KES {Math.max(0, adjustModal.credit_balance + (adjustType === 'add' ? 1 : -1) * (Number(adjustAmount) || 0)).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className={`flex-1 btn justify-center gap-2 text-white disabled:opacity-60 ${adjustType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
