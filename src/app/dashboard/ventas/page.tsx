'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import CategoryFilter from '../components/pos/CategoryFilter';
import ProductCard, {
  Product,
} from '../components/pos/ProductCard';

import POSOrderPanel, {
  CartItem,
} from '../components/pos/POSOrderPanel';

import { useAuth } from '@/contexts/AuthContext';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

function getToken() {
  if (typeof window === 'undefined') return '';

  const raw = localStorage.getItem(
    'foodpass_auth'
  );

  if (!raw) return '';

  try {
    return JSON.parse(raw).accessToken ?? '';
  } catch {
    return '';
  }
}

async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({}));

    throw new Error(
      body?.error ??
        body?.mensaje ??
        `Error ${res.status}`
    );
  }

  return res.json();
}

export default function VentasPage() {
  const { auth } = useAuth();
  const instId = auth?.instituciones?.[0]?.id;

  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [categories, setCategories] = useState<
    string[]
  >([]);

  const [selectedCategory, setSelectedCategory] =
    useState<string>('');

  const [searchTerm, setSearchTerm] =
    useState<string>('');

  const [cartItems, setCartItems] = useState<
    CartItem[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    if (instId) {
      cargarProductos();
    }
  }, [instId]);

  const cargarProductos = async () => {
    if (!instId) return;
    try {
      setIsLoading(true);

      const data = await apiFetch(
        `/instituciones/${instId}/productos`
      );

      const productsFormatted: Product[] = data
        .filter(
          (p: any) => p.estado === 'activo'
        )
        .map((p: any) => ({
          id: p.id,
          name: p.nombre,
          price: p.precio,
          stock: p.stock,
          category: p.categoria,
          generaTicket: p.generaTicket,
          imagen: p.imagen,
        }));

      setProducts(productsFormatted);

      const uniqueCategories = [
        ...new Set(
          productsFormatted
            .map((p) => p.category)
            .filter(Boolean)
        ),
      ].sort() as string[];

      setCategories(uniqueCategories);

      if (uniqueCategories.length > 0) {
        setSelectedCategory(uniqueCategories[0]);
      }
    } catch (error: any) {
      console.error('Error:', error);

      toast.error(
        error.message ??
          'Error al cargar productos'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.category === selectedCategory &&
      product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const getCartQuantity = (
    productId: string
  ): number =>
    cartItems.find(
      (item) => item.productId === productId
    )?.quantity ?? 0;

  const handleAddToCart = (
    product: Product
  ) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id
      );

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imagen: product.imagen,
        },
      ];
    });
  };

  const handleQuantityChange = (
    productId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (
    productId: string
  ) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          item.productId !== productId
      )
    );
  };

  const handleVaciar = () => {
    setCartItems([]);
  };

  const handlePayment = async (
    method:
      | 'efectivo'
      | 'yape'
      | 'postpago'
  ) => {
    if (cartItems.length === 0) return;

    try {
      const total = cartItems.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      );

      await apiFetch(
        `/instituciones/${instId}/pedidos`,
        {
          method: 'POST',
          body: JSON.stringify({
            canal: 'POS',
            metodo_pago: method,
            items: cartItems.map((item) => ({
              producto_id: item.productId,
              cantidad: item.quantity,
              precio_unitario: item.price,
            })),
          }),
        }
      );

      toast.success(
        `Pago procesado: ${method.toUpperCase()} · S/. ${total.toFixed(
          2
        )}`
      );

      setCartItems([]);

      cargarProductos();
    } catch (error: any) {
      console.error('Error:', error);

      toast.error(
        error.message ??
          'Error al procesar el pago'
      );
    }
  };

  return (
    <div
      className="
        flex
        flex-col
        xl:flex-row
        min-h-screen
        bg-slate-50
      "
    >
      {/* ========================= */}
      {/* PRODUCTOS */}
      {/* ========================= */}

      <div className="flex-1 min-w-0">
        <div className="p-4 sm:p-6">

          {/* Header */}
          <div
            className="
              bg-gradient-to-r
              from-green-600
              to-green-700
              rounded-2xl
              p-5
              sm:p-6
              text-white
              shadow-lg
              mb-6
            "
          >
            <div className="flex items-center gap-3">
              <ShoppingCart
                size={30}
                className="flex-shrink-0"
              />

              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">
                  Punto de Venta
                </h1>

                <p className="text-green-100 text-sm sm:text-base mt-1">
                  Gestión rápida de ventas POS
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              gap-2
              sm:gap-4
              mb-5
              text-sm
              text-slate-600
            "
          >
            <span
              className="
                inline-flex
                items-center
                gap-1
                border border-slate-300
                bg-white
                rounded-lg
                px-3 py-2
                w-fit
                font-medium
              "
            >
              Canal: POS
            </span>

            <span className="text-slate-500 break-all">
              usuario_id: NULL · anónimo
            </span>
          </div>

          {/* Categorías */}
          <CategoryFilter
            categories={categories}
            selectedCategory={
              selectedCategory
            }
            onCategoryChange={
              setSelectedCategory
            }
          />

          {/* Search */}
          <div className="relative mt-4 mb-6">
            <Search
              size={18}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="
                w-full
                pl-10
                pr-4
                py-3
                rounded-xl
                border border-slate-300
                bg-white
                text-slate-900
                placeholder-slate-400
                focus:outline-none
                focus:ring-2
                focus:ring-green-500
                focus:border-transparent
              "
            />
          </div>

          {/* Productos */}
          {isLoading ? (
            <div
              className="
                flex
                items-center
                justify-center
                py-20
              "
            >
              <p className="text-slate-500">
                Cargando productos...
              </p>
            </div>
          ) : (
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-2
                2xl:grid-cols-3
                gap-4
              "
            >
              {filteredProducts.length > 0 ? (
                filteredProducts.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQuantity={getCartQuantity(
                        product.id
                      )}
                      onAddToCart={
                        handleAddToCart
                      }
                    />
                  )
                )
              ) : (
                <div
                  className="
                    col-span-full
                    bg-white
                    border border-slate-200
                    rounded-2xl
                    py-16
                    text-center
                  "
                >
                  <p className="text-slate-500">
                    No hay productos
                    disponibles
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================= */}
      {/* PANEL ORDEN */}
      {/* ========================= */}

      <div
        className="
          w-full
          xl:w-[420px]
          border-t
          xl:border-t-0
          xl:border-l
          border-slate-200
          bg-white
          xl:sticky
          xl:top-0
          xl:h-screen
          overflow-hidden
          flex-shrink-0
        "
      >
        <POSOrderPanel
          items={cartItems}
          onQuantityChange={
            handleQuantityChange
          }
          onRemoveItem={handleRemoveItem}
          onVaciar={handleVaciar}
          onPayment={handlePayment}
        />
      </div>
    </div>
  );
}