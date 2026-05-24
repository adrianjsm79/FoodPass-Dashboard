'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface PaymentEffectiveModalProps {
  items: CartItem[];
  total: number;
  onConfirm: (montoRecibido: number) => void;
  onClose: () => void;
}

export default function PaymentEffectiveModal({
  items,
  total,
  onConfirm,
  onClose,
}: PaymentEffectiveModalProps) {
  const [montoRecibido, setMontoRecibido] = useState<string>(total.toString());

  const vuelto = Math.max(0, parseFloat(montoRecibido) - total);

  const handleConfirm = () => {
    if (parseFloat(montoRecibido) >= total) {
      onConfirm(parseFloat(montoRecibido));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Confirmar Pago</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          métodos_pago: Efectivo · tipo=EFECTIVO
        </p>

        <div className="mb-6 pb-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">ITEMS_PEDIDO</h3>
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between text-sm mb-2"
            >
              <span className="text-slate-600">
                {item.quantity}x {item.name}
                <span className="text-purple-600 text-xs ml-1">(ticket)</span>
              </span>
              <span className="font-medium text-slate-900">
                S/. {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-6 pb-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-xl font-bold text-green-600">
              S/. {total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Monto recibido
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              <span className="text-slate-400">÷</span>
            </button>
          </div>
        </div>

        <div className="mb-6 text-right">
          <p className="text-sm text-slate-600">Vuelto</p>
          <p className="text-lg font-bold text-green-600">
            S/. {vuelto.toFixed(2)}
          </p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={parseFloat(montoRecibido) < total}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>✓</span>
          Confirmar Pago
        </button>
      </div>
    </div>
  );
}
