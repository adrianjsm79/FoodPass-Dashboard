"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ModalidadPago = "PREPAGO" | "POSTPAGO";
type RolNombre = "USUARIO" | "CAJERO" | "ADMIN_INSTITUCION";

interface Usuario {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono?: string;
  rol: RolNombre;
  modalidad_pago: ModalidadPago;
  activo: boolean;
  creado_en: string;
  saldo_deuda?: number;
  limite_credito?: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────
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

function getInstitucionId(): string {
  return getAuth()?.institucionId ?? "";
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error("No hay sesión activa. Por favor inicia sesión.");

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
  return res.json() as Promise<T>;
}

// ── Helpers visuales ───────────────────────────────────────────────────────────
const ROL_LABEL: Record<RolNombre, string> = {
  USUARIO:           "Estudiante / Usuario",
  CAJERO:            "Cajero",
  ADMIN_INSTITUCION: "Administrador",
};

const ROL_COLORS: Record<RolNombre, string> = {
  USUARIO:           "bg-blue-100 text-blue-700",
  CAJERO:            "bg-purple-100 text-purple-700",
  ADMIN_INSTITUCION: "bg-orange-100 text-orange-700",
};

const MODALIDAD_COLORS: Record<ModalidadPago, string> = {
  PREPAGO:  "bg-green-100 text-green-700",
  POSTPAGO: "bg-amber-100 text-amber-700",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = ["#10b981","#f59e0b","#8b5cf6","#3b82f6","#ec4899","#06b6d4","#f97316"];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatBalance(u: Usuario) {
  if (u.modalidad_pago === "POSTPAGO") {
    const deuda = parseFloat(String(u.saldo_deuda ?? 0));
    if (deuda > 0)
      return <span className="font-semibold text-red-500">Debe S/. {deuda.toFixed(2)}</span>;
    return <span className="font-semibold text-slate-500">Sin deuda</span>;
  }
  return <span className="font-semibold text-slate-700">—</span>;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function Avatar({ name, id }: { name: string; id: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: avatarColor(id) }}
    >
      {initials(name)}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">{icon}{label}</div>
      <div className={`mt-2 text-2xl sm:text-3xl font-bold ${accent ? "text-red-500" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}

// ── Modal base: bottom-sheet en móvil, centrado en sm+ ────────────────────────
function ModalWrapper({ children, maxW = "max-w-md" }: { children: React.ReactNode; maxW?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4 backdrop-blur-sm">
      <div className={`w-full ${maxW} rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

// ── Modal: Crear Usuario ───────────────────────────────────────────────────────
function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (u: Usuario) => void;
}) {
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    rol_nombre: "USUARIO" as RolNombre,
    modalidad_pago: "PREPAGO" as ModalidadPago,
    limite_credito: 500,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    setError(null);
    if (!form.nombre_completo.trim() || !form.correo.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const institucionId = getInstitucionId();
      const created = await apiFetch<Usuario>(
        `/instituciones/${institucionId}/usuarios`,
        { method: "POST", body: JSON.stringify(form) }
      );
      onCreated(created);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">Nuevo Usuario</h2>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 px-5 sm:px-6 py-5">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre completo *</label>
          <input value={form.nombre_completo} onChange={(e) => set("nombre_completo", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            placeholder="Ej. Ana Torres Mendoza" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Correo electrónico *</label>
          <input type="email" value={form.correo} onChange={(e) => set("correo", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            placeholder="usuario@institucion.edu.pe" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Teléfono</label>
          <input value={form.telefono} onChange={(e) => set("telefono", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            placeholder="9XXXXXXXX" />
        </div>
        {/* Rol y modalidad: apilados en móvil, lado a lado en sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Rol</label>
            <select value={form.rol_nombre} onChange={(e) => set("rol_nombre", e.target.value as RolNombre)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500">
              <option value="USUARIO">Estudiante / Usuario</option>
              <option value="CAJERO">Cajero</option>
              <option value="ADMIN_INSTITUCION">Administrador</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Modalidad</label>
            <select value={form.modalidad_pago} onChange={(e) => set("modalidad_pago", e.target.value as ModalidadPago)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500">
              <option value="PREPAGO">Prepago</option>
              <option value="POSTPAGO">Postpago</option>
            </select>
          </div>
        </div>
        {form.modalidad_pago === "POSTPAGO" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Límite de crédito (S/.)</label>
            <input type="number" value={form.limite_credito} onChange={(e) => set("limite_credito", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
          </div>
        )}
        <p className="text-xs text-slate-400">
          🔑 Contraseña temporal: <strong>FoodPass2025!</strong> — el usuario podrá cambiarla al ingresar.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 px-5 sm:px-6 py-4">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 active:scale-95 transition-transform">
          {loading && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
          {loading ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Modal: Ver detalle ─────────────────────────────────────────────────────────
function ViewModal({ user, onClose }: { user: Usuario; onClose: () => void }) {
  return (
    <ModalWrapper maxW="max-w-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">Detalle de Usuario</h2>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-5 sm:px-6 py-5 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.nombre_completo} id={user.id} />
          <div>
            <p className="font-bold text-slate-800">{user.nombre_completo}</p>
            <p className="text-xs text-slate-500 break-all">{user.correo}</p>
          </div>
        </div>
        {[
          ["Teléfono",   user.telefono ?? "—"],
          ["Rol",        ROL_LABEL[user.rol]],
          ["Modalidad",  user.modalidad_pago],
          ["Deuda",      user.saldo_deuda != null ? `S/. ${parseFloat(String(user.saldo_deuda)).toFixed(2)}` : "—"],
          ["Límite",     user.limite_credito != null ? `S/. ${parseFloat(String(user.limite_credito)).toFixed(2)}` : "—"],
          ["Estado",     user.activo ? "Activo" : "Inactivo"],
          ["Creado",     new Date(user.creado_en).toLocaleDateString("es-PE")],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-slate-50 pb-2 text-sm">
            <span className="text-slate-500">{k}</span>
            <span className="font-medium text-slate-700 text-right ml-4">{v}</span>
          </div>
        ))}
      </div>
      <div className="px-5 sm:px-6 py-4 text-right">
        <button onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
          Cerrar
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Modal: Desactivar ──────────────────────────────────────────────────────────
function DeleteModal({ user, onClose, onConfirm }: { user: Usuario; onClose: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }
  return (
    <ModalWrapper maxW="max-w-sm">
      <div className="px-5 sm:px-6 py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Desactivar acceso</h3>
        <p className="mt-2 text-sm text-slate-500">
          El usuario <strong>{user.nombre_completo}</strong> perderá acceso a la institución. Su cuenta global no se elimina.
        </p>
      </div>
      <div className="flex gap-3 border-t border-slate-100 px-5 sm:px-6 py-4">
        <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={handle} disabled={loading}
          className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 active:scale-95 transition-transform">
          {loading ? "Desactivando…" : "Desactivar"}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [users, setUsers]             = useState<Usuario[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [filterMod, setFilterMod]     = useState<"todos" | ModalidadPago>("todos");
  const [filterRol, setFilterRol]     = useState<"todos" | RolNombre>("todos");
  const [modalNew, setModalNew]       = useState(false);
  const [modalView, setModalView]     = useState<Usuario | null>(null);
  const [modalDelete, setModalDelete] = useState<Usuario | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  // ── Fetch ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const institucionId = getInstitucionId();
      const data = await apiFetch<Usuario[]>(`/instituciones/${institucionId}/usuarios`);
      setUsers(data);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Toast ──
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Handlers ──
  function handleCreated(u: Usuario) {
    setUsers((p) => [u, ...p]);
    setModalNew(false);
    showToast(`Usuario "${u.nombre_completo}" creado correctamente`);
  }

  async function handleDesactivar() {
    if (!modalDelete) return;
    try {
      const institucionId = getInstitucionId();
      await apiFetch(`/instituciones/${institucionId}/usuarios/${modalDelete.id}`, { method: "DELETE" });
      setUsers((p) => p.map((u) => u.id === modalDelete.id ? { ...u, activo: false } : u));
      showToast("Acceso revocado");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al desactivar");
    } finally {
      setModalDelete(null);
    }
  }

  function handleExport() {
    const headers = ["Nombre","Correo","Teléfono","Rol","Modalidad","Deuda","Estado","Creado"];
    const rows = filtered.map((u) => [
      u.nombre_completo, u.correo, u.telefono ?? "", ROL_LABEL[u.rol],
      u.modalidad_pago, parseFloat(String(u.saldo_deuda ?? 0)).toFixed(2),
      u.activo ? "Activo" : "Inactivo",
      new Date(u.creado_en).toLocaleDateString("es-PE"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "usuarios.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exportado como usuarios.csv");
  }

  // ── Stats ──
  const totalUsers  = users.length;
  const activos     = users.filter((u) => u.activo).length;
  const totalDeuda  = users.filter((u) => parseFloat(String(u.saldo_deuda ?? 0)) > 0).reduce((s, u) => s + parseFloat(String(u.saldo_deuda ?? 0)), 0);
  const postpago    = users.filter((u) => u.modalidad_pago === "POSTPAGO").length;

  // ── Filter ──
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const ms = !q || u.nombre_completo.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q);
    const mm = filterMod === "todos" || u.modalidad_pago === filterMod;
    const mr = filterRol === "todos" || u.rol === filterRol;
    return ms && mm && mr;
  });

  // ── Render ──
  return (
    /* Padding adaptativo */
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6">

      {/* Toast */}
      {toast && (
        <div className="fixed right-3 sm:right-6 top-4 sm:top-6 z-[100] rounded-xl bg-slate-800 px-4 sm:px-5 py-3 text-sm font-medium text-white shadow-xl max-w-[calc(100vw-1.5rem)] sm:max-w-none">
          ✓ {toast}
        </div>
      )}

      {/* Modals */}
      {modalNew    && <CreateModal onClose={() => setModalNew(false)} onCreated={handleCreated} />}
      {modalView   && <ViewModal   user={modalView}   onClose={() => setModalView(null)} />}
      {modalDelete && <DeleteModal user={modalDelete} onClose={() => setModalDelete(null)} onConfirm={handleDesactivar} />}

      {/* Header: título + botón alineados en móvil */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">FoodPass · Gestión de Comedor</p>
        </div>
        {/* Botón "Nuevo Usuario" visible en el header solo en móvil */}
        <button
          onClick={() => setModalNew(true)}
          className="flex sm:hidden items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 shadow-sm active:scale-95 transition-transform"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </div>

      {/* Stats — 2 columnas en móvil/tablet, 4 en lg+ */}
      <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6 0H9m6 0a4 4 0 01-4 4H9a4 4 0 01-4-4" /></svg>}
          label="Total Usuarios" value={totalUsers} />
        <StatCard icon={<svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Activos" value={activos} />
        <StatCard icon={<svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          label="Deuda Total" value={`S/. ${totalDeuda.toFixed(2)}`} accent />
        <StatCard icon={<svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
          label="Postpago" value={postpago} />
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* Toolbar ── se apila en móvil */}
        <div className="border-b border-slate-100 px-4 sm:px-5 py-3 sm:py-4 space-y-3">
          {/* Fila 1: título + botones de acción (visibles en sm+) */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm sm:text-base font-semibold text-slate-800">Gestión de Usuarios</h2>
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={fetchUsers} title="Recargar"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recargar
              </button>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar
              </button>
              <button onClick={() => setModalNew(true)}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 active:scale-95 transition-transform shadow-sm">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Usuario
              </button>
            </div>
            {/* En móvil: iconos compactos de recargar y exportar */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button onClick={fetchUsers} title="Recargar"
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={handleExport} title="Exportar"
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Fila 2: búsqueda y filtros — columna en móvil, fila en sm+ */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o correo"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
            </div>
            <select value={filterMod} onChange={(e) => setFilterMod(e.target.value as typeof filterMod)}
              className="w-full sm:w-auto rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-green-400 bg-white">
              <option value="todos">Todas las modalidades</option>
              <option value="PREPAGO">Prepago</option>
              <option value="POSTPAGO">Postpago</option>
            </select>
            <select value={filterRol} onChange={(e) => setFilterRol(e.target.value as typeof filterRol)}
              className="w-full sm:w-auto rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-green-400 bg-white">
              <option value="todos">Todos los roles</option>
              <option value="USUARIO">Estudiante / Usuario</option>
              <option value="CAJERO">Cajero</option>
              <option value="ADMIN_INSTITUCION">Administrador</option>
            </select>
          </div>
        </div>

        {/* Estados de carga / error */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Cargando usuarios…
          </div>
        )}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <p className="text-sm text-red-500">{fetchError}</p>
            <button onClick={fetchUsers} className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">
              Reintentar
            </button>
          </div>
        )}

        {/* Table con scroll horizontal en pantallas pequeñas */}
        {!loading && !fetchError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: "640px" }}>
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 sm:px-5 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Modalidad</th>
                  <th className="px-4 py-3">Deuda</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">No se encontraron usuarios.</td></tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.nombre_completo} id={u.id} />
                        <div>
                          <p className="font-medium text-slate-800 leading-tight">{u.nombre_completo}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-none">{u.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={ROL_LABEL[u.rol]} className={ROL_COLORS[u.rol]} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={u.modalidad_pago} className={MODALIDAD_COLORS[u.modalidad_pago]} />
                    </td>
                    <td className="px-4 py-3">{formatBalance(u)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(u.creado_en).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${u.activo ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? "bg-green-500" : "bg-slate-400"}`} />
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModalView(u)} title="Ver detalle"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {u.activo && (
                          <button onClick={() => setModalDelete(u)} title="Desactivar"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer — apilado en móvil */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1 border-t border-slate-100 px-4 sm:px-5 py-3 text-xs text-slate-400">
          <span>Mostrando {filtered.length} de {users.length} usuarios</span>
          <span>FoodPass · Gestión de Comedor</span>
        </div>
      </div>
    </div>
  );
}