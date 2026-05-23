import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardPlus } from 'lucide-react';
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

import { useCreateOrder } from '@features/orders/hooks';
import type { OrderCreateInput } from '@features/orders/types';
import type { Patient } from '@features/patients/types';
import type { ReferenceListItem } from '@features/references/types';

import { PatientPicker } from './patient-picker';
import { ReferencePicker } from './reference-picker';
import { TestsPicker, type SelectedPanel, type SelectedTest } from './tests-picker';

export default function NuevaOrdenPage() {
  const navigate = useNavigate();
  const createMut = useCreateOrder();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [reference, setReference] = useState<ReferenceListItem | null>(null);
  const [requestingDoctor, setRequestingDoctor] = useState('');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [sampleTakenAt, setSampleTakenAt] = useState('');
  const [tests, setTests] = useState<SelectedTest[]>([]);
  const [panels, setPanels] = useState<SelectedPanel[]>([]);

  const canSubmit = useMemo(
    () => patient !== null && tests.length + panels.length > 0,
    [patient, tests, panels],
  );

  const handleSubmit = async () => {
    if (!patient) {
      toast.error('Selecciona un paciente');
      return;
    }
    if (tests.length + panels.length === 0) {
      toast.error('Agrega al menos una prueba o panel');
      return;
    }

    // El input `datetime-local` devuelve "2026-05-20T08:30" sin offset. El
    // backend lo parsea con `new Date(...)` (zona local del navegador). Lo
    // dejamos asi para que el operador vea exactamente la hora que tipeo.
    const payload: OrderCreateInput = {
      patientId: patient.id,
      ...(reference ? { referenceId: reference.id } : {}),
      ...(requestingDoctor.trim() ? { requestingDoctor: requestingDoctor.trim() } : {}),
      ...(clinicalInfo.trim() ? { clinicalInfo: clinicalInfo.trim() } : {}),
      ...(sampleTakenAt ? { sampleTakenAt: new Date(sampleTakenAt).toISOString() } : {}),
      ...(tests.length
        ? { tests: tests.map((t) => ({ testId: t.testId })) }
        : {}),
      ...(panels.length
        ? { panels: panels.map((p) => ({ panelId: p.panelId })) }
        : {}),
    };

    try {
      const order = await createMut.mutateAsync(payload);
      toast.success(`Orden ${order.code} creada`);
      navigate(`/admin/ordenes/${order.code}`);
    } catch (err) {
      reportFormError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/ordenes" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nueva orden</h1>
          <p className="text-sm text-muted-foreground">
            La orden nace en estado &quot;borrador&quot;. Una vez creada se capturan resultados
            desde el detalle y se valida/entrega cuando este completa.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Paciente</CardTitle>
          <CardDescription>
            Busca por nombre, apellido o documento. Si el paciente no existe, registralo desde el
            modulo de Pacientes y vuelve aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientPicker selected={patient} onSelect={setPatient} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Origen y datos clinicos</CardTitle>
          <CardDescription>
            La referencia es opcional (orden particular). El medico solicitante y la informacion
            clinica son los datos que aparecen en el encabezado del informe.
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
                placeholder="Dr. Nombre Apellido"
                maxLength={180}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sampleTakenAt">Fecha y hora de toma de muestra</Label>
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
              placeholder="Diagnostico presuntivo, sintomas, observaciones clinicas..."
              maxLength={2000}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Pruebas y paneles</CardTitle>
          <CardDescription>
            Agrega pruebas individuales o paneles completos. Las pruebas duplicadas se ignoran
            automaticamente; el backend resuelve internamente las del panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestsPicker
            selectedTests={tests}
            selectedPanels={panels}
            onChangeTests={setTests}
            onChangePanels={setPanels}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t bg-background/80 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <Button asChild variant="outline">
          <Link to="/admin/ordenes">Cancelar</Link>
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={!canSubmit || createMut.isPending}>
          <ClipboardPlus className="h-4 w-4" />
          {createMut.isPending ? 'Creando...' : 'Crear orden'}
        </Button>
      </div>
    </div>
  );
}
