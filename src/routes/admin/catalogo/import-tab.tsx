import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { downloadBlob } from '@shared/lib/download-blob';
import { reportFormError } from '@shared/lib/report-error';

import { catalogApi } from '@features/catalog/api';
import { catalogKeys } from '@features/catalog/hooks';
import type {
  ImportDryRunResponse,
  ImportError,
  ImportSummary,
} from '@features/catalog/types';

type Phase = 'idle' | 'uploading' | 'review' | 'confirming' | 'done';

function describeSummary(s: ImportSummary): Array<{ key: string; label: string; value: string }> {
  return [
    {
      key: 'cat',
      label: 'Categorias',
      value: `${s.categories.rows} filas · ${s.categories.toCreate} nuevas / ${s.categories.toUpdate} actualizar`,
    },
    {
      key: 'tests',
      label: 'Pruebas',
      value: `${s.tests.rows} filas · ${s.tests.toCreate} nuevas / ${s.tests.toUpdate} actualizar`,
    },
    {
      key: 'ranges',
      label: 'Rangos',
      value: `${s.ranges.rows} filas · ${s.ranges.toCreate} a crear`,
    },
  ];
}

export function ImportTab() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>('idle');
  const [dryRun, setDryRun] = useState<ImportDryRunResponse | null>(null);
  const [confirmedSummary, setConfirmedSummary] = useState<ImportSummary | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const hasErrors = useMemo(
    () => (dryRun?.errors.length ?? 0) > 0,
    [dryRun],
  );

  const handleTemplate = async () => {
    try {
      const blob = await catalogApi.downloadImportTemplate();
      downloadBlob(blob, 'plantilla-pruebas.xlsx');
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setPhase('uploading');
    setConfirmedSummary(null);
    try {
      const response = await catalogApi.uploadImport(file);
      setDryRun(response);
      setPhase('review');
    } catch (err) {
      setPhase('idle');
      reportFormError(err);
    } finally {
      // Limpiamos el input para que el mismo archivo pueda re-seleccionarse.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!dryRun) return;
    setPhase('confirming');
    try {
      const res = await catalogApi.confirmImport(dryRun.importToken);
      setConfirmedSummary(res.summary);
      setPhase('done');
      toast.success('Importacion aplicada');
      // Invalidamos el cache de categorias/pruebas/paneles para que las
      // tablas reflejen lo recien insertado/actualizado.
      void qc.invalidateQueries({ queryKey: catalogKeys.categories.all });
      void qc.invalidateQueries({ queryKey: catalogKeys.tests.all });
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.all });
    } catch (err) {
      setPhase('review');
      reportFormError(err);
    }
  };

  const handleDownloadErrors = async () => {
    if (!dryRun) return;
    try {
      const blob = await catalogApi.downloadImportErrors(dryRun.importToken);
      downloadBlob(blob, `errores-${dryRun.importToken}.xlsx`);
    } catch (err) {
      reportFormError(err);
    }
  };

  const reset = () => {
    setDryRun(null);
    setConfirmedSummary(null);
    setFilename(null);
    setPhase('idle');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importacion masiva (XLSX)</CardTitle>
        <CardDescription>
          Sube un archivo siguiendo la plantilla oficial. El sistema corre primero un dry-run para
          mostrarte cuantas filas se crearan o actualizaran, y si hay errores los descargas como
          XLSX para corregir y reintentar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => void handleTemplate()}>
            <Download className="h-4 w-4" /> Descargar plantilla
          </Button>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={phase === 'uploading' || phase === 'confirming'}
            >
              <Upload className="h-4 w-4" />
              {phase === 'uploading' ? 'Subiendo...' : 'Subir archivo'}
            </Button>
            {filename && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" /> {filename}
              </span>
            )}
          </div>
        </div>

        {phase === 'review' && dryRun && (
          <section className="space-y-4">
            <div className="rounded-md border bg-card">
              <div className="border-b p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Resumen del archivo</h3>
                  {hasErrors ? (
                    <Badge variant="destructive">
                      {dryRun.errors.length} {dryRun.errors.length === 1 ? 'error' : 'errores'}
                    </Badge>
                  ) : (
                    <Badge variant="success">Sin errores</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Token: <code className="font-mono">{dryRun.importToken}</code> · expira{' '}
                  {new Date(dryRun.expiresAt).toLocaleString()}
                </p>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                {describeSummary(dryRun.summary).map((row) => (
                  <div key={row.key} className="rounded-md border p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </div>
                    <div className="mt-1 text-sm">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {hasErrors ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">
                        Corrige los errores antes de confirmar
                      </p>
                      <p className="text-muted-foreground">
                        El backend rechaza la confirmacion mientras haya errores. Descarga el
                        reporte, corrige el archivo y vuelve a subirlo.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void handleDownloadErrors()}>
                    <Download className="h-4 w-4" /> Descargar errores
                  </Button>
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto rounded-md border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Hoja</TableHead>
                        <TableHead className="w-[60px]">Fila</TableHead>
                        <TableHead className="w-[140px]">Columna</TableHead>
                        <TableHead>Mensaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dryRun.errors.slice(0, 50).map((err: ImportError, idx) => (
                        <TableRow key={`${err.sheet}-${err.row}-${err.column}-${idx}`}>
                          <TableCell className="text-xs">{err.sheet}</TableCell>
                          <TableCell className="text-xs tabular-nums">{err.row}</TableCell>
                          <TableCell className="font-mono text-xs">{err.column}</TableCell>
                          <TableCell className="text-xs">{err.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {dryRun.errors.length > 50 && (
                    <div className="border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      Mostrando 50 de {dryRun.errors.length}. Descarga el XLSX para ver todos.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={reset} disabled={phase !== 'review'}>
                  <RotateCcw className="h-4 w-4" /> Cancelar
                </Button>
                <Button
                  onClick={() => void handleConfirm()}
                  disabled={phase !== 'review'}
                >
                  <CheckCircle2 className="h-4 w-4" /> Confirmar importacion
                </Button>
              </div>
            )}
          </section>
        )}

        {phase === 'confirming' && (
          <p className="text-sm text-muted-foreground">Aplicando cambios al catalogo...</p>
        )}

        {phase === 'done' && confirmedSummary && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-emerald-700">Importacion confirmada</p>
                <p className="text-muted-foreground">
                  Categorias: {confirmedSummary.categories.toCreate} nuevas /{' '}
                  {confirmedSummary.categories.toUpdate} actualizadas · Pruebas:{' '}
                  {confirmedSummary.tests.toCreate} nuevas /{' '}
                  {confirmedSummary.tests.toUpdate} actualizadas · Rangos:{' '}
                  {confirmedSummary.ranges.toCreate} nuevos.
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Nueva importacion
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
