import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Textarea } from '@shared/components/ui/textarea';
import { reportFormError } from '@shared/lib/report-error';

import {
  useCreateTestRange,
  useDeleteTestRange,
  useTestRanges,
  useUpdateTestRange,
} from '@features/catalog/hooks';
import type {
  PhysiologicalState,
  ReferenceRange,
  ReferenceRangeInput,
  ResultType,
  Sex,
} from '@features/catalog/types';

const SEX_LABEL: Record<Sex, string> = {
  A: 'Ambos',
  M: 'Masculino',
  F: 'Femenino',
};

const STATE_LABEL: Record<PhysiologicalState, string> = {
  none: 'Ninguno',
  pregnancy: 'Embarazo',
  lactation: 'Lactancia',
};

type AgeUnit = 'days' | 'months' | 'years';

const AGE_UNIT_LABEL: Record<AgeUnit, string> = {
  days: 'dias',
  months: 'meses',
  years: 'años',
};

const AGE_UNIT_DIVISOR: Record<AgeUnit, number> = {
  days: 1,
  months: 30,
  years: 365,
};

const schema = z
  .object({
    sex: z.enum(['A', 'M', 'F']),
    ageUnit: z.enum(['days', 'months', 'years']),
    ageMin: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
    ageMax: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
    physiologicalState: z.enum(['none', 'pregnancy', 'lactation']),
    valueMin: z.union([z.coerce.number(), z.literal('')]).optional(),
    valueMax: z.union([z.coerce.number(), z.literal('')]).optional(),
    qualitativeExpected: z.string().max(80).optional().or(z.literal('')),
    displayText: z.string().max(1000).optional().or(z.literal('')),
    priority: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.valueMin === 'number' &&
      typeof data.valueMax === 'number' &&
      data.valueMin > data.valueMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valueMax'],
        message: 'El máximo debe ser ≥ al mínimo',
      });
    }
    if (
      typeof data.ageMin === 'number' &&
      typeof data.ageMax === 'number' &&
      data.ageMin > data.ageMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ageMax'],
        message: 'La edad máxima debe ser ≥ a la mínima',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function emptyForm(): FormValues {
  return {
    sex: 'A',
    ageUnit: 'years',
    ageMin: '',
    ageMax: '',
    physiologicalState: 'none',
    valueMin: '',
    valueMax: '',
    qualitativeExpected: '',
    displayText: '',
    priority: 0,
  };
}

function pickAgeUnit(min: number | null, max: number | null): AgeUnit {
  const values = [min, max].filter((v): v is number => v != null && v > 0);
  if (values.length === 0) return 'years';
  if (values.every((v) => v % 365 === 0)) return 'years';
  if (values.every((v) => v % 30 === 0)) return 'months';
  return 'days';
}

function fromRange(r: ReferenceRange): FormValues {
  const unit = pickAgeUnit(r.ageMinDays, r.ageMaxDays);
  const divisor = AGE_UNIT_DIVISOR[unit];
  return {
    sex: r.sex,
    ageUnit: unit,
    ageMin: r.ageMinDays != null ? r.ageMinDays / divisor : '',
    ageMax: r.ageMaxDays != null ? r.ageMaxDays / divisor : '',
    physiologicalState: r.physiologicalState ?? 'none',
    valueMin: r.valueMin != null ? Number(r.valueMin) : '',
    valueMax: r.valueMax != null ? Number(r.valueMax) : '',
    qualitativeExpected: r.qualitativeExpected ?? '',
    displayText: r.displayText ?? '',
    priority: r.priority,
  };
}

function toInput(values: FormValues, resultType: ResultType): ReferenceRangeInput {
  const divisor = AGE_UNIT_DIVISOR[values.ageUnit];
  const payload: ReferenceRangeInput = {
    sex: values.sex,
    priority: values.priority,
  };
  if (typeof values.ageMin === 'number') payload.ageMinDays = Math.round(values.ageMin * divisor);
  if (typeof values.ageMax === 'number') payload.ageMaxDays = Math.round(values.ageMax * divisor);
  if (values.physiologicalState !== 'none') payload.physiologicalState = values.physiologicalState;
  if (resultType === 'numeric') {
    if (typeof values.valueMin === 'number') payload.valueMin = values.valueMin;
    if (typeof values.valueMax === 'number') payload.valueMax = values.valueMax;
  }
  if (resultType === 'qualitative' && values.qualitativeExpected) {
    payload.qualitativeExpected = values.qualitativeExpected;
  }
  if (values.displayText) payload.displayText = values.displayText;
  return payload;
}

function formatAge(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Cualquier edad';
  const unit = pickAgeUnit(min, max);
  const divisor = AGE_UNIT_DIVISOR[unit];
  const u = AGE_UNIT_LABEL[unit];
  if (min != null && max != null) return `${min / divisor} - ${max / divisor} ${u}`;
  if (min != null) return `≥ ${min / divisor} ${u}`;
  return `≤ ${(max as number) / divisor} ${u}`;
}

function formatValue(r: ReferenceRange, resultType: ResultType): string {
  if (r.displayText) return r.displayText;
  if (resultType === 'qualitative' && r.qualitativeExpected) return r.qualitativeExpected;
  const min = r.valueMin != null ? Number(r.valueMin) : null;
  const max = r.valueMax != null ? Number(r.valueMax) : null;
  if (min != null && max != null) return `${min} - ${max}`;
  if (min != null) return `≥ ${min}`;
  if (max != null) return `≤ ${max}`;
  return '—';
}

interface TestRangesTabProps {
  testId: string;
  resultType: ResultType;
  unit: string | null;
}

export function TestRangesTab({ testId, resultType, unit }: TestRangesTabProps) {
  const query = useTestRanges(testId);
  const createMut = useCreateTestRange(testId);
  const updateMut = useUpdateTestRange(testId);
  const deleteMut = useDeleteTestRange(testId);

  const [editing, setEditing] = useState<ReferenceRange | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ReferenceRange | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  });

  useEffect(() => {
    if (showForm) {
      form.reset(editing ? fromRange(editing) : emptyForm());
    }
  }, [showForm, editing, form]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (r: ReferenceRange) => {
    setEditing(r);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = toInput(values, resultType);
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input: payload });
        toast.success('Rango actualizado');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Rango agregado');
      }
      closeForm();
    } catch (err) {
      reportFormError(err, form.setError);
    }
  });

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      toast.success('Rango eliminado');
      setPendingDelete(null);
    } catch (err) {
      reportFormError(err);
    }
  };

  const ageUnit = form.watch('ageUnit');
  const submitting = createMut.isPending || updateMut.isPending;
  const items = query.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Rangos referenciales</h4>
          <p className="text-xs text-muted-foreground">
            Se imprimen en la columna "Valores referenciales" del informe. La prioridad más alta
            gana cuando varios rangos aplican al paciente.
          </p>
        </div>
        {!showForm && (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Agregar rango
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Sexo</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead>Valor {unit ? `(${unit})` : ''}</TableHead>
              <TableHead className="w-[70px] text-center">Prio.</TableHead>
              <TableHead className="w-[90px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableEmpty colSpan={6} iconHidden>
                Cargando...
              </TableEmpty>
            ) : query.isError ? (
              <TableEmpty colSpan={6}>No se pudieron cargar los rangos.</TableEmpty>
            ) : items.length === 0 ? (
              <TableEmpty colSpan={6}>
                Aún no hay rangos para esta prueba. Agrega el primero para que aparezca en el
                informe.
              </TableEmpty>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="outline">{SEX_LABEL[r.sex]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatAge(r.ageMinDays, r.ageMaxDays)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {r.physiologicalState && r.physiologicalState !== 'none'
                      ? STATE_LABEL[r.physiologicalState]
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatValue(r, resultType)}
                  </TableCell>
                  <TableCell className="text-center text-sm">{r.priority}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(r)}
                        aria-label="Editar rango"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(r)}
                        aria-label="Eliminar rango"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold">
              {editing ? 'Editar rango' : 'Nuevo rango'}
            </h5>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeForm}
              aria-label="Cerrar formulario"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select
                value={form.watch('sex')}
                onValueChange={(v) => form.setValue('sex', v as Sex, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEX_LABEL) as Sex[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEX_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado fisiológico</Label>
              <Select
                value={form.watch('physiologicalState')}
                onValueChange={(v) =>
                  form.setValue('physiologicalState', v as PhysiologicalState, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATE_LABEL) as PhysiologicalState[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="range-priority">Prioridad</Label>
              <Input
                id="range-priority"
                type="number"
                min={0}
                {...form.register('priority')}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Unidad de edad</Label>
              <Select
                value={ageUnit}
                onValueChange={(v) =>
                  form.setValue('ageUnit', v as AgeUnit, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AGE_UNIT_LABEL) as AgeUnit[]).map((u) => (
                    <SelectItem key={u} value={u}>
                      {AGE_UNIT_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="range-age-min">Edad desde</Label>
              <Input
                id="range-age-min"
                type="number"
                min={0}
                step="any"
                placeholder="vacío = sin mínimo"
                {...form.register('ageMin')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range-age-max">Edad hasta</Label>
              <Input
                id="range-age-max"
                type="number"
                min={0}
                step="any"
                placeholder="vacío = sin máximo"
                {...form.register('ageMax')}
              />
              {form.formState.errors.ageMax && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.ageMax.message}
                </p>
              )}
            </div>
          </div>

          {resultType === 'numeric' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="range-value-min">
                  Mínimo normal {unit ? `(${unit})` : ''}
                </Label>
                <Input
                  id="range-value-min"
                  type="number"
                  step="any"
                  {...form.register('valueMin')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-value-max">
                  Máximo normal {unit ? `(${unit})` : ''}
                </Label>
                <Input
                  id="range-value-max"
                  type="number"
                  step="any"
                  {...form.register('valueMax')}
                />
                {form.formState.errors.valueMax && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.valueMax.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {resultType === 'qualitative' && (
            <div className="space-y-2">
              <Label htmlFor="range-qualitative">Valor esperado</Label>
              <Input
                id="range-qualitative"
                placeholder="Ej. NEGATIVO"
                {...form.register('qualitativeExpected')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="range-display-text">
              Texto a mostrar (opcional)
            </Label>
            <Textarea
              id="range-display-text"
              rows={2}
              placeholder='Reemplaza el rango calculado. Ej. "VARONES: 14 - 18 g/dL"'
              {...form.register('displayText')}
            />
            <p className="text-xs text-muted-foreground">
              Si lo dejas vacío, el informe arma el texto a partir de los valores mín/máx.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="button" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar rango'}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar rango</AlertDialogTitle>
            <AlertDialogDescription>
              El rango quedará marcado como histórico (no se borra). Las órdenes anteriores
              mantienen el rango que aplicaron al momento del resultado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
