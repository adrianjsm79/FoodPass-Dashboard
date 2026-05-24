'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '@/config/api';
import { toast } from 'sonner';

interface HeaderProps {
  isCollapsed: boolean;
}

export default function Header({ isCollapsed = false }: HeaderProps) {
  const { auth, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (auth.refreshToken) {
        await api.logout(auth.refreshToken);
      }
      logout();
      toast.success('Sesión cerrada');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      logout();
      router.push('/login');
    }
  };

  return (
    <header className={`fixed top-0 ${isCollapsed ? 'left-20' : 'left-64'} right-0 bg-white border-b border-slate-200 shadow-sm z-40 transition-all duration-300`}>
      <div className="h-20 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Bienvenido, {auth.user?.nombre_completo?.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500">{auth.user?.correo}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Salir</span>
        </button>
      </div>
    </header>
  );
}
