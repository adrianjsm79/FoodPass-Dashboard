"use client";

import { useState } from "react";
import { Ticket, Clock, QrCode, Save } from "lucide-react";
import type { ConfigInstitucion } from "../../configuracion/page";
import { apiFetch, getInstitucionId } from "../../configuracion/page";

interface Props {
  config: ConfigInstitucion;
  setConfig: (c: ConfigInstitucion) => void;
  showToast: (msg: string, ok?: boolean) => void;
}

function Card({ title, description, icon: Icon, children }: {
  title: string; description: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-slate-50 px-6 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

const HORAS_OPCIONES = [
  { value: 6,   label: "6 horas" },
  { value: 12,  label: "12 horas" },
  { value: 24,  label: "24 horas (1 día)" },
  { value: 48,  label: "48 horas (2 días)" },
  { value: 72,  label: "72 horas (3 días)" },
  { value: 168, label: "7 días" },
];

export default function SeccionTickets({ config, setConfig, showToast }: Props) {
  const [formato,     setFormato]     = useState(config.formato_ticket);
  const [horas,       setHoras]       = useState(config.horas_expiracion_ticket);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const id = getInstitucionId();
      const updated = await apiFetch<ConfigInstitucion>(
        `/instituciones/${id}/configuracion`,
        {
          method: "PATCH",
          body: JSON.stringify({
            formato_ticket:           formato,
            horas_expiracion_ticket:  horas,
          }),
        }
      );
      setConfig({ ...config, ...updated });
      showToast("Configuración de tickets guardada");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al guardar", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-full">

      {/* Formato */}
      <Card
        title="Formato de Ticket"
        description="Cómo se presenta el ticket al usuario en la app"
        icon={QrCode}
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "QR",      label: "Código QR",      desc: "Escaneo rápido con cámara" },
            { value: "BARCODE", label: "Código de barras", desc: "Compatible con lectores USB" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFormato(f.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                formato === f.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200"
              }`}
            >
              <div className={`mb-2 text-2xl`}>
                {f.value === "QR" ? "⬛" : "▊▌▌▐▌▌▐▌▌▐"}
              </div>
              <p className={`text-sm font-semibold ${formato === f.value ? "text-emerald-700" : "text-slate-700"}`}>
                {f.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Expiración */}
      <Card
        title="Expiración de Tickets"
        description="Tiempo de validez desde que se genera el ticket"
        icon={Clock}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">Válido por</label>
            <div className="grid grid-cols-3 gap-2">
              {HORAS_OPCIONES.map((op) => (
                <button
                  key={op.value}
                  onClick={() => setHoras(op.value)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    horas === op.value
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-400 mb-1">Vista previa del comportamiento</p>
            <p className="text-sm text-slate-700">
              Un ticket generado hoy a las{" "}
              <span className="font-semibold text-slate-900">
                {new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
              </span>{" "}
              expirará el{" "}
              <span className="font-semibold text-emerald-600">
                {new Date(Date.now() + horas * 3600000).toLocaleString("es-PE", {
                  weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Info sobre estados */}
      <Card
        title="Estados de Ticket"
        description="Ciclo de vida de los tickets en el sistema"
        icon={Ticket}
      >
        <div className="space-y-2">
          {[
            { estado: "VIGENTE",  color: "bg-emerald-100 text-emerald-700", desc: "El ticket está activo y puede ser canjeado" },
            { estado: "CANJEADO", color: "bg-blue-100 text-blue-700",      desc: "El ticket fue escaneado y el producto entregado" },
            { estado: "EXPIRADO", color: "bg-slate-100 text-slate-500",    desc: "El ticket superó su tiempo de validez sin ser canjeado" },
          ].map((e) => (
            <div key={e.estado} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.color}`}>
                {e.estado}
              </span>
              <p className="text-xs text-slate-500">{e.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          El job de expiración corre automáticamente cada hora en el servidor.
        </p>
      </Card>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 active:scale-95 transition-all shadow-sm">
          {saving
            ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <Save className="h-4 w-4" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}