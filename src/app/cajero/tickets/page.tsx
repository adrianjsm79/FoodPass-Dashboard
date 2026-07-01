'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Ticket,
  QrCode,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketDetalle {
  id: string;
  codigo: string;
  estado: 'VIGENTE' | 'CANJEADO' | 'EXPIRADO';
  expira_en: string;
  canjeado_en: string | null;
  creado_en: string;
  nombre_usuario: string | null;
  nombre_producto: string;
  canal: 'APP' | 'POS';
  pedido_fecha?: string;
}

interface CanjeResult {
  ticket_id: string;
  codigo: string;
  estado: string;
  nombre_producto: string;
  nombre_usuario: string | null;
  canjeado_en: string;
}

interface ValidatedEntry {
  id: string;
  codigo: string;
  nombre_usuario: string | null;
  nombre_producto: string;
  validatedAt: Date;
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

function formatFechaCompleta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TicketsModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketDetalle | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [validationMessage, setValidationMessage] = useState<{ isValid: boolean; message: string } | null>(null);
  const [canjeLoading, setCanjeLoading] = useState(false);

  const [validatedTickets, setValidatedTickets] = useState<ValidatedEntry[]>([]);
  const [rejectedCount, setRejectedCount] = useState(0);

  const [showQRScanner, setShowQRScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Stats from real data ──
  const [totalToday, setTotalToday] = useState(0);
  const fetchTodayStats = useCallback(async () => {
    try {
      const institucionId = getInstitucionId();
      if (!institucionId) return;
      const today = new Date().toISOString().split('T')[0];
      const data = await apiFetch<TicketDetalle[]>(
        `/instituciones/${institucionId}/tickets?desde=${today}&limit=200`
      );
      setTotalToday(data.length);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchTodayStats();
  }, [fetchTodayStats]);

  const controlsRef = useRef<any>(null);
  const isProcessingScanRef = useRef(false);

  // ── Search ──
  const handleSearch = async (overrideCode?: string) => {
    const code = (overrideCode ?? searchQuery).trim().toUpperCase();
    if (!code) {
      toast.error('Ingresa un código');
      return;
    }

    setSearchLoading(true);
    setValidationMessage(null);
    setSelectedTicket(null);

    try {
      const institucionId = getInstitucionId();
      const ticket = await apiFetch<TicketDetalle>(
        `/instituciones/${institucionId}/tickets/buscar/${encodeURIComponent(code)}`
      );
      setSelectedTicket(ticket);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      toast.error(msg.includes('no encontrado') ? 'Ticket no encontrado' : msg);
      setSelectedTicket(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Validate & Canjear ──
  const handleValidateTicket = async () => {
    if (!selectedTicket) return;

    if (selectedTicket.estado === 'CANJEADO') {
      setValidationMessage({ isValid: false, message: '❌ Este ticket ya fue canjeado' });
      setRejectedCount((p) => p + 1);
      return;
    }

    if (selectedTicket.estado === 'EXPIRADO' || new Date(selectedTicket.expira_en) < new Date()) {
      setValidationMessage({ isValid: false, message: '⏰ Este ticket expiró' });
      setRejectedCount((p) => p + 1);
      return;
    }

    // Ticket is VIGENTE → canjear via API
    setCanjeLoading(true);
    try {
      const institucionId = getInstitucionId();
      const result = await apiFetch<CanjeResult>(
        `/instituciones/${institucionId}/tickets/${encodeURIComponent(selectedTicket.codigo)}/canjear`,
        { method: 'POST' }
      );

      setValidationMessage({ isValid: true, message: '✅ Ticket válido - Acceso permitido' });

      setValidatedTickets((prev) => [
        ...prev,
        {
          id: result.ticket_id,
          codigo: result.codigo,
          nombre_usuario: result.nombre_usuario,
          nombre_producto: result.nombre_producto,
          validatedAt: new Date(result.canjeado_en),
        },
      ]);

      setSelectedTicket((prev) =>
        prev ? { ...prev, estado: 'CANJEADO', canjeado_en: result.canjeado_en } : prev
      );

      toast.success('Ticket validado correctamente');

      setTimeout(() => {
        setSelectedTicket(null);
        setValidationMessage(null);
        setSearchQuery('');
      }, 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al canjear';
      setValidationMessage({ isValid: false, message: `❌ ${msg}` });
      setRejectedCount((p) => p + 1);
    } finally {
      setCanjeLoading(false);
    }
  };

  // ── QR Scanner ──
  const startQRScanner = async () => {
    setShowQRScanner(true);
    isProcessingScanRef.current = false;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const codeReader = new BrowserMultiFormatReader();
      
      // Wait slightly for the video element to be mounted in the DOM
      setTimeout(async () => {
        if (!videoRef.current) return;
        try {
          controlsRef.current = await codeReader.decodeFromVideoDevice(
            undefined, // undefined picks the default back camera on mobile
            videoRef.current,
            (result, err) => {
              if (result && !isProcessingScanRef.current) {
                isProcessingScanRef.current = true;
                const text = result.getText();
                setSearchQuery(text);
                toast.success('Código escaneado');
                stopQRScanner();
                handleSearch(text).finally(() => {
                  isProcessingScanRef.current = false;
                });
              }
            }
          );
        } catch (e) {
          toast.error('Error al inicializar la cámara');
          setShowQRScanner(false);
        }
      }, 150);
    } catch {
      toast.error('No se pudo cargar el escáner');
      setShowQRScanner(false);
    }
  };

  const stopQRScanner = () => {
    setShowQRScanner(false);
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  };

  // ── Status badge ──
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIGENTE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <Clock size={14} />
            Vigente
          </span>
        );
      case 'CANJEADO':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            <CheckCircle size={14} />
            Canjeado
          </span>
        );
      case 'EXPIRADO':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <AlertCircle size={14} />
            Expirado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* ============================= */}
      {/* HEADER */}
      {/* ============================= */}

      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Ticket size={30} />
          <h1 className="text-2xl md:text-3xl font-bold">
            Validación de Tickets
          </h1>
        </div>
        <p className="text-green-100 text-sm md:text-base">
          Valida tickets digitales generados desde la App Móvil
        </p>
      </div>

      {/* ============================= */}
      {/* GRID */}
      {/* ============================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ============================= */}
        {/* IZQUIERDA */}
        {/* ============================= */}

        <div className="xl:col-span-2 space-y-6">

          {/* ============================= */}
          {/* BUSCADOR */}
          {/* ============================= */}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">

            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Buscar Ticket
            </h2>

            <div className="space-y-4">

              {/* INPUT + BUTTON */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Código del ticket (FP-XXXX-XXXX)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    className="
                      w-full
                      pl-10 pr-4 py-3
                      border border-slate-300
                      rounded-xl
                      bg-white
                      text-slate-900
                      placeholder:text-slate-400
                      focus:outline-none
                      focus:ring-2
                      focus:ring-green-500
                    "
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="
                    w-full sm:w-auto
                    px-6 py-3
                    bg-green-600
                    hover:bg-green-700
                    disabled:opacity-60
                    text-white
                    rounded-xl
                    font-medium
                    transition
                    flex items-center justify-center gap-2
                  "
                >
                  {searchLoading && <Loader2 size={16} className="animate-spin" />}
                  Buscar
                </button>
              </div>

              {/* QR */}
              {!showQRScanner ? (
                <button
                  onClick={startQRScanner}
                  className="
                    w-full
                    flex items-center justify-center gap-2
                    px-4 py-3
                    border-2 border-dashed border-green-300
                    rounded-xl
                    text-green-600
                    hover:bg-green-50
                    transition
                  "
                >
                  <QrCode size={20} />
                  Escanear QR
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="aspect-square max-w-sm mx-auto bg-slate-900 rounded-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={stopQRScanner}
                    className="
                      w-full
                      py-3
                      bg-red-600
                      hover:bg-red-700
                      text-white
                      rounded-xl
                      font-medium
                      transition
                    "
                  >
                    Cerrar Scanner
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ============================= */}
          {/* TICKET */}
          {/* ============================= */}

          {selectedTicket && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">

              <h2 className="text-lg font-semibold text-slate-900 mb-5">
                Información del Ticket
              </h2>

              <div className="space-y-5">

                {/* ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Código
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1 break-all">
                      {selectedTicket.codigo}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Estado
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(selectedTicket.estado)}
                    </div>
                  </div>
                </div>

                {/* CLIENTE */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <User size={14} />
                    Cliente
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {selectedTicket.nombre_usuario ?? 'Anónimo'}
                  </p>
                </div>

                {/* PRODUCTO */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Producto
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {selectedTicket.nombre_producto}
                  </p>
                </div>

                {/* FECHAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Calendar size={14} />
                      Creado
                    </p>
                    <p className="text-sm text-slate-900 mt-1">
                      {formatFechaCompleta(selectedTicket.creado_en)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Clock size={14} />
                      Expira
                    </p>
                    <p className="text-sm text-slate-900 mt-1">
                      {formatFechaCompleta(selectedTicket.expira_en)}
                    </p>
                  </div>
                </div>

                {/* RESULTADO */}
                {validationMessage && (
                  <div
                    className={`
                      p-4 rounded-xl border
                      ${
                        validationMessage.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }
                    `}
                  >
                    <p
                      className={`
                        text-center font-bold text-lg
                        ${
                          validationMessage.isValid
                            ? 'text-green-700'
                            : 'text-red-700'
                        }
                      `}
                    >
                      {validationMessage.message}
                    </p>
                  </div>
                )}

                {/* BUTTON */}
                <button
                  onClick={handleValidateTicket}
                  disabled={validationMessage?.isValid === true || canjeLoading}
                  className={`
                    w-full
                    py-3
                    rounded-xl
                    font-bold
                    text-white
                    transition
                    flex items-center justify-center gap-2

                    ${
                      validationMessage?.isValid === true
                        ? 'bg-green-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }
                    disabled:opacity-70
                  `}
                >
                  {canjeLoading && <Loader2 size={16} className="animate-spin" />}
                  {validationMessage?.isValid === true
                    ? '✓ Acceso Permitido'
                    : canjeLoading
                    ? 'Validando…'
                    : 'Validar Ticket'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================= */}
        {/* DERECHA */}
        {/* ============================= */}

        <div className="space-y-6">

          {/* ESTADISTICAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">

            <h2 className="text-lg font-semibold text-slate-900 mb-5">
              Resumen del Día
            </h2>

            <div className="space-y-4">

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">
                  Validados (sesión)
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {validatedTickets.length}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">
                  Rechazados (sesión)
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {rejectedCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  Tasa Éxito
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {(validatedTickets.length + rejectedCount) > 0
                    ? Math.round(
                        (validatedTickets.length /
                          (validatedTickets.length + rejectedCount)) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* HISTORIAL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Historial Hoy
              </h2>
            </div>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">

              {validatedTickets.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Sin validaciones aún
                </div>
              ) : (
                validatedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-slate-50 transition"
                  >
                    <p className="font-medium text-slate-900 text-sm">
                      {ticket.nombre_usuario ?? 'Anónimo'}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {ticket.codigo} •{' '}
                      {ticket.nombre_producto}
                    </p>

                    <p className="text-xs text-green-600 mt-1">
                      ✓{' '}
                      {ticket.validatedAt.toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}