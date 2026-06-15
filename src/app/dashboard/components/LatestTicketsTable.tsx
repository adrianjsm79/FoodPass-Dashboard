'use client';

import {
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

export interface TicketRow {
  codigo: string;
  usuario: string;
  canal: 'APP' | 'POS';
  producto: string;
  estado:
    | 'Canjedo'
    | 'Vigente'
    | 'Expirado';
  hora: string;
}

interface LatestTicketsTableProps {
  tickets?: TicketRow[];
}

const getStatusColor = (
  estado: string
) => {

  switch (estado) {

    case 'Canjedo':
      return 'bg-green-50 text-green-700';

    case 'Vigente':
      return 'bg-blue-50 text-blue-700';

    case 'Expirado':
      return 'bg-red-50 text-red-700';

    default:
      return 'bg-slate-50 text-slate-700';
  }
};

const getStatusIcon = (
  estado: string
) => {

  switch (estado) {

    case 'Canjedo':
      return <CheckCircle2 size={14} />;

    case 'Vigente':
      return <Clock size={14} />;

    case 'Expirado':
      return <X size={14} />;

    default:
      return null;
  }
};

export default function LatestTicketsTable({
  tickets,
}: LatestTicketsTableProps) {

  const defaultTickets: TicketRow[] = [
    {
      codigo: 'FP-8841',
      usuario: 'Ana Torres',
      canal: 'APP',
      producto: 'Menú del día',
      estado: 'Canjedo',
      hora: '12:47',
    },
    {
      codigo: 'FP-8840',
      usuario: 'Carlos Rios',
      canal: 'POS',
      producto: 'Menú del día',
      estado: 'Vigente',
      hora: '12:45',
    },
    {
      codigo: 'FP-8839',
      usuario: 'Anónimo',
      canal: 'POS',
      producto: 'Snack + Gaseosa',
      estado: 'Canjedo',
      hora: '12:43',
    },
    {
      codigo: 'FP-8838',
      usuario: 'Maria Lopez',
      canal: 'APP',
      producto: 'Menú del día',
      estado: 'Vigente',
      hora: '12:40',
    },
    {
      codigo: 'FP-8837',
      usuario: 'Luis Vera',
      canal: 'APP',
      producto: 'Menú del día',
      estado: 'Expirado',
      hora: '10:15',
    },
    {
      codigo: 'FP-8836',
      usuario: 'Sofia Diaz',
      canal: 'APP',
      producto: 'Menú del día',
      estado: 'Canjedo',
      hora: '08:22',
    },
  ];

  const tableData =
    tickets || defaultTickets;

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
            Últimos Tickets
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
            tickets → items_pedido →
            pedidos → usuarios
          </p>
        </div>

        {/* realtime */}
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

      {/* ========================= */}
      {/* MOBILE CARDS */}
      {/* ========================= */}

      <div className="block lg:hidden">

        <div className="divide-y divide-slate-100">

          {tableData.map((ticket) => (

            <div
              key={ticket.codigo}
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
                    {ticket.usuario}
                  </p>

                  <p className="text-sm text-slate-500 mt-1 break-words">
                    {ticket.producto}
                  </p>

                  <div className="flex items-center justify-between mt-3 gap-3">

                    <span
                      className={`
                        inline-flex items-center gap-1.5
                        px-3 py-1
                        rounded-full
                        text-xs font-semibold

                        ${getStatusColor(
                          ticket.estado
                        )}
                      `}
                    >
                      {getStatusIcon(
                        ticket.estado
                      )}

                      {ticket.estado}
                    </span>

                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {ticket.hora}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

            {tableData.map((ticket) => (

              <tr
                key={ticket.codigo}
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
                  {ticket.usuario}
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
                  {ticket.producto}
                </td>

                {/* estado */}
                <td className="py-4 px-4">

                  <span
                    className={`
                      inline-flex items-center gap-1.5
                      px-3 py-1
                      rounded-full
                      text-xs font-semibold

                      ${getStatusColor(
                        ticket.estado
                      )}
                    `}
                  >
                    {getStatusIcon(
                      ticket.estado
                    )}

                    {ticket.estado}
                  </span>
                </td>

                {/* hora */}
                <td className="py-4 px-4 text-slate-500 font-medium">
                  {ticket.hora}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}