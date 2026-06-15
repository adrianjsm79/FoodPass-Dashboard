'use client';

export interface PostpayDebtItem {
  name: string;
  amount: number;
  color?: string;
}

interface PostpayDebtProps {
  items?: PostpayDebtItem[];
  totalDebt?: number;
}

export default function PostpayDebt({ items, totalDebt }: PostpayDebtProps) {
  const defaultItems: PostpayDebtItem[] = [
    { name: 'Carlos Rios', amount: 48.5, color: '#a855f7' },
    { name: 'Javier Mora', amount: 120.0, color: '#a855f7' },
    { name: 'Juan García', amount: 75.25, color: '#a855f7' },
  ];

  const debtItems = items || defaultItems;
  const total = totalDebt || debtItems.reduce((sum, item) => sum + item.amount, 0);
  const maxDebt = Math.max(...debtItems.map(item => item.amount));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Deuda Postpago</h2>
          <p className="text-sm text-slate-500">cuentas_postpago.saldo_deuda</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total Deuda</p>
          <p className="text-2xl font-bold text-slate-900">S/. {total.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {debtItems.map((debt, index) => {
          const percentage = (debt.amount / maxDebt) * 100;

          return (
            <div key={`${debt.name}-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{debt.name}</span>
                <span className="text-sm font-semibold text-slate-900">S/. {debt.amount.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: debt.color || '#a855f7',
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
