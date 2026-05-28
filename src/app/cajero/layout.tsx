'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

import SidebarCajero from './components/SidebarCajero';
import HeaderCajero from './components/HeaderCajero';

import { toast } from 'sonner';

export default function CajeroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { auth, isLoading } = useAuth();

  const [authorized, setAuthorized] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Verificar login
    if (!auth?.accessToken) {
      router.push('/login');
      return;
    }

    // Verificar instituciones
    if (!auth?.instituciones?.length) {
      toast.error('No tienes acceso');
      router.push('/login');
      return;
    }

    const role = auth.instituciones[0]?.rol;

    // Solo cajero
    if (role !== 'CAJERO') {
      router.push('/dashboard');
      return;
    }

    setAuthorized(true);

  }, [auth, isLoading, router]);

  if (isLoading || !authorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const institutionName =
    auth?.instituciones?.[0]?.nombre || 'Institución';

  return (
    <div className="flex h-screen bg-slate-50">

      {/* SIDEBAR */}
      <SidebarCajero
        institutionName={institutionName}
        isCollapsed={isCollapsed}
        onCollapseChange={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      {/* CONTENT */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}
        `}
      >

        {/* HEADER */}
        <HeaderCajero
          isCollapsed={isCollapsed}
          onMobileMenuToggle={() =>
            setIsMobileMenuOpen(!isMobileMenuOpen)
          }
        />

        {/* MAIN */}
        <main className="flex-1 overflow-auto mt-20 p-4 md:p-6">
          {children}
        </main>

      </div>
    </div>
  );
}