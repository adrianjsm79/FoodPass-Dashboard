"use client";

import { useState } from "react";
import { CreditCard, AlertTriangle, DollarSign, Save } from "lucide-react";
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

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </label>
  );
}

export default function SeccionPagos({ config, setConfig, showToast }: Props) {
  const [permitePostpago,      setPermitePostpago]      = useState(config.permite_postpago);
  const [requiereAprobacion,   setRequiereAprobacion]   = useState(config.requiere_aprobacion_postpago);
  const [limiteDefault,        setLimiteDefault]        = useState(500);
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
            permite_postpago:             permitePostpago,
            requiere_aprobacion_postpago: requiereAprobacion,
            ajustes_extra: { limite_credito_default: limiteDefault },
          }),
        }
      );
      setConfig({ ...config, ...updated });
      showToast("Configuración de pagos guardada");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al guardar", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-full">

      {/* Postpago */}
      <Card
        title="Modalidad Postpago"
        description="Permite a usuarios seleccionados consumir y pagar después"
        icon={CreditCard}
      >
        <div className="space-y-5">
          <Toggle
            checked={permitePostpago}
            onChange={setPermitePostpago}
            label="Habilitar postpago en la institución"
            description="Los usuarios con modalidad POSTPAGO podrán consumir con crédito y saldar su deuda luego."
          />

          {permitePostpago && (
            <div className="ml-0 space-y-5 border-t border-slate-50 pt-5">
              <Toggle
                checked={requiereAprobacion}
                onChange={setRequiereAprobacion}
                label="Requerir aprobación manual para postpago"
                description="Cuando un usuario solicita postpago, el admin debe aprobarlo antes de activarlo."
              />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Límite de crédito por defecto (S/.)
                </label>
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">S/.</span>
                  <input
                    type="number"
                    value={limiteDefault}
                    min={0}
                    step={50}
                    onChange={(e) => setLimiteDefault(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Al crear un usuario con modalidad POSTPAGO sin especificar límite, se usará este valor.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Métodos de pago aceptados */}
      <Card
        title="Métodos de Pago Aceptados"
        description="Qué métodos puede usar el cajero al cobrar"
        icon={DollarSign}
      >
        <div className="space-y-3">
          {[
            { id: "efectivo", label: "Efectivo",  desc: "Cobro en caja directamente" },
            { id: "yape",     label: "Yape",       desc: "QR de Yape en pantalla de caja" },
            { id: "plin",     label: "Plin",       desc: "QR de Plin en pantalla de caja" },
            { id: "tarjeta",  label: "Tarjeta",    desc: "POS físico (requiere terminal)" },
          ].map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-700">{m.label}</p>
                <p className="text-xs text-slate-400">{m.desc}</p>
              </div>
              <input type="checkbox" defaultChecked={m.id !== "tarjeta"}
                className="h-4 w-4 rounded accent-emerald-600" />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">La configuración de métodos de pago se sincroniza próximamente con el módulo POS.</p>
      </Card>

      {/* Aviso */}
      {!permitePostpago && (
        <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 px-5 py-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <p className="text-sm text-amber-700">
            El postpago está desactivado. Los usuarios existentes con modalidad POSTPAGO no podrán realizar nuevas compras hasta que se reactive.
          </p>
        </div>
      )}

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