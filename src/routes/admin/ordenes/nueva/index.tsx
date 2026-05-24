import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardPlus,
  FileText,
  FlaskConical,
  Loader2,
  Stethoscope,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/lib/cn';
import { reportFormError } from '@shared/lib/report-error';

import { useCreateOrder } from '@features/orders/hooks';
import type { OrderCreateInput } from '@features/orders/types';
import type { Patient } from '@features/patients/types';
import type { ReferenceListItem } from '@features/references/types';

import { PatientPicker } from './patient-picker';
import { ReferencePicker } from './reference-picker';
import { TestsPicker, type SelectedPanel, type SelectedTest } from './tests-picker';

interface StepHeaderProps {
  num: number;
  title: string;
  description: string;
  icon: typeof User;
  done?: boolean;
}

function StepHeader({ num, title, description, icon: Icon, done }: StepHeaderProps) {
  return (
    <CardHeader className="space-y-1.5 pb-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ring-1 ring-inset transition-colors',
            done
              ? 'bg-success/10 text-success ring-success/20'
              : 'bg-primary-50 text-primary-700 ring-primary-100',
          )}
          aria-hidden
        >
          {num}
        </div>
        <div className="flex-1">
          <CardTitle className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription className="mt-0.5">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

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

  const itemsCount = tests.length + panels.length;
  const canSubmit = useMemo(
    () => patient !== null && itemsCount > 0,
    [patient, itemsCount],
  );

  const handleSubmit = async () => {
    if (!patient) {
      toast.error('Selecciona un paciente');
      return;
    }
    if (itemsCount === 0) {
      toast.error('Agrega al menos una prueba o panel');
      return;
    }

    const payload: OrderCreateInput = {
      patientId: patient.id,
      ...(reference ? { referenceId: reference.id } : {}),
      ...(requestingDoctor.trim() ? { requestingDoctor: requestingDoctor.trim() } : {}),
      ...(clinicalInfo.trim() ? { clinicalInfo: clinicalInfo.trim() } : {}),
      ...(sampleTakenAt ? { sampleTakenAt: new Date(sampleTakenAt).toISOString() } : {}),
      ...(tests.length ? { tests: tests.map((t) => ({ testId: t.testId })) } : {}),
      ...(panels.length ? { panels: panels.map((p) => ({ panelId: p.panelId })) } : {}),
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
    <div className="space-y-6 pb-24">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/ordenes">
          <ArrowLeft /> Volver a ordenes
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva orden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La orden nace en estado &quot;borrador&quot;. Tras crearla se capturan los resultados
          desde el detalle y se valida cuando este completa.
        </p>
      </div>

      {/* Paso 1: Paciente */}
      <Card>
        <StepHeader
          num={1}
          title="Paciente"
          description="Busca por nombre, apellido o documento. Si no existe, registralo desde Pacientes y vuelve aqui."
          icon={User}
          done={patient !== null}
        />
        <CardContent>
          <PatientPicker selected={patient} onSelect={setPatient} />
        </CardContent>
      </Card>

      {/* Paso 2: Origen y datos clinicos */}
      <Card>
        <StepHeader
          num={2}
          title="Origen y datos clinicos"
          description="La referencia es opcional (orden particular). El medico y la informacion clinica aparecen en el encabezado del informe."
          icon={Stethoscope}
        />
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Referencia (opcional)</Label>
            <ReferencePicker selected={reference} onSelect={setReference} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doctor">Medico solicitante</Label>
              <Input
                id="doctor"
                value={requestingDoctor}
                onChange={(e) => setRequestingDoctor(e.target.value)}
                placeholder="Dr. Nombre Apellido"
                maxLength={180}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sampleTakenAt">Toma de muestra</Label>
              <Input
                id="sampleTakenAt"
                type="datetime-local"
                value={sampleTakenAt}
                onChange={(e) => setSampleTakenAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clinicalInfo">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-3.5" /> Informacion clinica
              </span>
            </Label>
            <Textarea
              id="clinicalInfo"
              rows={3}
              value={clinicalInfo}
              onChange={(e) => setClinicalInfo(e.target.value)}
              placeholder="Diagnostico presuntivo, sintomas, ayuno, medicacion..."
              maxLength={2000}
            />
            <p className="text-[11px] text-muted-foreground">
              {clinicalInfo.length}/2000 caracteres
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Paso 3: Pruebas */}
      <Card>
        <StepHeader
          num={3}
          title="Pruebas y paneles"
          description="Agrega pruebas individuales o paneles completos. Las duplicadas se ignoran automaticamente."
          icon={FlaskConical}
          done={itemsCount > 0}
        />
        <CardContent>
          <TestsPicker
            selectedTests={tests}
            selectedPanels={panels}
            onChangeTests={setTests}
            onChangePanels={setPanels}
          />
        </CardContent>
      </Card>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:left-64">
        <div className="container flex items-center justify-between gap-3 py-3">
          <div className="text-xs text-muted-foreground">
            {!patient && itemsCount === 0 ? (
              <>Selecciona un paciente y al menos una prueba para crear la orden.</>
            ) : !patient ? (
              <>Falta seleccionar el <span className="font-medium text-foreground">paciente</span>.</>
            ) : itemsCount === 0 ? (
              <>Falta agregar al menos <span className="font-medium text-foreground">una prueba</span>.</>
            ) : (
              <span className="flex items-center gap-1.5 text-success">
                Listo:{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {patient.firstName} {patient.lastName}
                </span>{' '}
                con <span className="font-medium tabular-nums text-foreground">{itemsCount}</span>{' '}
                {itemsCount === 1 ? 'item' : 'items'}.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/ordenes">Cancelar</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || createMut.isPending}
            >
              {createMut.isPending ? <Loader2 className="animate-spin" /> : <ClipboardPlus />}
              {createMut.isPending ? 'Creando...' : 'Crear orden'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
