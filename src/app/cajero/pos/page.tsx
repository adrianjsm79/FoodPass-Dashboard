'use client';

import { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Wallet,
  DollarSign,
} from 'lucide-react';

import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  calories?: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CajeroPOS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState('Menús');

  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'yape' | 'card'
  >('cash');

  const products: Product[] = [
    {
      id: '1',
      name: 'Menú Ejecutivo',
      price: 18.5,
      category: 'Menús',
      stock: 12,
      calories: 850,
    },
    {
      id: '2',
      name: 'Menú Estándar',
      price: 12.0,
      category: 'Menús',
      stock: 25,
      calories: 750,
    },
    {
      id: '3',
      name: 'Snack Paquete',
      price: 8.5,
      category: 'Snacks',
      stock: 15,
      calories: 400,
    },
    {
      id: '4',
      name: 'Sandwich',
      price: 6.0,
      category: 'Snacks',
      stock: 20,
      calories: 350,
    },
    {
      id: '5',
      name: 'Inca Kola',
      price: 2.5,
      category: 'Bebidas',
      stock: 30,
      calories: 140,
    },
    {
      id: '6',
      name: 'Agua Embotellada',
      price: 1.5,
      category: 'Bebidas',
      stock: 50,
      calories: 0,
    },
  ];

  const categories = [
    'Menús',
    'Snacks',
    'Bebidas',
  ];

  const filteredProducts = products.filter(
    (p) => p.category === selectedCategory
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    const existing = cartItems.find(
      (item) => item.productId === product.id
    );

    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (
    productId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(
      cartItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(
      cartItems.filter(
        (item) => item.productId !== productId
      )
    );
  };

  const total = cartItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    const methodLabel = {
      cash: 'Efectivo',
      yape: 'Yape',
      card: 'Tarjeta',
    }[paymentMethod];

    toast.success(
      `Venta registrada: S/. ${total.toFixed(
        2
      )} - ${methodLabel}`
    );

    setCartItems([]);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ======================= */}
      {/* HEADER */}
      {/* ======================= */}

      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart
            size={28}
            className="sm:w-8 sm:h-8"
          />

          <h1 className="text-2xl sm:text-3xl font-bold">
            Punto de Venta
          </h1>
        </div>

        <p className="text-green-100 text-sm sm:text-base">
          Vende rápido y fácil
        </p>
      </div>

      {/* ======================= */}
      {/* CONTENIDO */}
      {/* ======================= */}

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ======================= */}
        {/* PRODUCTOS */}
        {/* ======================= */}

        <div className="flex-1 min-w-0">

          {/* Categorías */}
          <div className="flex flex-wrap gap-2 mb-5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(cat)
                }
                className={`
                  px-4 py-2
                  rounded-xl
                  text-sm sm:text-base
                  font-semibold
                  transition-all duration-200

                  ${
                    selectedCategory === cat
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white border border-slate-300 text-slate-800 hover:border-green-400'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GRID */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              2xl:grid-cols-3
              gap-4
            "
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() =>
                  product.stock > 0 &&
                  addToCart(product)
                }
                className={`
                  rounded-2xl
                  border
                  overflow-hidden
                  transition-all duration-300

                  ${
                    product.stock === 0
                      ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-green-400 hover:shadow-xl cursor-pointer'
                  }
                `}
              >
                <div className="p-4">

                  {/* Imagen */}
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl aspect-square flex items-center justify-center mb-4">
                    <ShoppingCart
                      size={42}
                      className="text-green-600"
                    />
                  </div>

                  {/* Nombre */}
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Precio */}
                  <p className="text-2xl font-bold text-green-600 mt-3">
                    S/. {product.price.toFixed(2)}
                  </p>

                  {/* Stock */}
                  <p className="text-sm text-slate-600 mt-1">
                    Stock: {product.stock}
                  </p>

                  {/* Botón */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock === 0}
                    className="
                      mt-4
                      w-full
                      bg-green-600
                      hover:bg-green-700
                      disabled:bg-slate-300
                      text-white
                      py-3
                      rounded-xl
                      font-semibold
                      transition
                      flex items-center justify-center gap-2
                    "
                  >
                    <Plus
                      size={18}
                      className="text-white"
                    />

                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================= */}
        {/* CARRITO */}
        {/* ======================= */}

        <div
          className="
            w-full
            xl:w-[360px]
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

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Carrito
              </h2>

              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                {cartItems.length} item
                {cartItems.length !== 1
                  ? 's'
                  : ''}
              </span>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">

            {cartItems.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart
                  size={52}
                  className="mx-auto mb-3 text-slate-300"
                />

                <p className="text-slate-500">
                  Carrito vacío
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                >

                  {/* Top */}
                  <div className="flex justify-between gap-3">

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 break-words">
                        {item.name}
                      </p>

                      <p className="text-green-600 font-bold mt-1">
                        S/.{' '}
                        {(
                          item.price *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        removeFromCart(
                          item.productId
                        )
                      }
                      className="
                        text-red-500
                        hover:text-red-700
                        transition
                        flex items-center justify-center
                      "
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center gap-3 mt-4">

                    {/* Minus */}
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1
                        )
                      }
                      className="
                        w-10 h-10
                        rounded-lg
                        border border-slate-300
                        bg-white
                        hover:bg-slate-100
                        flex items-center justify-center
                        transition
                      "
                    >
                      <Minus
                        size={18}
                        className="text-slate-800"
                        strokeWidth={2.5}
                      />
                    </button>

                    {/* Quantity */}
                    <span className="font-bold text-lg text-slate-900 min-w-[24px] text-center">
                      {item.quantity}
                    </span>

                    {/* Plus */}
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1
                        )
                      }
                      className="
                        w-10 h-10
                        rounded-lg
                        border border-slate-300
                        bg-white
                        hover:bg-slate-100
                        flex items-center justify-center
                        transition
                      "
                    >
                      <Plus
                        size={18}
                        className="text-slate-800"
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4 space-y-5">

            {/* Totales */}
            <div className="space-y-2">

              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>

                <span>
                  S/. {total.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-xl font-bold border-t border-slate-200 pt-3">
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
              <p className="text-xs font-bold uppercase text-slate-500 mb-3">
                Método de pago
              </p>

              <div className="grid grid-cols-3 gap-2">

                {(
                  [
                    'cash',
                    'yape',
                    'card',
                  ] as const
                ).map((method) => {

                  const icons = {
                    cash: (
                      <Wallet size={20} />
                    ),
                    yape: (
                      <CreditCard size={20} />
                    ),
                    card: (
                      <DollarSign size={20} />
                    ),
                  };

                  const labels = {
                    cash: 'Efectivo',
                    yape: 'Yape',
                    card: 'Tarjeta',
                  };

                  return (
                    <button
                      key={method}
                      onClick={() =>
                        setPaymentMethod(
                          method
                        )
                      }
                      className={`
                        flex flex-col
                        items-center
                        justify-center
                        gap-2
                        py-3 px-2
                        rounded-xl
                        border-2
                        transition-all

                        ${
                          paymentMethod ===
                          method
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-slate-300 text-slate-700 hover:border-green-400'
                        }
                      `}
                    >
                      {icons[method]}

                      <span className="text-xs font-semibold">
                        {labels[method]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkout */}
            <button
              onClick={handleCheckout}
              disabled={
                cartItems.length === 0
              }
              className="
                w-full
                bg-gradient-to-r
                from-green-600
                to-green-700
                hover:from-green-700
                hover:to-green-800
                disabled:from-slate-300
                disabled:to-slate-300
                disabled:cursor-not-allowed
                text-white
                py-4
                rounded-xl
                font-bold
                text-lg
                transition-all
                shadow-lg
              "
            >
              Cobrar S/.{' '}
              {total.toFixed(2)}
            </button>

            {/* Limpiar */}
            <button
              onClick={() =>
                setCartItems([])
              }
              className="
                w-full
                text-slate-700
                hover:text-slate-900
                font-semibold
                py-2
                transition
              "
            >
              Limpiar Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}