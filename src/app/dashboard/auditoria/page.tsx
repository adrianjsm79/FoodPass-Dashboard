'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, Filter, ShoppingCart, Wallet, Users, Package, Ticket, CreditCard, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { io as socketIO, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace('/api', '');

interface AuditEntry {
  id: string;
  usuario_nombre: string;
  accion: string;
  categoria: string;
  descripcion: string;
  metadata: Record<string, any>;
  ip: string | null;
  creado_en: string;
}

const CATEGORIAS = ['TODAS', 'VENTAS', 'CAJA', 'USUARIOS', 'PRODUCTOS', 'POSTPAGO', 'TICKETS', 'AUTH'];

const CATEGORIA_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  VENTAS:    { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: <ShoppingCart size={14} /> },
  CAJA:      { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <Wallet size={14} /> },
  USUARIOS:  { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: <Users size={14} /> },
  PRODUCTOS: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <Package size={14} /> },
  POSTPAGO:  { color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  icon: <CreditCard size={14} /> },
  TICKETS:   { color: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200',   icon: <Ticket size={14} /> },
  AUTH:      { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    icon: <LogIn size={14} /> },
};

export default function AuditoriaPage() {
  const { auth } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [newCount, setNewCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const institutionId = auth?.instituciones?.[0]?.id;
  const token = auth?.accessToken;

  // Fetch inicial
  useEffect(() => {
    if (!institutionId || !token) return;
    fetchEntries();
  }, [institutionId, token]);

  // Socket.IO: escuchar nuevas entradas en tiempo real
  useEffect(() => {
    if (!institutionId) return;

    const socket = socketIO(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:institucion', institutionId);
    });

    socket.on('audit:nueva_entrada', (entrada: AuditEntry) => {
      // Solo agregar si coincide con el filtro actual (o sin filtro)
      if (categoriaFiltro === 'TODAS' || entrada.categoria === categoriaFiltro) {
        setEntries(prev => [entrada, ...prev]);
        setNewCount(c => c + 1);

        // Auto-limpiar el contador después de 3 segundos
        setTimeout(() => setNewCount(c => Math.max(0, c - 1)), 3000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [institutionId, categoriaFiltro]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoriaFiltro !== 'TODAS') params.append('categoria', categoriaFiltro);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      params.append('limite', '100');

      const url = `${API_BASE}/instituciones/${institutionId}/auditoria?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar auditoría');
      const data = await res.json();
      setEntries(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries();
  };

  const getConfig = (cat: string) => CATEGORIA_CONFIG[cat] || { color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: <Shield size={14} /> };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffMin < 1440) return `Hace ${Math.floor(diffMin / 60)}h`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-3 rounded-xl">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Log de Auditoría</h1>
            <p className="text-slate-500">Registro de acciones en tiempo real</p>
          </div>
        </div>
        {newCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            {newCount} nueva{newCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filtros de categoría (pills) */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategoriaFiltro(cat); setTimeout(fetchEntries, 50); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              categoriaFiltro === cat
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'TODAS' ? '🔍 Todas' : cat}
          </button>
        ))}
      </div>

      {/* Filtros de fecha */}
      <form onSubmit={handleFilter} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition border border-blue-200 w-full md:w-auto justify-center">
          <Filter size={18} />
          Filtrar
        </button>
      </form>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500">Cargando registros...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 text-lg">No hay registros de auditoría</p>
            <p className="text-slate-400 text-sm mt-1">Las acciones se mostrarán aquí en tiempo real</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry, i) => {
              const cfg = getConfig(entry.categoria);
              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${
                    i === 0 && newCount > 0 ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {/* Icono de categoría */}
                  <div className={`mt-1 flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${cfg.bg}`}>
                    <span className={cfg.color}>{cfg.icon}</span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{entry.usuario_nombre}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {entry.accion.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{entry.descripcion}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-slate-400">{formatTime(entry.creado_en)}</p>
                    {entry.ip && <p className="text-xs text-slate-300 mt-0.5">{entry.ip}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
