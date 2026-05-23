import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { defaultPathForRole, useAuth } from './useAuth';
import type { UserRole } from './types';

interface Props {
  allow: UserRole[];
}

export function RoleRoute({ allow }: Props) {
  const { user, isAuthenticating } = useAuth();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Cargando sesion...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={defaultPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
