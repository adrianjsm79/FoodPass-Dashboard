'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CreditCard } from 'lucide-react';

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

interface PaymentMethodData {
  name: string;
  value: number;
  amount: number;
}

// ── Component ───────────────────────────────────────────────────────────────────

const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function PaymentMethodsChart() {
  const [data, setData] = useState<PaymentMethodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) { setData([]); return; }
      const result = await apiFetch<PaymentMethodData[]>(
        `/instituciones/${auth.institucionId}/reportes/metodos-pago`
      );
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Métodos de Pago</h2>
        <p className="text-sm text-slate-400">Distribución de pagos completados</p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Cargando…
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12 text-sm gap-2">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchData} className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">
            Reintentar
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm gap-2">
          <CreditCard size={40} strokeWidth={1.5} />
          <p className="font-medium">Sin pagos registrados</p>
          <p className="text-xs">Los datos se mostrarán cuando se registren pagos.</p>
        </div>
      )}

      {/* CHART + LEGEND */}
      {!loading && !error && data.length > 0 && (
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0 w-[220px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(val: number, name: string) => [`${val} transacciones`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            {data.map((method, index) => (
              <div key={method.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {method.name}{' '}
                      <span className="text-xs text-slate-400">({method.value})</span>
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    S/. {method.amount.toFixed(2)}
                  </span>
                </div>
                {index < data.length - 1 && (
                  <div className="mt-3 h-px bg-slate-100" />
                )}
              </div>
            ))}

            {/* Total */}
            <div className="mt-1 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Total</span>
                <span className="text-sm font-bold text-slate-900">
                  S/. {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}