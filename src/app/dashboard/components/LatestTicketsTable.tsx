'use client';

import { CheckCircle2, Clock, X } from 'lucide-react';

export interface TicketRow {
  codigo: string;
  usuario: string;
  canal: 'APP' | 'POS';
  producto: string;
  estado: 'Canjedo' | 'Vigente' | 'Expirado';
  hora: string;
}

interface LatestTicketsTableProps {
  tickets?: TicketRow[];
}

const getStatusColor = (estado: string) => {
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

const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Canjedo':
      return <CheckCircle2 size={16} />;
    case 'Vigente':
      return <Clock size={16} />;
    case 'Expirado':
      return <X size={16} />;
    default:
      return null;
  }
};

export default function LatestTicketsTable({ tickets }: LatestTicketsTableProps) {
  const defaultTickets: TicketRow[] = [
    { codigo: 'FP-8841', usuario: 'Ana Torres', canal: 'APP', producto: 'Menú del día', estado: 'Canjedo', hora: '12:47' },
    { codigo: 'FP-8840', usuario: 'Carlos Rios', canal: 'POS', producto: 'Menú del día', estado: 'Vigente', hora: '12:45' },
    { codigo: 'FP-8839', usuario: 'Anónimo', canal: 'POS', producto: 'Snack + Gaseosa', estado: 'Canjedo', hora: '12:43' },
    { codigo: 'FP-8838', usuario: 'Maria Lopez', canal: 'APP', producto: 'Menú del día', estado: 'Vigente', hora: '12:40' },
    { codigo: 'FP-8837', usuario: 'Luis Vera', canal: 'APP', producto: 'Menú del día', estado: 'Expirado', hora: '10:15' },
    { codigo: 'FP-8836', usuario: 'Sofia Diaz', canal: 'APP', producto: 'Menú del día', estado: 'Canjedo', hora: '08:22' },
  ];

  const tableData = tickets || defaultTickets;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Últimos Tickets</h2>
          <p className="text-sm text-slate-500">tickets → items_pedido → pedidos → usuarios</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600 font-medium">Tiempo real</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs">Código</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs">Usuario</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs">Canal</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs">Producto</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs">Hora</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((ticket) => (
              <tr key={ticket.codigo} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="py-3 px-4 text-slate-600 font-medium">{ticket.codigo}</td>
                <td className="py-3 px-4 text-slate-600">{ticket.usuario}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-medium ${
                      ticket.canal === 'APP' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                    }`}
                  >
                    {ticket.canal === 'APP' ? 'APP' : 'POS'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">{ticket.producto}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(ticket.estado)}`}>
                    {getStatusIcon(ticket.estado)}
                    {ticket.estado}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">{ticket.hora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
