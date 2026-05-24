'use client';

export interface DashboardHeaderProps {
  institutionName?: string;
  date?: string;
}

export default function DashboardHeader({ institutionName = 'Universidad Nacional Mayor de San Marcos', date }: DashboardHeaderProps) {
  const displayDate = date || new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-2">
            {institutionName} - {displayDate.charAt(0).toUpperCase() + displayDate.slice(1)}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-emerald-700">En vivo</span>
        </div>
      </div>
    </div>
  );
}
