import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import { Product } from './POSGrid';

export interface CartItem {
  product: Product;
  qty: number;
}

export interface Discount {
  id: string;
  name: string;
  discount_type: 'percent' | 'flat';
  value: number;
}

interface CartPanelProps {
  items: CartItem[];
  discounts: Discount[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (method: 'mpesa' | 'cash', discountId: string | null, creditApplied: number) => void;
  customerCredit?: number;
  themeColor?: string;
}

export function CartPanel({ items, discounts, onUpdateQty, onRemove, onCheckout, customerCredit = 0, themeColor = 'blue' }: CartPanelProps) {
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null);
  const [creditApplied, setCreditApplied] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cashTendered, setCashTendered] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  const discount = discounts.find((d) => d.id === selectedDiscount);
  const discountAmount = discount
    ? discount.discount_type === 'percent'
      ? (subtotal * discount.value) / 100
      : discount.value
    : 0;

  const afterDiscount = subtotal - discountAmount;
  const totalDue = Math.max(0, afterDiscount - creditApplied);

  const btnClass = themeColor === 'orange'
    ? 'bg-orange-600 hover:bg-orange-700'
    : 'bg-blue-700 hover:bg-blue-800';

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <ShoppingCart size={40} className="mb-3 opacity-30" />
        <p className="font-semibold">Cart is empty</p>
        <p className="text-sm text-center mt-1">Click products to add them to the cart</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{item.product.name}</p>
              <p className="text-xs text-gray-500">KES {item.product.price.toLocaleString()} / {item.product.unit || 'pc'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdateQty(item.product.id, item.qty - 1)} className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100">
                <Minus size={12} />
              </button>
              <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
              <button onClick={() => onUpdateQty(item.product.id, item.qty + 1)} className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100">
                <Plus size={12} />
              </button>
            </div>
            <div className="text-right min-w-[60px]">
              <p className="font-bold text-sm">KES {(item.product.price * item.qty).toLocaleString()}</p>
            </div>
            <button onClick={() => onRemove(item.product.id)} className="text-red-400 hover:text-red-600 ml-1">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Discount */}
      <div className="px-4 py-3 border-t border-gray-100">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Tag size={11} /> Discount
        </label>
        <select
          value={selectedDiscount || ''}
          onChange={(e) => setSelectedDiscount(e.target.value || null)}
          className="input-field text-sm"
        >
          <option value="">No discount</option>
          {discounts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.discount_type === 'percent' ? `${d.value}%` : `KES ${d.value}`} off)
            </option>
          ))}
        </select>

        {customerCredit > 0 && (
          <div className="mt-2 flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="text-xs font-bold text-green-800">Customer Credit</p>
              <p className="text-xs text-green-600">Available: KES {customerCredit.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setCreditApplied(creditApplied > 0 ? 0 : Math.min(customerCredit, afterDiscount))}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                creditApplied > 0 ? 'bg-green-200 text-green-800' : 'bg-green-600 text-white'
              }`}
            >
              {creditApplied > 0 ? `Applied (KES ${creditApplied.toLocaleString()})` : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({discount?.name})</span><span>- KES {discountAmount.toLocaleString()}</span>
          </div>
        )}
        {creditApplied > 0 && (
          <div className="flex justify-between text-sm text-blue-600">
            <span>Credit Applied</span><span>- KES {creditApplied.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-lg text-gray-900 pt-2 border-t border-gray-200">
          <span>TOTAL DUE</span><span>KES {totalDue.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment */}
      {!showPayment ? (
        <div className="p-4">
          <button
            onClick={() => setShowPayment(true)}
            className={`w-full btn ${btnClass} text-white justify-center py-3 text-base`}
          >
            Proceed to Payment
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</p>
          <button
            onClick={() => onCheckout('mpesa', selectedDiscount, creditApplied)}
            className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white justify-center py-2.5"
          >
            📱 Pay with M-Pesa
          </button>
          <button
            onClick={() => onCheckout('cash', selectedDiscount, creditApplied)}
            className="w-full btn bg-amber-600 hover:bg-amber-700 text-white justify-center py-2.5"
          >
            💵 Pay with Cash
          </button>
          <button onClick={() => setShowPayment(false)} className="w-full btn-ghost justify-center py-2">
            Back
          </button>
        </div>
      )}
    </div>
  );
}
