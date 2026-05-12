export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    nombre_completo: string;
    correo: string;
  } | null;
  instituciones: Array<{
    id: string;
    nombre: string;
    slug: string;
    logo_url?: string;
    rol: string;
  }> | null;
}

export const setAuthStorage = (auth: AuthState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('foodpass_auth', JSON.stringify(auth));
  }
};

export const getAuthStorage = (): AuthState | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('foodpass_auth');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const clearAuthStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('foodpass_auth');
    localStorage.removeItem('foodpass_user');
  }
};

export const isUserAuthorized = (rol: string): boolean => {
  // Solo USUARIO no tiene acceso. Todos los demás roles (CAJERO, ADMIN_INSTITUCION, SUPERADMIN) si
  return rol !== 'USUARIO';
};
