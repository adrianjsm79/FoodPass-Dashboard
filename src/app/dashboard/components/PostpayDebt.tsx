'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet } from 'lucide-react';

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

interface DebtItem {
  usuario_id: string;
  nombre_completo: string;
  correo: string;
  saldo_deuda: string | number;
  limite_credito: string | number;
  porcentaje_uso: string | number | null;
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function PostpayDebt() {
  const [items, setItems] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) { setItems([]); return; }
      const result = await apiFetch<DebtItem[]>(
        `/instituciones/${auth.institucionId}/reportes/deuda-postpago`
      );
      setItems(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar deudas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDebt = items.reduce((sum, item) => sum + parseFloat(String(item.saldo_deuda)), 0);
  const maxDebt = items.length > 0 ? Math.max(...items.map(item => parseFloat(String(item.saldo_deuda)))) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Deuda Postpago</h2>
          <p className="text-sm text-slate-500">Usuarios con saldo pendiente</p>
        </div>
        {!loading && items.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Deuda</p>
            <p className="text-2xl font-bold text-slate-900">S/. {totalDebt.toFixed(2)}</p>
          </div>
        )}
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
          <Wallet size={36} strokeWidth={1.5} />
          <p className="font-medium text-emerald-600">Sin deudas pendientes</p>
          <p className="text-xs text-center">No hay usuarios con saldo postpago pendiente.</p>
        </div>
      )}

      {/* LIST */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((debt) => {
            const deuda = parseFloat(String(debt.saldo_deuda));
            const limite = parseFloat(String(debt.limite_credito));
            const percentage = maxDebt > 0 ? (deuda / maxDebt) * 100 : 0;
            const usoPct = limite > 0 ? (deuda / limite) * 100 : 0;

            return (
              <div key={debt.usuario_id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-700 block truncate">
                      {debt.nombre_completo}
                    </span>
                    <span className="text-xs text-slate-400">{debt.correo}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap ml-2">
                    S/. {deuda.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: usoPct > 80 ? '#ef4444' : usoPct > 50 ? '#f59e0b' : '#a855f7',
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {usoPct.toFixed(0)}% del límite (S/. {limite.toFixed(2)})
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
