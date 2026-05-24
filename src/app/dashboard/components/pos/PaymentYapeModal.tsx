'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface PaymentYapeModalProps {
  items: CartItem[];
  total: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function PaymentYapeModal({
  items,
  total,
  onConfirm,
  onClose,
}: PaymentYapeModalProps) {
  const [securityCode, setSecurityCode] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleVerify = () => {
    if (securityCode.length === 3) {
      setIsVerified(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Confirmar Pago</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          métodos_pago: Yape · tipo=DIGITAL
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

        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
              <span>QR</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">QR Yape disponible en caja</p>
              <p className="text-xs text-slate-600 mt-1">
                El cliente escanea el código QR del estante físico y paga
              </p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-white rounded border border-purple-200">
            <p className="text-xs text-slate-600">
              Verifique visualmente que el pago se haya realizado antes de confirmar
            </p>
          </div>

          <p className="text-xs text-amber-700 mt-3 flex items-start gap-1">
            <span className="mt-0.5">●</span>
            Se solicitará código de seguridad Yape opcional
          </p>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Código de seguridad Yape <span className="text-xs text-slate-500">opcional</span>
          </label>
          <input
            type="text"
            placeholder="1 2 3"
            value={securityCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 3);
              setSecurityCode(value);
            }}
            maxLength={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Últimos 3 dígitos de la operación Yape mostrados en el celular del cliente
          </p>
        </div>

        {securityCode.length === 3 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <p className="text-sm text-green-700">Código ingresado: {securityCode}</p>
          </div>
        )}

        <button
          onClick={() => {
            if (securityCode.length === 3 || isVerified) {
              onConfirm();
              onClose();
            } else {
              handleVerify();
            }
          }}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition flex items-center justify-center gap-2"
        >
          <span>✓</span>
          Confirmar — Pago Verificado
        </button>
      </div>
    </div>
  );
}
