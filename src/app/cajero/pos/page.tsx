'use client';

import { useEffect, useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import CategoryFilter from '../../dashboard/components/pos/CategoryFilter';
import ProductCard, { Product } from '../../dashboard/components/pos/ProductCard';
import POSOrderPanel, { CartItem } from '../../dashboard/components/pos/POSOrderPanel';
import { PostPagoAccount } from '../../dashboard/components/pos/PaymentModals';

interface ProductoAPI {
  id: string;
  nombre: string;
  precio: string | number;
  stock?: string | number;
  stock_actual?: string | number;
  categoria?: string;
  categoria_nombre?: string;
  generaTicket?: boolean;
  genera_ticket?: boolean;
  imagen?: string | null;
  imagen_url?: string | null;
  estado?: string;
  activo?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export default function CajeroPOS() {
  const { auth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isLoading, setIsLoading] = useState(true);
  const [postPagoAccounts, setPostPagoAccounts] = useState<PostPagoAccount[]>([]);

  const institutionId = auth?.instituciones?.[0]?.id ?? '';
  const token = auth?.accessToken ?? '';

  useEffect(() => {
    if (!institutionId || !token) return;

    const cargarDatos = async () => {
      setIsLoading(true);

      try {
        // Cargar productos
        const resProductos = await fetch(`${API_URL}/instituciones/${institutionId}/productos`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resProductos.ok) {
          throw new Error('Error al cargar productos');
        }

        const dataProductos = (await resProductos.json()) as ProductoAPI[];

        const productsFormatted: Product[] = dataProductos
          .filter((p) => p.estado === 'activo' || p.activo === true)
          .map((p) => ({
            id: p.id,
            name: p.nombre,
            price: Number(p.precio),
            stock: Number(p.stock ?? p.stock_actual ?? 0),
            category: p.categoria ?? p.categoria_nombre ?? 'Sin categoria',
            generaTicket: p.generaTicket ?? p.genera_ticket ?? false,
            imagen: p.imagen ?? p.imagen_url ?? null,
          }));

        setProducts(productsFormatted);

        const uniqueCategories = [
          ...new Set(productsFormatted.map((p) => p.category).filter(Boolean)),
        ].sort() as string[];

        setCategories(uniqueCategories);

        // Cargar cuentas postpago
        const resCuentas = await fetch(`${API_URL}/instituciones/${institutionId}/postpago/cuentas`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (resCuentas.ok) {
          const dataCuentas = await resCuentas.json();
          const formattedAccounts: PostPagoAccount[] = dataCuentas.map((acc: any) => ({
            id: acc.id,
            name: acc.nombre_completo,
            accountCode: acc.correo,
            currentDebt: Number(acc.saldo_deuda),
            creditLimit: Number(acc.limite_credito),
          }));
          setPostPagoAccounts(formattedAccounts);
        }
      } catch (error: unknown) {
        console.error('Error:', error);
        toast.error(error instanceof Error ? error.message : 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [institutionId, token]);

  const categoriesWithAll = ['Todas', ...categories];

  const filteredProducts = products.filter(
    (product) =>
      (selectedCategory === 'Todas' || product.category === selectedCategory) &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCartQuantity = (productId: string) =>
    cartItems.find((item) => item.productId === productId)?.quantity ?? 0;

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
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

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleVaciar = () => {
    setCartItems([]);
  };

  const handlePayment = async (
    method: 'efectivo' | 'yape' | 'postpago',
    options?: { cuenta_postpago_id?: string; referencia_externa?: string }
  ) => {
    if (cartItems.length === 0) return;

    try {
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const res = await fetch(`${API_URL}/instituciones/${institutionId}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          canal: 'POS',
          metodo_pago: method,
          cuenta_postpago_id: options?.cuenta_postpago_id,
          referencia_externa: options?.referencia_externa,
          items: cartItems.map((item) => ({
            producto_id: item.productId,
            cantidad: item.quantity,
            precio_unitario: item.price,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.mensaje ?? `Error ${res.status}`);
      }

      toast.success(`Pago procesado: ${method.toUpperCase()} - S/. ${total.toFixed(2)}`);
      setCartItems([]);
      setSearchTerm('');
      setSelectedCategory('Todas');
    } catch (error: unknown) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pago');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShoppingCart size={30} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Punto de Venta</h1>
              <p className="text-green-100 text-sm sm:text-base">Vende rapido y facil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <CategoryFilter
              categories={categoriesWithAll}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl py-20 text-center">
                <p className="text-slate-500">Cargando productos...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id)}
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl py-20 text-center">
                <p className="text-slate-500">No hay productos disponibles</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full xl:w-[380px]">
          <div className="sticky top-6">
            <POSOrderPanel
              items={cartItems}
              postPagoAccounts={postPagoAccounts}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
              onVaciar={handleVaciar}
              onPayment={handlePayment}
            />
          </div>
        </div>
      </div>
    </div>
  );
}