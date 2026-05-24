'use client';

interface POSHeaderProps {
  onVaciar: () => void;
}

export default function POSHeader({ onVaciar }: POSHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Punto de Venta</h1>
        <p className="text-sm text-slate-500">Universidad Nacional Mayor de San Marcos</p>
      </div>
    </div>
  );
}