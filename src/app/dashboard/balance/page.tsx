'use client';

import { useState, useEffect } from 'react';
import { Download, Wallet, CreditCard, Filter, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Arqueo {
  id: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_inicial: string;
  monto_sistema: string;
  monto_declarado: string | null;
  estado: string;
  cajero_nombre: string;
  diferencia: string;
}

export default function BalancePage() {
  const { auth } = useAuth();
  const [activeTab, setActiveTab] = useState<'efectivo' | 'digital'>('efectivo');
  const [arqueos, setArqueos] = useState<Arqueo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const institutionId = auth?.instituciones?.[0]?.id;
  const token = auth?.accessToken;

  useEffect(() => {
    if (institutionId && token && activeTab === 'efectivo') {
      fetchArqueos();
    }
  }, [institutionId, token, activeTab]);

  const fetchArqueos = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE}/instituciones/${institutionId}/balance/cajas`;
      const queryParams = new URLSearchParams();
      if (fechaInicio) queryParams.append('fechaInicio', fechaInicio);
      if (fechaFin) queryParams.append('fechaFin', fechaFin);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar arqueos');
      const data = await res.json();
      setArqueos(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArqueos();
  };

  const handleExportCSV = () => {
    if (arqueos.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    const headers = [
      'Cajero',
      'Estado',
      'Fecha Apertura',
      'Fecha Cierre',
      'Monto Inicial',
      'Monto Sistema',
      'Monto Declarado',
      'Diferencia'
    ];

    const csvContent = [
      headers.join(','),
      ...arqueos.map(a => [
        `"${a.cajero_nombre}"`,
        a.estado,
        `"${new Date(a.fecha_apertura).toLocaleString()}"`,
        a.fecha_cierre ? `"${new Date(a.fecha_cierre).toLocaleString()}"` : 'Pendiente',
        parseFloat(a.monto_inicial || '0').toFixed(2),
        parseFloat(a.monto_sistema || '0').toFixed(2),
        parseFloat(a.monto_declarado || '0').toFixed(2),
        parseFloat(a.diferencia || '0').toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Balance_Cajas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Balance Financiero</h1>
          <p className="text-slate-500">Monitorea y corrobora los arqueos de caja y pagos digitales</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          className={`pb-3 flex items-center gap-2 font-medium transition-colors border-b-2 ${
            activeTab === 'efectivo'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('efectivo')}
        >
          <Wallet size={18} />
          Efectivo (Cajas)
        </button>
        <button
          className={`pb-3 flex items-center gap-2 font-medium transition-colors border-b-2 ${
            activeTab === 'digital'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('digital')}
        >
          <CreditCard size={18} />
          Digital (Próximamente)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'efectivo' && (
        <div className="space-y-6">
          
          {/* Filtros */}
          <form onSubmit={handleApplyFilter} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
              <input 
                type="date" 
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
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

          {/* Tabla de Arqueos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                    <th className="px-6 py-4 font-semibold">Cajero</th>
                    <th className="px-6 py-4 font-semibold">Apertura / Cierre</th>
                    <th className="px-6 py-4 font-semibold text-right">Inicial</th>
                    <th className="px-6 py-4 font-semibold text-right">Sistema</th>
                    <th className="px-6 py-4 font-semibold text-right">Declarado</th>
                    <th className="px-6 py-4 font-semibold text-right">Diferencia</th>
                    <th className="px-6 py-4 font-semibold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        Cargando registros...
                      </td>
                    </tr>
                  ) : arqueos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        No se encontraron arqueos en las fechas seleccionadas.
                      </td>
                    </tr>
                  ) : (
                    arqueos.map(a => {
                      const diferencia = parseFloat(a.diferencia || '0');
                      const isFaltante = diferencia < 0;
                      const isExacto = diferencia === 0;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{a.cajero_nombre}</p>
                            <p className="text-xs text-slate-500">ID: {a.id.substring(0,8)}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div>{new Date(a.fecha_apertura).toLocaleString()}</div>
                            <div className="text-slate-400">
                              {a.fecha_cierre ? new Date(a.fecha_cierre).toLocaleString() : 'En curso'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-600">
                            S/. {parseFloat(a.monto_inicial).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                            S/. {parseFloat(a.monto_sistema || '0').toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                            {a.fecha_cierre ? `S/. ${parseFloat(a.monto_declarado || '0').toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            {!a.fecha_cierre ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
                                isFaltante 
                                  ? 'bg-red-50 text-red-700' 
                                  : isExacto 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-blue-50 text-blue-700'
                              }`}>
                                {isFaltante && <AlertTriangle size={14} />}
                                {isFaltante ? '' : '+'} S/. {diferencia.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              a.estado === 'ABIERTA' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {a.estado}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Gráfico de Balance */}
          {!isLoading && arqueos.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Comparativa: Sistema vs Declarado</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...arqueos].reverse().map(a => ({
                    name: new Date(a.fecha_apertura).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    sistema: parseFloat(a.monto_sistema || '0'),
                    declarado: parseFloat(a.monto_declarado || '0')
                  }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `S/. ${val}`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="sistema" name="Monto Sistema" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="declarado" name="Monto Declarado" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placeholder para Digital */}
      {activeTab === 'digital' && (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl py-20 text-center">
          <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Conciliación Digital Próximamente</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Esta sección te permitirá validar automáticamente los ingresos por billeteras digitales como Yape o transferencias bancarias según los reportes de tu banco.
          </p>
        </div>
      )}

    </div>
  );
}
