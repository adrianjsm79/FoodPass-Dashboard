'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  X,
  RefreshCw,
  Ticket,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TicketAPI {
  id: string;
  codigo: string;
  estado: 'VIGENTE' | 'CANJEADO' | 'EXPIRADO';
  expira_en: string;
  canjeado_en: string | null;
  creado_en: string;
  nombre_usuario: string | null;
  nombre_producto: string;
  canal: 'APP' | 'POS';
}

type EstadoDisplay = 'Canjeado' | 'Vigente' | 'Expirado';

// ── Auth helper (same pattern as usuarios/page.tsx) ────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapEstado(estado: string): EstadoDisplay {
  switch (estado) {
    case 'CANJEADO': return 'Canjeado';
    case 'VIGENTE': return 'Vigente';
    case 'EXPIRADO': return 'Expirado';
    default: return 'Vigente';
  }
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  const hoy = new Date();
  const esHoy =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear();

  const hora = d.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (esHoy) return `Hoy ${hora}`;
  return `${d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} ${hora}`;
}

const getStatusColor = (estado: EstadoDisplay) => {
  switch (estado) {
    case 'Canjeado': return 'bg-green-50 text-green-700';
    case 'Vigente': return 'bg-blue-50 text-blue-700';
    case 'Expirado': return 'bg-red-50 text-red-700';
    default: return 'bg-slate-50 text-slate-700';
  }
};

const getStatusIcon = (estado: EstadoDisplay) => {
  switch (estado) {
    case 'Canjeado': return <CheckCircle2 size={14} />;
    case 'Vigente': return <Clock size={14} />;
    case 'Expirado': return <X size={14} />;
    default: return null;
  }
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function LatestTicketsTable() {
  const [tickets, setTickets] = useState<TicketAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) {
        setTickets([]);
        return;
      }
      const data = await apiFetch<TicketAPI[]>(
        `/instituciones/${auth.institucionId}/tickets?limit=10`
      );
      setTickets(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow-sm
        border border-slate-200
        overflow-hidden
      "
    >

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div
        className="
          p-4 sm:p-6
          border-b border-slate-100

          flex flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        "
      >

        <div className="min-w-0">

          <h2
            className="
              text-lg
              sm:text-xl
              font-bold
              text-slate-900
            "
          >
            Últimos Tickets Digitales
          </h2>

          <p
            className="
              text-xs
              sm:text-sm
              text-slate-500
              mt-1
              break-words
            "
          >
            Tickets generados desde compras digitales
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="
              flex items-center gap-1.5
              border border-slate-200
              px-3 py-2
              rounded-full
              text-xs font-semibold text-slate-600
              hover:bg-slate-50
              disabled:opacity-50
              transition
            "
            title="Recargar tickets"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Recargar</span>
          </button>

          {/* realtime indicator */}
          <div
            className="
              flex items-center gap-2
              bg-green-50
              border border-green-200
              px-3 py-2
              rounded-full
              w-fit
            "
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

            <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
              Tiempo real
            </span>
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* LOADING STATE */}
      {/* ========================= */}

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Cargando tickets…
        </div>
      )}

      {/* ========================= */}
      {/* ERROR STATE */}
      {/* ========================= */}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchTickets}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ========================= */}
      {/* EMPTY STATE */}
      {/* ========================= */}

      {!loading && !error && tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <Ticket size={48} strokeWidth={1.5} />
          <p className="text-sm font-medium">No hay tickets digitales</p>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            Los tickets se generarán automáticamente cuando los estudiantes realicen compras desde la app móvil.
          </p>
        </div>
      )}

      {/* ========================= */}
      {/* MOBILE CARDS */}
      {/* ========================= */}

      {!loading && !error && tickets.length > 0 && (
        <>
          <div className="block lg:hidden">

            <div className="divide-y divide-slate-100">

              {tickets.map((ticket) => {
                const estado = mapEstado(ticket.estado);
                return (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-slate-50 transition"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2 flex-wrap">

                          <p className="font-bold text-slate-900">
                            {ticket.codigo}
                          </p>

                          <span
                            className={`
                              inline-flex items-center justify-center
                              px-2.5 py-1
                              rounded-full
                              text-xs font-semibold

                              ${
                                ticket.canal ===
                                'APP'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-cyan-100 text-cyan-700'
                              }
                            `}
                          >
                            {ticket.canal}
                          </span>
                        </div>

                        <p className="text-sm text-slate-700 mt-2 font-medium">
                          {ticket.nombre_usuario || 'Anónimo'}
                        </p>

                        <p className="text-sm text-slate-500 mt-1 break-words">
                          {ticket.nombre_producto}
                        </p>

                        <div className="flex items-center justify-between mt-3 gap-3">

                          <span
                            className={`
                              inline-flex items-center gap-1.5
                              px-3 py-1
                              rounded-full
                              text-xs font-semibold

                              ${getStatusColor(estado)}
                            `}
                          >
                            {getStatusIcon(estado)}

                            {estado}
                          </span>

                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatFechaHora(ticket.creado_en)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================= */}
          {/* DESKTOP TABLE */}
          {/* ========================= */}

          <div className="hidden lg:block overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="text-left py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-wide">
                    Código
                  </th>

                  <th className="text-left py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-wide">
                    Usuario
                  </th>

                  <th className="text-left py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-wide">
                    Canal
                  </th>

                  <th className="text-left py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-wide">
                    Producto
                  </th>

                  <th className="text-left py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-wide">
                    Estado
                  </th>

                  <th className="text-left py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-wide">
                    Hora
                  </th>
                </tr>
              </thead>

              <tbody>

                {tickets.map((ticket) => {
                  const estado = mapEstado(ticket.estado);
                  return (
                    <tr
                      key={ticket.id}
                      className="
                        border-b border-slate-100
                        hover:bg-slate-50
                        transition
                      "
                    >

                      {/* codigo */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900">
                          {ticket.codigo}
                        </span>
                      </td>

                      {/* usuario */}
                      <td className="py-4 px-4 text-slate-700">
                        {ticket.nombre_usuario || 'Anónimo'}
                      </td>

                      {/* canal */}
                      <td className="py-4 px-4">

                        <span
                          className={`
                            inline-flex items-center justify-center
                            px-3 py-1
                            rounded-full
                            text-xs font-semibold

                            ${
                              ticket.canal ===
                              'APP'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-cyan-100 text-cyan-700'
                            }
                          `}
                        >
                          {ticket.canal}
                        </span>
                      </td>

                      {/* producto */}
                      <td className="py-4 px-4 text-slate-700">
                        {ticket.nombre_producto}
                      </td>

                      {/* estado */}
                      <td className="py-4 px-4">

                        <span
                          className={`
                            inline-flex items-center gap-1.5
                            px-3 py-1
                            rounded-full
                            text-xs font-semibold

                            ${getStatusColor(estado)}
                          `}
                        >
                          {getStatusIcon(estado)}

                          {estado}
                        </span>
                      </td>

                      {/* hora */}
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {formatFechaHora(ticket.creado_en)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}