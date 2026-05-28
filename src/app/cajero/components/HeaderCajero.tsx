'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

import {
  Menu,
  LogOut,
  ShoppingCart,
} from 'lucide-react';

import { toast } from 'sonner';

import { api } from '@/config/api';

interface HeaderCajeroProps {
  isCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

export default function HeaderCajero({
  isCollapsed,
  onMobileMenuToggle,
}: HeaderCajeroProps) {

  const router = useRouter();

  const { auth, logout } = useAuth();

  const handleLogout = async () => {
    try {

      // Logout backend
      if (auth?.refreshToken) {
        await api.logout(auth.refreshToken);
      }

      // Limpiar auth
      logout();

      toast.success('Sesión cerrada');

      // Redirigir
      router.push('/login');

    } catch (error) {

      console.error(error);

      logout();

      router.push('/login');
    }
  };

  const userName =
    auth?.user?.nombre_completo?.split(' ')[0] || 'Cajero';

  const institutionName =
    auth?.instituciones?.[0]?.nombre || 'Institución';

  return (
    <header
      className={`
        fixed top-0 right-0
        h-20
        bg-white
        border-b border-slate-200
        shadow-sm
        z-30
        transition-all duration-300
        ${isCollapsed ? 'md:left-20' : 'md:left-64'}
        left-0
      `}
    >

      <div className="h-full px-4 md:px-6 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          {/* HAMBURGUESA */}
          <button
            onClick={onMobileMenuToggle}
            className="
              md:hidden
              p-2
              rounded-lg
              hover:bg-slate-100
              transition
            "
          >
            <Menu
              size={24}
              className="text-slate-700"
            />
          </button>

          {/* INFO */}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800">
              Bienvenido, {userName}
            </h1>

            <div className="flex items-center gap-2 mt-1">

              <span className="
                inline-flex items-center gap-1
                px-2 py-1
                rounded-full
                bg-green-100
                text-green-700
                text-xs font-medium
              ">
                <ShoppingCart size={12} />
                Cajero
              </span>

              <span className="text-sm text-slate-500 hidden sm:block">
                {institutionName}
              </span>

            </div>
          </div>
        </div>

        {/* RIGHT */}
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-2
            px-3 py-2
            rounded-lg
            bg-red-50
            hover:bg-red-100
            text-red-600
            transition
          "
        >
          <LogOut size={18} />

          <span className="hidden md:block text-sm font-medium">
            Salir
          </span>
        </button>

      </div>
    </header>
  );
}