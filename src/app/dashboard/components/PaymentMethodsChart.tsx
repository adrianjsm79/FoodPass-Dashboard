'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PaymentMethodData {
  name: string;
  value: number;
  amount: number;
}

interface PaymentMethodsChartProps {
  data?: PaymentMethodData[];
}

const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b'];

export default function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const defaultData: PaymentMethodData[] = [
    { name: 'Yape', value: 80, amount: 1840 },
    { name: 'Plin', value: 32, amount: 680 },
    { name: 'Efectivo', value: 48, amount: 720 },
    { name: 'Tarjeta', value: 12, amount: 340 },
  ];

  const chartData = data || defaultData;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Métodos de Pago</h2>
        <p className="text-sm text-slate-400">pagos.metodo_pago_id → métodos_pago</p>
      </div>

      <div className="flex items-center gap-6">
        {/* ✅ Antes era w-40 (160px) fijo — ahora flex con tamaño adecuado */}
        <div className="flex-shrink-0 w-[220px]">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(val, name) => [`${val} transacciones`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda ocupa el espacio restante */}
        <div className="flex-1 flex flex-col gap-3">
          {chartData.map((method, index) => (
            <div key={method.name}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {method.name}{' '}
                    <span className="text-xs text-slate-400">({method.value})</span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  S/. {method.amount}
                </span>
              </div>
              {index < chartData.length - 1 && (
                <div className="mt-3 h-px bg-slate-100" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}