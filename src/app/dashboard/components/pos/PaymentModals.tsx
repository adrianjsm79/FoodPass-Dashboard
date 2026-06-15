'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { CartItem } from './POSOrderPanel';

// ─── Shared modal wrapper ──────────────────────────────────────────────────────

interface ModalWrapperProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalWrapper({ title, subtitle, onClose, children }: ModalWrapperProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-0.5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Order summary ─────────────────────────────────────────────────────────────

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
}

function OrderSummary({ items, total }: OrderSummaryProps) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 mb-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        items_pedido
      </p>
      {items.map((item) => (
        <div key={item.productId} className="flex justify-between text-sm text-slate-700 mb-1">
          <span>
            {item.quantity}× {item.name}{' '}
            <span className="text-xs text-purple-500">(ticket)</span>
          </span>
          <span>S/. {(item.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between font-semibold text-slate-800 mt-3 pt-3 border-t border-slate-200">
        <span>Total</span>
        <span className="text-green-600">S/. {total.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Modal: Efectivo ───────────────────────────────────────────────────────────

interface EfectivoModalProps {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function EfectivoModal({ items, total, onClose, onConfirm }: EfectivoModalProps) {
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  const monto = parseFloat(montoRecibido) || 0;
  const vuelto = monto - total;

  return (
    <ModalWrapper
      title="Confirmar Pago"
      subtitle="metodos_pago: Efectivo · tipo=EFECTIVO"
      onClose={onClose}
    >
      <OrderSummary items={items} total={total} />

      <div className="mb-3">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-1 mb-1">
          Monto recibido
        </label>
        <input
          type="number"
          value={montoRecibido}
          onChange={(e) => setMontoRecibido(e.target.value)}
          placeholder="0.00"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {monto > 0 && (
        <div className="flex justify-between bg-green-50 border border-green-100 rounded-lg px-4 py-2.5 text-sm mb-4">
          <span className="text-slate-600">Vuelto</span>
          <span className={`font-semibold ${vuelto >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            S/. {vuelto.toFixed(2)}
          </span>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={monto < total}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <CheckCircle size={16} />
        Confirmar Pago
      </button>
    </ModalWrapper>
  );
}

// ─── Modal: Yape ──────────────────────────────────────────────────────────────

interface YapeModalProps {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function YapeModal({ items, total, onClose, onConfirm }: YapeModalProps) {
  const [codigo, setCodigo] = useState<string>('');

  return (
    <ModalWrapper
      title="Confirmar Pago"
      subtitle="metodos_pago: Yape · tipo=DIGITAL"
      onClose={onClose}
    >
      <OrderSummary items={items} total={total} />

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">QR</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">QR Yape disponible en caja</p>
            <p className="text-xs text-slate-500">
              El cliente escanea el código QR del <strong>estante físico</strong> y paga
            </p>
          </div>
        </div>
        <div className="bg-white border border-purple-200 rounded-lg px-4 py-2 text-center font-bold text-purple-700 text-base mt-2">
          S/. {total.toFixed(2)}
        </div>
        <p className="text-xs text-yellow-600 mt-3">
          Verifique visualmente que el pago se haya realizado antes de confirmar
        </p>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
          # Código de seguridad Yape{' '}
          <span className="text-xs text-slate-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          maxLength={3}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="1 2 3"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-slate-400 mt-1">
          Últimos 3 dígitos de la operación Yape mostrados en el celular del cliente
        </p>
        {codigo.length === 3 && (
          <p className="text-xs text-green-600 mt-1">Código ingresado: {codigo}</p>
        )}
      </div>

      <button
        onClick={onConfirm}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <CheckCircle size={16} />
        Confirmar — Pago Verificado
      </button>
    </ModalWrapper>
  );
}

// ─── Modal: PostPago ───────────────────────────────────────────────────────────

export interface PostPagoAccount {
  id: string;
  name: string;
  accountCode: string;
  currentDebt: number;
  creditLimit: number;
}

interface PostPagoModalProps {
  items: CartItem[];
  total: number;
  account: PostPagoAccount;
  onClose: () => void;
  onConfirm: () => void;
}

export function PostPagoModal({
  items,
  total,
  account,
  onClose,
  onConfirm,
}: PostPagoModalProps) {
  const newDebt = account.currentDebt + total;
  const usedPercent = Math.min((newDebt / account.creditLimit) * 100, 100);

  return (
    <ModalWrapper
      title="Confirmar Pago"
      subtitle="transacciones_postpago · tipo=CARGO"
      onClose={onClose}
    >
      <OrderSummary items={items} total={total} />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {account.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{account.name}</p>
            <p className="text-xs text-slate-400">
              cuentas_postpago · {account.accountCode}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Deuda actual</span>
            <span>S/. {account.currentDebt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>+ Este cargo (CARGO)</span>
            <span className="text-green-600 font-medium">S/. {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-blue-200 mt-1">
            <span>Nueva deuda</span>
            <span className="text-blue-600">S/. {newDebt.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Límite de crédito</span>
            <span>S/. {account.creditLimit.toFixed(2)}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{Math.round(usedPercent)}% del límite utilizado</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700 mb-4">
        Se registrará un <strong>CARGO</strong> en transacciones_postpago. El descuento se aplicará desde RRHH.
      </div>

      <button
        onClick={onConfirm}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <CheckCircle size={16} />
        Registrar Cargo PostPago
      </button>
    </ModalWrapper>
  );
}