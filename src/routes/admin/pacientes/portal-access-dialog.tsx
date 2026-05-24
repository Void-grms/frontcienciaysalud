import { useState } from 'react';
import { AlertTriangle, Check, Copy, KeyRound } from 'lucide-react';
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

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copiado al portapapeles`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const handleCopyAll = () => {
    if (!data) return;
    void handleCopy(
      `Usuario: ${data.documentNumber}\nContrasena: ${data.temporaryPassword}`,
      'Credenciales',
    );
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
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-9 place-items-center rounded-md bg-warning/15 text-warning-foreground"
              aria-hidden
            >
              <KeyRound className="size-4" />
            </div>
            <div>
              <DialogTitle>Acceso al portal del paciente</DialogTitle>
              <DialogDescription>
                Estas son las credenciales que el paciente usara para entrar al sistema.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {data && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
              <div className="space-y-0.5">
                <p className="font-medium text-warning-foreground">Se muestra una sola vez</p>
                <p className="text-xs text-warning-foreground/80">
                  Copia o entrega las credenciales ahora. Si se pierden, hay que generar otra
                  contrasena temporal.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <CredentialField
                label="Usuario"
                value={data.documentNumber}
                onCopy={() => void handleCopy(data.documentNumber, 'Usuario')}
              />
              <CredentialField
                label="Contrasena temporal"
                value={data.temporaryPassword}
                onCopy={() => void handleCopy(data.temporaryPassword, 'Contrasena')}
                mono
              />
            </div>

            <p className="text-xs text-muted-foreground">
              En el primer ingreso el sistema obligara al paciente a cambiar esta contrasena.
              Comparte la credencial por un canal seguro (en persona, WhatsApp al telefono
              registrado).
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCopyAll}>
            {copied ? <Check className="text-success" /> : <Copy />}
            {copied ? 'Copiado' : 'Copiar ambos'}
          </Button>
          <Button onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialField({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
        <code
          className={
            mono
              ? 'flex-1 font-mono text-base font-semibold tracking-wide'
              : 'flex-1 font-mono text-sm'
          }
        >
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:shadow-ring"
          aria-label={`Copiar ${label.toLowerCase()}`}
          title={`Copiar ${label.toLowerCase()}`}
        >
          <Copy className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
