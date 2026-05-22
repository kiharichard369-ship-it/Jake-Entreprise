import React, { useState, useRef } from 'react';
import { DollarSign, Plus, Camera, CheckCircle, XCircle, Search, Upload, Eye, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

type ExpenseCategory = 'fuel' | 'repair' | 'other';
type ExpenseStatus = 'logged' | 'reviewed' | 'rejected';

interface Expense {
  id: string;
  driver: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  receipt_url: string | null;
  status: ExpenseStatus;
  rejection_reason: string | null;
  logged_at: string;
}

const mockExpenses: Expense[] = [
  { id: 'e1', driver: 'Brian Njoroge', category: 'fuel', description: 'Fueled lorry at Total Petrol Station — 40 litres', amount: 6400, receipt_url: null, status: 'reviewed', rejection_reason: null, logged_at: '2026-05-16T08:15:00Z' },
  { id: 'e2', driver: 'Brian Njoroge', category: 'repair', description: 'Right rear tyre puncture — patch at roadside garage', amount: 500, receipt_url: 'receipt_e2.jpg', status: 'logged', rejection_reason: null, logged_at: '2026-05-16T10:40:00Z' },
  { id: 'e3', driver: 'James Kiprop', category: 'fuel', description: 'Mid-day fuel top-up — 20 litres Shell Station', amount: 3200, receipt_url: null, status: 'logged', rejection_reason: null, logged_at: '2026-05-16T12:05:00Z' },
  { id: 'e4', driver: 'Brian Njoroge', category: 'other', description: 'Parking fee at Section 58 market area', amount: 100, receipt_url: null, status: 'rejected', rejection_reason: 'Parking fees are not reimbursable per company policy. Only fuel and vehicle repair costs.', logged_at: '2026-05-15T14:30:00Z' },
  { id: 'e5', driver: 'James Kiprop', category: 'repair', description: 'Replaced worn wiper blades — Nakuru Auto Parts', amount: 800, receipt_url: 'receipt_e5.jpg', status: 'reviewed', rejection_reason: null, logged_at: '2026-05-15T09:20:00Z' },
];

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; emoji: string; bg: string; text: string }> = {
  fuel:   { label: 'Fuel',   emoji: '⛽', bg: 'bg-amber-100', text: 'text-amber-800' },
  repair: { label: 'Repair', emoji: '🔧', bg: 'bg-blue-100',  text: 'text-blue-800' },
  other:  { label: 'Other',  emoji: '📋', bg: 'bg-gray-100',  text: 'text-gray-700' },
};

