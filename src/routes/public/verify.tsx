import { useParams } from 'react-router-dom';
import { CheckCircle2, FileBadge2, Loader2, ShieldAlert, Stamp } from 'lucide-react';

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
        <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Verificando informe...
        </CardContent>
      </Card>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle>Token no valido</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            No pudimos verificar este informe. El enlace puede haber expirado, ser invalido o
            haberse revocado.
          </p>
          <p className="text-xs">
            Si recibiste este enlace de tu laboratorio, comunicate con ellos para obtener uno
            nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-4">
      {/* Card principal: marca de validez */}
      <Card className="border-emerald-500/40">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle className="text-lg">Documento autentico</CardTitle>
            </div>
            <Badge variant="outline" className="font-mono">
              v{data.reportVersion}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            Este informe fue emitido por <strong>{data.laboratory.commercialName}</strong>
            {data.laboratory.taxId ? ` (RUC ${data.laboratory.taxId})` : ''} y es valido segun
            nuestros registros.
          </p>
          {data.isAmended && (
            <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-amber-900">
              Atencion: este informe fue marcado como <strong>enmendado</strong>. La version
              vigente puede ser otra; consulta a tu laboratorio para obtener el informe vigente.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metadatos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileBadge2 className="h-4 w-4" /> Datos del informe
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Codigo de orden" value={data.orderCode} mono />
          <Row label="Version" value={`v${data.reportVersion}`} />
          {data.validatedAt && (
            <Row label="Validado" value={formatDateTime(data.validatedAt)} />
          )}
          {data.deliveredAt && (
            <Row label="Entregado" value={formatDateTime(data.deliveredAt)} />
          )}
          <Row label="Paciente" value={data.patient.initials} />
          <Row label="Documento" value={data.patient.documentMasked} mono />
        </CardContent>
      </Card>

      {/* Firmantes */}
      {data.professionals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stamp className="h-4 w-4" /> Profesionales firmantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.professionals.map((p, idx) => (
                <li key={idx} className="rounded border bg-card px-3 py-2 text-sm">
                  <div className="font-medium">{p.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.professionalTitle ?? 'Profesional'}
                    {p.licenseNumber ? ` · CMP/Colegiatura ${p.licenseNumber}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Por privacidad, los datos clinicos no se exponen en esta vista publica. Solicita el PDF
        completo a tu laboratorio para verlos.
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? 'font-mono font-medium' : 'font-medium'}>{value}</div>
    </div>
  );
}
