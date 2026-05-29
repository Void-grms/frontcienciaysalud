import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { Info, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { reportFormError } from '@shared/lib/report-error';

import { TestRangesTab } from './test-ranges-tab';

import {
  useCategoriesList,
  useCreateTest,
  useUpdateTest,
} from '@features/catalog/hooks';
import type {
  ResultType,
  Test,
  TestCreateInput,
  TestUpdateInput,
} from '@features/catalog/types';

const RESULT_TYPES: Array<{ value: ResultType; label: string; hint: string }> = [
  { value: 'numeric', label: 'Numerica', hint: 'Numero con unidades y decimales (ej. glucosa).' },
  { value: 'qualitative', label: 'Cualitativa', hint: 'Lista cerrada de valores (ej. POSITIVO / NEGATIVO).' },
  { value: 'text', label: 'Texto libre', hint: 'Texto corto (ej. grupo sanguineo).' },
  { value: 'observation', label: 'Observacion', hint: 'Bloque de observaciones, sin rango.' },
];

const optionSchema = z.object({
  value: z.string().min(1, 'Requerido').max(80),
});

const schema = z
  .object({
    code: z.string().min(1, 'Requerido').max(40),
    name: z.string().min(2, 'Minimo 2 caracteres').max(180),
    shortName: z.string().max(80).optional().or(z.literal('')),
    categoryId: z.string().uuid('Selecciona una categoria'),
    resultType: z.enum(['numeric', 'text', 'qualitative', 'observation']),
    unit: z.string().max(40).optional().or(z.literal('')),
    method: z.string().max(120).optional().or(z.literal('')),
    decimals: z.coerce.number().int().min(0).max(6).optional(),
    minCritical: z.union([z.coerce.number(), z.literal('')]).optional(),
    maxCritical: z.union([z.coerce.number(), z.literal('')]).optional(),
    referenceText: z.string().max(2000).optional().or(z.literal('')),
    options: z.array(optionSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.resultType === 'qualitative') {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Agrega al menos 2 opciones',
        });
      }
    }
    if (
      typeof data.minCritical === 'number' &&
      typeof data.maxCritical === 'number' &&
      data.minCritical >= data.maxCritical
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxCritical'],
        message: 'El maximo critico debe ser mayor al minimo',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface TestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test | null;
}

function emptyForm(): FormValues {
  return {
    code: '',
    name: '',
    shortName: '',
    categoryId: '',
    resultType: 'numeric',
    unit: '',
    method: '',
    decimals: 2,
    minCritical: '',
    maxCritical: '',
    referenceText: '',
    options: [],
  };
}

function fromTest(test: Test): FormValues {
  return {
    code: test.code,
    name: test.name,
    shortName: test.shortName ?? '',
    categoryId: test.categoryId,
    resultType: test.resultType,
    unit: test.unit ?? '',
    method: test.method ?? '',
    decimals: test.decimals,
    minCritical: test.minCritical ?? '',
    maxCritical: test.maxCritical ?? '',
    referenceText: test.referenceText ?? '',
    options: test.options?.map((o) => ({ value: o.value })) ?? [],
  };
}

