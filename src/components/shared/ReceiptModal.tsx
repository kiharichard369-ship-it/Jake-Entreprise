import React from 'react';
import { X, Printer } from 'lucide-react';
import { CartItem } from './CartPanel';

interface ReceiptProps {
  open: boolean;
  onClose: () => void;
  onNewSale: () => void;
  receiptRef: string;
  businessName: string;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  creditApplied: number;
  total: number;
  paymentMethod: 'mpesa' | 'cash';
  mpesaRef?: string;
  changeDue?: number;
  showCategory?: boolean;
}

function ReceiptCopy({ title, ...props }: ReceiptProps & { title: string }) {
  const now = new Date();
  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-5 w-[280px] font-mono text-xs bg-white">
      <div className="text-center mb-3 border-b border-dashed pb-3">
        <p className="font-black text-sm">{props.businessName}</p>
        <p className="text-gray-500">Jake's Enterprise</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {now.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' '}{now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="font-bold mt-1">Receipt: {props.receiptRef}</p>
        <p className="text-gray-400 text-[10px]">Cashier: {props.cashierName}</p>
        <div className="mt-2 inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold">{title}</div>
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1">
        {props.items.map((item) => (
          <div key={item.product.id}>
            <div className="flex justify-between">
              <span className="flex-1 pr-1">{item.product.name}</span>
              <span>KES {(item.product.price * item.qty).toLocaleString()}</span>
            </div>
            <div className="text-gray-400 text-[10px] flex items-center gap-2">
              {props.showCategory && <span className="uppercase font-bold">{item.product.category}</span>}
              <span>{item.qty} × KES {item.product.price.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed pt-2 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>KES {props.subtotal.toLocaleString()}</span></div>
        {props.discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>{props.discountLabel}</span>
            <span>-KES {props.discountAmount.toLocaleString()}</span>
          </div>
        )}
        {props.creditApplied > 0 && (
          <div className="flex justify-between text-blue-700">
            <span>Credit Applied</span>
            <span>-KES {props.creditApplied.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm border-t border-dashed pt-1">
          <span>TOTAL</span><span>KES {props.total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Payment</span>
          <span>{props.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}</span>
        </div>
        {props.mpesaRef && (
          <div className="flex justify-between text-gray-500">
            <span>M-Pesa Ref</span><span>{props.mpesaRef}</span>
          </div>
        )}
        {props.changeDue !== undefined && props.changeDue > 0 && (
          <div className="flex justify-between font-bold">
            <span>Change</span><span>KES {props.changeDue.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="text-center mt-3 text-gray-400 text-[10px] border-t border-dashed pt-2">
        Thank you for your business!<br />Powered by Mirie Technologies
      </div>
    </div>
  );
}

export function ReceiptModal(props: ReceiptProps) {
  if (!props.open) return null;

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-gray-900">Sale Complete</h2>
            <p className="text-gray-500 text-sm">Print or save receipts below</p>
          </div>
          <button onClick={props.onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="receipt-print flex gap-6 justify-center overflow-x-auto pb-4">
          <ReceiptCopy {...props} title="CUSTOMER COPY" />
          <ReceiptCopy {...props} title="BUSINESS COPY" />
        </div>

        <div className="flex gap-3 mt-5 justify-center">
          <button onClick={() => window.print()} className="btn bg-gray-800 text-white hover:bg-gray-700 gap-2">
            <Printer size={16} /> Print Both
          </button>
          <button onClick={props.onNewSale} className="btn bg-blue-700 text-white hover:bg-blue-800">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
