'use client';

import { useState } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, Wallet, Clock, ImagePlus } from 'lucide-react';
import { EfectivoModal, YapeModal, PostPagoModal, PostPagoAccount } from './PaymentModals';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imagen?: string;
}

type PaymentMethod = 'efectivo' | 'yape' | 'postpago';

interface POSOrderPanelProps {
  items: CartItem[];
  postPagoAccount?: PostPagoAccount | null;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onVaciar: () => void;
  onPayment: (method: PaymentMethod) => void;
}

const DEMO_POSTPAGO_ACCOUNT: PostPagoAccount = {
  id: 'cp1',
  name: 'Carlos Ríos',
  accountCode: 'cp1',
  currentDebt: 48.5,
  creditLimit: 200,
};

export default function POSOrderPanel({
  items,
  postPagoAccount = DEMO_POSTPAGO_ACCOUNT,
  onQuantityChange,
  onRemoveItem,
  onVaciar,
  onPayment,
}: POSOrderPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('efectivo');
  const [activeModal, setActiveModal] = useState<PaymentMethod | null>(null);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasItems = items.length > 0;

  const handleCobrar = () => {
    if (!hasItems) return;
    setActiveModal(selectedMethod);
  };

  const handleConfirm = () => {
    onPayment(selectedMethod);
    setActiveModal(null);
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'efectivo', label: 'Efectivo', icon: <Wallet size={15} /> },
    { id: 'yape',     label: 'Yape',     icon: <CreditCard size={15} /> },
    { id: 'postpago', label: 'PostPago', icon: <Clock size={15} /> },
  ];

  return (
    <>
      {/* ← sticky top-0 + h-screen hace que el panel siempre ocupe la pantalla completa */}
      <div className="w-[300px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col sticky top-0 h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
            <ShoppingCart size={15} />
            Orden POS
          </div>
          <button
            onClick={onVaciar}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} />
            Vaciar
          </button>
        </div>

        {/* Items list — ocupa el espacio disponible y hace scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center mt-10">Sin productos</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2">
                {item.imagen ? (
                  <img
                    src={item.imagen}
                    alt={item.name}
                    className="w-8 h-8 rounded-md object-cover flex-shrink-0 border border-slate-100"
                  />
                ) : (
                  <div className="w-8 h-8 bg-slate-100 rounded-md flex-shrink-0 flex items-center justify-center">
                    <ImagePlus size={12} className="text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">S/. {Number(item.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
                    className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:border-red-300 hover:text-red-500 text-xs"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="w-5 text-center text-xs font-semibold text-slate-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
                    className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:border-green-400 hover:text-green-600 text-xs"
                  >
                    <Plus size={10} />
                  </button>
                </div>
                <span className="text-xs font-semibold text-slate-700 w-12 text-right flex-shrink-0">
                  S/. {(Number(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer — siempre pegado al fondo */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-3 flex-shrink-0">
          <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-600">
            Se generarán tickets digitales (productos.genera_ticket)
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Subtotal</span>
              <span>S/. {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 text-sm">
              <span>Total</span>
              <span className="text-green-600">S/. {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  selectedMethod === method.id
                    ? method.id === 'postpago'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-green-600 border-green-600 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                }`}
              >
                {method.icon}
                {method.label}
              </button>
            ))}
          </div>

          {selectedMethod === 'postpago' && postPagoAccount && (
            <div className="border border-blue-100 rounded-lg px-3 py-2 text-xs space-y-1.5">
              <p className="text-slate-400 text-xs">Asociar cuenta postpago *</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {postPagoAccount.name.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700 text-xs">{postPagoAccount.name}</span>
                </div>
                <button className="text-slate-300 hover:text-slate-500 text-sm leading-none">×</button>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Deuda actual</span>
                <span>S/. {postPagoAccount.currentDebt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-blue-600">
                <span>Nueva deuda</span>
                <span>S/. {(postPagoAccount.currentDebt + total).toFixed(2)} / {postPagoAccount.creditLimit}</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((postPagoAccount.currentDebt + total) / postPagoAccount.creditLimit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleCobrar}
            disabled={!hasItems}
            className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-colors ${
              !hasItems
                ? 'bg-slate-300 cursor-not-allowed'
                : selectedMethod === 'postpago'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Cobrar S/. {total.toFixed(2)}
            {selectedMethod === 'postpago' ? ' · PostPago' : ''}
          </button>
        </div>
      </div>

      {activeModal === 'efectivo' && (
        <EfectivoModal items={items} total={total} onClose={() => setActiveModal(null)} onConfirm={handleConfirm} />
      )}
      {activeModal === 'yape' && (
        <YapeModal items={items} total={total} onClose={() => setActiveModal(null)} onConfirm={handleConfirm} />
      )}
      {activeModal === 'postpago' && postPagoAccount && (
        <PostPagoModal items={items} total={total} account={postPagoAccount} onClose={() => setActiveModal(null)} onConfirm={handleConfirm} />
      )}
    </>
  );
}