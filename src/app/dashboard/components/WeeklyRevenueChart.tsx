'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  day: string;
  APP: number;
  POS: number;
}

interface WeeklyRevenueChartProps {
  data?: RevenueData[];
}

export default function WeeklyRevenueChart({ data }: WeeklyRevenueChartProps) {
  const defaultData: RevenueData[] = [
    { day: 'Lun', APP: 1800, POS: 700 },
    { day: 'Mar', APP: 2400, POS: 800 },
    { day: 'Mié', APP: 1500, POS: 600 },
    { day: 'Jue', APP: 2700, POS: 850 },
    { day: 'Vie', APP: 2800, POS: 900 },
    { day: 'Sáb', APP: 900, POS: 500 },
    { day: 'Dom', APP: 700, POS: 400 },
  ];

  const chartData = data || defaultData;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Ingresos Semanales</h2>
        <p className="text-sm text-slate-500">pedidos.monto_total - APP vs POS</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
            }}
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          />
          <Legend />
          <Bar dataKey="APP" fill="#a855f7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="POS" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
