'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, XCircle, ShoppingCart, Ticket } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getAuth() {
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

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error('No hay sesión activa');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? body?.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

interface Actividad {
  id: string;
  type: 'ticket' | 'sale';
  description: string;
  amount: number;
  timestamp: string;
  usuario: string;
  estado: string;
}

export default function HistorialPage() {
  const [historial, setHistorial] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) return;

      const res = await apiFetch<Actividad[]>(`/instituciones/${auth.institucionId}/cajero/historial`);
      setHistorial(res);
    } catch (e: any) {
      setError(e.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const handleAnular = async (pedidoId: string) => {
    if (!confirm('¿Estás seguro de que deseas anular esta venta? El dinero deberá ser devuelto y el stock se restaurará automáticamente.')) {
      return;
    }
    
    try {
      const auth = getAuth();
      await apiFetch(`/instituciones/${auth?.institucionId}/cajero/anular/${pedidoId}`, {
        method: 'POST'
      });
      alert('Venta anulada correctamente');
      fetchHistorial();
    } catch (e: any) {
      alert(`Error al anular: ${e.message}`);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History size={32} className="text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-900">Historial del Día</h1>
        </div>
        <Link href="/dashboard/cajero" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Volver
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Hora</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Monto</th>
                <th className="px-6 py-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No hay transacciones registradas hoy.
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id} className={item.estado === 'CANCELADO' ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50 transition'}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatTime(item.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'ticket' ? <Ticket size={16} className="text-green-600"/> : <ShoppingCart size={16} className="text-blue-600"/>}
                        <span>{item.description}</span>
                        {item.estado === 'CANCELADO' && (
                          <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full uppercase ml-2">Anulado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{item.usuario}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      S/. {item.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.type === 'sale' && item.estado === 'PAGADO' && (
                        <button 
                          onClick={() => handleAnular(item.id)}
                          className="text-red-500 hover:text-red-700 flex items-center justify-end gap-1 ml-auto"
                          title="Anular venta y restaurar stock"
                        >
                          <XCircle size={18} />
                          <span className="text-xs font-medium">Anular</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
