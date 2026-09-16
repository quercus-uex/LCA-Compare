import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { NavbarContainer } from './components/navbar-container.component.tsx';
import { AdminRoute } from './routes/admin/admin.route.tsx';
import { LoginRoute } from './routes/auth/login.route.tsx';
import { CompareRoute } from './routes/compare/compare.route.tsx';
import { LandingRoute } from './routes/landing/landing.route.tsx';
import { NotFoundRoute } from './routes/not-found.route.tsx';
import { ParcelaRoute } from './routes/parcelas/parcela.route.tsx';
import { ParcelasRoute } from './routes/parcelas/parcelas.route.tsx';
import { ResultadoRoute } from './routes/resultados/resultado.route.tsx';
import { StatsRoute } from './routes/stats/stats.route.tsx';

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
