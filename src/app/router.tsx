import { createBrowserRouter, Navigate } from 'react-router-dom';

import AdminLayout from '@layouts/AdminLayout';
import PatientLayout from '@layouts/PatientLayout';
import ReferenceLayout from '@layouts/ReferenceLayout';
import PublicLayout from '@layouts/PublicLayout';

import LoginPage from '@routes/auth/login';
import AdminOverview from '@routes/admin';
import CatalogPage from '@routes/admin/catalogo';
import PacientesPage from '@routes/admin/pacientes';
import ReferenciasPage from '@routes/admin/referencias';
import ProfesionalesPage from '@routes/admin/profesionales';
import ConfiguracionPage from '@routes/admin/configuracion';
import AuditoriaPage from '@routes/admin/auditoria';
import OrdenesListPage from '@routes/admin/ordenes';
import NuevaOrdenPage from '@routes/admin/ordenes/nueva';
import OrdenDetailPage from '@routes/admin/ordenes/detalle';
import ResultadosPage from '@routes/admin/ordenes/resultados';
import PatientOrdersList from '@routes/paciente';
import PatientOrderDetailPage from '@routes/paciente/detalle';
import ReferenceOrdersList from '@routes/referencia';
import ReferenceOrderDetailPage from '@routes/referencia/detalle';
import ReferencePatientsPage from '@routes/referencia/pacientes';
import VerifyPage from '@routes/public/verify';
import NotFoundPage from '@routes/public/not-found';

import { RoleRoute } from '@shared/auth/RoleRoute';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },

  // Auth
  { path: '/login', element: <LoginPage /> },

  // Pagina publica de verificacion
  {
    element: <PublicLayout />,
    children: [{ path: '/verificar/:token', element: <VerifyPage /> }],
  },

  // Admin
  {
    element: <RoleRoute allow={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminOverview /> },
          { path: '/admin/catalogo', element: <CatalogPage /> },
          { path: '/admin/pacientes', element: <PacientesPage /> },
          { path: '/admin/referencias', element: <ReferenciasPage /> },
          { path: '/admin/profesionales', element: <ProfesionalesPage /> },
          { path: '/admin/configuracion', element: <ConfiguracionPage /> },
          { path: '/admin/ordenes', element: <OrdenesListPage /> },
          { path: '/admin/ordenes/nueva', element: <NuevaOrdenPage /> },
          { path: '/admin/ordenes/:idOrCode', element: <OrdenDetailPage /> },
          { path: '/admin/ordenes/:idOrCode/resultados', element: <ResultadosPage /> },
          { path: '/admin/auditoria', element: <AuditoriaPage /> },
        ],
      },
    ],
  },

  // Paciente
  {
    element: <RoleRoute allow={['patient']} />,
    children: [
      {
        element: <PatientLayout />,
        children: [
          { path: '/paciente', element: <PatientOrdersList /> },
          { path: '/paciente/:idOrCode', element: <PatientOrderDetailPage /> },
        ],
      },
    ],
  },

  // Referencia
  {
    element: <RoleRoute allow={['reference_user']} />,
    children: [
      {
        element: <ReferenceLayout />,
        children: [
          { path: '/referencia', element: <ReferenceOrdersList /> },
          { path: '/referencia/pacientes', element: <ReferencePatientsPage /> },
          { path: '/referencia/:idOrCode', element: <ReferenceOrderDetailPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
