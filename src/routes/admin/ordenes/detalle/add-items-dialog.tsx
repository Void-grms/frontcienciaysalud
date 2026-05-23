import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { reportFormError } from '@shared/lib/report-error';

import { useAddOrderItem } from '@features/orders/hooks';

import {
  TestsPicker,
  type SelectedPanel,
  type SelectedTest,
} from '../nueva/tests-picker';

interface AddItemsDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sub-dialog para agregar pruebas/paneles a una orden existente. Reutiliza el
// mismo TestsPicker del wizard, pero el endpoint es /orders/:id/items, que
// solo acepta UN testId o UN panelId por request. Por eso aqui despachamos N
// llamadas secuenciales y juntamos errores al final.
export function AddItemsDialog({ orderId, open, onOpenChange }: AddItemsDialogProps) {
  const [tests, setTests] = useState<SelectedTest[]>([]);
  const [panels, setPanels] = useState<SelectedPanel[]>([]);
  const addMut = useAddOrderItem();

  const handleConfirm = async () => {
    let added = 0;
    let failed = 0;

    for (const p of panels) {
      try {
        await addMut.mutateAsync({ id: orderId, input: { panelId: p.panelId } });
        added++;
      } catch (err) {
        failed++;
        reportFormError(err);
      }
    }
    for (const t of tests) {
      try {
        await addMut.mutateAsync({ id: orderId, input: { testId: t.testId } });
        added++;
      } catch (err) {
        failed++;
        reportFormError(err);
      }
    }

    if (added > 0) {
      toast.success(`${added} ${added === 1 ? 'item agregado' : 'items agregados'}`);
    }
    if (failed === 0) {
      setTests([]);
      setPanels([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar pruebas a la orden</DialogTitle>
          <DialogDescription>
            Las pruebas que ya esten en la orden seran ignoradas por el backend.
          </DialogDescription>
        </DialogHeader>
        <TestsPicker
          selectedTests={tests}
          selectedPanels={panels}
          onChangeTests={setTests}
          onChangePanels={setPanels}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addMut.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={
              addMut.isPending || (tests.length === 0 && panels.length === 0)
            }
          >
            {addMut.isPending ? 'Agregando...' : 'Agregar a la orden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
