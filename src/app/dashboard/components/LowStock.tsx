'use client';

import { AlertTriangle } from 'lucide-react';

export interface LowStockItem {
  name: string;
  current: number;
  total: number;
}

interface LowStockProps {
  items?: LowStockItem[];
}

export default function LowStock({ items }: LowStockProps) {
  const defaultItems: LowStockItem[] = [
    { name: 'Menú del día', current: 12, total: 150 },
    { name: 'Ensalada Mixta', current: 5, total: 60 },
    { name: 'Gaseosa 500ml', current: 18, total: 80 },
  ];

  const stockItems = items || defaultItems;

  const getPercentage = (current: number, total: number) => (current / total) * 100;
  const getBarColor = (percentage: number) => {
    if (percentage < 20) return 'bg-red-500';
    if (percentage < 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-6 flex items-center gap-2">
        <AlertTriangle size={20} className="text-amber-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Stock Bajo</h2>
          <p className="text-sm text-slate-500">cantidad → umbral_stock_bajo</p>
        </div>
      </div>

      <div className="space-y-4">
        {stockItems.map((item) => {
          const percentage = getPercentage(item.current, item.total);
          const barColor = getBarColor(percentage);

          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {item.current} / {item.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {percentage.toFixed(0)}% restante - umbral: 50
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