const STATUS_CONFIG: Record<ExpenseStatus, { badge: string; label: string }> = {
  logged:   { badge: 'badge-pending', label: 'Logged' },
  reviewed: { badge: 'badge-paid',    label: 'Reviewed' },
  rejected: { badge: 'badge-unpaid',  label: 'Rejected' },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Driver View ──────────────────────────────────────────────────────────────
function DriverExpenseView() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const myExpenses = mockExpenses.filter((e) => e.driver === profile?.full_name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Description is required';
    if (!amount || Number(amount) <= 0) e.amount = 'Enter a valid amount greater than 0';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    toast.success('Expense logged. Admin has been notified.');
    setDescription(''); setAmount(''); setReceiptPreview(null); setReceiptFile(null); setErrors({});
    setSaving(false);
  };

  const totalToday = myExpenses
    .filter((e) => e.logged_at.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Log expense form */}
      <div className="card p-6">
        <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
          <Plus size={18} className="text-green-600" /> Log New Expense
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`py-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                      category === cat ? `border-current ${cfg.bg} ${cfg.text}` : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}>
                    <span className="text-xl">{cfg.emoji}</span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
              rows={3} placeholder="Describe the expense in detail…"
              className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Amount (KES) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">KES</span>
              <input type="number" min="1" value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
                className={`input-field pl-12 ${errors.amount ? 'border-red-400' : ''}`} placeholder="0" />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Receipt upload */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Receipt Photo <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {receiptPreview ? (
              <div className="relative inline-block">
                <img src={receiptPreview} alt="Receipt" className="h-32 rounded-xl object-cover border border-gray-200" />
                <button type="button" onClick={() => { setReceiptPreview(null); setReceiptFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors">
                <Camera size={20} />
                <span className="text-sm font-medium">Tap to upload receipt photo</span>
                <span className="text-xs">JPG, PNG · Max 5MB</span>
              </button>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="btn bg-green-600 text-white hover:bg-green-700 gap-2 disabled:opacity-60">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Logging…' : 'Log Expense'}
          </button>
        </form>
      </div>

      {/* My expense history */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">My Expenses</h3>
          {totalToday > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Total today</p>
              <p className="font-black text-gray-900">KES {totalToday.toLocaleString()}</p>
            </div>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {myExpenses.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">No expenses logged yet</p>
          ) : (
            myExpenses.map((exp) => {
              const cat = CATEGORY_CONFIG[exp.category];
              const stat = STATUS_CONFIG[exp.status];
              return (
                <div key={exp.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${cat.bg}`}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`badge text-[10px] ${cat.bg} ${cat.text}`}>{cat.label}</span>
                        <span className={`badge text-[10px] ${stat.badge}`}>{stat.label}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{exp.description}</p>
                      {exp.status === 'rejected' && exp.rejection_reason && (
                        <div className="flex items-start gap-1.5 mt-1.5 p-2 bg-red-50 rounded-lg border border-red-100">
                          <XCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">{exp.rejection_reason}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(exp.logged_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-gray-900">KES {exp.amount.toLocaleString()}</p>
                      {exp.receipt_url && (
                        <p className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-0.5 justify-end">
                          <Upload size={10} /> receipt
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin Review View ────────────────────────────────────────────────────────
function AdminExpenseView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('logged');
  const [rejectModal, setRejectModal] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [receiptModal, setReceiptModal] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = mockExpenses.filter((e) => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchSearch = !search || e.driver.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalByCategory = (cat: ExpenseCategory) =>
    mockExpenses.filter((e) => e.category === cat && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);

  const handleReview = async (id: string) => {
    setProcessing(id);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Expense marked as reviewed');
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) { toast.error('Enter a rejection reason'); return; }
    setProcessing(rejectModal.id);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Expense rejected. Driver has been notified.');
    setRejectModal(null); setRejectReason(''); setProcessing(null);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <div key={cat} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.bg}`}>{cfg.emoji}</div>
              <div>
                <p className="text-xs text-gray-500">{cfg.label} this month</p>
                <p className="font-black text-gray-900">KES {totalByCategory(cat).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search driver or description…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['logged', 'reviewed', 'rejected', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${statusFilter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Expense table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Driver', 'Category', 'Description', 'Amount', 'Receipt', 'Logged', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((exp) => {
              const cat = CATEGORY_CONFIG[exp.category];
              const stat = STATUS_CONFIG[exp.status];
              return (
                <tr key={exp.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 font-semibold text-sm text-gray-900">{exp.driver}</td>
                  <td className="px-4 py-3.5">
                    <span className={`badge text-[10px] ${cat.bg} ${cat.text}`}>{cat.emoji} {cat.label}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[200px]">
                    <p className="truncate">{exp.description}</p>
                    {exp.status === 'rejected' && exp.rejection_reason && (
                      <p className="text-red-500 text-[10px] mt-0.5 truncate">↳ {exp.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-black text-gray-900">KES {exp.amount.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    {exp.receipt_url ? (
                      <button onClick={() => setReceiptModal(exp.receipt_url)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold">
                        <Eye size={12} /> View
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">{timeAgo(exp.logged_at)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`badge text-[10px] ${stat.badge}`}>{stat.label}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {exp.status === 'logged' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleReview(exp.id)} disabled={processing === exp.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold disabled:opacity-60">
                          {processing === exp.id ? <span className="w-3 h-3 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : <CheckCircle size={11} />}
                          Review
                        </button>
                        <button onClick={() => setRejectModal(exp)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold">
                          <XCircle size={11} /> Reject
                        </button>
                      </div>
                    )}
                    {exp.status !== 'logged' && <span className="text-xs text-gray-400">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No expenses found</p>
          </div>
        )}
      </div>

      {/* Receipt preview modal */}
      {receiptModal && (
        <div className="modal-overlay" onClick={() => setReceiptModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-gray-900">Receipt Photo</p>
              <button onClick={() => setReceiptModal(null)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Camera size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Receipt: {receiptModal}</p>
                <p className="text-xs mt-1">Preview requires Supabase Storage integration</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Reject Expense</h2>
            <p className="text-gray-500 text-sm mb-4">{rejectModal.driver} — KES {rejectModal.amount.toLocaleString()} ({rejectModal.description})</p>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this expense is rejected…" rows={3} className="input-field resize-none" autoFocus />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectReason.trim() || !!processing}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700 justify-center disabled:opacity-60">Reject Expense</button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page wrapper ─────────────────────────────────────────────────────────────
export default function DriverExpensePage() {
  const { role } = useAuth();
  const isAdmin = role === 'water_admin' || role === 'super_admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 hero-delivery rounded-xl flex items-center justify-center">
          <DollarSign size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            {isAdmin ? 'Expense Review' : 'Log Expense'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAdmin ? 'Review and approve driver expenses' : 'Fuel, repair and other vehicle expenses'}
          </p>
        </div>
      </div>
      {isAdmin ? <AdminExpenseView /> : <DriverExpenseView />}
    </div>
  );
}
