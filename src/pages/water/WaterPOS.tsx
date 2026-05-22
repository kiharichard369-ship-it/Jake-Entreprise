import React, { useState } from 'react';
import { POSGrid, Product } from '../../components/shared/POSGrid';
import { CartPanel, CartItem, Discount } from '../../components/shared/CartPanel';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { Droplets } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Mock products — replace with Supabase query
const mockProducts: Product[] = [
  { id: '1', name: '500ml Refill', price: 5, category: 'Refill', current_stock: 200, unit: 'bottle', status: 'active' },
  { id: '2', name: '1L Refill', price: 10, category: 'Refill', current_stock: 150, unit: 'bottle', status: 'active' },
  { id: '3', name: '1.5L Refill', price: 15, category: 'Refill', current_stock: 120, unit: 'bottle', status: 'active' },
  { id: '4', name: '2L Refill', price: 20, category: 'Refill', current_stock: 80, unit: 'bottle', status: 'active' },
  { id: '5', name: '3L Refill', price: 30, category: 'Refill', current_stock: 60, unit: 'bottle', status: 'active' },
  { id: '6', name: '5L Refill', price: 40, category: 'Refill', current_stock: 100, unit: 'bottle', status: 'active' },
  { id: '7', name: '10L Refill', price: 80, category: 'Refill', current_stock: 40, unit: 'bottle', status: 'active' },
  { id: '8', name: '20L Refill', price: 150, category: 'Refill', current_stock: 30, unit: 'bottle', status: 'active' },
  { id: '9', name: '500ml New Bottle', price: 30, category: 'New', current_stock: 50, unit: 'bottle', status: 'active' },
  { id: '10', name: '1L New Bottle', price: 50, category: 'New', current_stock: 40, unit: 'bottle', status: 'active' },
  { id: '11', name: '5L New Bottle', price: 150, category: 'New', current_stock: 20, unit: 'bottle', status: 'active' },
  { id: '12', name: '10L New Bottle', price: 280, category: 'New', current_stock: 15, unit: 'bottle', status: 'active' },
  { id: '13', name: '20L New Bottle', price: 450, category: 'New', current_stock: 10, unit: 'bottle', status: 'active' },
  { id: '14', name: 'Caps', price: 20, category: 'Caps', current_stock: 500, unit: 'pc', status: 'active' },
  { id: '15', name: 'PET 1L Bottle', price: 40, category: 'PET', current_stock: 30, unit: 'bottle', status: 'active' },
  { id: '16', name: 'PET 1.5L Bottle', price: 30, category: 'PET', current_stock: 25, unit: 'bottle', status: 'active' },
  { id: '17', name: 'PET 5L Bottle', price: 110, category: 'PET', current_stock: 20, unit: 'bottle', status: 'active' },
  { id: '18', name: 'PET 10L Bottle', price: 200, category: 'PET', current_stock: 0, unit: 'bottle', status: 'active' },
  { id: '19', name: 'Jerrican 5L', price: 0, category: 'Jerrican', current_stock: 15, unit: 'pc', status: 'active' },
  { id: '20', name: 'Jerrican 20L', price: 0, category: 'Jerrican', current_stock: 10, unit: 'pc', status: 'active' },
];

const mockDiscounts: Discount[] = [
  { id: 'd1', name: 'Bulk 10%', discount_type: 'percent', value: 10 },
  { id: 'd2', name: 'Loyal Customer', discount_type: 'flat', value: 50 },
];

export default function WaterPOS() {
  const { profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receipt, setReceipt] = useState<{ open: boolean; ref: string; total: number; method: 'mpesa' | 'cash'; discount: number; discountLabel: string; credit: number }>({
    open: false, ref: '', total: 0, method: 'cash', discount: 0, discountLabel: '', credit: 0,
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.product.id !== id));
    else setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, qty } : i));
  };

  const handleCheckout = (method: 'mpesa' | 'cash', discountId: string | null, creditApplied: number) => {
    const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const disc = mockDiscounts.find((d) => d.id === discountId);
    const discAmt = disc ? (disc.discount_type === 'percent' ? subtotal * disc.value / 100 : disc.value) : 0;
    const total = Math.max(0, subtotal - discAmt - creditApplied);
    setReceipt({
      open: true,
      ref: 'WTR-' + Date.now().toString(36).toUpperCase(),
      total,
      method,
      discount: discAmt,
      discountLabel: disc?.name || '',
      credit: creditApplied,
    });
  };

  const handleNewSale = () => {
    setCart([]);
    setReceipt((r) => ({ ...r, open: false }));
  };

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Left: product grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
        {/* Header strip */}
        <div className="hero-water px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <Droplets size={18} className="text-white" />
          <span className="font-black text-white tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>WATER RETAIL POS</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-white/70 text-xs">Ready</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <POSGrid
            products={mockProducts}
            categories={['Refill', 'New', 'Caps', 'PET', 'Jerrican']}
            onAddToCart={addToCart}
            themeColor="blue"
          />
        </div>
      </div>

      {/* Right: cart */}
      <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden bg-gray-50">
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">Cart</h3>
          <span className="badge badge-active">{cart.length} items</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <CartPanel
            items={cart}
            discounts={mockDiscounts}
            onUpdateQty={updateQty}
            onRemove={(id) => setCart((p) => p.filter((i) => i.product.id !== id))}
            onCheckout={handleCheckout}
            themeColor="blue"
          />
        </div>
      </div>

      {/* Receipt modal */}
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
