import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { reportFormError } from '@shared/lib/report-error';

import { useUpdateOrder } from '@features/orders/hooks';
import { canEditMetadata } from '@features/orders/state-meta';
import type { OrderDetail } from '@features/orders/types';
import type { ReferenceListItem } from '@features/references/types';

import { ReferencePicker } from '../nueva/reference-picker';

// Convertir "2026-05-20T08:30:00.000Z" en "2026-05-20T08:30" para el input
// datetime-local (que usa zona local). Lo dejamos en un helper para no
// duplicar la conversion del slice/padding.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface OrderMetadataCardProps {
  order: OrderDetail;
}

export function OrderMetadataCard({ order }: OrderMetadataCardProps) {
  const editable = canEditMetadata(order.state);
  const updateMut = useUpdateOrder();

  const [reference, setReference] = useState<ReferenceListItem | null>(
    order.reference
      ? {
          id: order.reference.id,
          name: order.reference.name,
          taxId: order.reference.taxId,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          address: null,
          notes: null,
          status: 'active',
          createdAt: '',
          updatedAt: '',
        }
      : null,
  );
  const [requestingDoctor, setRequestingDoctor] = useState(order.requestingDoctor ?? '');
  const [clinicalInfo, setClinicalInfo] = useState(order.clinicalInfo ?? '');
  const [sampleTakenAt, setSampleTakenAt] = useState(toLocalInput(order.sampleTakenAt));

  // Cuando llega una nueva version de la orden (por invalidacion de cache),
  // sincronizamos los inputs. Sin esto, despues de guardar quedarian "dirty"
  // sin razon.
  useEffect(() => {
    setReference(
      order.reference
        ? {
            id: order.reference.id,
            name: order.reference.name,
            taxId: order.reference.taxId,
            contactName: null,
            contactEmail: null,
            contactPhone: null,
            address: null,
            notes: null,
            status: 'active',
            createdAt: '',
            updatedAt: '',
          }
        : null,
    );
    setRequestingDoctor(order.requestingDoctor ?? '');
    setClinicalInfo(order.clinicalInfo ?? '');
    setSampleTakenAt(toLocalInput(order.sampleTakenAt));
  }, [order]);

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({
        id: order.id,
        input: {
          // Null explicito desvincula la referencia; undefined la deja como esta.
          referenceId: reference ? reference.id : null,
          requestingDoctor: requestingDoctor.trim() || undefined,
          clinicalInfo: clinicalInfo.trim() || undefined,
          sampleTakenAt: sampleTakenAt ? new Date(sampleTakenAt).toISOString() : undefined,
        },
      });
      toast.success('Datos de la orden actualizados');
    } catch (err) {
      reportFormError(err);
    }
  };

  if (!editable) {
    // Modo solo lectura: mostramos los datos tal cual estan.
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datos de la orden</CardTitle>
          <CardDescription>
            En estado &quot;{order.state}&quot; los metadatos quedan congelados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Referencia</dt>
              <dd>{order.reference?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Medico solicitante</dt>
              <dd>{order.requestingDoctor ?? '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Informacion clinica</dt>
              <dd className="whitespace-pre-wrap">{order.clinicalInfo ?? '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la orden</CardTitle>
        <CardDescription>
          Editables mientras la orden este en borrador o en proceso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Referencia (opcional)</Label>
          <ReferencePicker selected={reference} onSelect={setReference} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="doctor">Medico solicitante</Label>
            <Input
              id="doctor"
              value={requestingDoctor}
              onChange={(e) => setRequestingDoctor(e.target.value)}
              maxLength={180}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sampleTakenAt">Toma de muestra</Label>
            <Input
              id="sampleTakenAt"
              type="datetime-local"
              value={sampleTakenAt}
              onChange={(e) => setSampleTakenAt(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinicalInfo">Informacion clinica</Label>
          <Textarea
            id="clinicalInfo"
            rows={3}
            value={clinicalInfo}
            onChange={(e) => setClinicalInfo(e.target.value)}
            maxLength={2000}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={updateMut.isPending}>
            <Save className="h-4 w-4" />
            {updateMut.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
