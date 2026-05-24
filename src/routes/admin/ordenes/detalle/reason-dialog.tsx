import { useEffect, useState } from 'react';
import { FileWarning, Loader2 } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/lib/cn';

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: (reason: string) => Promise<void> | void;
  loading?: boolean;
}

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  loading,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const trimmed = reason.trim();
  const valid = trimmed.length >= 3;
  const isDestructive = confirmVariant === 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'grid size-9 place-items-center rounded-md',
                isDestructive
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-warning/15 text-warning-foreground',
              )}
              aria-hidden
            >
              <FileWarning className="size-4" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="reason">
            Motivo <span className="text-muted-foreground">(queda en el historial)</span>
          </Label>
          <Textarea
            id="reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el motivo. Minimo 3 caracteres."
            maxLength={500}
            autoFocus
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {valid ? (
                <span className="text-success">✓ Motivo valido</span>
              ) : (
                'Ingresa al menos 3 caracteres'
              )}
            </span>
            <span className="tabular-nums">{trimmed.length}/500</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => void onConfirm(trimmed)}
            disabled={!valid || loading}
          >
            {loading && <Loader2 className="animate-spin" />}
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
