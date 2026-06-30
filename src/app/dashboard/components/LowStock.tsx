'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Package } from 'lucide-react';

// ── Auth / API helpers ──────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getAuth(): { accessToken: string; institucionId: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('foodpass_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const inst = (parsed.instituciones ?? []).find(
      (i: { rol: string }) => i.rol !== 'USUARIO'
    ) ?? parsed.instituciones?.[0];
    return {
      accessToken: parsed.accessToken ?? '',
      institucionId: inst?.id ?? '',
    };
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error('No hay sesión activa');

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? body?.mensaje ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ───────────────────────────────────────────────────────────────────────

interface StockItem {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  umbral_stock_bajo: number;
  stock_bajo: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function LowStock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) { setItems([]); return; }
      const allStock = await apiFetch<StockItem[]>(
        `/instituciones/${auth.institucionId}/stock`
      );
      // Filter only low stock items
      const lowStock = allStock.filter(s => s.stock_bajo);
      setItems(lowStock);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getPercentage = (current: number, umbral: number) => {
    // Show percentage relative to double the threshold (so 100% = at threshold, 0% = empty)
    const max = umbral * 2;
    return Math.min((current / max) * 100, 100);
  };

  const getBarColor = (current: number, umbral: number) => {
    const ratio = current / umbral;
    if (ratio <= 0.3) return 'bg-red-500';
    if (ratio <= 0.7) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-6 flex items-center gap-2">
        <AlertTriangle size={20} className="text-amber-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Stock Bajo
            {!loading && items.length > 0 && (
              <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {items.length} producto{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500">Productos bajo el umbral configurado</p>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Cargando…
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-8 text-sm gap-2">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchData} className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">
            Reintentar
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm gap-2">
          <Package size={36} strokeWidth={1.5} />
          <p className="font-medium text-emerald-600">Todo en orden</p>
          <p className="text-xs text-center">Ningún producto tiene stock por debajo del umbral.</p>
        </div>
      )}

      {/* LIST */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => {
            const percentage = getPercentage(item.cantidad, item.umbral_stock_bajo);
            const barColor = getBarColor(item.cantidad, item.umbral_stock_bajo);

            return (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-700 block truncate">{item.nombre}</span>
                    <span className="text-xs text-slate-400">{item.categoria}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap ml-2">
                    {item.cantidad} / {item.umbral_stock_bajo}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {item.cantidad === 0
                    ? 'Sin stock'
                    : `${item.cantidad} unidad${item.cantidad !== 1 ? 'es' : ''} restante${item.cantidad !== 1 ? 's' : ''}`
                  }
                  {' '}— umbral: {item.umbral_stock_bajo}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
