'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

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

interface RevenueData {
  day: string;
  APP: number;
  POS: number;
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function WeeklyRevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) { setData([]); return; }
      const result = await apiFetch<RevenueData[]>(
        `/instituciones/${auth.institucionId}/reportes/ventas-semanales`
      );
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalWeek = data.reduce((sum, d) => sum + d.APP + d.POS, 0);

  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow-sm
        border border-slate-200
        p-4 sm:p-6
        overflow-hidden
      "
    >

      {/* HEADER */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Ingresos Semanales
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Últimos 7 días — APP vs POS
          </p>
        </div>
        {!loading && data.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <TrendingUp size={14} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              S/. {totalWeek.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center h-[320px] text-slate-400 text-sm gap-2">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Cargando datos…
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center h-[320px] text-slate-400 text-sm gap-2">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchData} className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">
            Reintentar
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[320px] text-slate-400 text-sm gap-2">
          <TrendingUp size={40} strokeWidth={1.5} />
          <p className="font-medium">Sin ventas esta semana</p>
          <p className="text-xs text-slate-400">Los datos se mostrarán cuando se registren pedidos pagados.</p>
        </div>
      )}

      {/* CHART */}
      {!loading && !error && data.length > 0 && (
        <div className="w-full h-[280px] sm:h-[320px] md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontSize: '14px',
                }}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                formatter={(value: any) => [`S/. ${Number(value).toFixed(2)}`, undefined]}
              />
              <Legend
                wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
              />
              <Bar dataKey="APP" fill="#a855f7" radius={[8, 8, 0, 0]} />
              <Bar dataKey="POS" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}