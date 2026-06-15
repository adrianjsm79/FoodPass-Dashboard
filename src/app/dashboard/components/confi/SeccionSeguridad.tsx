"use client";

import { useState } from "react";
import { Shield, KeyRound, LogOut, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "../../configuracion/page";

interface Props {
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

function PasswordInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SeccionSeguridad({ showToast }: Props) {
  const [actual,    setActual]    = useState("");
  const [nueva,     setNueva]     = useState("");
  const [confirma,  setConfirma]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [cerrando,  setCerrando]  = useState(false);

  // Requisitos de contraseña
  const requisitos = [
    { label: "Mínimo 8 caracteres",          ok: nueva.length >= 8 },
    { label: "Al menos una letra mayúscula",  ok: /[A-Z]/.test(nueva) },
    { label: "Al menos un número",            ok: /\d/.test(nueva) },
    { label: "Las contraseñas coinciden",     ok: nueva === confirma && confirma !== "" },
  ];
  const valida = requisitos.every((r) => r.ok) && actual !== "";

  async function handleCambiarPassword() {
    if (!valida) return;
    setSaving(true);
    try {
      await apiFetch("/auth/cambiar-contrasena", {
        method: "POST",
        body: JSON.stringify({ contrasena_actual: actual, contrasena_nueva: nueva }),
      });
      setActual(""); setNueva(""); setConfirma("");
      showToast("Contraseña actualizada correctamente");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al cambiar contraseña", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleCerrarSesiones() {
    setCerrando(true);
    try {
      // Obtiene el refreshToken guardado y lo revoca
      const raw = localStorage.getItem("foodpass_auth");
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed.refreshToken) {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: parsed.refreshToken }),
        });
      }
      showToast("Todas las sesiones cerradas. Redirigiendo…");
      setTimeout(() => {
        localStorage.removeItem("foodpass_auth");
        window.location.href = "/";
      }, 1500);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al cerrar sesiones", false);
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="space-y-5 max-w-full">

      {/* Cambiar contraseña */}
      <Card
        title="Cambiar Contraseña"
        description="Actualiza la contraseña de tu cuenta de administrador"
        icon={KeyRound}
      >
        <div className="space-y-4">
          <PasswordInput label="Contraseña actual *" value={actual} onChange={setActual} />
          <PasswordInput label="Nueva contraseña *"  value={nueva}  onChange={setNueva}  placeholder="Mínimo 8 caracteres" />
          <PasswordInput label="Confirmar nueva contraseña *" value={confirma} onChange={setConfirma} />

          {/* Requisitos */}
          {nueva !== "" && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              {requisitos.map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className={`h-4 w-4 flex items-center justify-center rounded-full text-xs ${r.ok ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                    {r.ok ? "✓" : "·"}
                  </span>
                  <span className={`text-xs ${r.ok ? "text-emerald-700" : "text-slate-400"}`}>{r.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={handleCambiarPassword} disabled={!valida || saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 active:scale-95 transition-all shadow-sm">
              {saving
                ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <KeyRound className="h-4 w-4" />}
              {saving ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </div>
        </div>
      </Card>

      {/* Sesiones */}
      <Card
        title="Sesiones Activas"
        description="Controla el acceso a tu cuenta desde otros dispositivos"
        icon={Shield}
      >
        <div className="space-y-4">
          {/* Sesión actual */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-slate-700">Sesión actual</p>
                <p className="text-xs text-slate-400">
                  {typeof window !== "undefined" ? window.location.hostname : "localhost"} · Ahora
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Activa
            </span>
          </div>

          <p className="text-xs text-slate-400">
            FoodPass usa tokens con expiración de 8 horas. Si cerraste sesión en otro dispositivo, el token dejará de funcionar automáticamente.
          </p>

          <div className="border-t border-slate-100 pt-4">
            <button onClick={handleCerrarSesiones} disabled={cerrando}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 active:scale-95 transition-all">
              {cerrando
                ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <LogOut className="h-4 w-4" />}
              {cerrando ? "Cerrando…" : "Cerrar todas las sesiones"}
            </button>
            <p className="mt-2 text-xs text-slate-400">
              Revoca el refresh token y te redirige al login.
            </p>
          </div>
        </div>
      </Card>

      {/* Info de sistema */}
      <Card
        title="Información del Sistema"
        description="Datos técnicos de la plataforma"
        icon={Shield}
      >
        <div className="space-y-2">
          {[
            ["Plataforma",   "FoodPass Dashboard"],
            ["Versión",      "1.0.0-beta"],
            ["Entorno",      process.env.NODE_ENV ?? "production"],
            ["API Base",     process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-50 pb-2 text-sm">
              <span className="text-slate-400">{k}</span>
              <span className="font-mono text-xs text-slate-600 bg-slate-50 rounded px-2 py-0.5">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}