'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Ticket, TrendingUp, DollarSign, Users,
  AlertCircle, Activity, ShoppingCart, Zap, BarChart3,
} from 'lucide-react';

interface DailyStats {
  ticketsValidated: number;
  salesCount: number;
  dayRevenue: number;
  lowStockItems: number;
  usersServed: number;
}

interface RecentActivity {
  id: string;
  type: 'ticket' | 'sale';
  description: string;
  timestamp: Date;
}

interface AIInsight {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
}

export default function CajeroDashboard() {
  const [stats] = useState<DailyStats>({
    ticketsValidated: 24,
    salesCount: 18,
    dayRevenue: 285.5,
    lowStockItems: 3,
    usersServed: 42,
  });

  const [recentActivity] = useState<RecentActivity[]>([
    { id: '1', type: 'ticket', description: 'Ticket validado - Menú ejecutivo', timestamp: new Date(Date.now() - 5 * 60000) },
    { id: '2', type: 'sale', description: 'Venta - 2x Inca Kola + Sandwich', timestamp: new Date(Date.now() - 12 * 60000) },
    { id: '3', type: 'ticket', description: 'Ticket validado - Menú estándar', timestamp: new Date(Date.now() - 18 * 60000) },
  ]);

  const [aiInsights] = useState<AIInsight[]>([
    { icon: <AlertCircle size={18} />, title: 'Stock bajo', description: 'El menú ejecutivo se agotará en ~2 horas', type: 'warning' },
    { icon: <TrendingUp size={18} />, title: 'Producto estrella', description: 'La bebida más vendida hoy es Inca Kola', type: 'success' },
    { icon: <Zap size={18} />, title: 'Recomendación', description: 'Se recomienda preparar más almuerzos', type: 'info' },
  ]);

  const formatTime = (date: Date) => {
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Hace unos segundos';
    if (minutes < 60) return `Hace ${minutes} min`;
    return `Hace ${Math.floor(minutes / 60)}h`;
  };

  return (
    <div className="space-y-6">

      {/* Header — igual que Tickets */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={32} />
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <p className="text-green-100">Resumen de operaciones del día</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-lg"><Ticket size={24} className="text-green-600" /></div>
            <span className="text-2xl font-bold text-green-600">{stats.ticketsValidated}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Tickets Validados</p>
          <p className="text-xs text-slate-500 mt-1">Hoy</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-lg"><ShoppingCart size={24} className="text-blue-600" /></div>
            <span className="text-2xl font-bold text-blue-600">{stats.salesCount}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Ventas Realizadas</p>
          <p className="text-xs text-slate-500 mt-1">Hoy</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-3 rounded-lg"><DollarSign size={24} className="text-purple-600" /></div>
            <span className="text-2xl font-bold text-purple-600">S/. {stats.dayRevenue.toFixed(2)}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Ingresos</p>
          <p className="text-xs text-slate-500 mt-1">Hoy</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-100 p-3 rounded-lg"><AlertCircle size={24} className="text-red-600" /></div>
            <span className="text-2xl font-bold text-red-600">{stats.lowStockItems}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Bajo Stock</p>
          <p className="text-xs text-slate-500 mt-1">Productos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-100 p-3 rounded-lg"><Users size={24} className="text-orange-600" /></div>
            <span className="text-2xl font-bold text-orange-600">{stats.usersServed}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Atendidos</p>
          <p className="text-xs text-slate-500 mt-1">Hoy</p>
        </div>

      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">Actividad Reciente</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activity.type === 'ticket' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {activity.type === 'ticket'
                      ? <Ticket size={18} className="text-green-600" />
                      : <ShoppingCart size={18} className="text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500">{formatTime(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" />
              <h2 className="text-lg font-semibold text-slate-900">Sugerencias</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {aiInsights.map((insight, index) => (
              <div key={index} className="p-4">
                <div className={`flex items-start gap-3 p-3 rounded-lg ${
                  insight.type === 'warning' ? 'bg-red-50' :
                  insight.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  <div className={`flex-shrink-0 ${
                    insight.type === 'warning' ? 'text-red-600' :
                    insight.type === 'success' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {insight.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Acciones Rápidas — fondo blanco con borde, texto visible */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/cajero/tickets"
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition"
          >
            <div className="bg-green-600 p-3 rounded-xl">
              <Ticket size={24} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-green-800">Validar Tickets</p>
          </Link>
          <Link
            href="/dashboard/cajero/pos"
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition"
          >
            <div className="bg-blue-600 p-3 rounded-xl">
              <ShoppingCart size={24} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-blue-800">Punto de Venta</p>
          </Link>
          <button
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition"
          >
            <div className="bg-purple-600 p-3 rounded-xl">
              <BarChart3 size={24} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-purple-800">Reportes</p>
          </button>
        </div>
      </div>

    </div>
  );
}