export function TestDialog({ open, onOpenChange, test }: TestDialogProps) {
  const isEditing = test !== null;
  const createMut = useCreateTest();
  const updateMut = useUpdateTest();

  // Cargamos categorias activas para el selector (mismo padron del backend).
  const categoriesQuery = useCategoriesList({ status: 'active', perPage: 100 });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  });

  const optionsField = useFieldArray({ control: form.control, name: 'options' });
  const [tab, setTab] = useState<'data' | 'ranges'>('data');

  useEffect(() => {
    if (open) {
      form.reset(test ? fromTest(test) : emptyForm());
      // Al abrir siempre volvemos a la pestaña Datos para no confundir al usuario
      // si previamente cerró el modal en otra pestaña.
      setTab('data');
    }
  }, [open, test, form]);

  const resultType = form.watch('resultType');

  const onSubmit = form.handleSubmit(async (values) => {
    const base = {
      name: values.name,
      categoryId: values.categoryId,
      resultType: values.resultType,
      ...(values.shortName ? { shortName: values.shortName } : {}),
      ...(values.unit ? { unit: values.unit } : {}),
      ...(values.method ? { method: values.method } : {}),
      ...(values.referenceText ? { referenceText: values.referenceText } : {}),
      ...(values.resultType === 'numeric'
        ? {
            decimals: values.decimals ?? 2,
            ...(typeof values.minCritical === 'number' ? { minCritical: values.minCritical } : {}),
            ...(typeof values.maxCritical === 'number' ? { maxCritical: values.maxCritical } : {}),
          }
        : {}),
      ...(values.resultType === 'qualitative'
        ? {
            options: (values.options ?? []).map((o, idx) => ({
              value: o.value,
              displayOrder: idx,
            })),
          }
        : {}),
    };

    try {
      if (isEditing && test) {
        await updateMut.mutateAsync({ id: test.id, input: base as TestUpdateInput });
        toast.success('Prueba actualizada');
      } else {
        const payload: TestCreateInput = { ...base, code: values.code } as TestCreateInput;
        await createMut.mutateAsync(payload);
        toast.success('Prueba creada');
      }
      onOpenChange(false);
    } catch (err) {
      reportFormError(err, form.setError);
    }
  });

  const submitting = createMut.isPending || updateMut.isPending;
  const categories = categoriesQuery.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar prueba' : 'Nueva prueba'}</DialogTitle>
          <DialogDescription>
            Los cambios crean automaticamente una version historica. El codigo no se puede modificar
            una vez creado porque las ordenes emitidas lo referencian.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'data' | 'ranges')}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="self-start">
            <TabsTrigger value="data">Datos</TabsTrigger>
            <TabsTrigger value="ranges" disabled={!isEditing}>
              Rangos referenciales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="flex min-h-0 flex-1 flex-col">
            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <DialogBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Codigo *</Label>
              <Input
                id="code"
                autoComplete="off"
                disabled={isEditing}
                placeholder="GLU"
                {...form.register('code')}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Nombre corto</Label>
              <Input
                id="shortName"
                autoComplete="off"
                placeholder="Glucosa"
                {...form.register('shortName')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              autoComplete="off"
              placeholder="Glucosa serica"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={form.watch('categoryId') || undefined}
                onValueChange={(v) => form.setValue('categoryId', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo de resultado *</Label>
              <Select
                value={resultType}
                onValueChange={(v) => form.setValue('resultType', v as ResultType, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {RESULT_TYPES.find((rt) => rt.value === resultType)?.hint}
              </p>
            </div>
          </div>

          {resultType === 'numeric' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" placeholder="mg/dL" {...form.register('unit')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimals">Decimales</Label>
                <Input
                  id="decimals"
                  type="number"
                  min={0}
                  max={6}
                  {...form.register('decimals')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Metodo</Label>
                <Input
                  id="method"
                  placeholder="Cinetica enzimatica"
                  {...form.register('method')}
                />
              </div>
            </div>
          )}

          {resultType === 'numeric' && (
            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <p>
                  Umbrales de <strong>alarma</strong>. Solo disparan el ícono{' '}
                  <span className="font-mono">↑/↓</span> al lado del resultado cuando está fuera de
                  rango. <strong>NO</strong> son los valores que se imprimen en la columna
                  &quot;Valores referenciales&quot; del PDF — ésos se editan en la pestaña{' '}
                  <strong>Rangos referenciales</strong>.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minCritical">Umbral crítico inferior (↓)</Label>
                  <Input
                    id="minCritical"
                    type="number"
                    step="any"
                    {...form.register('minCritical')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCritical">Umbral crítico superior (↑)</Label>
                  <Input
                    id="maxCritical"
                    type="number"
                    step="any"
                    {...form.register('maxCritical')}
                  />
                  {form.formState.errors.maxCritical && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.maxCritical.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {resultType === 'qualitative' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opciones predefinidas *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => optionsField.append({ value: '' })}
                >
                  <Plus className="h-4 w-4" /> Agregar opcion
                </Button>
              </div>
              <div className="space-y-2">
                {optionsField.fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Ej. POSITIVO"
                      {...form.register(`options.${idx}.value`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => optionsField.remove(idx)}
                      aria-label="Quitar opcion"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {optionsField.fields.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sin opciones aun.</p>
                )}
              </div>
              {form.formState.errors.options && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.options.message ??
                    (form.formState.errors.options as { root?: { message?: string } })?.root?.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="referenceText">Notas internas (no aparecen en el PDF)</Label>
            <Textarea
              id="referenceText"
              rows={2}
              placeholder="Notas de uso interno del laboratorio (metodología, observaciones, etc.)"
              {...form.register('referenceText')}
            />
            <p className="text-[11px] text-muted-foreground">
              Para configurar lo que se imprime en la columna &quot;Valores referenciales&quot; usa
              la pestaña <strong>Rangos referenciales</strong>.
            </p>
          </div>

              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear prueba'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent
            value="ranges"
            className="flex min-h-0 flex-1 flex-col"
          >
            {isEditing && test ? (
              <DialogBody>
                <TestRangesTab
                  testId={test.id}
                  resultType={test.resultType}
                  unit={test.unit}
                />
              </DialogBody>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
