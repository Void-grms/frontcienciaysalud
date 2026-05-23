import { Link } from 'react-router-dom';

import { Button } from '@shared/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">La pagina que buscas no existe.</p>
      <Button asChild>
        <Link to="/login">Ir al inicio</Link>
      </Button>
    </div>
  );
}
