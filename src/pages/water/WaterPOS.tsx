import React, { useState, useEffect, useCallback } from 'react';
import { POSGrid, Product } from '../../components/shared/POSGrid';
import { CartPanel, CartItem, Discount } from '../../components/shared/CartPanel';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { Droplets, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function WaterPOS() {
  const { profile, shopId } = useAuth();
  const [products, setProducts]   = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{
    open: boolean; ref: string; total: number; method: 'mpesa' | 'cash';
    discount: number; discountLabel: string; credit: number;
  }>({ open: false, ref: '', total: 0, method: 'cash', discount: 0, discountLabel: '', credit: 0 });

  const loadData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true); setLoadError('');
    const [{ data: prods, error: pErr }, { data: discs }] = await Promise.all([
      supabase.from('water_products')
        .select('id, size_label, price, current_stock, status, water_stock_categories(name)')
        .eq('shop_id', shopId).eq('status', 'active')
        .order('price', { ascending: true }),
      supabase.from('discounts')
        .select('id, name, discount_type, value')
        .eq('shop_id', shopId).eq('status', 'active').eq('business_id', 'water_retail'),
    ]);
    if (pErr) { setLoadError(pErr.message); setLoading(false); return; }

    setProducts((prods || []).map((p: any) => ({
      id: p.id,
      name: p.size_label,
      price: Number(p.price),
      category: p.water_stock_categories?.name || 'Refill',
      current_stock: p.current_stock,
      unit: 'bottle',
      status: p.status,
    })));

    setDiscounts((discs || []).map((d: any) => ({
      id: d.id, name: d.name,
      discount_type: d.discount_type,
      value: Number(d.value),
    })));
    setLoading(false);
  }, [shopId]);

  useEffect(() => { loadData(); }, [loadData]);

  const addToCart = (product: Product) => {
    // Stock guard
    const inCart = cart.find((i) => i.product.id === product.id);
    const qtyInCart = inCart?.qty || 0;
    if (qtyInCart >= product.current_stock) {
      toast.error(`Only ${product.current_stock} in stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart((p) => p.filter((i) => i.product.id !== id));
    else {
      const product = cart.find((i) => i.product.id === id)?.product;
      if (product && qty > product.current_stock) { toast.error(`Only ${product.current_stock} in stock`); return; }
      setCart((p) => p.map((i) => i.product.id === id ? { ...i, qty } : i));
    }
  };

  const handleCheckout = async (method: 'mpesa' | 'cash', discountId: string | null, creditApplied: number) => {
    if (!shopId || !profile) { toast.error('Session error — please refresh'); return; }
    setProcessing(true);

    const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const disc = discounts.find((d) => d.id === discountId);
    const discAmt = disc
      ? disc.discount_type === 'percent' ? subtotal * disc.value / 100 : disc.value
      : 0;
    const total = Math.max(0, subtotal - discAmt - creditApplied);

    try {
      // 1. Insert transaction
      const receiptRef = 'WTR-' + Date.now().toString(36).toUpperCase();
      const { data: txData, error: txErr } = await supabase.from('transactions').insert({
        business_id: 'water_retail',
        shop_id: shopId,
        cashier_id: profile.id,
        payment_method: method,
        subtotal,
        discount_amount: discAmt,
        total,
        status: 'completed',
        receipt_ref: receiptRef,
      }).select('id').single();

      if (txErr) throw new Error(txErr.message);
      const txId = (txData as any).id;

      // 2. Insert transaction items
      const items = cart.map((i) => ({
        transaction_id: txId,
        product_id: i.product.id,
        product_name: i.product.name,
        category: i.product.category,
        qty: i.qty,
        unit_price: i.product.price,
        line_total: i.product.price * i.qty,
      }));
      const { error: itemErr } = await supabase.from('transaction_items').insert(items);
      if (itemErr) throw new Error(itemErr.message);

      // 3. Deduct stock for each item
      for (const item of cart) {
        const { data: wp } = await supabase.from('water_products')
          .select('current_stock').eq('id', item.product.id).single();
        if (wp) {
          await supabase.from('water_products').update({
            current_stock: Math.max(0, (wp as any).current_stock - item.qty),
            updated_at: new Date().toISOString(),
          }).eq('id', item.product.id);
        }
      }

      // 4. Update daily_revenue (upsert)
      const today = new Date().toISOString().split('T')[0];
      const { data: dr } = await supabase.from('daily_revenue')
        .select('id, mpesa_revenue, cash_revenue')
        .eq('business_id', 'water_retail').eq('shop_id', shopId).eq('revenue_date', today)
        .maybeSingle();

      if (dr) {
        await supabase.from('daily_revenue').update({
          mpesa_revenue: method === 'mpesa' ? (dr as any).mpesa_revenue + total : (dr as any).mpesa_revenue,
          cash_revenue:  method === 'cash'  ? (dr as any).cash_revenue  + total : (dr as any).cash_revenue,
        }).eq('id', (dr as any).id);
      } else {
        await supabase.from('daily_revenue').insert({
          business_id: 'water_retail', shop_id: shopId, revenue_date: today,
          mpesa_revenue: method === 'mpesa' ? total : 0,
          cash_revenue:  method === 'cash'  ? total : 0,
          recorded_by: profile.id,
        });
      }

      // 5. Show receipt
      setReceipt({ open: true, ref: receiptRef, total, method, discount: discAmt, discountLabel: disc?.name || '', credit: creditApplied });
      // Refresh product stock counts
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Sale failed — please try again');
    } finally {
      setProcessing(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setReceipt((r) => ({ ...r, open: false }));
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">Loading products…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center p-6">
        <div className="card p-8 max-w-sm text-center space-y-3">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <p className="font-bold text-gray-900">Failed to load products</p>
          <p className="text-sm text-gray-500">{loadError}</p>
          <button onClick={loadData} className="btn bg-blue-700 text-white hover:bg-blue-900 mx-auto">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Left: product grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
        <div className="hero-water px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <Droplets size={18} className="text-white" />
          <span className="font-black text-white tracking-wide" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
            WATER RETAIL POS
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-white/70 text-xs">{products.length} products</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <POSGrid
            products={products}
            categories={categories.length > 0 ? categories : ['Refill']}
            onAddToCart={addToCart}
            themeColor="blue"
          />
        </div>
      </div>

      {/* Right: cart */}
      <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden bg-gray-50">
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">Cart</h3>
          <div className="flex items-center gap-2">
            {processing && <Loader2 size={14} className="animate-spin text-blue-600" />}
            <span className="badge badge-active">{cart.reduce((s, i) => s + i.qty, 0)} items</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <CartPanel
            items={cart}
            discounts={discounts}
            onUpdateQty={updateQty}
            onRemove={(id) => setCart((p) => p.filter((i) => i.product.id !== id))}
            onCheckout={handleCheckout}
            themeColor="blue"
          />
        </div>
      </div>

      <ReceiptModal
        open={receipt.open}
        onClose={() => setReceipt((r) => ({ ...r, open: false }))}
        onNewSale={handleNewSale}
        receiptRef={receipt.ref}
        businessName="Water Retail"
        cashierName={profile?.full_name || 'Cashier'}
        items={cart}
        subtotal={cart.reduce((s, i) => s + i.product.price * i.qty, 0)}
        discountAmount={receipt.discount}
        discountLabel={receipt.discountLabel}
        creditApplied={receipt.credit}
        total={receipt.total}
        paymentMethod={receipt.method}
        showCategory={false}
      />
    </div>
  );
}