'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/apiClient';

export interface CategoriaAPI {
  id: string;
  nombre: string;
  icono: string | null;
  activo: boolean;
  institucion_id: string;
}

export interface CategoriaPayload {
  nombre: string;
  icono?: string | null;
}

// Ajusta si tus rutas tienen prefijo distinto, ej: /api/v1/categorias
const BASE = '/api/categorias';

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaAPI[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<CategoriaAPI[]>(BASE);
      setCategorias(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = async (payload: CategoriaPayload): Promise<CategoriaAPI> => {
    const nueva = await api.post<CategoriaAPI>(BASE, payload);
    setCategorias((prev) => [...prev, nueva]);
    return nueva;
  };

  const actualizar = async (id: string, payload: Partial<CategoriaPayload>): Promise<CategoriaAPI> => {
    const updated = await api.patch<CategoriaAPI>(`${BASE}/${id}`, payload);
    setCategorias((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const desactivar = async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  };

  return { categorias, loading, error, cargar, crear, actualizar, desactivar };
}