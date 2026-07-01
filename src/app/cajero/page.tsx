'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Ticket, TrendingUp, DollarSign, Users,
  AlertCircle, Activity, ShoppingCart, Zap, BarChart3,
} from 'lucide-react';

// ─── Auth / API helpers ────────────────────────────────────────────────────────

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
    throw new Error(body?.message ?? body?.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AlertaStock {
  nombre: string;
  cantidad: number;
  umbral: number;
}

interface ActividadReciente {
  id: string;
  type: 'ticket' | 'sale';
  description: string;
  amount: number;
  timestamp: string;
}

interface DashboardData {
  ticketsValidados: number;
  ventasRealizadas: number;
  ingresosPos: number;
  usuariosAtendidos: number;
  alertasStock: AlertaStock[];
  actividadReciente: ActividadReciente[];
}

export default function CajeroDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) return;

      const res = await apiFetch<DashboardData>(
        `/instituciones/${auth.institucionId}/cajero/dashboard`
      );
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Hace unos segundos';
    if (minutes < 60) return `Hace ${minutes} min`;
    return `Hace ${Math.floor(minutes / 60)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={32} />
          <h1 className="text-3xl font-bold">Dashboard de Caja</h1>
        </div>
        <p className="text-green-100">Resumen de operaciones del día de hoy</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-lg"><Ticket size={24} className="text-green-600" /></div>
            <span className="text-2xl font-bold text-green-600">{data.ticketsValidados}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Tickets Validados</p>
          <p className="text-xs text-slate-500 mt-1">APP - Hoy</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-lg"><ShoppingCart size={24} className="text-blue-600" /></div>
            <span className="text-2xl font-bold text-blue-600">{data.ventasRealizadas}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Ventas Realizadas</p>
          <p className="text-xs text-slate-500 mt-1">POS - Hoy</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-3 rounded-lg"><DollarSign size={24} className="text-purple-600" /></div>
            <span className="text-2xl font-bold text-purple-600">S/. {data.ingresosPos.toFixed(2)}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Ingresos Caja</p>
          <p className="text-xs text-slate-500 mt-1">POS - Hoy</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-100 p-3 rounded-lg"><Users size={24} className="text-orange-600" /></div>
            <span className="text-2xl font-bold text-orange-600">{data.usuariosAtendidos}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Usuarios Atendidos</p>
          <p className="text-xs text-slate-500 mt-1">Únicos hoy</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">Actividad Reciente (Hoy)</h2>
            </div>
            <button onClick={fetchDashboardData} className="text-sm text-green-600 hover:text-green-700 font-medium">Actualizar</button>
          </div>
          <div className="divide-y divide-slate-100">
            {data.actividadReciente.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No hay actividad registrada aún el día de hoy.
              </div>
            ) : (
              data.actividadReciente.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activity.type === 'ticket' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {activity.type === 'ticket'
                        ? <Ticket size={18} className="text-green-600" />
                        : <ShoppingCart size={18} className="text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                      <p className="text-xs text-slate-500">{formatTime(activity.timestamp)}</p>
                    </div>
                  </div>
                  <div className="font-semibold text-slate-700">
                    S/. {activity.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900">Alertas de Stock</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.alertasStock.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Todos los productos tienen stock suficiente.
              </div>
            ) : (
              data.alertasStock.map((alerta, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                    <div className="flex-shrink-0 text-red-600">
                      <AlertCircle size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{alerta.nombre}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-600">Quedan {alerta.cantidad} (Umbral: {alerta.umbral})</p>
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">¡Bajo!</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/cajero/tickets"
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition"
          >
            <div className="bg-green-600 p-3 rounded-xl">
              <Ticket size={24} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-green-800">Validar Tickets APP</p>
          </Link>
          <Link
            href="/dashboard/cajero/pos"
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition"
          >
            <div className="bg-blue-600 p-3 rounded-xl">
              <ShoppingCart size={24} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-blue-800">Punto de Venta POS</p>
          </Link>
        </div>
      </div>

    </div>
  );
}