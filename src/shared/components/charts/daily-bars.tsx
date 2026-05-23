// Grafico de barras apiladas (creadas vs entregadas por dia) hecho con SVG
// puro. Evitamos agregar recharts/chart.js (~100KB extra de bundle) porque
// con 30-90 puntos un SVG manual es suficiente y mantiene el control de
// estilo via Tailwind classes.

import { useMemo } from 'react';

interface Point {
  date: string; // YYYY-MM-DD
  created: number;
  delivered: number;
}

interface DailyBarsProps {
  data: Point[];
  height?: number;
}

export function DailyBars({ data, height = 160 }: DailyBarsProps) {
  const { width, bars, max, ticks } = useMemo(() => {
    // Si no hay datos, dibujamos un placeholder vacio.
    if (data.length === 0) {
      return { width: 600, bars: [], max: 0, ticks: [] };
    }
    const barWidth = 14;
    const gap = 6;
    const width = data.length * (barWidth + gap);
    const max = Math.max(1, ...data.map((p) => Math.max(p.created, p.delivered)));

    const bars = data.map((p, i) => {
      const x = i * (barWidth + gap);
      const createdH = (p.created / max) * (height - 30);
      const deliveredH = (p.delivered / max) * (height - 30);
      return { ...p, x, createdH, deliveredH };
    });

    // Ticks Y: 0 y max
    const ticks = [0, Math.ceil(max / 2), max];
    return { width, bars, max, ticks };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos para el rango seleccionado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        width={width + 40}
        height={height}
        className="block"
        role="img"
        aria-label="Grafico diario de ordenes creadas vs entregadas"
      >
        {/* Ticks Y */}
        {ticks.map((t, idx) => {
          const y = height - 30 - (t / max) * (height - 30);
          return (
            <g key={idx}>
              <line
                x1={32}
                y1={y}
                x2={width + 40}
                y2={y}
                className="stroke-muted-foreground/20"
              />
              <text
                x={28}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* Barras */}
        <g transform="translate(40, 0)">
          {bars.map((b, i) => {
            const showLabel = i === 0 || i === bars.length - 1 || i % 5 === 0;
            return (
              <g key={b.date}>
                {/* "Creadas" en gris claro detras */}
                <rect
                  x={b.x}
                  y={height - 30 - b.createdH}
                  width={6}
                  height={b.createdH}
                  className="fill-primary/30"
                />
                {/* "Entregadas" en primary, encima */}
                <rect
                  x={b.x + 6}
                  y={height - 30 - b.deliveredH}
                  width={6}
                  height={b.deliveredH}
                  className="fill-emerald-500"
                />
                {showLabel && (
                  <text
                    x={b.x + 6}
                    y={height - 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {b.date.slice(5)}
                  </text>
                )}
                <title>{`${b.date} · creadas: ${b.created} · entregadas: ${b.delivered}`}</title>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="mt-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary/30" /> Creadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" /> Entregadas
        </span>
      </div>
    </div>
  );
}
