'use client';

export interface DashboardHeaderProps {
  institutionName?: string;
  date?: string;
}

export default function DashboardHeader({
  institutionName = 'Universidad Nacional Mayor de San Marcos',
  date,
}: DashboardHeaderProps) {

  const displayDate =
    date ||
    new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="mb-6 sm:mb-8">

      <div
        className="
          flex flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        "
      >

        {/* ========================= */}
        {/* TITULO */}
        {/* ========================= */}

        <div className="min-w-0">

          <h1
            className="
              text-2xl
              sm:text-3xl
              lg:text-4xl
              font-bold
              text-slate-900
              break-words
            "
          >
            Dashboard
          </h1>

          <p
            className="
              text-slate-500
              mt-2
              text-sm
              sm:text-base
              leading-relaxed
              break-words
            "
          >
            {institutionName} —{' '}
            {displayDate.charAt(0).toUpperCase() +
              displayDate.slice(1)}
          </p>
        </div>

        {/* ========================= */}
        {/* STATUS */}
        {/* ========================= */}

        <div
          className="
            self-start
            lg:self-auto

            flex items-center gap-2

            px-4 py-2

            bg-emerald-50
            border border-emerald-200
            rounded-full

            w-fit
            shrink-0
          "
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />

          <span className="text-sm font-medium text-emerald-700 whitespace-nowrap">
            En vivo
          </span>
        </div>

      </div>
    </div>
  );
}