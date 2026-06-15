'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BarChart3,
  Ticket,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarCajeroProps {
  institutionName: string;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  userRole?: string | null;
}

export default function SidebarCajero({
  institutionName,
  isCollapsed,
  onCollapseChange,
  isMobileMenuOpen,
  onMobileMenuClose,
  userRole,
}: SidebarCajeroProps) {

  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/cajero',
      icon: BarChart3,
    },
    {
      label: 'Tickets',
      href: '/cajero/tickets',
      icon: Ticket,
    },
    {
      label: 'POS',
      href: '/cajero/pos',
      icon: ShoppingCart,
    },
  ];

  // =========================
  // ACTIVE ROUTE
  // =========================

  const isActive = (href: string) => {

    // Dashboard SOLO en /cajero
    if (href === '/cajero') {
      return pathname === '/cajero';
    }

    // Rutas hijas
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ========================= */}
      {/* OVERLAY MOBILE */}
      {/* ========================= */}

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* ========================= */}
      {/* SIDEBAR */}
      {/* ========================= */}

      <aside
        className={`
          fixed top-0 left-0
          h-screen
          bg-gradient-to-b from-slate-900 to-slate-800
          border-r border-slate-700
          text-white
          flex flex-col
          z-50
          transition-all duration-300 ease-in-out

          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}

          w-64

          ${
            isMobileMenuOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="h-16 min-h-16 border-b border-slate-700 px-4 flex items-center justify-between">

          {/* LOGO */}
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold truncate text-white">
                {institutionName}
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                {userRole || 'CAJERO'}
              </p>
            </div>
          )}

          {/* DESKTOP COLLAPSE */}
          <button
            onClick={() =>
              onCollapseChange(!isCollapsed)
            }
            className="
              hidden lg:flex
              items-center justify-center
              w-9 h-9
              rounded-lg
              hover:bg-slate-700
              transition
            "
          >
            {isCollapsed ? (
              <ChevronRight
                size={18}
                className="text-slate-300"
              />
            ) : (
              <ChevronLeft
                size={18}
                className="text-slate-300"
              />
            )}
          </button>

          {/* MOBILE CLOSE */}
          <button
            onClick={onMobileMenuClose}
            className="
              lg:hidden
              flex items-center justify-center
              w-9 h-9
              rounded-lg
              hover:bg-slate-700
              transition
            "
          >
            <X
              size={18}
              className="text-slate-300"
            />
          </button>
        </div>

        {/* ========================= */}
        {/* NAVIGATION */}
        {/* ========================= */}

        <nav className="flex-1 overflow-y-auto p-3">

          <ul className="space-y-2">

            {menuItems.map((item) => {

              const Icon = item.icon;

              const active = isActive(item.href);

              return (
                <li key={item.href}>

                  <Link
                    href={item.href}
                    onClick={() => {

                      // Cerrar menu en mobile
                      if (isMobileMenuOpen) {
                        onMobileMenuClose();
                      }
                    }}
                    className={`
                      group
                      flex items-center
                      gap-3
                      rounded-xl
                      px-3 py-3
                      transition-all duration-200

                      ${
                        active
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }
                    `}
                  >

                    <Icon
                      size={20}
                      className={`
                        flex-shrink-0
                        ${
                          active
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-white'
                        }
                      `}
                    />

                    {!isCollapsed && (
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ========================= */}
        {/* FOOTER */}
        {/* ========================= */}

        <div className="border-t border-slate-700 p-4">

          {!isCollapsed ? (

            <div className="bg-slate-700/50 rounded-xl p-3">

              <p className="text-sm font-semibold text-white">
                Panel Cajero
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Gestión operativa del comedor
              </p>
            </div>

          ) : (

            <div className="flex justify-center">
              <ShoppingCart
                size={20}
                className="text-slate-400"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}