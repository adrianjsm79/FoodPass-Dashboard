'use client';

import DashboardHeader from './components/DashboardHeader';
import WeeklyRevenueChart from './components/WeeklyRevenueChart';
import PaymentMethodsChart from './components/PaymentMethodsChart';
import LowStock from './components/LowStock';
import PostpayDebt from './components/PostpayDebt';
import LatestTicketsTable from './components/LatestTicketsTable';

export default function DashboardPreview() {
  const institutionName = 'Universidad Nacional Mayor de San Marcos';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
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
      </div>
    </div>
  );
}
