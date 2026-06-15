'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search, Plus, Pencil, Trash2, TriangleAlert, Tag,
  LayoutGrid, ToggleRight, ToggleLeft, Ticket, X, ImagePlus,
  PowerOff,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getToken() {
  if (typeof window === 'undefined') return '';
  const raw = localStorage.getItem('foodpass_auth');
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return parsed.accessToken ?? '';
  } catch {
    return '';
  }
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

  if (res.status === 401) {
    const raw = localStorage.getItem('foodpass_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: parsed.refreshToken }),
      });
      if (refreshRes.ok) {
        const { accessToken } = await refreshRes.json();
        parsed.accessToken = accessToken;
        localStorage.setItem('foodpass_auth', JSON.stringify(parsed));
        return apiFetch(path, options);
      }
    }
    throw new Error('Sesión expirada, vuelve a iniciar sesión');
  }

  // DELETE puede devolver 204 sin body
  if (res.status === 204) return null;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? body?.mensaje ?? body?.message ?? `Error ${res.status}`);
  }

  // Algunas respuestas DELETE devuelven 200 con body vacío
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_nombre: string;
  categoria_id: string;
  precio: number;
  stock_actual: number;
  umbral_stock_bajo: number;
  genera_ticket: boolean;
  activo: boolean;
  imagen_url?: string | null;
}

