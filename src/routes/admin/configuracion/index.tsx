import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  AlertCircle,
  Code,
  Image as ImageIcon,
  Info,
  Loader2,
  Mail,
  Palette,
  Phone,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { PageHeader } from '@shared/components/page-header';
import { Textarea } from '@shared/components/ui/textarea';
import { storageUrl } from '@shared/api/storage-url';
import { reportFormError } from '@shared/lib/report-error';

import {
  useLabConfig,
  useUpdateLabConfig,
  useUpdateLabLogo,
} from '@features/lab-config/hooks';

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const MAX_LOGO_BYTES = 1024 * 1024;
const ALLOWED_LOGO_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const schema = z.object({
  commercialName: z.string().min(2, 'Minimo 2 caracteres').max(180),
  taxId: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  email: z.string().max(180).email('Email invalido').optional().or(z.literal('')),
  primaryColor: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || HEX_RE.test(v), 'Color hex invalido (ej. #0F766E)'),
  headerHtml: z.string().max(5000).optional().or(z.literal('')),
  footerHtml: z.string().max(5000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
      <AlertCircle className="size-3" />
      {message}
    </p>
  );
}

export default function ConfiguracionPage() {
  const query = useLabConfig();
  const updateMut = useUpdateLabConfig();
  const logoMut = useUpdateLabLogo();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      commercialName: '',
      taxId: '',
      address: '',
      phone: '',
      email: '',
      primaryColor: '',
      headerHtml: '',
      footerHtml: '',
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset({
        commercialName: query.data.commercialName,
        taxId: query.data.taxId ?? '',
        address: query.data.address ?? '',
        phone: query.data.phone ?? '',
        email: query.data.email ?? '',
        primaryColor: query.data.primaryColor ?? '',
        headerHtml: query.data.headerHtml ?? '',
        footerHtml: query.data.footerHtml ?? '',
      });
      setLogoPreview(storageUrl(query.data.logoStorageKey));
      setPendingLogo(null);
    }
  }, [query.data, form]);

  useEffect(() => {
    if (!pendingLogo) return;
    const url = URL.createObjectURL(pendingLogo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingLogo]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('El logo excede 1 MB');
      return;
    }
    if (!ALLOWED_LOGO_MIME.includes(file.type)) {
      toast.error('Formato no permitido. Usa PNG, JPG o WebP.');
      return;
    }
    setPendingLogo(file);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      commercialName: values.commercialName,
      ...(values.taxId !== undefined ? { taxId: values.taxId || undefined } : {}),
      ...(values.address !== undefined ? { address: values.address || undefined } : {}),
      ...(values.phone !== undefined ? { phone: values.phone || undefined } : {}),
      ...(values.email ? { email: values.email } : {}),
      ...(values.primaryColor ? { primaryColor: values.primaryColor } : {}),
      ...(values.headerHtml !== undefined ? { headerHtml: values.headerHtml } : {}),
      ...(values.footerHtml !== undefined ? { footerHtml: values.footerHtml } : {}),
    };

    try {
      await updateMut.mutateAsync(payload);
      if (pendingLogo) {
        await logoMut.mutateAsync(pendingLogo);
        setPendingLogo(null);
      }
      toast.success('Configuracion guardada');
    } catch (err) {
      reportFormError(err, form.setError);
    }
  });

  const submitting = updateMut.isPending || logoMut.isPending;
  const isDirty = form.formState.isDirty || pendingLogo !== null;

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configuracion" description="Cargando..." />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configuracion" />
        <p className="text-sm text-destructive">No se pudo cargar la configuracion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Configuracion del laboratorio"
        description="Estos datos se imprimen en los informes PDF y aparecen en el portal publico. Los cambios solo afectan a informes nuevos — los PDFs ya emitidos conservan los datos originales."
      />

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Identidad */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4 text-muted-foreground" />
              Identidad
            </CardTitle>
            <CardDescription>Razon social, RUC y datos de contacto del laboratorio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="commercialName">Razon social *</Label>
                <Input
                  id="commercialName"
                  autoComplete="organization"
                  placeholder="Laboratorio Clinico SAC"
                  {...form.register('commercialName')}
                  aria-invalid={!!form.formState.errors.commercialName || undefined}
                />
                <FieldError message={form.formState.errors.commercialName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxId">RUC / Tax ID</Label>
                <Input
                  id="taxId"
                  autoComplete="off"
                  className="font-mono tabular-nums"
                  placeholder="20123456789"
                  {...form.register('taxId')}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefono</Label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className="pl-9 tabular-nums"
                    placeholder="+51 1 234 5678"
                    {...form.register('phone')}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="pl-9"
                    placeholder="contacto@laboratorio.com"
                    {...form.register('email')}
                    aria-invalid={!!form.formState.errors.email || undefined}
                  />
                </div>
                <FieldError message={form.formState.errors.email?.message} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Direccion</Label>
              <Input
                id="address"
                autoComplete="street-address"
                placeholder="Av. Principal 123, Lima"
                {...form.register('address')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primaryColor">
                <span className="inline-flex items-center gap-1.5">
                  <Palette className="size-3.5" /> Color principal del PDF
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  placeholder="#0F766E"
                  className="max-w-[180px] font-mono uppercase"
                  {...form.register('primaryColor')}
                  aria-invalid={!!form.formState.errors.primaryColor || undefined}
                />
                <span
                  className="inline-block size-9 shrink-0 rounded-md border border-border shadow-xs"
                  style={{ background: form.watch('primaryColor') || 'transparent' }}
                  aria-label="Preview del color"
                />
              </div>
              <FieldError message={form.formState.errors.primaryColor?.message} />
              <p className="text-[11px] text-muted-foreground">
                Codigo hexadecimal (ej. <code className="font-mono">#0F766E</code>). Se usa para
                acentos en el encabezado del PDF.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              Logo del laboratorio
            </CardTitle>
            <CardDescription>
              Se incrusta en cada pagina del PDF y aparece en el portal publico. PNG, JPG o WebP
              hasta 1 MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-stretch gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row">
              <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-card sm:w-48">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo del laboratorio"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                    <ImageIcon className="size-6" />
                    <span className="text-[11px]">Sin logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload />
                    {logoPreview ? 'Reemplazar logo' : 'Subir logo'}
                  </Button>
                  {pendingLogo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingLogo(null);
                        setLogoPreview(storageUrl(query.data?.logoStorageKey ?? null));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X /> Descartar
                    </Button>
                  )}
                </div>
                {pendingLogo ? (
                  <p className="flex items-center gap-1 text-xs text-warning-foreground">
                    <AlertCircle className="size-3" />
                    El nuevo logo se subira al guardar.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    PNG, JPG o WebP. Maximo 1 MB.
                    <br />
                    Recomendado: ~600 x 200 px, fondo transparente.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HTML del informe */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Code className="size-4 text-muted-foreground" />
              Header y footer del informe
            </CardTitle>
            <CardDescription>
              HTML que se imprime en cada pagina del PDF. Solo se permiten etiquetas basicas
              (texto, &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;) — sin JavaScript ni recursos externos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="headerHtml">Header del PDF</Label>
              <Textarea
                id="headerHtml"
                rows={3}
                placeholder="<strong>Lab Clinico</strong> · informacion adicional"
                className="font-mono text-xs"
                {...form.register('headerHtml')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="footerHtml">Footer del PDF</Label>
              <Textarea
                id="footerHtml"
                rows={3}
                placeholder="Direccion · telefono · web"
                className="font-mono text-xs"
                {...form.register('footerHtml')}
              />
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:left-64">
        <div className="container flex items-center justify-between gap-3 py-3">
          <div className="text-xs text-muted-foreground">
            {isDirty ? (
              <span className="flex items-center gap-1.5 text-warning-foreground">
                <AlertCircle className="size-3.5" />
                Hay cambios sin guardar
              </span>
            ) : (
              <span>Sin cambios pendientes</span>
            )}
          </div>
          <Button
            type="submit"
            onClick={() => void onSubmit()}
            disabled={submitting || !isDirty}
            size="sm"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <Save />}
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
