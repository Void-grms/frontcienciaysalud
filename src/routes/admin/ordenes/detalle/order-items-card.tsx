import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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

  const done = order.items.filter((i) => i.result !== null).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pruebas
          <Badge variant="muted" className="font-normal">
            {done}/{order.items.length} con resultado
          </Badge>
        </CardTitle>
        <CardDescription>
          La captura de resultados se hace en la pantalla de Resultados (Sprint 5). Las pruebas se
          pueden agregar o quitar mientras la orden este en borrador o en proceso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Codigo</TableHead>
                <TableHead>Prueba</TableHead>
                <TableHead className="hidden md:table-cell">Panel</TableHead>
                <TableHead className="hidden lg:table-cell w-[130px]">Resultado</TableHead>
                <TableHead className="w-[100px]">Flag</TableHead>
                {editable && <TableHead className="w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length === 0 ? (
                <TableEmpty colSpan={editable ? 6 : 5}>
                  La orden no tiene pruebas todavia.
                </TableEmpty>
              ) : (
                order.items.map((item) => {
                  const flag = item.result?.flag ?? null;
                  const flagMeta = flag ? FLAG_META[flag] : null;
                  const value = item.result?.valueNumeric ?? item.result?.valueText ?? '—';
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.test.code}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{item.test.name}</div>
                        <div className="text-xs text-muted-foreground">
                          v{item.testVersion} · {item.test.resultType}
                          {item.test.unit ? ` · ${item.test.unit}` : ''}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {item.panel ? `${item.panel.code} · ${item.panel.name}` : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-sm">
                        {value}
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
                            size="icon"
                            onClick={() => void handleRemove(item.id, item.test.name)}
                            disabled={removeMut.isPending}
                            aria-label={`Quitar ${item.test.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
