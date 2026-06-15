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

export default function WeeklyRevenueChart({
  data,
}: WeeklyRevenueChartProps) {

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
    <div
      className="
        bg-white
        rounded-2xl
        shadow-sm
        border border-slate-200
        p-4 sm:p-6
        overflow-hidden
      "
    >

      {/* ======================== */}
      {/* HEADER */}
      {/* ======================== */}

      <div className="mb-4 sm:mb-6">

        <h2
          className="
            text-lg
            sm:text-xl
            font-bold
            text-slate-900
          "
        >
          Ingresos Semanales
        </h2>

        <p
          className="
            text-xs
            sm:text-sm
            text-slate-500
            mt-1
          "
        >
          pedidos.monto_total - APP vs POS
        </p>
      </div>

      {/* ======================== */}
      {/* CHART */}
      {/* ======================== */}

      <div
        className="
          w-full
          h-[280px]
          sm:h-[320px]
          md:h-[360px]
        "
      >
        <ResponsiveContainer width="100%" height="100%">

          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -15,
              bottom: 0,
            }}
          >

            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            {/* X */}
            <XAxis
              dataKey="day"
              stroke="#64748b"
              tick={{
                fontSize: 12,
                fill: '#64748b',
              }}
            />

            {/* Y */}
            <YAxis
              stroke="#64748b"
              tick={{
                fontSize: 12,
                fill: '#64748b',
              }}
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: '#0f172a',
                fontSize: '14px',
              }}
              cursor={{
                fill: 'rgba(0,0,0,0.04)',
              }}
            />

            {/* Legend */}
            <Legend
              wrapperStyle={{
                fontSize: '13px',
                paddingTop: '10px',
              }}
            />

            {/* APP */}
            <Bar
              dataKey="APP"
              fill="#a855f7"
              radius={[8, 8, 0, 0]}
            />

            {/* POS */}
            <Bar
              dataKey="POS"
              fill="#06b6d4"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}