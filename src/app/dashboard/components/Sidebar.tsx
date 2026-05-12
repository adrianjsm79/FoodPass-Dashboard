'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  Package,
  Ticket,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  institutionName: string;
}

export default function Sidebar({ institutionName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { label: 'Inicio', href: '/dashboard', icon: Home },
    { label: 'Ventas-POS', href: '/dashboard/ventas', icon: ShoppingCart },
    { label: 'Productos', href: '/dashboard/productos', icon: Package },
    { label: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
    { label: 'Usuarios', href: '/dashboard/usuarios', icon: Users },
    { label: 'Reportes', href: '/dashboard/reportes', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex-1">
            <h2 className="text-sm font-bold truncate">{institutionName}</h2>
            <p className="text-xs text-slate-400">Institución</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-700 rounded transition"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft
            size={20}
            className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    active
                      ? 'bg-green-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings Section */}
      <div className="border-t border-slate-700 p-3">
        <Link
          href="/dashboard/configuracion"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
            isActive('/dashboard/configuracion')
              ? 'bg-green-600 text-white'
              : 'hover:bg-slate-700 text-slate-300'
          }`}
          title={isCollapsed ? 'Configuración' : ''}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Configuración</span>}
        </Link>
      </div>
    </aside>
  );
}
