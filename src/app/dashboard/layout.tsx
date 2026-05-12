'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAuthorized } from '@/lib/auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { auth, isLoading } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Verificar si está autenticado
    if (!auth.accessToken) {
      router.push('/login');
      return;
    }

    // Verificar si tiene instituciones y si al menos una está autorizada
    if (
      !auth.instituciones ||
      auth.instituciones.length === 0 ||
      !auth.instituciones.some((inst) => isUserAuthorized(inst.rol))
    ) {
      toast.error('No estás autorizado para acceder al panel');
      router.push('/login');
      return;
    }

    setAuthorized(true);
  }, [auth, isLoading, router]);

  if (isLoading || !authorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const institutionName = auth.instituciones?.[0]?.nombre || 'Institución';

  return (
    <div className="flex h-screen">
      <Sidebar institutionName={institutionName} isCollapsed={isCollapsed} onCollapseChange={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header />
        <main className="flex-1 overflow-auto bg-slate-50 mt-20 p-6">{children}</main>
      </div>
    </div>
  );
}
