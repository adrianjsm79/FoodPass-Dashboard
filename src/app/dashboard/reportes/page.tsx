"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── Auth / API helpers ────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function getAuth(): { accessToken: string; institucionId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("foodpass_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const inst = (parsed.instituciones ?? []).find(
      (i: { rol: string }) => i.rol !== "USUARIO"
    ) ?? parsed.instituciones?.[0];
    return {
      accessToken: parsed.accessToken ?? "",
      institucionId: inst?.id ?? "",
    };
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error("No hay sesión activa");

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });

  if (res.status === 401) {
    const raw = localStorage.getItem("foodpass_auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: parsed.refreshToken }),
      });
      if (refreshRes.ok) {
        const { accessToken } = await refreshRes.json();
        parsed.accessToken = accessToken;
        localStorage.setItem("foodpass_auth", JSON.stringify(parsed));
        return apiFetch<T>(path);
      }
    }
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? body?.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type Period = "hoy" | "semana" | "mes";

interface SalesRow {
  label: string;
  periodo: string;
  app: number;
  pos: number;
  total_pedidos: number;
  usuarios_unicos: number;
}

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

interface DebtItem {
  usuario_id: string;
  nombre_completo: string;
  correo: string;
  saldo_deuda: string | number;
  limite_credito: string | number;
  porcentaje_uso: string | number | null;
  actualizado_en: string;
}

interface PieDataItem {
  name: string;
  value: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1000 ? `S/. ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}` : `S/. ${n.toFixed(2)}`;

const fmtShort = (n: number) => `S/${n >= 1000 ? (n / 1000).toFixed(1) + "k" : n}`;

function getDateRange(period: Period): { desde: string; hasta: string; agrupar_por: string } {
  const now = new Date();
  const hasta = now.toISOString();

  if (period === "hoy") {
    const desde = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    return { desde, hasta, agrupar_por: "dia" };
  }
  if (period === "semana") {
    const desde = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
    return { desde, hasta, agrupar_por: "dia" };
  }
  // mes
  const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return { desde, hasta, agrupar_por: "dia" };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, subColor = "text-green-600",
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
  sub?: React.ReactNode; subColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
        {icon}{label}
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-800 tracking-tight">{value}</div>
      {sub && <div className={`mt-1 text-sm font-medium ${subColor}`}>{sub}</div>}
    </div>
  );
}

interface TooltipPayloadItem { name: string; value: number; color: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string; }

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Cargando datos…
    </div>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed right-6 top-6 z-[100] flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-xl">
      <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {msg}
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white">✕</button>
    </div>
  );
}

