"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Period = "hoy" | "semana" | "mes";

// ─── Raw data per period ───────────────────────────────────────────────────────
const DAILY_DATA = {
  hoy: [
    { label: "07:00", prepago: 120,  presencial: 45  },
    { label: "08:00", prepago: 310,  presencial: 80  },
    { label: "09:00", prepago: 180,  presencial: 55  },
    { label: "10:00", prepago: 95,   presencial: 30  },
    { label: "11:00", prepago: 440,  presencial: 160 },
    { label: "12:00", prepago: 820,  presencial: 390 },
    { label: "13:00", prepago: 750,  presencial: 420 },
    { label: "14:00", prepago: 310,  presencial: 140 },
    { label: "15:00", prepago: 130,  presencial: 60  },
  ],
  semana: [
    { label: "21 Abr", prepago: 1200, presencial: 340 },
    { label: "22 Abr", prepago: 1850, presencial: 520 },
    { label: "23 Abr", prepago: 1600, presencial: 480 },
    { label: "24 Abr", prepago: 2100, presencial: 610 },
    { label: "25 Abr", prepago: 2500, presencial: 700 },
    { label: "26 Abr", prepago: 1900, presencial: 420 },
    { label: "27 Abr", prepago: 2800, presencial: 962 },
  ],
  mes: [
    { label: "01 Abr", prepago: 900,  presencial: 210 },
    { label: "05 Abr", prepago: 1400, presencial: 380 },
    { label: "10 Abr", prepago: 1750, presencial: 490 },
    { label: "15 Abr", prepago: 2100, presencial: 560 },
    { label: "20 Abr", prepago: 1600, presencial: 430 },
    { label: "25 Abr", prepago: 2500, presencial: 700 },
    { label: "30 Abr", prepago: 2900, presencial: 820 },
  ],
};

const TOP_PRODUCTS = {
  hoy: [
    { name: "Menú Completo",   qty: 142, revenue: 994  },
    { name: "Desayuno Clásico",qty: 98,  revenue: 490  },
    { name: "Bebida Natural",  qty: 87,  revenue: 261  },
    { name: "Sopa del Día",    qty: 65,  revenue: 260  },
    { name: "Snack Saludable", qty: 44,  revenue: 132  },
  ],
  semana: [
    { name: "Menú Completo",   qty: 892, revenue: 6244 },
    { name: "Desayuno Clásico",qty: 610, revenue: 3050 },
    { name: "Bebida Natural",  qty: 543, revenue: 1629 },
    { name: "Sopa del Día",    qty: 401, revenue: 1604 },
    { name: "Snack Saludable", qty: 298, revenue: 894  },
  ],
  mes: [
    { name: "Menú Completo",   qty: 3840, revenue: 26880 },
    { name: "Desayuno Clásico",qty: 2610, revenue: 13050 },
    { name: "Bebida Natural",  qty: 2190, revenue: 6570  },
    { name: "Sopa del Día",    qty: 1720, revenue: 6880  },
    { name: "Snack Saludable", qty: 1140, revenue: 3420  },
  ],
};

const PIE_DATA = {
  hoy:    [{ name: "Prepago", value: 68 }, { name: "Presencial", value: 32 }],
  semana: [{ name: "Prepago", value: 76 }, { name: "Presencial", value: 24 }],
  mes:    [{ name: "Prepago", value: 72 }, { name: "Presencial", value: 28 }],
};

const STATS = {
  hoy:    { ingresos: 3155,   prevPct: "+8.2",  usuarios: 48,  ventas: 521,   deuda: 143.50, deudores: 6 },
  semana: { ingresos: 14350,  prevPct: "+12.4", usuarios: 248, ventas: 3262,  deuda: 143.50, deudores: 6 },
  mes:    { ingresos: 58400,  prevPct: "+9.7",  usuarios: 892, ventas: 12480, deuda: 143.50, deudores: 6 },
};

