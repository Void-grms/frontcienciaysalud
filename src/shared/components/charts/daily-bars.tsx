// Grafico de barras agrupadas (creadas vs entregadas por dia) hecho con SVG
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

// Padding interno del SVG para que los ticks del eje Y y los labels de fecha
// no se corten contra los bordes.
const TOP_PADDING = 12;
const BOTTOM_PADDING = 24;
const Y_AXIS_WIDTH = 40;
// Ancho minimo por grupo (par de barras + gap). Asi con pocos puntos los
// labels de fecha "05-26" no se superponen.
const MIN_GROUP_TOTAL = 48;

export function DailyBars({ data, height = 200 }: DailyBarsProps) {
  const chart = useMemo(() => {
    if (data.length === 0) {
      return null;
    }
    const barWidth = 6;
    const groupGap = 4;
    const interGroupGap = 6;
    const groupWidth = barWidth * 2 + groupGap;
    // Si los grupos quedan muy juntos (pocos puntos en el rango), expandimos
    // para que cada uno tenga al menos `MIN_GROUP_TOTAL` px de horizontal.
    const groupTotal = Math.max(groupWidth + interGroupGap, MIN_GROUP_TOTAL);
    const width = data.length * groupTotal;

    const max = Math.max(1, ...data.map((p) => Math.max(p.created, p.delivered)));
    // Redondeamos el max para que el tope sea un numero "limpio" (5, 10, 25, 50, 100...).
    const niceMax = niceCeil(max);
    const plotHeight = height - TOP_PADDING - BOTTOM_PADDING;

    const bars = data.map((p, i) => {
      const x = i * groupTotal;
      const createdH = (p.created / niceMax) * plotHeight;
      const deliveredH = (p.delivered / niceMax) * plotHeight;
      return { ...p, x, createdH, deliveredH };
    });

    const ticks = [0, Math.round(niceMax / 2), niceMax];
    return { width, bars, max: niceMax, ticks, plotHeight, groupWidth, groupTotal };
  }, [data, height]);

  if (!chart) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos para el rango seleccionado.
      </div>
    );
  }

  const { width, bars, max, ticks, plotHeight, groupWidth, groupTotal } = chart;
  const totals = bars.reduce(
    (acc, b) => ({ created: acc.created + b.created, delivered: acc.delivered + b.delivered }),
    { created: 0, delivered: 0 },
  );

  // Mostramos el label de fecha solo cada N grupos para que no se aglomeren.
  // Con MIN_GROUP_TOTAL ~ 48px y ancho real del texto ~30px, podemos mostrar
  // todos si grupos son grandes y skipear si son chicos.
  const labelStep = groupTotal >= 36 ? 1 : Math.ceil(bars.length / 8);

  const totalWidth = width + Y_AXIS_WIDTH;
  const totalHeight = height;

  return (
    <div>
      {/* Totales */}
      <div className="mb-3 flex items-baseline gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Creadas
          </div>
          <div className="text-xl font-semibold tabular-nums">{totals.created}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Entregadas
          </div>
          <div className="text-xl font-semibold tabular-nums text-success">
            {totals.delivered}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden pb-1">
        <svg
          width={totalWidth}
          height={totalHeight}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="block"
          role="img"
          aria-label="Grafico diario de ordenes creadas vs entregadas"
        >
          {/* Ticks Y + gridlines. y se desplaza por TOP_PADDING para que el
              tick superior no quede pegado al borde del SVG. */}
          {ticks.map((t, idx) => {
            const y = TOP_PADDING + plotHeight - (t / max) * plotHeight;
            return (
              <g key={idx}>
                <line
                  x1={Y_AXIS_WIDTH - 4}
                  y1={y}
                  x2={totalWidth}
                  y2={y}
                  className="stroke-border"
                  strokeDasharray={t === 0 ? undefined : '2 3'}
                />
                <text
                  x={Y_AXIS_WIDTH - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Barras */}
          <g transform={`translate(${Y_AXIS_WIDTH}, ${TOP_PADDING})`}>
            {bars.map((b, i) => {
              const showLabel = i === 0 || i === bars.length - 1 || i % labelStep === 0;
              return (
                <g key={b.date} className="group">
                  <rect
                    x={b.x}
                    y={plotHeight - b.createdH}
                    width={6}
                    height={Math.max(b.createdH, b.created > 0 ? 2 : 0)}
                    rx={1.5}
                    className="fill-primary-100 transition-colors group-hover:fill-primary-600"
                  />
                  <rect
                    x={b.x + 10}
                    y={plotHeight - b.deliveredH}
                    width={6}
                    height={Math.max(b.deliveredH, b.delivered > 0 ? 2 : 0)}
                    rx={1.5}
                    className="fill-success/80 transition-colors group-hover:fill-success"
                  />
                  {showLabel && (
                    <text
                      x={b.x + groupWidth / 2}
                      y={plotHeight + 14}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px] tabular-nums"
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
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-primary-100" /> Creadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-success/80" /> Entregadas
        </span>
      </div>
    </div>
  );
}

function niceCeil(n: number): number {
  if (n <= 5) return 5;
  if (n <= 10) return 10;
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  if (n <= 100) return 100;
  const order = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / order) * order;
}
