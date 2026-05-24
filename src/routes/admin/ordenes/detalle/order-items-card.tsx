import { FlaskConical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@shared/lib/cn';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { reportFormError } from '@shared/lib/report-error';

import { useRemoveOrderItem } from '@features/orders/hooks';
import { canEditItems } from '@features/orders/state-meta';
import type { OrderDetail, ResultFlag } from '@features/orders/types';

const FLAG_META: Record<ResultFlag, { label: string; variant: 'success' | 'warning' | 'destructive' | 'muted' }> = {
  normal: { label: 'Normal', variant: 'success' },
  high: { label: 'Alto', variant: 'warning' },
  low: { label: 'Bajo', variant: 'warning' },
  critical: { label: 'Critico', variant: 'destructive' },
  unknown: { label: 'Sin rango', variant: 'muted' },
};

interface OrderItemsCardProps {
  order: OrderDetail;
}

export function OrderItemsCard({ order }: OrderItemsCardProps) {
  const removeMut = useRemoveOrderItem();
  const editable = canEditItems(order.state);

  const handleRemove = async (itemId: string, name: string) => {
    try {
      await removeMut.mutateAsync({ id: order.id, itemId });
      toast.success(`"${name}" eliminada de la orden`);
    } catch (err) {
      reportFormError(err);
    }
  };

  const total = order.items.length;
  const done = order.items.filter((i) => i.result !== null).length;
  const progress = total === 0 ? 0 : (done / total) * 100;
  const allDone = total > 0 && done === total;

  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-muted-foreground" />
              Pruebas
              <Badge variant="muted" className="font-normal">
                {total}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {editable
                ? 'Puedes agregar o quitar pruebas mientras la orden este en borrador o en proceso.'
                : 'En este estado las pruebas estan congeladas.'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Con resultado
            </div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">
              {done}
              <span className="text-sm text-muted-foreground">/{total}</span>
            </div>
          </div>
        </div>

        {total > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all duration-500', allDone ? 'bg-success' : 'bg-primary')}
              style={{ width: `${progress}%` }}
              aria-hidden
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-b-lg border-t border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Codigo</TableHead>
                <TableHead>Prueba</TableHead>
                <TableHead className="hidden md:table-cell">Panel</TableHead>
                <TableHead className="hidden lg:table-cell w-[130px]">Resultado</TableHead>
                <TableHead className="w-[100px]">Flag</TableHead>
                {editable && <TableHead className="w-[48px]" aria-label="Acciones" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {total === 0 ? (
                <TableEmpty colSpan={editable ? 6 : 5} icon={FlaskConical}>
                  La orden no tiene pruebas todavia.
                </TableEmpty>
              ) : (
                order.items.map((item) => {
                  const flag = item.result?.flag ?? null;
                  const flagMeta = flag ? FLAG_META[flag] : null;
                  const value = item.result?.valueNumeric ?? item.result?.valueText ?? null;
                  return (
                    <TableRow key={item.id} className="group">
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                        {item.test.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              'mt-1.5 size-1.5 shrink-0 rounded-full',
                              item.result !== null ? 'bg-success' : 'bg-muted-foreground/30',
                            )}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium leading-tight">
                              {item.test.name}
                            </div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              v{item.testVersion}
                              <span className="mx-1.5 text-border">·</span>
                              <span className="uppercase tracking-wide">{item.test.resultType}</span>
                              {item.test.unit && (
                                <>
                                  <span className="mx-1.5 text-border">·</span>
                                  {item.test.unit}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                        {item.panel ? (
                          <span className="line-clamp-1">
                            <span className="font-mono">{item.panel.code}</span>
                            <span className="mx-1.5 text-border">·</span>
                            {item.panel.name}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="hidden font-mono text-sm tabular-nums lg:table-cell">
                        {value ?? <span className="text-muted-foreground/60">—</span>}
                      </TableCell>
                      <TableCell>
                        {flagMeta ? (
                          <Badge variant={flagMeta.variant}>{flagMeta.label}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {editable && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleRemove(item.id, item.test.name)}
                            disabled={removeMut.isPending}
                            aria-label={`Quitar ${item.test.name}`}
                            title="Quitar prueba"
                            className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