const PIE_COLORS = ["#16a34a", "#86efac"];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [period, setPeriod] = useState<Period>("semana");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [debtors, setDebtors] = useState<DebtItem[]>([]);
  const [resumen, setResumen] = useState<{
    ventas_hoy: { total_pedidos: number; ingresos: number };
    tickets_activos: number;
    productos_con_stock_bajo: number;
    total_deuda_postpago: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      if (!auth?.institucionId) return;

      const { desde, hasta, agrupar_por } = getDateRange(period);
      const basePath = `/instituciones/${auth.institucionId}/reportes`;
      const qs = `desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;

      const [sales, products, debt, summary] = await Promise.all([
        apiFetch<SalesRow[]>(`${basePath}/ventas-por-canal?${qs}&agrupar_por=${agrupar_por}`),
        apiFetch<TopProduct[]>(`${basePath}/productos-top?${qs}&limit=5`),
        apiFetch<DebtItem[]>(`${basePath}/deuda-postpago`),
        apiFetch<typeof resumen>(`${basePath}/resumen`),
      ]);

      setSalesData(sales);
      setTopProducts(products);
      setDebtors(debt);
      setResumen(summary);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Computed values
  const totalIngresos = salesData.reduce((s, r) => s + r.app + r.pos, 0);
  const totalPedidos = salesData.reduce((s, r) => s + r.total_pedidos, 0);
  const totalUsuarios = new Set(salesData.map(r => r.usuarios_unicos)).size > 0
    ? salesData.reduce((max, r) => Math.max(max, r.usuarios_unicos), 0)
    : 0;
  // Use the sum of unique users across all periods for a better estimate
  const usuariosTotal = salesData.reduce((s, r) => s + r.usuarios_unicos, 0);
  const totalApp = salesData.reduce((s, r) => s + r.app, 0);
  const totalPos = salesData.reduce((s, r) => s + r.pos, 0);
  const totalDeuda = debtors.reduce((s, d) => s + parseFloat(String(d.saldo_deuda)), 0);

  const pieData: PieDataItem[] = totalApp + totalPos > 0
    ? [
      { name: "APP (Prepago)", value: Math.round((totalApp / (totalApp + totalPos)) * 100) },
      { name: "POS (Presencial)", value: Math.round((totalPos / (totalApp + totalPos)) * 100) },
    ]
    : [];

  // Chart data mapped for area chart
  const chartData = salesData.map(r => ({
    label: r.label,
    app: r.app,
    pos: r.pos,
  }));

  const barData = topProducts.map(p => ({
    name: p.name.length > 12 ? p.name.substring(0, 12) + "…" : p.name,
    qty: p.qty,
  }));

  const periodLabel = period === "hoy" ? "Hoy" : period === "semana" ? "Esta Semana" : "Este Mes";

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ─── Export functions using real data ──────────────────────────────────────

  function exportCSV() {
    const headers = ["Período", "APP (S/.)", "POS (S/.)", "Total (S/.)", "Pedidos", "Usuarios"];
    const rows = salesData.map(d => [d.label, d.app.toFixed(2), d.pos.toFixed(2), (d.app + d.pos).toFixed(2), d.total_pedidos, d.usuarios_unicos]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `reporte_ventas_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const html = `
      <html><head><title>Reporte FoodPass</title>
      <style>body{font-family:sans-serif;padding:32px;color:#1e293b}h1{color:#16a34a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f8fafc;font-size:12px;text-transform:uppercase;color:#64748b}.summary{display:flex;gap:24px;margin:16px 0}.summary div{background:#f8fafc;padding:12px 16px;border-radius:8px;flex:1}</style>
      </head><body>
      <h1>FoodPass · Reporte de ${periodLabel}</h1>
      <p style="color:#64748b">Generado el ${new Date().toLocaleString("es-PE")}</p>
      
      <h3>Resumen</h3>
      <table>
        <tr><th>Métrica</th><th>Valor</th></tr>
        <tr><td>Ingresos Totales</td><td><strong>S/. ${totalIngresos.toFixed(2)}</strong></td></tr>
        <tr><td>Total Pedidos</td><td>${totalPedidos}</td></tr>
        <tr><td>Ventas APP</td><td>S/. ${totalApp.toFixed(2)}</td></tr>
        <tr><td>Ventas POS</td><td>S/. ${totalPos.toFixed(2)}</td></tr>
        <tr><td>Deuda Postpago</td><td>S/. ${totalDeuda.toFixed(2)} (${debtors.length} usuarios)</td></tr>
      </table>

      <h3>Ventas por Período</h3>
      <table>
        <tr><th>Período</th><th>APP (S/.)</th><th>POS (S/.)</th><th>Total (S/.)</th><th>Pedidos</th></tr>
        ${salesData.map(d => `<tr><td>${d.label}</td><td>${d.app.toFixed(2)}</td><td>${d.pos.toFixed(2)}</td><td>${(d.app + d.pos).toFixed(2)}</td><td>${d.total_pedidos}</td></tr>`).join("")}
      </table>

      ${topProducts.length > 0 ? `
      <h3>Productos Más Vendidos</h3>
      <table>
        <tr><th>#</th><th>Producto</th><th>Unidades</th><th>Ingresos (S/.)</th></tr>
        ${topProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.qty}</td><td>${p.revenue.toFixed(2)}</td></tr>`).join("")}
      </table>` : ""}

      ${debtors.length > 0 ? `
      <h3>Deudas Postpago</h3>
      <table>
        <tr><th>Usuario</th><th>Correo</th><th>Deuda (S/.)</th><th>Límite (S/.)</th></tr>
        ${debtors.map(d => `<tr><td>${d.nombre_completo}</td><td>${d.correo}</td><td>${parseFloat(String(d.saldo_deuda)).toFixed(2)}</td><td>${parseFloat(String(d.limite_credito)).toFixed(2)}</td></tr>`).join("")}
      </table>` : ""}

      <p style="margin-top:32px;font-size:12px;color:#94a3b8">FoodPass · Gestión de Comedor Institucional</p>
      </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) setTimeout(() => w.print(), 800);
    URL.revokeObjectURL(url);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Análisis de ventas, productos y deudas</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-base font-semibold text-slate-800">Generación de Reportes</p>
          <p className="text-xs text-slate-400">Datos reales de tu institución</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["hoy", "semana", "mes"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                period === p
                  ? "bg-green-600 text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p === "hoy" ? "Hoy" : p === "semana" ? "Esta Semana" : "Este Mes"}
            </button>
          ))}
          <button
            onClick={() => { exportCSV(); showToast("CSV exportado correctamente"); }}
            disabled={loading || salesData.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 active:scale-95 transition-transform shadow-sm disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
          <button
            onClick={() => { exportPDF(); showToast("PDF listo para imprimir"); }}
            disabled={loading || salesData.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <Spinner />}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={fetchData} className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">Reintentar</button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              label={`Ingresos ${periodLabel}`}
              value={fmt(totalIngresos)}
              sub={`${totalPedidos} pedidos`}
            />
            <StatCard
              icon={<svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5" /></svg>}
              label="Usuarios Únicos"
              value={usuariosTotal}
              sub={periodLabel}
              subColor="text-blue-500"
            />
            <StatCard
              icon={<svg className="h-4 w-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Ventas POS"
              value={fmt(totalPos)}
              sub={`APP: ${fmt(totalApp)}`}
              subColor="text-purple-500"
            />
            <StatCard
              icon={<svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
              label="Deuda Postpago"
              value={fmt(totalDeuda)}
              sub={`${debtors.length} usuario${debtors.length !== 1 ? "s" : ""} con deuda`}
              subColor="text-red-500"
            />
          </div>

          {/* Area Chart + Pie */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">Ventas por Canal</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-600 inline-block" />APP</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-300 inline-block" />POS</span>
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm">Sin datos de ventas para este período</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gApp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#86efac" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#86efac" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="app" name="APP" stroke="#16a34a" strokeWidth={2.5} fill="url(#gApp)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#16a34a" }} />
                    <Area type="monotone" dataKey="pos" name="POS" stroke="#86efac" strokeWidth={2} fill="url(#gPos)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#86efac" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col">
              <h2 className="text-base font-semibold text-slate-800 mb-2">Distribución de Canales</h2>
              <p className="text-xs text-slate-400 mb-4">{periodLabel}</p>
              {pieData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>
              ) : (
                <>
                  <div className="flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                          {d.name}
                        </span>
                        <span className="font-semibold text-slate-800">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bar chart + Deudores */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top products */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Productos Más Vendidos</h2>
              {topProducts.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Sin ventas en este período</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(value) => [`${value} uds`, "Cantidad"]} />
                      <Bar dataKey="qty" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 divide-y divide-slate-50">
                    {topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700">{i + 1}</span>
                          <span className="text-slate-700">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-semibold text-slate-800">{fmt(p.revenue)}</span>
                          <span className="text-xs text-slate-400">{p.qty} uds</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Debtors */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">Usuarios con Deuda</h2>
                {debtors.length > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                    {debtors.length} usuario{debtors.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {debtors.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Sin deudas pendientes ✓</div>
              ) : (
                <>
                  <div className="divide-y divide-slate-50">
                    {debtors.map((d) => {
                      const deuda = parseFloat(String(d.saldo_deuda));
                      const limite = parseFloat(String(d.limite_credito));
                      const usoPct = limite > 0 ? (deuda / limite) * 100 : 0;
                      return (
                        <div key={d.usuario_id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{d.nombre_completo}</p>
                            <p className="text-xs text-slate-400">{d.correo} · {usoPct.toFixed(0)}% del límite</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-500">S/. {deuda.toFixed(2)}</p>
                            <div className="mt-0.5 h-1.5 w-20 rounded-full bg-slate-100 ml-auto">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min(100, usoPct)}%`,
                                  backgroundColor: usoPct > 80 ? "#ef4444" : usoPct > 50 ? "#f59e0b" : "#a855f7",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                    <span className="text-sm font-medium text-red-700">Deuda total acumulada</span>
                    <span className="text-lg font-bold text-red-600">S/. {totalDeuda.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sales Table */}
          {salesData.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Detalle de Ventas por Período</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 text-left">Período</th>
                      <th className="pb-2 text-right">APP</th>
                      <th className="pb-2 text-right">POS</th>
                      <th className="pb-2 text-right">Total</th>
                      <th className="pb-2 text-right">Pedidos</th>
                      <th className="pb-2 text-right">% APP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salesData.map((row) => {
                      const total = row.app + row.pos;
                      const pct = total > 0 ? Math.round((row.app / total) * 100) : 0;
                      return (
                        <tr key={row.periodo} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 font-medium text-slate-700">{row.label}</td>
                          <td className="py-2.5 text-right text-green-600 font-medium">{fmt(row.app)}</td>
                          <td className="py-2.5 text-right text-slate-500">{fmt(row.pos)}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800">{fmt(total)}</td>
                          <td className="py-2.5 text-right text-slate-600">{row.total_pedidos}</td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-slate-100">
                                <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-500">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 font-bold text-slate-800">
                      <td className="pt-3">Total</td>
                      <td className="pt-3 text-right text-green-600">{fmt(totalApp)}</td>
                      <td className="pt-3 text-right text-slate-500">{fmt(totalPos)}</td>
                      <td className="pt-3 text-right">{fmt(totalIngresos)}</td>
                      <td className="pt-3 text-right">{totalPedidos}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}