const DEBTORS = [
  { name: "Carlos Ríos Paredes",    code: "PROF-045", debt: 67.00, days: 12 },
  { name: "Luis Vera Castillo",     code: "PROF-012", debt: 45.00, days: 8  },
  { name: "Rosa Ccopa Quispe",      code: "ADM-007",  debt: 18.50, days: 5  },
  { name: "Jorge Mamani Flores",    code: "20190342", debt: 8.00,  days: 3  },
  { name: "Pedro Huanca Ticona",    code: "20180023", debt: 3.00,  days: 2  },
  { name: "Lucía Condori Apaza",    code: "20210099", debt: 2.00,  days: 1  },
];

const PIE_COLORS = ["#16a34a", "#86efac"];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1000 ? `S/. ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}` : `S/. ${n.toFixed(2)}`;

const fmtShort = (n: number) => `S/${n >= 1000 ? (n / 1000).toFixed(1) + "k" : n}`;

function StatCard({
  icon,
  label,
  value,
  sub,
  subColor = "text-green-600",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  subColor?: string;
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

// ─── Custom tooltip for area chart ────────────────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

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

// ─── Export helpers ────────────────────────────────────────────────────────────
function exportCSV(period: Period) {
  const data = DAILY_DATA[period];
  const headers = ["Período", "Prepago (S/.)", "Presencial (S/.)"];
  const rows = data.map((d) => [d.label, d.prepago, d.presencial]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `reporte_ventas_${period}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(period: Period) {
  const stats = STATS[period];
  const data = DAILY_DATA[period];
  const html = `
    <html><head><title>Reporte FoodPass</title>
    <style>body{font-family:sans-serif;padding:32px;color:#1e293b}h1{color:#16a34a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f8fafc;font-size:12px;text-transform:uppercase;color:#64748b}</style>
    </head><body>
    <h1>FoodPass · Reporte de ${period === "hoy" ? "Hoy" : period === "semana" ? "Esta Semana" : "Este Mes"}</h1>
    <p style="color:#64748b">Tecsup</p>
    <h3>Resumen</h3>
    <p>Ingresos totales: <strong>S/. ${stats.ingresos.toLocaleString()}</strong> (${stats.prevPct}% vs periodo anterior)</p>
    <p>Usuarios únicos: <strong>${stats.usuarios}</strong> &nbsp;|&nbsp; Ventas presenciales: <strong>S/. ${stats.ventas.toLocaleString()}</strong></p>
    <h3>Ventas Diarias</h3>
    <table><tr><th>Período</th><th>Prepago (S/.)</th><th>Presencial (S/.)</th><th>Total (S/.)</th></tr>
    ${data.map(d => `<tr><td>${d.label}</td><td>${d.prepago}</td><td>${d.presencial}</td><td>${d.prepago + d.presencial}</td></tr>`).join("")}
    </table>
    <p style="margin-top:32px;font-size:12px;color:#94a3b8">Generado el ${new Date().toLocaleString("es-PE")} · FoodPass Gestión de Comedor</p>
    </body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) setTimeout(() => w.print(), 800);
  URL.revokeObjectURL(url);
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const [period, setPeriod] = useState<Period>("semana");
  const [toast, setToast]   = useState<string | null>(null);

  const stats     = STATS[period];
  const chartData = DAILY_DATA[period];
  const products  = TOP_PRODUCTS[period];
  const pieData   = PIE_DATA[period];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const periodLabel = period === "hoy" ? "Hoy" : period === "semana" ? "Esta Semana" : "Este Mes";

  const barData = products.map((p) => ({ name: p.name.split(" ")[0], qty: p.qty }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tecsup</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-base font-semibold text-slate-800">Generación de Reportes</p>
          <p className="text-xs text-slate-400">Análisis de ventas, consumo y deuda acumulada</p>
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
            onClick={() => { exportCSV(period); showToast("Excel exportado correctamente"); }}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 active:scale-95 transition-transform shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Excel
          </button>
          <button
            onClick={() => { exportPDF(period); showToast("PDF listo para imprimir"); }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          label="Ingresos Semana"
          value={fmt(stats.ingresos)}
          sub={`${stats.prevPct}% vs semana anterior`}
        />
        <StatCard
          icon={<svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5" /></svg>}
          label="Usuarios Únicos"
          value={stats.usuarios}
          sub={periodLabel}
          subColor="text-blue-500"
        />
        <StatCard
          icon={<svg className="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m13-9l2 9M9 21h6" /></svg>}
          label="Ventas Presenciales"
          value={fmt(stats.ventas)}
          sub="POS esta semana"
          subColor="text-orange-500"
        />
        <StatCard
          icon={<svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          label="Deuda Postpago"
          value={fmt(stats.deuda)}
          sub={`${stats.deudores} usuarios con deuda`}
          subColor="text-red-500"
        />
      </div>

      {/* ── Area Chart + Pie ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Ventas Diarias</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-600 inline-block" />Prepago</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-300 inline-block" />Presencial</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gPrepago" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPresencial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#86efac" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#86efac" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="prepago"    name="Prepago"    stroke="#16a34a" strokeWidth={2.5} fill="url(#gPrepago)"    dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#16a34a" }} />
              <Area type="monotone" dataKey="presencial" name="Presencial" stroke="#86efac" strokeWidth={2}   fill="url(#gPresencial)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#86efac" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Pie ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Distribución de Pagos</h2>
          <p className="text-xs text-slate-400 mb-4">{periodLabel}</p>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                {/* FIX: usar función sin tipo explícito para evitar el error de ValueType */}
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
        </div>
      </div>

      {/* ── Bar chart + Deudores ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Productos Más Vendidos</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              {/* FIX: mismo patrón — sin tipo explícito en el formatter */}
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                formatter={(value) => [`${value} uds`, "Cantidad"]}
              />
              <Bar dataKey="qty" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 divide-y divide-slate-50">
            {products.map((p, i) => (
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
        </div>

        {/* ── Deudores ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Usuarios con Deuda</h2>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">{DEBTORS.length} usuarios</span>
          </div>
          <div className="divide-y divide-slate-50">
            {DEBTORS.map((d) => (
              <div key={d.code} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.code} · {d.days}d sin pagar</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">S/. {d.debt.toFixed(2)}</p>
                  <div className="mt-0.5 h-1.5 w-20 rounded-full bg-slate-100 ml-auto">
                    <div
                      className="h-1.5 rounded-full bg-red-400"
                      style={{ width: `${Math.min(100, (d.debt / 70) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
            <span className="text-sm font-medium text-red-700">Deuda total acumulada</span>
            <span className="text-lg font-bold text-red-600">S/. 143.50</span>
          </div>
        </div>
      </div>

      {/* ── Resumen de Transacciones ── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Resumen de Ventas por Período</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 text-left">Período</th>
                <th className="pb-2 text-right">Prepago</th>
                <th className="pb-2 text-right">Presencial</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">% Prepago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {chartData.map((row) => {
                const total = row.prepago + row.presencial;
                const pct   = Math.round((row.prepago / total) * 100);
                return (
                  <tr key={row.label} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 font-medium text-slate-700">{row.label}</td>
                    <td className="py-2.5 text-right text-green-600 font-medium">{fmt(row.prepago)}</td>
                    <td className="py-2.5 text-right text-slate-500">{fmt(row.presencial)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">{fmt(total)}</td>
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
                <td className="pt-3 text-right text-green-600">{fmt(chartData.reduce((s, r) => s + r.prepago, 0))}</td>
                <td className="pt-3 text-right text-slate-500">{fmt(chartData.reduce((s, r) => s + r.presencial, 0))}</td>
                <td className="pt-3 text-right">{fmt(chartData.reduce((s, r) => s + r.prepago + r.presencial, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}