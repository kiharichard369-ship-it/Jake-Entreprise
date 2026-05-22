import React, { useState } from 'react';
import { Truck, Plus, Clock, MapPin, CheckCircle, Package, AlertCircle, Navigation, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

type TripStatus = 'pending' | 'dispatched' | 'delivered' | 'returned';

interface TripItem { product: string; qty: number; litres: number; amount: number; }

interface Trip {
  id: string;
  customer: string;
  location: string;
  phone: string;
  items: TripItem[];
  status: TripStatus;
  payment_status: 'paid' | 'unpaid';
  dispatch_time: string | null;
  delivery_time: string | null;
  return_time: string | null;
  total_amount: number;
}

const waterProducts = [
  { id: 'wp1', label: '20L Refill', price_per_unit: 150, litres_per_unit: 20 },
  { id: 'wp2', label: '10L Refill', price_per_unit: 80, litres_per_unit: 10 },
  { id: 'wp3', label: '5L Refill', price_per_unit: 40, litres_per_unit: 5 },
];

const deliveryCustomers = [
  { id: 'c1', full_name: 'Kamau Peter', location: 'Milimani Estate', phone: '0712345678' },
  { id: 'c2', full_name: 'Grace Njeri', location: 'Section 58', phone: '0722111222' },
  { id: 'c3', full_name: 'David Ochieng', location: 'Pipeline', phone: '0733999888' },
  { id: 'c4', full_name: 'Mary Achieng', location: 'Kaptembwo', phone: '0700123456' },
];

const mockTrips: Trip[] = [
  { id: 't1', customer: 'Kamau Peter', location: 'Milimani Estate', phone: '0712345678', items: [{ product: '20L Refill', qty: 6, litres: 120, amount: 900 }], status: 'delivered', payment_status: 'paid', dispatch_time: '08:30', delivery_time: '09:15', return_time: null, total_amount: 900 },
  { id: 't2', customer: 'Grace Njeri', location: 'Section 58', phone: '0722111222', items: [{ product: '20L Refill', qty: 5, litres: 100, amount: 750 }], status: 'delivered', payment_status: 'unpaid', dispatch_time: '09:45', delivery_time: '10:30', return_time: null, total_amount: 750 },
  { id: 't3', customer: 'David Ochieng', location: 'Pipeline', phone: '0733999888', items: [{ product: '20L Refill', qty: 10, litres: 200, amount: 1500 }], status: 'dispatched', payment_status: 'paid', dispatch_time: '11:00', delivery_time: null, return_time: null, total_amount: 1500 },
  { id: 't4', customer: 'Mary Achieng', location: 'Kaptembwo', phone: '0700123456', items: [{ product: '20L Refill', qty: 4, litres: 80, amount: 600 }], status: 'pending', payment_status: 'paid', dispatch_time: null, delivery_time: null, return_time: null, total_amount: 600 },
];

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-gray-600',  bg: 'bg-gray-100' },
  dispatched: { label: 'Dispatched', color: 'text-amber-700', bg: 'bg-amber-100' },
  delivered:  { label: 'Delivered',  color: 'text-green-700', bg: 'bg-green-100' },
  returned:   { label: 'Returned',   color: 'text-blue-700',  bg: 'bg-blue-100' },
};

const OPENING_LOAD = 6600; // litres

