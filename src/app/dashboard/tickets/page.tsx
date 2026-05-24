'use client';

import { useState } from 'react';
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
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = 'vigente' | 'canjeado' | 'expirado';
type Canal = 'APP' | 'POS';

interface Ticket {
  codigo: string;
  usuario: string | null;
  producto: string;
  expira: string;
  canal: Canal;
  estado: TicketStatus;
  canjeadoPor?: string;
  canjeadoEn?: string;
}

interface HistorialEntry {
  codigo: string;
  to: TicketStatus;
  hora: string;
  actor: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_TICKETS: Ticket[] = [
  { codigo: 'FP-8841', usuario: 'Ana Torres',    producto: 'Menú del Día',     expira: '12:47',            canal: 'APP', estado: 'canjeado', canjeadoPor: 'Ana Cajero', canjeadoEn: '12:47' },
  { codigo: 'FP-8840', usuario: 'Carlos Ríos',   producto: 'Menú del Día',     expira: '2025-04-29',       canal: 'APP', estado: 'vigente' },
  { codigo: 'FP-8839', usuario: null,             producto: 'Menú del Día',     expira: '12:43',            canal: 'POS', estado: 'canjeado', canjeadoPor: 'Sistema',    canjeadoEn: '12:43' },
  { codigo: 'FP-8838', usuario: 'María López',   producto: 'Menú del Día',     expira: '2025-04-29 11:00', canal: 'APP', estado: 'canjeado', canjeadoPor: 'Ana Cajero', canjeadoEn: '2025-04-27 11:12 p. m.' },
  { codigo: 'FP-8837', usuario: 'Luis Vera',     producto: 'Menú Vegetariano', expira: '2025-04-27',       canal: 'APP', estado: 'expirado' },
  { codigo: 'FP-8836', usuario: 'Sofía Díaz',    producto: 'Menú del Día',     expira: '08:22',            canal: 'APP', estado: 'canjeado', canjeadoPor: 'Ana Cajero', canjeadoEn: '08:22' },
  { codigo: 'FP-8835', usuario: null,             producto: 'Menú del Día',     expira: '07:55',            canal: 'POS', estado: 'canjeado', canjeadoPor: 'Sistema',    canjeadoEn: '07:55' },
  { codigo: 'FP-8834', usuario: 'Pedro Castro',  producto: 'Pollo a la Brasa', expira: '2025-04-29',       canal: 'APP', estado: 'vigente' },
  { codigo: 'FP-8833', usuario: 'Lucía Ramos',   producto: 'Menú del Día',     expira: '2025-04-29',       canal: 'APP', estado: 'vigente' },
  { codigo: 'FP-8832', usuario: 'Jorge Mendoza', producto: 'Menú Vegetariano', expira: '2025-04-26',       canal: 'APP', estado: 'expirado' },
];

const INITIAL_HISTORIAL: HistorialEntry[] = [
  { codigo: 'FP-8837', to: 'expirado', hora: '08:00', actor: 'Sistema' },
  { codigo: 'FP-8836', to: 'canjeado', hora: '08:22', actor: 'Ana Cajero' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const config = {
    vigente:  { label: 'Vigente',  bg: 'bg-blue-50',  text: 'text-blue-600',  icon: <Clock size={11} /> },
    canjeado: { label: 'Canjeado', bg: 'bg-green-50', text: 'text-green-600', icon: <CheckCircle size={11} /> },
    expirado: { label: 'Expirado', bg: 'bg-red-50',   text: 'text-red-500',   icon: <XCircle size={11} /> },
  }[status];

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
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [historial, setHistorial] = useState<HistorialEntry[]>(INITIAL_HISTORIAL);

  const [searchCode, setSearchCode] = useState('');
  const [foundTicket, setFoundTicket] = useState<Ticket | null | undefined>(undefined);
  const [canjeSuccess, setCanjeSuccess] = useState(false);

  const [monitorSearch, setMonitorSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | TicketStatus>('todos');

  const total    = tickets.length;
  const vigente  = tickets.filter((t) => t.estado === 'vigente').length;
  const canjeado = tickets.filter((t) => t.estado === 'canjeado').length;
  const expirado = tickets.filter((t) => t.estado === 'expirado').length;

  const handleBuscar = () => {
    const t = tickets.find((t) => t.codigo === searchCode.trim().toUpperCase());
    setFoundTicket(t ?? null);
    setCanjeSuccess(false);
  };

  const handleCanjear = (codigo: string) => {
    const now = new Date();
    const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const full =
      now.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' +
      hora +
      ' p. m.';

    setTickets((prev) =>
      prev.map((t) =>
        t.codigo === codigo
          ? { ...t, estado: 'canjeado', canjeadoPor: 'Ana Cajero', canjeadoEn: full }
          : t
      )
    );

    setHistorial((prev) => [
      { codigo, to: 'canjeado', hora, actor: 'Ana Cajero' },
      ...prev,
    ]);

    if (foundTicket?.codigo === codigo) {
      setFoundTicket((prev) =>
        prev ? { ...prev, estado: 'canjeado', canjeadoPor: 'Ana Cajero', canjeadoEn: full } : prev
      );
      setCanjeSuccess(true);
    }
  };

  const filteredMonitor = tickets.filter((t) => {
    const matchStatus = statusFilter === 'todos' || t.estado === statusFilter;
    const q = monitorSearch.toLowerCase();
    const matchSearch =
      !q ||
      t.codigo.toLowerCase().includes(q) ||
      (t.usuario ?? '').toLowerCase().includes(q) ||
      t.producto.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={total}    sub="tickets hoy"         accent="default" />
        <StatCard label="Vigente"        value={vigente}  sub="pendientes de canje" accent="blue"    />
        <StatCard label="Canjeado"       value={canjeado} sub="canjeados hoy"       accent="green"   />
        <StatCard label="Expirado"       value={expirado} sub="vencidos sin canje"  accent="red"     />
      </div>

      {/* Validar ticket */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-0.5">
          <RefreshCw size={15} className="text-green-500" />
          <h2 className="text-sm font-semibold text-slate-800">Validar Ticket</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">Escanea o ingresa el código</p>

        <p className="text-xs text-slate-500 mb-1.5">tickets.codigo</p>
        <div className="flex gap-2 mb-1.5">
          <div className="flex-1 relative">
            <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="FP-0000"
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleBuscar}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 rounded-lg transition-colors"
          >
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
          <p className="text-xs text-red-500">No se encontró un ticket con ese código.</p>
        )}

        {/* Ticket card */}
        {foundTicket && (
          <div
            className={`border rounded-xl p-4 ${
              foundTicket.estado === 'canjeado'
                ? 'bg-green-50 border-green-200'
                : foundTicket.estado === 'expirado'
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
                { icon: <User size={12} />,      label: 'Usuario',      value: foundTicket.usuario ?? 'Anónimo' },
                { icon: <Hash size={12} />,      label: 'Producto',     value: foundTicket.producto },
                { icon: <Calendar size={12} />,  label: 'Expira',       value: foundTicket.expira },
                { icon: <Smartphone size={12} />,label: 'Canal',        value: foundTicket.canal },
                ...(foundTicket.canjeadoPor
                  ? [{ icon: <User size={12} />, label: 'Canjeado por', value: `${foundTicket.canjeadoPor} · ${foundTicket.canjeadoEn}` }]
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

            {foundTicket.estado === 'vigente' && (
              <button
                onClick={() => handleCanjear(foundTicket.codigo)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <CircleCheck size={15} />
                Canjear Ticket
              </button>
            )}

            {foundTicket.estado === 'canjeado' && foundTicket.canjeadoPor && (
              <p className="text-xs text-green-600 flex items-center gap-1.5">
                <CircleCheck size={12} />
                Canjeado el {foundTicket.canjeadoEn} por {foundTicket.canjeadoPor}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Historial reciente */}
      {historial.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
          <div className="space-y-2">
            {historial.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    entry.to === 'canjeado' ? 'bg-green-500' : 'bg-red-400'
                  }`}
                />
                <span className="font-mono text-slate-500">{entry.codigo}</span>
                <span className="text-slate-300">·</span>
                <span
                  className={`font-semibold uppercase tracking-wide ${
                    entry.to === 'canjeado' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {entry.to}
                </span>
                <span className="text-slate-400 ml-auto">
                  {entry.hora} · {entry.actor}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitor de tickets */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Monitor de Tickets</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              tickets JOIN items_pedido JOIN pedidos JOIN usuarios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Código, usuario o producto..."
                value={monitorSearch}
                onChange={(e) => setMonitorSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 w-52"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="border border-slate-200 rounded-lg text-xs text-slate-600 pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="vigente">Vigente</option>
                <option value="canjeado">Canjeado</option>
                <option value="expirado">Expirado</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={() => { setMonitorSearch(''); setStatusFilter('todos'); }}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <table className="w-full">
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
              <tr key={ticket.codigo} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2.5 pr-3 text-xs font-mono text-slate-500">{ticket.codigo}</td>
                <td className="py-2.5 pr-3 text-xs text-slate-700">
                  {ticket.usuario ?? <span className="text-slate-400 italic">Anónimo</span>}
                </td>
                <td className="py-2.5 pr-3">
                  <CanalBadge canal={ticket.canal} />
                </td>
                <td className="py-2.5 pr-3 text-xs text-slate-700">{ticket.producto}</td>
                <td className="py-2.5 pr-3 text-xs text-slate-500">{ticket.expira}</td>
                <td className="py-2.5 pr-3">
                  <StatusBadge status={ticket.estado} />
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1">
                    {ticket.estado === 'vigente' && (
                      <button
                        onClick={() => handleCanjear(ticket.codigo)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
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

        {filteredMonitor.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">No se encontraron tickets.</p>
        )}
      </div>
    </div>
  );
}