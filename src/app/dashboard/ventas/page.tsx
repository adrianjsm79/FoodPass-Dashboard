'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import CategoryFilter from '../components/pos/CategoryFilter';
import ProductCard, { Product } from '../components/pos/ProductCard';
import POSOrderPanel, { CartItem } from '../components/pos/POSOrderPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const INST_ID = 'a1000000-0000-0000-0000-000000000001';

function getToken() {
  if (typeof window === 'undefined') return '';
  const raw = localStorage.getItem('foodpass_auth');
  if (!raw) return '';
  try { return JSON.parse(raw).accessToken ?? ''; } catch { return ''; }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? body?.mensaje ?? `Error ${res.status}`);
  }
  return res.json();
}

export default function VentasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setIsLoading(true);
      // ✅ Llama al backend Express (no a la API Route de Next.js)
      const data = await apiFetch(`/instituciones/${INST_ID}/productos`);

      const productsFormatted: Product[] = data
        .filter((p: any) => p.estado === 'activo') // solo activos en el POS
        .map((p: any) => ({
          id:           p.id,
          name:         p.nombre,
          price:        p.precio,
          stock:        p.stock,
          category:     p.categoria,
          generaTicket: p.generaTicket,
          imagen:       p.imagen,
        }));

      setProducts(productsFormatted);

      const uniqueCategories = [
        ...new Set(productsFormatted.map((p) => p.category).filter(Boolean)),
      ].sort() as string[];

      setCategories(uniqueCategories);
      if (uniqueCategories.length > 0) setSelectedCategory(uniqueCategories[0]);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message ?? 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.category === selectedCategory &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCartQuantity = (productId: string): number =>
    cartItems.find((item) => item.productId === productId)?.quantity ?? 0;

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name:      product.name,
          price:     product.price,
          quantity:  1,
          imagen:    product.imagen,
        },
      ];
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleVaciar = () => setCartItems([]);

  const handlePayment = async (method: 'efectivo' | 'yape' | 'postpago') => {
    if (cartItems.length === 0) return;
    try {
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // ✅ Llama al backend Express
      await apiFetch(`/instituciones/${INST_ID}/pedidos`, {
        method: 'POST',
        body: JSON.stringify({
          canal:       'POS',
          metodo_pago: method,
          items: cartItems.map((item) => ({
            producto_id:     item.productId,
            cantidad:        item.quantity,
            precio_unitario: item.price,
          })),
        }),
      });

      toast.success(
        `Pago procesado: ${method.toUpperCase()} · S/. ${total.toFixed(2)}`
      );
      setCartItems([]);
      cargarProductos();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message ?? 'Error al procesar el pago');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Área de productos — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-slate-800">Punto de Venta</h1>
            <p className="text-sm text-slate-500">Tecsup</p>
          </div>

          <div className="flex items-center gap-4 mb-5 text-xs text-slate-500">
            <span className="flex items-center gap-1 border border-slate-200 rounded-md px-2 py-1">
              Canal: POS
            </span>
            <span>usuario_id: NULL · anónimo</span>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <div className="relative mt-3 mb-5">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-500">Cargando productos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartQuantity={getCartQuantity(product.id)}
                    onAddToCart={handleAddToCart}
                  />
                ))
              ) : (
                <p className="text-slate-500 col-span-3 py-12 text-center">
                  No hay productos disponibles en esta categoría
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <POSOrderPanel
        items={cartItems}
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
        onVaciar={handleVaciar}
        onPayment={handlePayment}
      />
    </div>
  );
}