export default function DeliveryRecordingPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [showNewForm, setShowNewForm] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // New trip form state
  const [customerId, setCustomerId] = useState('');
  const [productRows, setProductRows] = useState([{ productId: 'wp1', qty: '' }]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Lorry load calculation
  const deliveredLitres = trips.filter((t) => ['delivered', 'returned'].includes(t.status))
    .reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.litres, 0), 0);
  const dispatchedLitres = trips.filter((t) => t.status === 'dispatched')
    .reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.litres, 0), 0);
  const remainingLitres = OPENING_LOAD - deliveredLitres - dispatchedLitres;
  const loadPercent = Math.max(0, Math.round((remainingLitres / OPENING_LOAD) * 100));

  // Pending litres from form
  const formLitres = productRows.reduce((sum, row) => {
    const p = waterProducts.find((wp) => wp.id === row.productId);
    return sum + (p ? (Number(row.qty) || 0) * p.litres_per_unit : 0);
  }, 0);
  const projectedRemaining = remainingLitres - formLitres;

  const selectedCustomer = deliveryCustomers.find((c) => c.id === customerId);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Please select a customer';
    if (productRows.some((r) => !r.qty || Number(r.qty) <= 0)) e.products = 'Enter quantity for all products';
    if (formLitres > remainingLitres) e.load = `Insufficient lorry load. Available: ${remainingLitres}L`;
    return e;
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const newTrip: Trip = {
      id: `t${Date.now()}`,
      customer: selectedCustomer!.full_name,
      location: selectedCustomer!.location,
      phone: selectedCustomer!.phone,
      items: productRows.map((row) => {
        const p = waterProducts.find((wp) => wp.id === row.productId)!;
        const qty = Number(row.qty);
        return { product: p.label, qty, litres: qty * p.litres_per_unit, amount: qty * p.price_per_unit };
      }),
      status: 'pending', payment_status: paymentStatus,
      dispatch_time: null, delivery_time: null, return_time: null,
      total_amount: productRows.reduce((s, row) => {
        const p = waterProducts.find((wp) => wp.id === row.productId)!;
        return s + Number(row.qty) * p.price_per_unit;
      }, 0),
    };
    setTrips((prev) => [newTrip, ...prev]);
    toast.success('Trip created. Tap "Mark as Dispatched" when you leave.');
    setShowNewForm(false);
    setCustomerId(''); setProductRows([{ productId: 'wp1', qty: '' }]); setFormErrors({});
    setSaving(false);
  };

  const updateTripStatus = async (tripId: string, newStatus: TripStatus) => {
    setProcessing(tripId);
    const now = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    await new Promise((r) => setTimeout(r, 600));
    setTrips((prev) => prev.map((t) => {
      if (t.id !== tripId) return t;
      const updated = { ...t, status: newStatus };
      if (newStatus === 'dispatched') updated.dispatch_time = now;
      if (newStatus === 'delivered') {
        updated.delivery_time = now;
        if (t.payment_status === 'unpaid') toast.error(`Debt of KES ${t.total_amount.toLocaleString()} recorded for ${t.customer}`);
      }
      if (newStatus === 'returned') updated.return_time = now;
      return updated;
    }));
    const messages: Record<TripStatus, string> = {
      dispatched: 'Trip marked as dispatched. Timestamp recorded.',
      delivered: 'Delivery confirmed. Timestamp recorded.',
      returned: 'Returned to depot. Day log updated.',
      pending: '',
    };
    if (messages[newStatus]) toast.success(messages[newStatus]);
    setProcessing(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-delivery rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Deliveries</h1>
            <p className="text-gray-500 text-sm">Dispatch and delivery tracking — {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn bg-green-600 text-white hover:bg-green-700 gap-2">
          <Plus size={15} /> New Delivery
        </button>
      </div>

      {/* Lorry load bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Lorry Load Status</p>
            <p className="font-black text-2xl text-gray-900">{remainingLitres.toLocaleString()}L remaining</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Opening load</p>
            <p className="font-bold text-gray-700">{OPENING_LOAD.toLocaleString()}L</p>
            <p className="text-xs text-gray-400 mt-1">{deliveredLitres.toLocaleString()}L delivered · {dispatchedLitres.toLocaleString()}L in transit</p>
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${loadPercent > 50 ? 'bg-green-500' : loadPercent > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${loadPercent}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">0L</span>
          <span className={`text-xs font-bold ${loadPercent > 50 ? 'text-green-600' : loadPercent > 20 ? 'text-amber-600' : 'text-red-600'}`}>{loadPercent}%</span>
          <span className="text-[10px] text-gray-400">{OPENING_LOAD.toLocaleString()}L</span>
        </div>
      </div>

      {/* New delivery form */}
      {showNewForm && (
        <div className="card p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900 flex items-center gap-2"><Plus size={16} className="text-green-600" /> New Delivery Trip</h2>
            <button onClick={() => setShowNewForm(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><X size={15} /></button>
          </div>
          <form onSubmit={handleCreateTrip} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Customer <span className="text-red-500">*</span></label>
              <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setFormErrors((p) => ({ ...p, customer: '' })); }}
                className={`input-field ${formErrors.customer ? 'border-red-400' : ''}`}>
                <option value="">Select delivery customer…</option>
                {deliveryCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} — {c.location} ({c.phone})</option>
                ))}
              </select>
              {formErrors.customer && <p className="text-xs text-red-500 mt-1">{formErrors.customer}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Products to Dispatch</label>
              <div className="space-y-2">
                {productRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={row.productId}
                      onChange={(e) => setProductRows((prev) => prev.map((r, ri) => ri === i ? { ...r, productId: e.target.value } : r))}
                      className="input-field flex-1">
                      {waterProducts.map((p) => <option key={p.id} value={p.id}>{p.label} (KES {p.price_per_unit}/unit, {p.litres_per_unit}L)</option>)}
                    </select>
                    <input type="number" min="1" placeholder="Qty"
                      value={row.qty}
                      onChange={(e) => setProductRows((prev) => prev.map((r, ri) => ri === i ? { ...r, qty: e.target.value } : r))}
                      className="input-field w-24" />
                    {productRows.length > 1 && (
                      <button type="button" onClick={() => setProductRows((prev) => prev.filter((_, ri) => ri !== i))}
                        className="w-8 h-8 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setProductRows((prev) => [...prev, { productId: 'wp1', qty: '' }])}
                className="mt-2 text-xs text-green-600 font-bold hover:text-green-800 flex items-center gap-1">
                <Plus size={12} /> Add another product
              </button>
              {formErrors.products && <p className="text-xs text-red-500 mt-1">{formErrors.products}</p>}
            </div>

            {/* Live load preview */}
            {formLitres > 0 && (
              <div className={`p-3 rounded-xl border ${formLitres > remainingLitres ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Load for this trip</span>
                  <span className="font-bold">{formLitres.toLocaleString()}L</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Lorry remaining after</span>
                  <span className={`font-black ${projectedRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {projectedRemaining < 0 ? 'EXCEEDS CAPACITY' : `${projectedRemaining.toLocaleString()}L`}
                  </span>
                </div>
                {formErrors.load && <p className="text-xs text-red-600 font-bold mt-1">{formErrors.load}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Payment Status</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['paid', 'unpaid'] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPaymentStatus(p)}
                    className={`flex-1 py-2.5 text-sm font-bold capitalize transition-colors ${paymentStatus === p ? p === 'paid' ? 'bg-green-600 text-white' : 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {p === 'paid' ? '✓ Paid' : '⚠ Not Paid (Debt)'}
                  </button>
                ))}
              </div>
              {paymentStatus === 'unpaid' && (
                <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} /> A debt record will be automatically created when delivery is confirmed
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 btn bg-green-600 text-white hover:bg-green-700 justify-center gap-2 disabled:opacity-60">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Creating…' : 'Create Trip'}
              </button>
              <button type="button" onClick={() => setShowNewForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Trip cards */}
      <div className="space-y-4">
        <h3 className="font-black text-gray-900">Today's Trips ({trips.length})</h3>
        {trips.map((trip) => {
          const cfg = STATUS_CONFIG[trip.status];
          return (
            <div key={trip.id} className={`card overflow-hidden border-l-4 ${
              trip.status === 'delivered' ? 'border-green-500' :
              trip.status === 'dispatched' ? 'border-amber-500' :
              trip.status === 'returned' ? 'border-blue-500' : 'border-gray-300'
            }`}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-black text-gray-900">{trip.customer}</p>
                      <span className={`badge text-[10px] ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <span className={`badge text-[10px] ${trip.payment_status === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>{trip.payment_status}</span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2"><MapPin size={10} />{trip.location} · <span>{trip.phone}</span></p>
                    <div className="flex gap-4 flex-wrap">
                      {trip.items.map((item, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-lg font-medium text-gray-700">
                          {item.product} ×{item.qty} ({item.litres}L)
                        </span>
                      ))}
                    </div>

                    {/* Timestamps */}
                    <div className="flex gap-6 mt-3 flex-wrap">
                      {[
                        { label: 'Dispatched', value: trip.dispatch_time },
                        { label: 'Delivered', value: trip.delivery_time },
                        { label: 'Returned', value: trip.return_time },
                      ].map((ts) => (
                        <div key={ts.label}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{ts.label}</p>
                          <p className={`text-xs font-bold ${ts.value ? 'text-gray-900' : 'text-gray-300'}`}>
                            {ts.value ? <span className="flex items-center gap-1"><Clock size={10} />{ts.value}</span> : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-xl text-gray-900">KES {trip.total_amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {trip.status === 'pending' && (
                    <button onClick={() => updateTripStatus(trip.id, 'dispatched')} disabled={processing === trip.id}
                      className="btn bg-amber-600 text-white hover:bg-amber-700 text-sm gap-2 disabled:opacity-60">
                      {processing === trip.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Navigation size={14} />}
                      Mark as Dispatched
                    </button>
                  )}
                  {trip.status === 'dispatched' && (
                    <button onClick={() => updateTripStatus(trip.id, 'delivered')} disabled={processing === trip.id}
                      className="btn bg-green-600 text-white hover:bg-green-700 text-sm gap-2 disabled:opacity-60">
                      {processing === trip.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                      Mark as Delivered
                    </button>
                  )}
                  {trip.status === 'delivered' && !trip.return_time && (
                    <button onClick={() => updateTripStatus(trip.id, 'returned')} disabled={processing === trip.id}
                      className="btn bg-blue-600 text-white hover:bg-blue-700 text-sm gap-2 disabled:opacity-60">
                      {processing === trip.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Truck size={14} />}
                      Returned to Depot
                    </button>
                  )}
                  {trip.payment_status === 'unpaid' && trip.status === 'delivered' && (
                    <span className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                      <AlertCircle size={12} /> Debt recorded
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
