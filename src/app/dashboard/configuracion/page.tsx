"use client";

import { useState, useEffect } from "react";
import { Settings, Building2, CreditCard, Ticket, Shield, ChevronRight } from "lucide-react";
import SeccionGeneral from "../components/confi/SeccionGeneral";
import SeccionPagos from "../components/confi/SeccionPagos";
import SeccionTickets from "../components/confi/SeccionTickets";
import SeccionSeguridad from "../components/confi/SeccionSeguridad";


// ── Tipos ──────────────────────────────────────────────────────────────────────
export interface ConfigInstitucion {
  formato_ticket: string;
  horas_expiracion_ticket: number;
  permite_postpago: boolean;
  permite_ventas_anonimas: boolean;
  requiere_aprobacion_postpago: boolean;
  ajustes_extra: Record<string, unknown>;
}

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "general",   label: "General",   icon: Building2  },
  { id: "pagos",     label: "Pagos",     icon: CreditCard },
  { id: "tickets",   label: "Tickets",   icon: Ticket     },
  { id: "seguridad", label: "Seguridad", icon: Shield     },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getAuth() {
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
      institucionNombre: inst?.nombre ?? "",
    };
  } catch { return null; }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error("Sin sesión activa");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.accessToken}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Error del servidor");
  }
  return res.json();
}

export function getInstitucionId() {
  return getAuth()?.institucionId ?? "";
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const [tab, setTab]           = useState<TabId>("general");
  const [config, setConfig]     = useState<ConfigInstitucion | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [institucionNombre, setInstitucionNombre] = useState("");

  useEffect(() => {
    const auth = getAuth();
    setInstitucionNombre(auth?.institucionNombre ?? "Mi Institución");
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    setError(null);
    try {
      const id = getInstitucionId();
      const data = await apiFetch<ConfigInstitucion>(
        `/instituciones/${id}/configuracion`
      );
      setConfig(data);
    } catch (e: unknown) {
      // Si el endpoint aún no existe, usamos valores por defecto
      setConfig({
        formato_ticket: "QR",
        horas_expiracion_ticket: 48,
        permite_postpago: false,
        permite_ventas_anonimas: true,
        requiere_aprobacion_postpago: true,
        ajustes_extra: {},
      });
      if (e instanceof Error && !e.message.includes("404")) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-6 z-[100] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-xl transition-all ${toast.ok ? "bg-emerald-600" : "bg-red-500"}`}>
          <span>{toast.ok ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Settings className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
            <p className="text-sm text-slate-500">{institucionNombre}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-8 py-3 text-xs text-slate-400">
        <span>Configuración</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-slate-600">{activeTab.label}</span>
      </div>

      {/* Content */}
      <div className="px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Cargando configuración…
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-600">
            {error}
            <button onClick={fetchConfig} className="ml-3 underline">Reintentar</button>
          </div>
        ) : config ? (
          <>
            {tab === "general"   && <SeccionGeneral   config={config} setConfig={setConfig} showToast={showToast} />}
            {tab === "pagos"     && <SeccionPagos     config={config} setConfig={setConfig} showToast={showToast} />}
            {tab === "tickets"   && <SeccionTickets   config={config} setConfig={setConfig} showToast={showToast} />}
            {tab === "seguridad" && <SeccionSeguridad showToast={showToast} />}
          </>
        ) : null}
      </div>
    </div>
  );
}