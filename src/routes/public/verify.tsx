import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  FileBadge2,
  Info,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Stamp,
} from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { formatDateTime } from '@shared/lib/format-date';

import { useVerifyReport } from '@features/reports/hooks';

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const query = useVerifyReport(token ?? null);

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Verificando informe...
        </CardContent>
      </Card>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive/40 bg-destructive/[0.03]">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="size-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">Informe no valido</h2>
                <p className="text-sm text-muted-foreground">
                  No pudimos verificar este enlace.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <p className="text-foreground">El enlace puede haber:</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Expirado o sido revocado por el laboratorio.</li>
                <li>• Sido modificado o alterado despues de su emision.</li>
                <li>• Provenir de un documento no autentico.</li>
              </ul>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Si recibiste este enlace de tu laboratorio, contactalos para obtener uno valido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-5">
      {/* Card principal: marca de validez */}
      <Card className="overflow-hidden border-success/30">
        <div className="border-b border-success/20 bg-success/5 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className="grid size-12 shrink-0 place-items-center rounded-full bg-success/15 text-success ring-1 ring-success/20"
              aria-hidden
            >
              <ShieldCheck className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-success">
                  Documento autentico
                </h2>
                <Badge variant="outline" className="font-mono">
                  v{data.reportVersion}
                </Badge>
                {data.isAmended && <Badge variant="warning">Enmendado</Badge>}
              </div>
              <p className="mt-1 text-sm text-foreground">
                Este informe fue emitido por{' '}
                <span className="font-medium">{data.laboratory.commercialName}</span>
                {data.laboratory.taxId && (
                  <>
                    {' '}(RUC <span className="font-mono tabular-nums">{data.laboratory.taxId}</span>)
                  </>
                )}{' '}
                y es valido segun nuestros registros.
              </p>
            </div>
          </div>
        </div>

        {data.isAmended && (
          <div className="flex items-start gap-3 border-b border-border bg-warning/10 px-6 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
            <div>
              <p className="font-medium text-warning-foreground">Informe enmendado</p>
              <p className="mt-0.5 text-xs text-warning-foreground/80">
                Este informe fue marcado como enmendado. La version vigente puede ser otra —
                consulta al laboratorio para obtener el informe actual.
              </p>
            </div>
          </div>
        )}

        <CardContent className="p-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <Row label="Codigo de orden" value={data.orderCode} mono />
            <Row label="Version" value={`v${data.reportVersion}`} />
            {data.validatedAt && (
              <Row label="Validado" value={formatDateTime(data.validatedAt)} tabular />
            )}
            {data.deliveredAt && (
              <Row label="Entregado" value={formatDateTime(data.deliveredAt)} tabular />
            )}
            <Row label="Paciente" value={data.patient.initials} />
            <Row label="Documento" value={data.patient.documentMasked} mono />
          </div>
        </CardContent>
      </Card>

      {/* Firmantes */}
      {data.professionals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Stamp className="size-4 text-muted-foreground" />
              Profesionales firmantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.professionals.map((p, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <div
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"
                    aria-hidden
                  >
                    <FileBadge2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{p.fullName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {p.professionalTitle ?? 'Profesional'}
                      {p.licenseNumber && (
                        <>
                          <span className="mx-1.5 text-border">·</span>
                          <span className="font-mono">CP {p.licenseNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer de privacidad */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Privacidad</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Por proteccion del paciente, esta pagina solo confirma autenticidad y datos minimos.
            Los resultados y datos personales completos solo son accesibles desde el portal del
            laboratorio con credenciales validas.
          </p>
        </div>
      </div>

      {/* Acento de verificacion */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-success" />
        <span>Verificado contra los registros del laboratorio</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  tabular,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tabular?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={[
          'mt-0.5 font-medium',
          mono && 'font-mono',
          tabular && 'tabular-nums',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </div>
    </div>
  );
}
