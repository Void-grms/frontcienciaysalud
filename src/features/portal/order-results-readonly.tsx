import { Badge } from '@shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';

import type { OrderItem, ResultFlag } from '@features/orders/types';

const FLAG_META: Record<
  ResultFlag,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'muted' }
> = {
  normal: { label: 'Normal', variant: 'success' },
  high: { label: 'Alto', variant: 'warning' },
  low: { label: 'Bajo', variant: 'warning' },
  critical: { label: 'Critico', variant: 'destructive' },
  unknown: { label: 'Sin rango', variant: 'muted' },
};

interface OrderResultsReadonlyProps {
  items: OrderItem[];
}

// Tabla compartida por los portales paciente/referencia. Muestra el resultado
// y su flag, agrupando por panel cuando aplica. No hay interaccion: la captura
// la hace solo el admin desde el panel administrativo.
export function OrderResultsReadonly({ items }: OrderResultsReadonlyProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prueba</TableHead>
            <TableHead className="w-[140px]">Resultado</TableHead>
            <TableHead className="w-[100px]">Flag</TableHead>
            <TableHead className="hidden md:table-cell">Observacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableEmpty colSpan={4}>Sin pruebas para mostrar.</TableEmpty>
          ) : (
            items.map((item) => {
              const flag = item.result?.flag ?? null;
              const flagMeta = flag ? FLAG_META[flag] : null;
              const value =
                item.result?.valueNumeric != null
                  ? `${item.result.valueNumeric}${item.test.unit ? ' ' + item.test.unit : ''}`
                  : item.result?.valueText ?? '—';
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{item.test.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono">{item.test.code}</span>
                      {item.panel ? ` · panel ${item.panel.code}` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{value}</TableCell>
                  <TableCell>
                    {flagMeta ? (
                      <Badge variant={flagMeta.variant}>{flagMeta.label}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {item.result?.observation ?? '—'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
