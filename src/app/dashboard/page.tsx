'use client';

import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from './components/DashboardHeader';
import WeeklyRevenueChart from './components/WeeklyRevenueChart';
import PaymentMethodsChart from './components/PaymentMethodsChart';
import LowStock from './components/LowStock';
import PostpayDebt from './components/PostpayDebt';
import LatestTicketsTable from './components/LatestTicketsTable';

export default function DashboardPage() {
  const { auth } = useAuth();
  const institutionName = auth.instituciones?.[0]?.nombre || 'Institución';

  return (
    <div className="space-y-6">
      <DashboardHeader institutionName={institutionName} />

      <div className="grid grid-cols-1 gap-6">
        <WeeklyRevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentMethodsChart />
        <div className="space-y-6">
          <LowStock />
          <PostpayDebt />
        </div>
      </div>

      <div>
        <LatestTicketsTable />
      </div>
    </div>
  );
}