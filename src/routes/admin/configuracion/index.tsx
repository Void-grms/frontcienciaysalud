import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Image as ImageIcon, Save, Upload, X } from 'lucide-react';
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

  // Cuando se elige un logo nuevo, generamos una preview local y revocamos al
  // cambiar/cerrar.
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
      // Si tambien hay un logo pendiente, lo subimos en un PUT separado.
      // El backend reemplaza el archivo y borra el anterior best-effort.
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

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Configuracion</h1>
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Configuracion</h1>
        <p className="text-sm text-destructive">No se pudo cargar la configuracion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuracion del laboratorio</h1>
        <p className="text-sm text-muted-foreground">
          Estos datos se imprimen en los informes PDF (header y footer) y aparecen en el portal
          publico. El logo se incrusta en cada pagina del PDF.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identidad</CardTitle>
            <CardDescription>
              Razon social, RUC y color principal. El color se usa para acentos en el PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="commercialName">Razon social *</Label>
                <Input
                  id="commercialName"
                  autoComplete="off"
                  {...form.register('commercialName')}
                />
                {form.formState.errors.commercialName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.commercialName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="taxId">RUC</Label>
                <Input id="taxId" autoComplete="off" {...form.register('taxId')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" autoComplete="tel" {...form.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Direccion</Label>
              <Input id="address" autoComplete="street-address" {...form.register('address')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color principal (hex)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  placeholder="#0F766E"
                  className="max-w-[160px]"
                  {...form.register('primaryColor')}
                />
                <span
                  className="inline-block h-9 w-9 rounded-md border"
                  style={{ background: form.watch('primaryColor') || 'transparent' }}
                  aria-label="Preview color"
                />
              </div>
              {form.formState.errors.primaryColor && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.primaryColor.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              PNG, JPG o WebP · maximo 1 MB. Se imprime en la esquina superior del PDF y en el
              portal publico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 rounded-md border bg-muted/30 p-4">
              <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded border bg-background">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo del laboratorio"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Subir nuevo logo
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
                    <X className="h-4 w-4" /> Descartar cambio
                  </Button>
                )}
                {pendingLogo && (
                  <p className="text-xs text-muted-foreground">
                    El nuevo logo se subira al guardar.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Header y footer del informe</CardTitle>
            <CardDescription>
              HTML basico (texto, &lt;br&gt;, &lt;strong&gt;) que se imprime en cada pagina del PDF.
              No se ejecuta JavaScript ni se cargan recursos externos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headerHtml">Header HTML</Label>
              <Textarea
                id="headerHtml"
                rows={3}
                placeholder="<strong>Lab Clinico</strong> · informacion adicional"
                className="font-mono text-xs"
                {...form.register('headerHtml')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerHtml">Footer HTML</Label>
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

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
