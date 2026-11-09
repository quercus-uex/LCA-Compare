import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { NavbarContainer } from './components/navbar-container.component.tsx';
import { LoginRoute } from './routes/auth/login.route.tsx';
import { LandingRoute } from './routes/landing/landing.route.tsx';
import { NotFoundRoute } from './routes/not-found.route.tsx';

// Las rutas con mapas, gráficas o el panel de administración se cargan al visitarlas
const AdminRoute = lazy(() => import('./routes/admin/admin.route.tsx').then((m) => ({ default: m.AdminRoute })));
const CompareRoute = lazy(() => import('./routes/compare/compare.route.tsx').then((m) => ({ default: m.CompareRoute })));
const MiembroParcelasRoute = lazy(() => import('./routes/organizaciones/miembro-parcelas.route.tsx').then((m) => ({ default: m.MiembroParcelasRoute })));
const OrganizacionRoute = lazy(() => import('./routes/organizaciones/organizacion.route.tsx').then((m) => ({ default: m.OrganizacionRoute })));
const OrganizacionesRoute = lazy(() => import('./routes/organizaciones/organizaciones.route.tsx').then((m) => ({ default: m.OrganizacionesRoute })));
const ParcelaRoute = lazy(() => import('./routes/parcelas/parcela.route.tsx').then((m) => ({ default: m.ParcelaRoute })));
const ParcelasRoute = lazy(() => import('./routes/parcelas/parcelas.route.tsx').then((m) => ({ default: m.ParcelasRoute })));
const ResultadoRoute = lazy(() => import('./routes/resultados/resultado.route.tsx').then((m) => ({ default: m.ResultadoRoute })));
const StatsRoute = lazy(() => import('./routes/stats/stats.route.tsx').then((m) => ({ default: m.StatsRoute })));

function App() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-base-300">
      <Toaster position="bottom-right" richColors />
      <Routes>
        <Route path="/" element={<NavbarContainer />}>
          <Route index element={<LandingRoute />} />
          <Route path="/compare" element={<CompareRoute />} />
          <Route path="/auth/login" element={<LoginRoute />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/estadisticas" element={<StatsRoute />} />
          <Route path="/organizaciones">
            <Route index element={<OrganizacionesRoute />} />
            <Route path=":id" element={<OrganizacionRoute />} />
            <Route path=":id/miembros/:idUsuario" element={<MiembroParcelasRoute />} />
          </Route>
          <Route path="/parcelas">
            <Route index element={<ParcelasRoute />} />
            <Route path=":id" element={<ParcelaRoute />} />
          </Route>
          <Route path="/resultados">
            <Route path=":id" element={<ResultadoRoute />} />
          </Route>
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App
