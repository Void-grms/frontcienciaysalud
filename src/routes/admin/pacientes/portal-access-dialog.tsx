import { useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';
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

import type { PortalAccessResponse } from '@features/patients/types';

interface PortalAccessDialogProps {
  data: PortalAccessResponse | null;
  onClose: () => void;
}

// La contrasena temporal se devuelve solo una vez; si el admin la pierde tiene
// que volver a resetear el acceso. Por eso este dialog tiene "Copiar" y un
// boton de cerrar explicito con warning.
export function PortalAccessDialog({ data, onClose }: PortalAccessDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(
        `Usuario: ${data.documentNumber}\nContrasena: ${data.temporaryPassword}`,
      );
      setCopied(true);
      toast.success('Credenciales copiadas al portapapeles');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  return (
    <Dialog
      open={data !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" /> Acceso al portal del paciente
          </DialogTitle>
          <DialogDescription>
            Guarda o entrega estas credenciales al paciente. Esta contrasena se muestra una sola
            vez; si se pierde habra que volver a resetear el acceso desde aqui.
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Usuario: </span>
                {data.documentNumber}
              </div>
              <div>
                <span className="text-muted-foreground">Contrasena: </span>
                {data.temporaryPassword}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              En el primer ingreso el sistema obliga al paciente a cambiarla.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => void handleCopy()}>
            <Copy className="h-4 w-4" /> {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
