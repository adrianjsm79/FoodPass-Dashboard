'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Hash,
  User,
  Calendar,
  Smartphone,
  ChevronDown,
  CircleCheck,
  Ticket,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = 'VIGENTE' | 'CANJEADO' | 'EXPIRADO';
type Canal = 'APP' | 'POS';

interface TicketAPI {
  id: string;
  codigo: string;
  estado: TicketStatus;
  expira_en: string;
  canjeado_en: string | null;
  creado_en: string;
  nombre_usuario: string | null;
  nombre_producto: string;
  canal: Canal;
}

interface TicketDetalle extends TicketAPI {
  pedido_fecha?: string;
  historial?: HistorialEntry[];
}

interface HistorialEntry {
  id: string;
  estado_anterior: string;
  estado_nuevo: string;
  cambiado_por_nombre: string | null;
  motivo: string | null;
  creado_en: string;
}

interface CanjeResult {
  ticket_id: string;
  codigo: string;
  estado: string;
  nombre_producto: string;
  nombre_usuario: string | null;
  canjeado_en: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error('No hay sesión activa');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? body?.mensaje ?? body?.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

function getInstitucionId(): string {
  return getAuth()?.institucionId ?? '';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFechaCorta(iso: string): string {
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

  if (esHoy) return hora;
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatFechaCompleta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }) + ' ' + d.toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const config = {
    VIGENTE:  { label: 'Vigente',  bg: 'bg-blue-50',  text: 'text-blue-600',  icon: <Clock size={11} /> },
    CANJEADO: { label: 'Canjeado', bg: 'bg-green-50', text: 'text-green-600', icon: <CheckCircle size={11} /> },
    EXPIRADO: { label: 'Expirado', bg: 'bg-red-50',   text: 'text-red-500',   icon: <XCircle size={11} /> },
  }[status];

  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function CanalBadge({ canal }: { canal: Canal }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
        canal === 'APP'
          ? 'bg-purple-50 text-purple-600 border-purple-100'
          : 'bg-teal-50 text-teal-600 border-teal-100'
      }`}
    >
      <Smartphone size={10} />
      {canal}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent: 'default' | 'blue' | 'green' | 'red';
}) {
  const textColor = {
    default: 'text-slate-800',
    blue:    'text-blue-500',
    green:   'text-green-600',
    red:     'text-red-500',
  }[accent];

  const bgColor = {
    default: '',
    blue:    'bg-blue-50/50',
    green:   'bg-green-50/50',
    red:     'bg-red-50/50',
  }[accent];

  return (
    <div className={`border border-slate-200 rounded-xl p-4 bg-white ${bgColor}`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  // ── State ──
  const [tickets, setTickets] = useState<TicketAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchCode, setSearchCode] = useState('');
  const [foundTicket, setFoundTicket] = useState<TicketDetalle | null | undefined>(undefined);
  const [searchLoading, setSearchLoading] = useState(false);
  const [canjeSuccess, setCanjeSuccess] = useState(false);
  const [canjeLoading, setCanjeLoading] = useState(false);

  const [monitorSearch, setMonitorSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | TicketStatus>('todos');

  const [historial, setHistorial] = useState<Array<{
    codigo: string;
    to: string;
    hora: string;
    actor: string;
  }>>([]);

  // ── Fetch tickets ──
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const institucionId = getInstitucionId();
      if (!institucionId) {
        setTickets([]);
        return;
      }
      const data = await apiFetch<TicketAPI[]>(
        `/instituciones/${institucionId}/tickets?limit=50`
      );
      setTickets(data);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Stats ──
  const total    = tickets.length;
  const vigente  = tickets.filter((t) => t.estado === 'VIGENTE').length;
  const canjeado = tickets.filter((t) => t.estado === 'CANJEADO').length;
  const expirado = tickets.filter((t) => t.estado === 'EXPIRADO').length;

  // ── Search ticket by code ──
  const handleBuscar = async () => {
    const code = searchCode.trim().toUpperCase();
    if (!code) return;

    setSearchLoading(true);
    setCanjeSuccess(false);
    setFoundTicket(undefined);

    try {
      const institucionId = getInstitucionId();
      const ticket = await apiFetch<TicketDetalle>(
        `/instituciones/${institucionId}/tickets/buscar/${encodeURIComponent(code)}`
      );
      setFoundTicket(ticket);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      if (msg.includes('no encontrado') || msg.includes('404')) {
        setFoundTicket(null);
      } else {
        setFoundTicket(null);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Canjear ticket ──
  const handleCanjear = async (codigo: string) => {
    setCanjeLoading(true);
    try {
      const institucionId = getInstitucionId();
      const result = await apiFetch<CanjeResult>(
        `/instituciones/${institucionId}/tickets/${encodeURIComponent(codigo)}/canjear`,
        { method: 'POST' }
      );

      // Update local state
      setTickets((prev) =>
        prev.map((t) =>
          t.codigo === codigo
            ? { ...t, estado: 'CANJEADO' as TicketStatus, canjeado_en: result.canjeado_en }
            : t
        )
      );

      // Update found ticket if it matches
      if (foundTicket?.codigo === codigo) {
        setFoundTicket((prev) =>
          prev ? { ...prev, estado: 'CANJEADO' as TicketStatus, canjeado_en: result.canjeado_en } : prev
        );
        setCanjeSuccess(true);
      }

      // Add to local historial
      const now = new Date();
      const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
      setHistorial((prev) => [
        { codigo, to: 'CANJEADO', hora, actor: 'Cajero' },
        ...prev,
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al canjear';
      alert(msg);
    } finally {
      setCanjeLoading(false);
    }
  };

  // ── Filter for monitor ──
  const filteredMonitor = tickets.filter((t) => {
    const matchStatus = statusFilter === 'todos' || t.estado === statusFilter;
    const q = monitorSearch.toLowerCase();
    const matchSearch =
      !q ||
      t.codigo.toLowerCase().includes(q) ||
      (t.nombre_usuario ?? '').toLowerCase().includes(q) ||
      t.nombre_producto.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando tickets…
      </div>
    );
  }

  // ── Error state ──
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
        <p className="text-sm text-red-500">{fetchError}</p>
        <button
          onClick={fetchTickets}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Tickets" value={total}    sub="en la institución" accent="default" />
        <StatCard label="Vigente"        value={vigente}  sub="pendientes de canje" accent="blue"    />
        <StatCard label="Canjeado"       value={canjeado} sub="canjeados"            accent="green"   />
        <StatCard label="Expirado"       value={expirado} sub="vencidos sin canje"   accent="red"     />
      </div>

      {/* Validar ticket */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-0.5">
          <RefreshCw size={15} className="text-green-500" />
          <h2 className="text-sm font-semibold text-slate-800">Validar Ticket</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">Escanea o ingresa el código</p>

        <p className="text-xs text-slate-500 mb-1.5">tickets.codigo</p>
        <div className="flex flex-col sm:flex-row gap-2 mb-1.5">
          <div className="flex-1 relative">
            <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="FP-XXXX-XXXX"
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={searchLoading}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {searchLoading && <Loader2 size={14} className="animate-spin" />}
            Buscar
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Ingresa el código del ticket generado desde la App Móvil
        </p>

        {/* Success banner */}
        {canjeSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-3 text-sm text-green-700">
            <CircleCheck size={14} />
            ¡Ticket canjeado exitosamente! Se registró en historial_estado_ticket.
          </div>
        )}

        {/* Not found */}
        {foundTicket === null && (
          <p className="text-xs text-red-500">No se encontró un ticket con ese código en esta institución.</p>
        )}

        {/* Ticket card */}
        {foundTicket && typeof foundTicket === 'object' && 'codigo' in foundTicket && (
          <div
            className={`border rounded-xl p-4 ${
              foundTicket.estado === 'CANJEADO'
                ? 'bg-green-50 border-green-200'
                : foundTicket.estado === 'EXPIRADO'
                ? 'bg-red-50 border-red-100'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <StatusBadge status={foundTicket.estado} />
              <span className="text-xs font-mono text-slate-400">{foundTicket.codigo}</span>
            </div>

            <div className="space-y-2 mb-4">
              {[
                { icon: <User size={12} />,       label: 'Usuario',  value: foundTicket.nombre_usuario ?? 'Anónimo' },
                { icon: <Hash size={12} />,       label: 'Producto', value: foundTicket.nombre_producto },
                { icon: <Calendar size={12} />,   label: 'Expira',   value: formatFechaCompleta(foundTicket.expira_en) },
                { icon: <Smartphone size={12} />, label: 'Canal',    value: foundTicket.canal },
                ...(foundTicket.canjeado_en
                  ? [{ icon: <User size={12} />, label: 'Canjeado', value: formatFechaCompleta(foundTicket.canjeado_en) }]
                  : []),
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-400 text-xs w-24 pt-0.5">
                    {icon} {label}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            {foundTicket.estado === 'VIGENTE' && (
              <button
                onClick={() => handleCanjear(foundTicket.codigo)}
                disabled={canjeLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {canjeLoading ? <Loader2 size={15} className="animate-spin" /> : <CircleCheck size={15} />}
                {canjeLoading ? 'Canjeando…' : 'Canjear Ticket'}
              </button>
            )}

            {foundTicket.estado === 'CANJEADO' && foundTicket.canjeado_en && (
              <p className="text-xs text-green-600 flex items-center gap-1.5">
                <CircleCheck size={12} />
                Canjeado el {formatFechaCompleta(foundTicket.canjeado_en)}
              </p>
            )}

            {foundTicket.estado === 'EXPIRADO' && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <XCircle size={12} />
                Ticket expirado — no se puede canjear
              </p>
            )}
          </div>
        )}
      </div>

      {/* Historial reciente (local session) */}
      {historial.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 sm:px-5 py-4">
          <div className="space-y-2">
            {historial.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    entry.to === 'CANJEADO' ? 'bg-green-500' : 'bg-red-400'
                  }`}
                />
                <span className="font-mono text-slate-500">{entry.codigo}</span>
                <span className="text-slate-300">·</span>
                <span
                  className={`font-semibold uppercase tracking-wide ${
                    entry.to === 'CANJEADO' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {entry.to}
                </span>
                <span className="text-slate-400 ml-auto whitespace-nowrap">
                  {entry.hora} · {entry.actor}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitor de tickets */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Monitor de Tickets</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              tickets JOIN items_pedido JOIN pedidos JOIN usuarios
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Código, usuario o producto..."
                value={monitorSearch}
                onChange={(e) => setMonitorSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-52"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="border border-slate-200 rounded-lg text-xs text-slate-600 pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="VIGENTE">Vigente</option>
                <option value="CANJEADO">Canjeado</option>
                <option value="EXPIRADO">Expirado</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={() => { fetchTickets(); setMonitorSearch(''); setStatusFilter('todos'); }}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
              title="Recargar"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Ticket size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">No hay tickets digitales</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Los tickets se generarán automáticamente cuando los estudiantes realicen compras desde la app móvil.
            </p>
          </div>
        )}

        {/* Table */}
        {tickets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '640px' }}>
              <thead>
                <tr className="border-b border-slate-100">
                  {['Código', 'Usuario', 'Canal', 'Producto', 'Expira', 'Estado', 'Acción'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-slate-400 pb-2 pr-3 last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMonitor.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-3 text-xs font-mono text-slate-500">{ticket.codigo}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-700">
                      {ticket.nombre_usuario ?? <span className="text-slate-400 italic">Anónimo</span>}
                    </td>
                    <td className="py-2.5 pr-3">
                      <CanalBadge canal={ticket.canal} />
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-700">{ticket.nombre_producto}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{formatFechaCorta(ticket.expira_en)}</td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={ticket.estado} />
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        {ticket.estado === 'VIGENTE' && (
                          <button
                            onClick={() => handleCanjear(ticket.codigo)}
                            disabled={canjeLoading}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                          >
                            Canjear
                          </button>
                        )}
                        <button className="p-1 border border-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
                          <ChevronDown size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tickets.length > 0 && filteredMonitor.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">No se encontraron tickets con esos filtros.</p>
        )}
      </div>
    </div>
  );
}