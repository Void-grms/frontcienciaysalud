import { Badge } from '@shared/components/ui/badge';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';

import type { OrderItem, ResultFlag } from '@features/orders/types';
import type { Test } from '@features/catalog/types';

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

// Draft que vive en el componente padre: lo modelamos para el subset de
// campos que cada tipo de resultado usa. `undefined` significa "sin cambio
// pendiente"; null y string vacio se envian al backend para limpiar.
export interface DraftResult {
  valueNumeric: number | null | undefined;
  valueText: string | null | undefined;
  observation: string | null | undefined;
}

interface ResultRowProps {
  item: OrderItem;
  // Opcional porque para items numeric/text/observation no lo necesitamos.
  test?: Test | null;
  draft: DraftResult;
  // El padre dispone de un solo callback que toma el itemId + parche y
  // actualiza su Map de drafts. Mantenerlo asi evita tener que prop-drill
  // tres setters distintos por fila.
  onPatch: (patch: Partial<DraftResult>) => void;
  disabled?: boolean;
}

export function ResultRow({ item, test, draft, onPatch, disabled }: ResultRowProps) {
  const type = item.test.resultType;
  // Para mostrar lo que el usuario ve realmente en cada input, mezclamos
  // el draft (lo que se va a guardar) con el ultimo valor persistido.
  const persistedNumeric = item.result?.valueNumeric ?? null;
  const persistedText = item.result?.valueText ?? null;
  const persistedObservation = item.result?.observation ?? null;

  const currentNumeric =
    draft.valueNumeric === undefined ? persistedNumeric : draft.valueNumeric;
  const currentText = draft.valueText === undefined ? persistedText : draft.valueText;
  const currentObservation =
    draft.observation === undefined ? persistedObservation : draft.observation;

  const flag = item.result?.flag ?? null;
  const flagMeta = flag ? FLAG_META[flag] : null;

  return (
    <tr className="border-b last:border-b-0">
      <td className="p-3 align-top font-mono text-xs text-muted-foreground">
        {item.test.code}
      </td>
      <td className="p-3 align-top">
        <div className="text-sm font-medium">{item.test.name}</div>
        <div className="text-xs text-muted-foreground">
          {type} · v{item.testVersion}
          {item.panel ? ` · panel ${item.panel.code}` : ''}
        </div>
      </td>
      <td className="p-3 align-top">
        {type === 'numeric' && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              className="w-32"
              disabled={disabled}
              value={currentNumeric === null ? '' : String(currentNumeric)}
              onChange={(e) => {
                const v = e.target.value;
                onPatch({ valueNumeric: v === '' ? null : Number(v) });
              }}
            />
            {item.test.unit && (
              <span className="text-xs text-muted-foreground">{item.test.unit}</span>
            )}
          </div>
        )}
        {type === 'qualitative' && (
          <Select
            value={currentText ?? ''}
            onValueChange={(v) => onPatch({ valueText: v || null })}
            disabled={disabled}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {test?.options?.map((o) => (
                <SelectItem key={o.id} value={o.value}>
                  {o.value}
                </SelectItem>
              )) ?? (
                <SelectItem value="__loading" disabled>
                  Cargando opciones...
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        {type === 'text' && (
          <Input
            className="w-full max-w-sm"
            disabled={disabled}
            value={currentText ?? ''}
            onChange={(e) => onPatch({ valueText: e.target.value || null })}
            placeholder="Texto libre"
          />
        )}
        {type === 'observation' && (
          <span className="text-xs text-muted-foreground italic">
            Sin valor cuantitativo · usa el campo Observacion
          </span>
        )}
      </td>
      <td className="p-3 align-top">
        {flagMeta ? <Badge variant={flagMeta.variant}>{flagMeta.label}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="p-3 align-top">
        <Textarea
          rows={2}
          className="min-h-[44px] w-full"
          disabled={disabled}
          value={currentObservation ?? ''}
          onChange={(e) => onPatch({ observation: e.target.value || null })}
          placeholder="Observaciones..."
        />
      </td>
    </tr>
  );
}
