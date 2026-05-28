'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

import {
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';

import { api } from '@/config/api';
import { toast } from 'sonner';

interface HeaderProps {
  isCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

export default function Header({
  isCollapsed = false,
  onMobileMenuToggle,
}: HeaderProps) {

  const { auth, logout } = useAuth();

  const router = useRouter();

  const role =
    auth?.instituciones?.[0]?.rol;

  const isCajero =
    role === 'CAJERO';

  const handleLogout = async () => {

    try {

      if (auth.refreshToken) {
        await api.logout(
          auth.refreshToken
        );
      }

      logout();

      toast.success(
        'Sesión cerrada'
      );

      router.push('/login');

    } catch (error) {

      console.error(
        'Error al cerrar sesión:',
        error
      );

      logout();

      router.push('/login');
    }
  };

  return (
    <header
      className={`
        fixed top-0 right-0
        bg-white/95 backdrop-blur-sm
        border-b border-slate-200
        shadow-sm
        z-30
        transition-all duration-300

        left-0

        ${
          isCollapsed
            ? 'lg:left-20'
            : 'lg:left-64'
        }
      `}
    >

      <div
        className="
          h-16 lg:h-20
          px-4 lg:px-6
          flex items-center justify-between
        "
      >

        {/* ========================= */}
        {/* LEFT */}
        {/* ========================= */}

        <div className="flex items-center gap-4 flex-1 min-w-0">

          {/* Hamburguesa */}
          <button
            onClick={
              onMobileMenuToggle
            }
            className="
              lg:hidden
              flex items-center justify-center
              w-10 h-10
              rounded-xl
              hover:bg-slate-100
              transition
              flex-shrink-0
            "
          >
            <Menu
              size={22}
              className="text-slate-700"
            />
          </button>

          {/* Usuario */}
          <div className="min-w-0">

            <h1
              className="
                text-base
                sm:text-lg
                lg:text-xl
                font-semibold
                text-slate-900
                truncate
              "
            >
              Bienvenido,{` `}
              {
                auth.user
                  ?.nombre_completo
                  ?.split(' ')[0]
              || 'Usuario'}
            </h1>

            <div className="flex items-center gap-2 mt-1 flex-wrap">

              {/* Badge */}
              <div
                className={`
                  flex items-center gap-1
                  px-2 py-1
                  rounded-full
                  text-xs font-medium

                  ${
                    isCajero
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }
                `}
              >

                {isCajero ? (
                  <ShoppingCart size={12} />
                ) : (
                  <ShieldCheck size={12} />
                )}

                <span>
                  {isCajero
                    ? 'Cajero'
                    : 'Administrador'}
                </span>
              </div>

              {/* Correo */}
              <p
                className="
                  hidden md:block
                  text-sm text-slate-500
                  truncate
                  max-w-[250px]
                "
              >
                {auth.user?.correo}
              </p>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* RIGHT */}
        {/* ========================= */}

        <div className="flex items-center flex-shrink-0">

          <button
            onClick={handleLogout}
            className="
              flex items-center gap-2
              px-3 lg:px-4
              py-2
              bg-red-50
              text-red-600
              hover:bg-red-100
              rounded-xl
              transition-all duration-200
            "
          >
            <LogOut size={18} />

            <span
              className="
                hidden sm:block
                text-sm font-medium
              "
            >
              Salir
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}