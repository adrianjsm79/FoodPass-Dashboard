'use client';

import { useState } from 'react';

import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Wallet,
  Clock,
  ImagePlus,
} from 'lucide-react';

import {
  EfectivoModal,
  YapeModal,
  PostPagoModal,
  PostPagoAccount,
} from './PaymentModals';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imagen?: string | null;
}

type PaymentMethod =
  | 'efectivo'
  | 'yape'
  | 'postpago';

interface POSOrderPanelProps {
  items: CartItem[];

  postPagoAccounts?: PostPagoAccount[];

  onQuantityChange: (
    productId: string,
    quantity: number
  ) => void;

  onRemoveItem: (
    productId: string
  ) => void;

  onVaciar: () => void;

  onPayment: (
    method: PaymentMethod,
    options?: { cuenta_postpago_id?: string; referencia_externa?: string }
  ) => void;
}

export default function POSOrderPanel({
  items,
  postPagoAccounts = [],
  onQuantityChange,
  onRemoveItem,
  onVaciar,
  onPayment,
}: POSOrderPanelProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>('efectivo');

  const [activeModal, setActiveModal] =
    useState<PaymentMethod | null>(
      null
    );

  const total = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const hasItems = items.length > 0;

  const handleCobrar = () => {
    if (!hasItems) return;

    setActiveModal(selectedMethod);
  };

  const handleConfirm = (opciones?: { cuenta_postpago_id?: string; referencia_externa?: string }) => {
    onPayment(selectedMethod, opciones);

    setActiveModal(null);
  };

  const paymentMethods: {
    id: PaymentMethod;
    label: string;
    icon: React.ReactNode;
  }[] = [
      {
        id: 'efectivo',
        label: 'Efectivo',
        icon: <Wallet size={18} />,
      },
      {
        id: 'yape',
        label: 'Yape',
        icon: <CreditCard size={18} />,
      },
      {
        id: 'postpago',
        label: 'PostPago',
        icon: <Clock size={18} />,
      },
    ];

  return (
    <>
      <div
        className="
    w-full
    xl:w-[380px]
    bg-white
    rounded-2xl
    shadow-lg
    border border-slate-200
    overflow-hidden
    flex flex-col
    h-fit
    xl:sticky
    xl:top-6
  "
      >
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div
          className="
            bg-gradient-to-r
            from-green-600
            to-green-700
            text-white
            p-4
            flex items-center justify-between
            flex-shrink-0
          "
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={22} />

            <h2 className="text-lg font-bold">
              Carrito
            </h2>
          </div>

          <span
            className="
              bg-white/20
              px-3 py-1
              rounded-full
              text-sm font-semibold
            "
          >
            {items.length} item
            {items.length !== 1
              ? 's'
              : ''}
          </span>
        </div>

        {/* ========================= */}
        {/* LISTA */}
        {/* ========================= */}

        <div
          className="
            max-h-[420px]
            overflow-y-auto
            p-4
            space-y-3
          "
        >
          {!hasItems ? (
            <div className="py-14 text-center">
              <ShoppingCart
                size={54}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="text-slate-500">
                Carrito vacío
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="
                  bg-slate-50
                  border border-slate-200
                  rounded-2xl
                  p-4
                "
              >
                {/* Top */}
                <div className="flex gap-3">
                  {/* Imagen */}
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.name}
                      className="
                        w-14 h-14
                        rounded-xl
                        object-cover
                        border border-slate-200
                        flex-shrink-0
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-14 h-14
                        rounded-xl
                        bg-slate-100
                        flex items-center justify-center
                        border border-slate-200
                        flex-shrink-0
                      "
                    >
                      <ImagePlus
                        size={20}
                        className="text-slate-400"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="
                        font-semibold
                        text-slate-900
                        break-words
                        text-sm sm:text-base
                      "
                    >
                      {item.name}
                    </p>

                    <p
                      className="
                        text-green-600
                        font-bold
                        mt-1
                        text-sm
                      "
                    >
                      S/.{' '}
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() =>
                      onRemoveItem(
                        item.productId
                      )
                    }
                    className="
                      text-red-500
                      hover:text-red-700
                      transition
                      flex-shrink-0
                    "
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Quantity */}
                <div
                  className="
                    flex items-center
                    gap-3
                    mt-4
                  "
                >
                  <button
                    onClick={() =>
                      onQuantityChange(
                        item.productId,
                        item.quantity - 1
                      )
                    }
                    className="
                      w-9 h-9
                      rounded-lg
                      border border-slate-300
                      bg-white
                      flex items-center justify-center
                      text-slate-700
                      hover:bg-slate-100
                      transition
                    "
                  >
                    <Minus
                      size={16}
                      className="text-slate-700"
                    />
                  </button>

                  <span
                    className="
                      font-bold
                      text-slate-900
                      text-base
                    "
                  >
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      onQuantityChange(
                        item.productId,
                        item.quantity + 1
                      )
                    }
                    className="
                      w-9 h-9
                      rounded-lg
                      border border-slate-300
                      bg-white
                      flex items-center justify-center
                      text-slate-700
                      hover:bg-slate-100
                      transition
                    "
                  >
                    <Plus
                      size={16}
                      className="text-slate-700"
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================= */}
        {/* FOOTER */}
        {/* ========================= */}

        <div
          className="
            border-t border-slate-200
            p-4
            space-y-5
            flex-shrink-0
          "
        >
          {/* Vaciar */}
          <button
            onClick={onVaciar}
            className="
              w-full
              text-red-500
              hover:text-red-700
              font-semibold
              py-2
              transition
              flex items-center justify-center gap-2
            "
          >
            <Trash2 size={16} />
            Limpiar Carrito
          </button>

          {/* Info */}
          <div
            className="
              bg-purple-50
              border border-purple-100
              rounded-xl
              px-4 py-3
              text-sm
              text-purple-700
            "
          >
            Se generarán tickets
            digitales automáticamente
          </div>

          {/* Totales */}
          <div className="space-y-2">
            <div
              className="
                flex justify-between
                text-slate-700
              "
            >
              <span>Subtotal</span>

              <span>
                S/. {total.toFixed(2)}
              </span>
            </div>

            <div
              className="
                flex justify-between
                text-xl font-bold
                border-t border-slate-200
                pt-3
              "
            >
              <span className="text-slate-900">
                Total
              </span>

              <span className="text-green-600">
                S/. {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Métodos */}
          <div>
            <p
              className="
                text-xs
                font-bold
                uppercase
                text-slate-500
                mb-3
              "
            >
              Método de pago
            </p>

            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(
                (method) => (
                  <button
                    key={method.id}
                    onClick={() =>
                      setSelectedMethod(
                        method.id
                      )
                    }
                    className={`
                      flex flex-col items-center
                      justify-center
                      gap-2
                      py-3 px-2
                      rounded-xl
                      border-2
                      transition-all

                      ${selectedMethod ===
                        method.id
                        ? method.id ===
                          'postpago'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-green-600 bg-green-50 text-green-700'
                        : 'border-slate-300 text-slate-700 hover:border-green-400'
                      }
                    `}
                  >
                    {method.icon}

                    <span className="text-xs font-semibold">
                      {method.label}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* PostPago Info Placeholder (Removed to simplify, modal handles it) */}

          {/* Checkout */}
          <button
            onClick={handleCobrar}
            disabled={!hasItems}
            className={`
              w-full
              py-4
              rounded-xl
              font-bold
              text-lg
              text-white
              transition-all
              shadow-lg

              ${!hasItems
                ? 'bg-slate-300 cursor-not-allowed'
                : selectedMethod ===
                  'postpago'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              }
            `}
          >
            Cobrar S/.{' '}
            {total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* MODALS */}
      {/* ========================= */}

      {activeModal === 'efectivo' && (
        <EfectivoModal
          items={items}
          total={total}
          onClose={() =>
            setActiveModal(null)
          }
          onConfirm={handleConfirm}
        />
      )}

      {activeModal === 'yape' && (
        <YapeModal
          items={items}
          total={total}
          onClose={() =>
            setActiveModal(null)
          }
          onConfirm={(referencia) => handleConfirm({ referencia_externa: referencia })}
        />
      )}

      {activeModal === 'postpago' && (
        <PostPagoModal
          items={items}
          total={total}
          accounts={postPagoAccounts}
          onClose={() =>
            setActiveModal(null)
          }
          onConfirm={(cuentaId) => handleConfirm({ cuenta_postpago_id: cuentaId })}
        />
      )}
    </>
  );
}