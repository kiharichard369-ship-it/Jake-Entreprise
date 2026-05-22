import React, { useState } from 'react';
import { POSGrid, Product } from '../../components/shared/POSGrid';
import { CartPanel, CartItem, Discount } from '../../components/shared/CartPanel';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const rbProducts: Product[] = [
  { id: 'r1', name: 'Full Chicken (Capon)', price: 600, category: 'raw', sub_category: 'Standard Chicken', current_stock: 12, unit: 'pc', status: 'active' },
  { id: 'r2', name: 'Half Chicken', price: 300, category: 'raw', sub_category: 'Standard Chicken', current_stock: 8, unit: 'pc', status: 'active' },
  { id: 'r3', name: 'Quarter Cut', price: 150, category: 'raw', sub_category: 'Standard Chicken', current_stock: 15, unit: 'pc', status: 'active' },
  { id: 'r4', name: 'Full Chicken (Marinated)', price: 650, category: 'raw', sub_category: 'Marinated', current_stock: 6, unit: 'pc', status: 'active' },
  { id: 'r5', name: 'Half Chicken (Marinated)', price: 350, category: 'raw', sub_category: 'Marinated', current_stock: 5, unit: 'pc', status: 'active' },
  { id: 'r6', name: 'Quarter (Marinated)', price: 200, category: 'raw', sub_category: 'Marinated', current_stock: 10, unit: 'pc', status: 'active' },
  { id: 'r7', name: 'Kienyeji Full', price: 1000, category: 'raw', sub_category: 'Kienyeji', current_stock: 4, unit: 'pc', status: 'active' },
  { id: 'r8', name: 'Kienyeji Half', price: 500, category: 'raw', sub_category: 'Kienyeji', current_stock: 3, unit: 'pc', status: 'active' },
  { id: 'r9', name: 'Gizzards 1kg', price: 550, category: 'raw', sub_category: 'Offcuts', current_stock: 2, unit: 'kg', status: 'active' },
  { id: 'r10', name: 'Chicken Liver 1kg', price: 400, category: 'raw', sub_category: 'Offcuts', current_stock: 5, unit: 'kg', status: 'active' },
  { id: 'r11', name: 'Chicken Wings 1kg', price: 750, category: 'raw', sub_category: 'Offcuts', current_stock: 8, unit: 'kg', status: 'active' },
  { id: 'r12', name: 'Smokies 5-pack', price: 160, category: 'raw', sub_category: 'Processed', current_stock: 20, unit: 'pack', status: 'active' },
  { id: 'r13', name: 'Beef Sausages 6-pack', price: 240, category: 'raw', sub_category: 'Processed', current_stock: 15, unit: 'pack', status: 'active' },
  { id: 'r14', name: 'Pet Food 1kg', price: 170, category: 'raw', sub_category: 'Processed', current_stock: 10, unit: 'kg', status: 'active' },
  { id: 'c1', name: 'Full Chicken Cooked', price: 650, category: 'cooked', sub_category: 'Standard Chicken', current_stock: 1, unit: 'pc', status: 'active' },
  { id: 'c2', name: 'Half Chicken Cooked', price: 350, category: 'cooked', sub_category: 'Standard Chicken', current_stock: 6, unit: 'pc', status: 'active' },
  { id: 'c3', name: 'Quarter Cut Cooked', price: 180, category: 'cooked', sub_category: 'Standard Chicken', current_stock: 10, unit: 'pc', status: 'active' },
  { id: 'c4', name: 'Cooked Smokies', price: 40, category: 'cooked', sub_category: 'Processed', current_stock: 30, unit: 'pc', status: 'active' },
  { id: 'c5', name: 'Cooked Beef Sausages', price: 50, category: 'cooked', sub_category: 'Processed', current_stock: 25, unit: 'pc', status: 'active' },
  { id: 'c6', name: 'Fries Small', price: 70, category: 'cooked', sub_category: 'Fries', current_stock: 50, unit: 'pc', status: 'active' },
  { id: 'c7', name: 'Fries Medium', price: 100, category: 'cooked', sub_category: 'Fries', current_stock: 50, unit: 'pc', status: 'active' },
  { id: 'c8', name: 'Fries Large', price: 150, category: 'cooked', sub_category: 'Fries', current_stock: 5, unit: 'pc', status: 'active' },
];

const mockDiscounts: Discount[] = [
  { id: 'd1', name: 'Bulk 10%', discount_type: 'percent', value: 10 },
  { id: 'd2', name: 'Staff Meal', discount_type: 'flat', value: 100 },
];

export default function RBPOS() {
  const { profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receipt, setReceipt] = useState<any>({ open: false });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleCheckout = (method: 'mpesa' | 'cash', discountId: string | null, creditApplied: number) => {
    const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
    const disc = mockDiscounts.find((d) => d.id === discountId);
    const discAmt = disc ? (disc.discount_type === 'percent' ? subtotal * disc.value / 100 : disc.value) : 0;
    const total = Math.max(0, subtotal - discAmt - creditApplied);
    setReceipt({ open: true, ref: 'RB-' + Date.now().toString(36).toUpperCase(), total, method, discount: discAmt, discountLabel: disc?.name || '', credit: creditApplied });
  };

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
        <div className="hero-rb px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <Flame size={18} className="text-white" />
          <span className="font-black text-white tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>R&B TAKE-AWAY POS</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-white/70 text-xs">Ready</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <POSGrid products={rbProducts} categories={['raw', 'cooked']} onAddToCart={addToCart} themeColor="orange" />
        </div>
      </div>

      <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden bg-gray-50">
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">Cart</h3>
          <span className="badge bg-orange-100 text-orange-800">{cart.length} items</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <CartPanel
            items={cart}
            discounts={mockDiscounts}
            onUpdateQty={(id, qty) => {
              if (qty <= 0) setCart((p) => p.filter((i) => i.product.id !== id));
              else setCart((p) => p.map((i) => i.product.id === id ? { ...i, qty } : i));
            }}
            onRemove={(id) => setCart((p) => p.filter((i) => i.product.id !== id))}
            onCheckout={handleCheckout}
            themeColor="orange"
          />
        </div>
      </div>

      <ReceiptModal
        open={receipt.open}
        onClose={() => setReceipt({ ...receipt, open: false })}
        onNewSale={() => { setCart([]); setReceipt({ open: false }); }}
        receiptRef={receipt.ref || ''}
        businessName="Restaurant & Butchery"
        cashierName={profile?.full_name || 'Cashier'}
        items={cart}
        subtotal={cart.reduce((s, i) => s + i.product.price * i.qty, 0)}
        discountAmount={receipt.discount || 0}
        discountLabel={receipt.discountLabel || ''}
        creditApplied={receipt.credit || 0}
        total={receipt.total || 0}
        paymentMethod={receipt.method || 'cash'}
        showCategory={true}
      />
    </div>
  );
}
