"use client";

import { useState } from "react";
import { Building2, Clock, Users, Save } from "lucide-react";
import type { ConfigInstitucion } from "../../configuracion/page";
import { apiFetch, getInstitucionId } from "../../configuracion/page";

interface Props {
  config: ConfigInstitucion;
  setConfig: (c: ConfigInstitucion) => void;
  showToast: (msg: string, ok?: boolean) => void;
}

// ── Helpers UI ─────────────────────────────────────────────────────────────────
function Card({ title, description, icon: Icon, children }: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
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

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${checked ? "bg-emerald-500" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </label>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SeccionGeneral({ config, setConfig, showToast }: Props) {
  const [saving, setSaving] = useState(false);
  const [ventasAnonimas, setVentasAnonimas] = useState(config.permite_ventas_anonimas);

  async function handleSave() {
    setSaving(true);
    try {
      const id = getInstitucionId();
      const updated = await apiFetch<ConfigInstitucion>(
        `/instituciones/${id}/configuracion`,
        {
          method: "PATCH",
          body: JSON.stringify({ permite_ventas_anonimas: ventasAnonimas }),
        }
      );
      setConfig({ ...config, ...updated });
      showToast("Configuración general guardada");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al guardar", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-full">

      {/* Información de la institución */}
      <Card
        title="Información de la Institución"
        description="Datos básicos que se muestran en tickets y reportes"
        icon={Building2}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Nombre de la institución</label>
            <input
              defaultValue=""
              placeholder="Ej. Universidad Nacional de Trujillo"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1 text-xs text-slate-400">Este campo se gestiona desde el panel de Superadmin.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Correo de contacto</label>
            <input
              defaultValue=""
              placeholder="comedor@institucion.edu.pe"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      </Card>

      {/* Horario del comedor */}
      <Card
        title="Horario de Atención"
        description="Referencial — se muestra en la app de usuarios"
        icon={Clock}
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { dia: "Lunes – Viernes", apertura: "07:00", cierre: "18:00" },
            { dia: "Sábado",          apertura: "07:00", cierre: "13:00" },
          ].map((h) => (
            <div key={h.dia} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h.dia}</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-400">Apertura</label>
                  <input type="time" defaultValue={h.apertura}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-400" />
                </div>
                <span className="mt-4 text-slate-300">→</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-400">Cierre</label>
                  <input type="time" defaultValue={h.cierre}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">Próximamente estos horarios se sincronizarán con la app de usuarios.</p>
      </Card>

      {/* Ventas anónimas */}
      <Card
        title="Acceso y Ventas"
        description="Controla quién puede comprar en el comedor"
        icon={Users}
      >
        <Toggle
          checked={ventasAnonimas}
          onChange={setVentasAnonimas}
          label="Permitir ventas sin cuenta registrada"
          description="Si está activo, el cajero puede registrar ventas en efectivo sin asociarlas a un usuario."
        />
      </Card>

      {/* Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 active:scale-95 transition-all shadow-sm"
        >
          {saving
            ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <Save className="h-4 w-4" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}