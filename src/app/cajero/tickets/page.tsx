'use client';

import { useState, useRef } from 'react';
import {
  Ticket,
  QrCode,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface ValidatedTicket {
  id: string;
  code: string;
  userName: string;
  menuType: string;
  status: 'active' | 'used' | 'expired';
  purchaseDate: Date;
  expirationDate: Date;
  validatedAt?: Date;
}

interface ValidationResult {
  ticket: ValidatedTicket;
  isValid: boolean;
  message: string;
}

export default function TicketsModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] =
    useState<ValidatedTicket | null>(null);

  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const [validatedTickets, setValidatedTickets] = useState<
    ValidatedTicket[]
  >([]);

  const [showQRScanner, setShowQRScanner] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const mockTickets: ValidatedTicket[] = [
    {
      id: '1',
      code: 'TKT-2026-001',
      userName: 'Juan Pérez',
      menuType: 'Menú Ejecutivo',
      status: 'active',
      purchaseDate: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ),
      expirationDate: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000
      ),
    },
    {
      id: '2',
      code: 'TKT-2026-002',
      userName: 'María García',
      menuType: 'Menú Estándar',
      status: 'used',
      purchaseDate: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000
      ),
      expirationDate: new Date(
        Date.now() + 6 * 24 * 60 * 60 * 1000
      ),
      validatedAt: new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ),
    },
    {
      id: '3',
      code: 'TKT-2026-003',
      userName: 'Carlos López',
      menuType: 'Snack Pack',
      status: 'expired',
      purchaseDate: new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000
      ),
      expirationDate: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ),
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Ingresa un código o nombre');
      return;
    }

    const found = mockTickets.find(
      (t) =>
        t.code
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        t.userName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );

    if (found) {
      setSelectedTicket(found);
      setValidationResult(null);
    } else {
      toast.error('Ticket no encontrado');
      setSelectedTicket(null);
    }
  };

  const handleValidateTicket = () => {
    if (!selectedTicket) return;

    const now = new Date();

    let isValid = true;
    let message = '';

    if (selectedTicket.status === 'used') {
      isValid = false;
      message = '❌ Este ticket ya fue utilizado';
    } else if (
      selectedTicket.status === 'expired'
    ) {
      isValid = false;
      message = '⏰ Este ticket expiró';
    } else if (
      selectedTicket.expirationDate < now
    ) {
      isValid = false;
      message = '⏰ Este ticket expiró';
    } else {
      isValid = true;
      message =
        '✅ Ticket válido - Acceso permitido';
    }

    setValidationResult({
      ticket: selectedTicket,
      isValid,
      message,
    });

    if (isValid) {
      const updatedTicket = {
        ...selectedTicket,
        status: 'used' as const,
        validatedAt: new Date(),
      };

      setValidatedTickets([
        ...validatedTickets,
        updatedTicket,
      ]);

      toast.success(
        'Ticket validado correctamente'
      );

      setTimeout(() => {
        setSelectedTicket(null);
        setValidationResult(null);
        setSearchQuery('');
      }, 2000);
    }
  };

  const startQRScanner = async () => {
    setShowQRScanner(true);

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
        });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toast.error(
        'No se pudo acceder a la cámara'
      );
      setShowQRScanner(false);
    }
  };

  const stopQRScanner = () => {
    setShowQRScanner(false);

    if (
      videoRef.current &&
      videoRef.current.srcObject
    ) {
      const tracks = (
        videoRef.current
          .srcObject as MediaStream
      ).getTracks();

      tracks.forEach((track) =>
        track.stop()
      );
    }
  };

  const getStatusBadge = (
    status: string
  ) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <CheckCircle size={14} />
            Activo
          </span>
        );

      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            <CheckCircle size={14} />
            Usado
          </span>
        );

      case 'expired':
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
          Valida tickets digitales y controla el acceso
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
                    placeholder="Código o nombre..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
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
                  className="
                    w-full sm:w-auto
                    px-6 py-3
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    rounded-xl
                    font-medium
                    transition
                  "
                >
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
                      {selectedTicket.code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Estado
                    </p>

                    <div className="mt-1">
                      {getStatusBadge(
                        selectedTicket.status
                      )}
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
                    {selectedTicket.userName}
                  </p>
                </div>

                {/* MENU */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Tipo de Menú
                  </p>

                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {selectedTicket.menuType}
                  </p>
                </div>

                {/* FECHAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Calendar size={14} />
                      Comprado
                    </p>

                    <p className="text-sm text-slate-900 mt-1">
                      {selectedTicket.purchaseDate.toLocaleDateString(
                        'es-ES'
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Clock size={14} />
                      Expira
                    </p>

                    <p className="text-sm text-slate-900 mt-1">
                      {selectedTicket.expirationDate.toLocaleDateString(
                        'es-ES'
                      )}
                    </p>
                  </div>
                </div>

                {/* RESULTADO */}
                {validationResult && (
                  <div
                    className={`
                      p-4 rounded-xl border
                      ${
                        validationResult.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }
                    `}
                  >
                    <p
                      className={`
                        text-center font-bold text-lg
                        ${
                          validationResult.isValid
                            ? 'text-green-700'
                            : 'text-red-700'
                        }
                      `}
                    >
                      {validationResult.message}
                    </p>
                  </div>
                )}

                {/* BUTTON */}
                <button
                  onClick={handleValidateTicket}
                  disabled={
                    validationResult?.isValid === true
                  }
                  className={`
                    w-full
                    py-3
                    rounded-xl
                    font-bold
                    text-white
                    transition

                    ${
                      validationResult?.isValid ===
                      true
                        ? 'bg-green-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }
                  `}
                >
                  {validationResult?.isValid ===
                  true
                    ? '✓ Acceso Permitido'
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
                  Validados
                </span>

                <span className="text-2xl font-bold text-green-600">
                  {validatedTickets.length}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">
                  Rechazados
                </span>

                <span className="text-2xl font-bold text-red-600">
                  2
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  Tasa Éxito
                </span>

                <span className="text-2xl font-bold text-green-600">
                  {validatedTickets.length > 0
                    ? Math.round(
                        (validatedTickets.length /
                          (validatedTickets.length +
                            2)) *
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
                      {ticket.userName}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {ticket.code} •{' '}
                      {ticket.menuType}
                    </p>

                    {ticket.validatedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓{' '}
                        {ticket.validatedAt.toLocaleTimeString(
                          'es-ES'
                        )}
                      </p>
                    )}
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