interface Categoria {
  id: string;
  nombre: string;
  imagen_url?: string | null;
  activo: boolean;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapProducto(p: any): Producto {
  return {
    id:               p.id,
    nombre:           p.nombre,
    descripcion:      p.descripcion ?? null,
    categoria_nombre: p.categoria ?? p.categoria_nombre ?? '',
    categoria_id:     p.categoriaId ?? p.categoria_id ?? '',
    precio:           parseFloat(p.precio),
    // ✅ FIX: el backend puede devolver "stock" o "stock_actual"
    stock_actual:     parseInt(p.stock ?? p.stock_actual ?? 0),
    umbral_stock_bajo: parseInt(p.umbral ?? p.umbral_stock_bajo ?? 5),
    genera_ticket:    p.generaTicket ?? p.genera_ticket ?? false,
    activo:           p.estado === 'activo' || p.activo === true,
    // ✅ FIX: el backend puede devolver "imagen" o "imagen_url"
    imagen_url:       p.imagen ?? p.imagen_url ?? null,
  };
}

// ─── ImageUploader ────────────────────────────────────────────────────────────

function ImageUploader({
  value, onChange, size = 'md',
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  size?: 'sm' | 'md';
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.error('No se admiten archivos locales. Ingresa una URL pública de imagen.');
    e.target.value = '';
  };

  const handleUrlChange = (newUrl: string) => {
    onChange(newUrl.trim() || undefined);
  };

  const wrapCls = size === 'sm' ? 'w-14 h-14 rounded-xl' : 'w-full h-32 rounded-xl';

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center justify-center cursor-pointer border-2 border-dashed border-slate-200 bg-slate-50 hover:border-green-400 hover:bg-green-50 transition-colors overflow-hidden group ${wrapCls}`}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <ImagePlus size={14} className="text-white" />
              {size !== 'sm' && <span className="text-white text-xs font-medium">Cambiar</span>}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-green-500 transition-colors">
            <ImagePlus size={size === 'sm' ? 16 : 22} />
            {size !== 'sm' && (
              <>
                <span className="text-xs font-medium">Subir imagen</span>
                <span className="text-xs text-slate-300">JPG, PNG, WEBP</span>
              </>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div className="space-y-1">
        <input
          type="url"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="https://example.com/imagen.jpg"
          value={value ?? ''}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        <p className="text-[10px] text-slate-400">Usa una URL pública corta o deja el campo vacío.</p>
      </div>
    </div>
  );
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function Thumbnail({
  imagen, nombre, size = 'sm', fallbackIcon,
}: {
  imagen?: string | null;
  nombre: string;
  size?: 'sm' | 'md';
  fallbackIcon?: React.ReactNode;
}) {
  const cls = size === 'md' ? 'w-10 h-10 rounded-xl' : 'w-8 h-8 rounded-lg';

  if (imagen) {
    return <img src={imagen} alt={nombre} className={`${cls} object-cover flex-shrink-0 border border-slate-100`} />;
  }
  return (
    <div className={`${cls} bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300`}>
      {fallbackIcon ?? <ImagePlus size={13} />}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-300';

function StatCard({ icon, value, label, sub, iconColor }: {
  icon: React.ReactNode; value: number; label: string; sub: string; iconColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className={`mb-2 ${iconColor}`}>{icon}</div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-xs text-slate-400 font-mono mt-0.5 hidden sm:block">{sub}</p>
    </div>
  );
}

// ─── Form defaults ────────────────────────────────────────────────────────────

const emptyProductoForm = () => ({
  nombre: '', descripcion: '', categoria_id: '', precio: '',
  stock: '', umbral: '', genera_ticket: false, activo: true,
  imagen_url: undefined as string | undefined,
});

const emptyCategoriaForm = () => ({
  nombre: '',
  imagen_url: undefined as string | undefined,
});

// ─── Tipos para el confirm dialog ─────────────────────────────────────────────

type ConfirmAction =
  | { tipo: 'desactivar-producto'; id: string; nombre: string }
  | { tipo: 'eliminar-producto';   id: string; nombre: string }
  | { tipo: 'eliminar-categoria';  id: string; nombre: string };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductosPage() {
  const { auth } = useAuth();
  const instId = auth?.instituciones?.[0]?.id;

  const [productos,  setProductos]  = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [activeTab,  setActiveTab]  = useState<'productos' | 'categorias'>('productos');
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('todas');
  const [isLoading,  setIsLoading]  = useState(true);
  const [saving,     setSaving]     = useState(false);

  const [showModalProd, setShowModalProd] = useState(false);
  const [editingProd,   setEditingProd]   = useState<Producto | null>(null);
  const [formProd,      setFormProd]      = useState(emptyProductoForm());

  const [showModalCat, setShowModalCat] = useState(false);
  const [editingCat,   setEditingCat]   = useState<Categoria | null>(null);
  const [formCat,      setFormCat]      = useState(emptyCategoriaForm());

  // ✅ FIX: el confirm ahora distingue desactivar / eliminar producto / eliminar categoría
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  async function cargarDatos() {
    if (!instId) return;
    setIsLoading(true);
    try {
      const [catsRaw, prodsRaw] = await Promise.all([
        apiFetch(`/instituciones/${instId}/categorias`),
        apiFetch(`/instituciones/${instId}/productos`),
      ]);

      // ✅ FIX: mapeamos imagen desde "icono" o "imagen_url" según lo que devuelva el backend
      const cats: Categoria[] = catsRaw.map((c: any) => ({
        id:         c.id,
        nombre:     c.nombre,
        imagen_url: c.imagen_url ?? c.icono ?? c.imagen ?? null,
        activo:     c.activo ?? c.estado === 'activo',
      }));

      setCategorias(cats);
      setProductos(prodsRaw.map(mapProducto));
    } catch (e: any) {
      toast.error(e.message ?? 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (instId) {
      void cargarDatos(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [instId]);

  const total         = productos.length;
  const activos       = productos.filter((p) => p.activo).length;
  const generanTicket = productos.filter((p) => p.genera_ticket).length;
  const stockCritico  = productos.filter((p) => p.stock_actual < p.umbral_stock_bajo).length;

  // ─── Handlers: Producto ───────────────────────────────────────────────────

  const openNuevoProd = () => {
    setEditingProd(null);
    setFormProd({ ...emptyProductoForm(), categoria_id: categorias[0]?.id ?? '' });
    setShowModalProd(true);
  };

  const openEditarProd = (p: Producto) => {
    setEditingProd(p);
    setFormProd({
      nombre:        p.nombre,
      descripcion:   p.descripcion ?? '',
      categoria_id:  p.categoria_id,
      precio:        String(p.precio),
      // ✅ FIX: cargamos el stock real al editar
      stock:         String(p.stock_actual),
      umbral:        String(p.umbral_stock_bajo),
      genera_ticket: p.genera_ticket,
      activo:        p.activo,
      imagen_url:    p.imagen_url ?? undefined,
    });
    setShowModalProd(true);
  };

  const handleGuardarProd = async () => {
    if (!formProd.nombre.trim()) return toast.error('El nombre es requerido');
    if (!formProd.categoria_id)  return toast.error('Selecciona una categoría');
    if (!formProd.precio)        return toast.error('El precio es requerido');

    setSaving(true);
    try {
      const stockValue = parseInt(formProd.stock) || 0;

      const body: Record<string, any> = {
        nombre:        formProd.nombre.trim(),
        descripcion:   formProd.descripcion.trim() || null,
        categoria_id:  formProd.categoria_id,
        precio:        parseFloat(formProd.precio),
        genera_ticket: formProd.genera_ticket,
        activo:        formProd.activo,
        imagen:        formProd.imagen_url ?? null,
        imagen_url:    formProd.imagen_url ?? null,
        umbral:        parseInt(formProd.umbral) || 5,
      };

      if (editingProd) {
        // al editar enviamos el stock real al backend.
        body.stock_actual = stockValue;
        body.stock        = stockValue;

        await apiFetch(`/instituciones/${instId}/productos/${editingProd.id}`, {
          method: 'PATCH', body: JSON.stringify(body),
        });
        toast.success('Producto actualizado');
      } else {
        // al crear enviamos stock_inicial y stock_actual para que el backend lo registre.
        body.stock_inicial = stockValue;
        body.stock_actual  = stockValue;
        body.stock         = stockValue;

        await apiFetch(`/instituciones/${instId}/productos`, {
          method: 'POST', body: JSON.stringify(body),
        });
        toast.success('Producto creado');
      }

      setShowModalProd(false);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIX: desactivar (toggle estado) → no elimina, solo cambia activo
  const handleDesactivarProd = async (id: string) => {
    try {
      await apiFetch(`/instituciones/${instId}/productos/${id}`, {
        method: 'PATCH', body: JSON.stringify({ activo: false }),
      });
      toast.success('Producto desactivado');
      setConfirmAction(null);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al desactivar');
    }
  };

  // ✅ FIX: eliminar definitivo → DELETE real
  const handleEliminarProd = async (id: string) => {
    try {
      await apiFetch(`/instituciones/${instId}/productos/${id}`, { method: 'DELETE' });
      toast.success('Producto eliminado');
      setConfirmAction(null);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al eliminar');
    }
  };

  // Toggle estado (activo/inactivo) directo desde la tabla
  const toggleEstado = async (p: Producto) => {
    try {
      await apiFetch(`/instituciones/${instId}/productos/${p.id}`, {
        method: 'PATCH', body: JSON.stringify({ activo: !p.activo }),
      });
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al cambiar estado');
    }
  };

  // ─── Handlers: Categoría ─────────────────────────────────────────────────

  const openNuevaCat = () => {
    setEditingCat(null);
    setFormCat(emptyCategoriaForm());
    setShowModalCat(true);
  };

  const openEditarCat = (c: Categoria) => {
    setEditingCat(c);
    setFormCat({ nombre: c.nombre, imagen_url: c.imagen_url ?? undefined });
    setShowModalCat(true);
  };

  const handleGuardarCat = async () => {
    if (!formCat.nombre.trim()) return toast.error('El nombre es requerido');
    setSaving(true);
    try {
      const imageValue = formCat.imagen_url;
      const safeImage = typeof imageValue === 'string' && !imageValue.startsWith('data:') && imageValue.length <= 100
        ? imageValue
        : undefined;

      if (imageValue && !safeImage) {
        toast.warning('La imagen no se guardará porque excede el límite del backend.');
      }

      const body: Record<string, unknown> = {
        nombre: formCat.nombre.trim(),
      };
      if (safeImage) {
        body.icono = safeImage;
        body.imagen_url = safeImage;
      }

      if (editingCat) {
        await apiFetch(`/instituciones/${instId}/categorias/${editingCat.id}`, {
          method: 'PATCH', body: JSON.stringify(body),
        });
        toast.success('Categoría actualizada');
      } else {
        await apiFetch(`/instituciones/${instId}/categorias`, {
          method: 'POST', body: JSON.stringify(body),
        });
        toast.success('Categoría creada');
      }
      setShowModalCat(false);
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIX: eliminar categoría → DELETE real (no solo desactivar)
  const handleEliminarCat = async (id: string) => {
    try {
      await apiFetch(`/instituciones/${instId}/categorias/${id}`, { method: 'DELETE' });
      toast.success('Categoría eliminada');
      setConfirmAction(null);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      cargarDatos();
    } catch (e: any) {
      toast.error(e.message ?? 'Error al eliminar');
    }
  };

  const filteredProductos = productos.filter((p) => {
    const matchCat    = catFilter === 'todas' || p.categoria_id === catFilter;
    const matchSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ─── Confirm dialog content ───────────────────────────────────────────────

  const renderConfirm = () => {
    if (!confirmAction) return null;

    if (confirmAction.tipo === 'desactivar-producto') {
      return (
        <Modal title="Desactivar producto" onClose={() => setConfirmAction(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <PowerOff size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-700">
                  ¿Desactivar este producto?
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  <strong>"{confirmAction.nombre}"</strong> quedará inactivo pero podrás reactivarlo después desde la tabla.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDesactivarProd(confirmAction.id)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                Sí, desactivar
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    if (confirmAction.tipo === 'eliminar-producto') {
      return (
        <Modal title="Eliminar producto" onClose={() => setConfirmAction(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <TriangleAlert size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  ¿Eliminar este producto definitivamente?
                </p>
                <p className="text-xs text-red-500 mt-1">
                  <strong>"{confirmAction.nombre}"</strong> se borrará de forma permanente y no podrás recuperarlo.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleEliminarProd(confirmAction.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    if (confirmAction.tipo === 'eliminar-categoria') {
      return (
        <Modal title="Eliminar categoría" onClose={() => setConfirmAction(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <TriangleAlert size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  ¿Eliminar esta categoría definitivamente?
                </p>
                <p className="text-xs text-red-500 mt-1">
                  <strong>"{confirmAction.nombre}"</strong> se borrará de forma permanente. Asegúrate de que no tenga productos asignados.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleEliminarCat(confirmAction.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </Modal>
      );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<LayoutGrid size={20}    />} value={total}         label="Total Productos"  sub="en catálogo"             iconColor="text-blue-500"   />
        <StatCard icon={<ToggleRight size={20}   />} value={activos}       label="Activos"          sub="disponibles para venta"  iconColor="text-green-500"  />
        <StatCard icon={<Ticket size={20}        />} value={generanTicket} label="Generan Ticket"   sub="productos.genera_ticket" iconColor="text-purple-500" />
        <StatCard icon={<TriangleAlert size={20} />} value={stockCritico}  label="Stock Crítico"    sub="cantidad ≤ umbral"       iconColor="text-orange-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['productos', 'categorias'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeTab === tab
                ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'productos' ? <LayoutGrid size={14} /> : <Tag size={14} />}
            {tab === 'productos' ? 'Productos' : 'Categorías'}
            <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-md font-semibold">
              {tab === 'productos' ? total : categorias.length}
            </span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Cargando...</div>
      )}

      {/* ══════════ Tab: Productos ══════════ */}
      {!isLoading && activeTab === 'productos' && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Catálogo</h2>
            <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Buscar por nombre..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="w-full sm:w-auto border border-slate-200 rounded-lg text-xs text-slate-600 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <button
                onClick={openNuevoProd}
                className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus size={13} /> Nuevo producto
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[640px] px-3 sm:px-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Producto', 'Categoría', 'Precio', 'Stock', 'Ticket', 'Estado', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 pb-2 pr-3 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProductos.map((prod) => {
                    const isCritico = prod.stock_actual < prod.umbral_stock_bajo;
                    return (
                      <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Thumbnail imagen={prod.imagen_url} nombre={prod.nombre} />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{prod.nombre}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">{prod.descripcion}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100 whitespace-nowrap">
                            {prod.categoria_nombre}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          S/. {prod.precio.toFixed(2)}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isCritico ? 'text-orange-500' : 'text-slate-700'}`}>
                            {isCritico && <TriangleAlert size={11} />}
                            {prod.stock_actual}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          {prod.genera_ticket && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100 whitespace-nowrap">
                              <Ticket size={10} /> Genera ticket
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <button
                            onClick={() => toggleEstado(prod)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${prod.activo ? 'text-green-600' : 'text-slate-400'}`}
                          >
                            {prod.activo
                              ? <ToggleRight size={16} className="text-green-500" />
                              : <ToggleLeft  size={16} className="text-slate-300" />}
                            {prod.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        {/* ✅ FIX: 3 acciones → editar, desactivar, eliminar */}
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditarProd(prod)}
                              title="Editar"
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmAction({ tipo: 'desactivar-producto', id: prod.id, nombre: prod.nombre })}
                              title="Desactivar"
                              className="p-1 text-slate-400 hover:text-orange-500 transition-colors"
                            >
                              <PowerOff size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmAction({ tipo: 'eliminar-producto', id: prod.id, nombre: prod.nombre })}
                              title="Eliminar"
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProductos.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8">No se encontraron productos.</p>
          )}
        </div>
      )}

      {/* ══════════ Tab: Categorías ══════════ */}
      {!isLoading && activeTab === 'categorias' && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Categorías</h2>
            <button
              onClick={openNuevaCat}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} /> Nueva categoría
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categorias.map((cat) => {
              const count = productos.filter((p) => p.categoria_id === cat.id).length;
              return (
                <div key={cat.id} className="flex items-center justify-between border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* ✅ FIX: Thumbnail usa imagen_url que ya fue mapeada correctamente */}
                    <Thumbnail
                      imagen={cat.imagen_url}
                      nombre={cat.nombre}
                      size="md"
                      fallbackIcon={<Tag size={14} className="text-slate-400" />}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{cat.nombre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{count} {count === 1 ? 'producto' : 'productos'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => openEditarCat(cat)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    {/* ✅ FIX: eliminar categoría de verdad */}
                    <button
                      onClick={() => setConfirmAction({ tipo: 'eliminar-categoria', id: cat.id, nombre: cat.nombre })}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
            {categorias.length === 0 && (
              <p className="col-span-1 sm:col-span-2 text-xs text-slate-400 text-center py-8">No hay categorías registradas.</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════ Modal: Producto ══════════ */}
      {showModalProd && (
        <Modal title={editingProd ? 'Editar producto' : 'Nuevo producto'} onClose={() => setShowModalProd(false)}>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Imagen</label>
                <ImageUploader size="sm" value={formProd.imagen_url}
                  onChange={(img) => setFormProd((p) => ({ ...p, imagen_url: img }))} />
              </div>
              <div className="flex-1 min-w-0">
                <Field label="Nombre *">
                  <input className={inputCls} placeholder="Ej: Menú del Día" value={formProd.nombre}
                    onChange={(e) => setFormProd((p) => ({ ...p, nombre: e.target.value }))} />
                </Field>
              </div>
            </div>

            <Field label="Descripción">
              <input className={inputCls} placeholder="Descripción breve" value={formProd.descripcion}
                onChange={(e) => setFormProd((p) => ({ ...p, descripcion: e.target.value }))} />
            </Field>

            <Field label="Categoría *">
              <select className={inputCls} value={formProd.categoria_id}
                onChange={(e) => setFormProd((p) => ({ ...p, categoria_id: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Field>

            {/* ✅ FIX: 3 columnas siempre (precio, stock, alerta) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Precio (S/.) *">
                <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00"
                  value={formProd.precio}
                  onChange={(e) => setFormProd((p) => ({ ...p, precio: e.target.value }))} />
              </Field>
              {/* ✅ FIX: campo stock siempre visible (stock_inicial al crear, stock al editar) */}
              <Field label={editingProd ? 'Stock actual' : 'Stock inicial'}>
                <input type="number" min="0" className={inputCls} placeholder="0"
                  value={formProd.stock}
                  onChange={(e) => setFormProd((p) => ({ ...p, stock: e.target.value }))} />
              </Field>
              <Field label="Alerta stock">
                <input type="number" min="0" className={inputCls} placeholder="5"
                  value={formProd.umbral}
                  onChange={(e) => setFormProd((p) => ({ ...p, umbral: e.target.value }))} />
              </Field>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={formProd.genera_ticket} className="w-4 h-4 accent-green-600"
                  onChange={(e) => setFormProd((p) => ({ ...p, genera_ticket: e.target.checked }))} />
                <span className="text-xs text-slate-600 font-medium">Genera ticket</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={formProd.activo} className="w-4 h-4 accent-green-600"
                  onChange={(e) => setFormProd((p) => ({ ...p, activo: e.target.checked }))} />
                <span className="text-xs text-slate-600 font-medium">Activo</span>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModalProd(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarProd}
                disabled={saving || !formProd.nombre.trim() || !formProd.categoria_id}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                {saving ? 'Guardando...' : editingProd ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════ Modal: Categoría ══════════ */}
      {showModalCat && (
        <Modal title={editingCat ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setShowModalCat(false)}>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Imagen</label>
                <ImageUploader size="sm" value={formCat.imagen_url}
                  onChange={(img) => setFormCat((p) => ({ ...p, imagen_url: img }))} />
              </div>
              <div className="flex-1 min-w-0">
                <Field label="Nombre *">
                  <input className={inputCls} placeholder="Ej: Menús, Bebidas, Snacks" maxLength={100} value={formCat.nombre}
                    onChange={(e) => setFormCat((p) => ({ ...p, nombre: e.target.value }))} />
                </Field>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModalCat(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarCat} disabled={saving || !formCat.nombre.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                {saving ? 'Guardando...' : editingCat ? 'Guardar cambios' : 'Crear categoría'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════ Modales de confirmación ══════════ */}
      {renderConfirm()}
    </div>
  );
}