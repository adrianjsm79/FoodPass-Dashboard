'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/apiClient';

export interface ProductoAPI {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;               // viene como string de Postgres, parseamos abajo
  genera_ticket: boolean;
  activo: boolean;
  categoria_id: string;
  categoria_nombre: string;     // JOIN en el service
  stock_actual: number | null;  // LEFT JOIN con stock_producto
  institucion_id: string;
}

export interface CrearProductoPayload {
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  genera_ticket?: boolean;
  stock_inicial?: number;
}

export interface ActualizarProductoPayload {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  genera_ticket?: boolean;
  activo?: boolean;
  categoria_id?: string;
}

const BASE = '/api/productos';

export function useProductos() {
  const [productos, setProductos] = useState<ProductoAPI[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // solo_activos=false → trae activos e inactivos para el panel admin
      const data = await api.get<ProductoAPI[]>(`${BASE}?solo_activos=false`);
      // Postgres devuelve precio como string — normalizamos
      const normalized = data.map((p) => ({
        ...p,
        precio: Number(p.precio),
        stock_actual: p.stock_actual !== null ? Number(p.stock_actual) : null,
      }));
      setProductos(normalized);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = async (payload: CrearProductoPayload): Promise<ProductoAPI> => {
    const nuevo = await api.post<ProductoAPI>(BASE, payload);
    await cargar(); // recarga para obtener categoria_nombre y stock_actual del JOIN
    return nuevo;
  };

  const actualizar = async (id: string, payload: ActualizarProductoPayload): Promise<ProductoAPI> => {
    const updated = await api.patch<ProductoAPI>(`${BASE}/${id}`, payload);
    await cargar();
    return updated;
  };

  const desactivar = async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, activo: false } : p)));
  };

  const toggleActivo = async (id: string, activo: boolean): Promise<void> => {
    await api.patch(`${BASE}/${id}`, { activo });
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, activo } : p)));
  };

  return { productos, loading, error, cargar, crear, actualizar, desactivar, toggleActivo };
}