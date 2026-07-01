'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CajaPage() {
  const router = useRouter();
  const [turno, setTurno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [montoInicial, setMontoInicial] = useState('');
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [procesando, setProcesando] = useState(false);

  const fetchTurno = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) return;

      const res = await apiFetch<{ turno: any }>(`/instituciones/${auth.institucionId}/caja/turno-actual`);
      setTurno(res.turno);
    } catch (e: any) {
      setError(e.message || 'Error al verificar la caja');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurno();
  }, [fetchTurno]);

  const handleAbrir = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesando(true);
    setError(null);
    try {
      const auth = getAuth();
      await apiFetch(`/instituciones/${auth?.institucionId}/caja/abrir-turno`, {
        method: 'POST',
        body: JSON.stringify({ monto_inicial: parseFloat(montoInicial) || 0 })
      });
      fetchTurno();
    } catch (e: any) {
      setError(e.message);
      setProcesando(false);
    }
  };

  const handleCerrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turno) return;
    setProcesando(true);
    setError(null);
    try {
      const auth = getAuth();
      const res = await apiFetch<any>(`/instituciones/${auth?.institucionId}/caja/cerrar-turno`, {
        method: 'POST',
        body: JSON.stringify({ turno_id: turno.id, monto_declarado: parseFloat(montoDeclarado) || 0 })
      });
      alert(`Caja Cerrada.\nMonto Sistema: S/. ${res.monto_sistema}\nMonto Declarado: S/. ${res.monto_declarado}`);
      router.push('/dashboard/cajero');
    } catch (e: any) {
      setError(e.message);
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet size={32} className="text-purple-600" />
          <h1 className="text-3xl font-bold text-slate-900">Arqueo de Caja</h1>
        </div>
        <Link href="/cajero" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Volver
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!turno ? (
        // ABRIR CAJA
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-2">Apertura de Turno</h2>
          <p className="text-slate-500 text-sm mb-6">Debes abrir una caja para poder realizar ventas en el Punto de Venta (POS).</p>
          
          <form onSubmit={handleAbrir} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto Inicial (Sencillo en caja) S/.</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {procesando ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </form>
        </div>
      ) : (
        // CERRAR CAJA
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <CheckCircle size={20} />
            <h2 className="text-xl font-semibold text-slate-900">Caja Abierta</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Turno iniciado el: {new Date(turno.fecha_apertura).toLocaleString('es-PE')} <br/>
            Monto Inicial: S/. {parseFloat(turno.monto_inicial).toFixed(2)}
          </p>
          
          <form onSubmit={handleCerrar} className="space-y-4 border-t border-slate-100 pt-6">
            <h3 className="font-semibold text-slate-800">Cierre de Turno</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Efectivo en Caja S/.</label>
              <p className="text-xs text-slate-500 mb-2">Cuenta todo el dinero físico en tu cajón y decláralo aquí.</p>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={montoDeclarado}
                onChange={(e) => setMontoDeclarado(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-lg"
                placeholder="Ej. 150.50"
              />
            </div>
            <button
              type="submit"
              disabled={procesando || !montoDeclarado}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <LogOut size={20} />
              {procesando ? 'Cerrando...' : 'Declarar y Cerrar Caja'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
