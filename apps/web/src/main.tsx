import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.ts';
import './index.css'
import { BrowserRouter } from 'react-router';
import App from './App.tsx'
import { AuthProvider } from './hooks/auth.hook.tsx';
import { CompareProvider } from './hooks/compare.hook.tsx';
import { LocationProvider } from './hooks/location.hook.tsx';
import { ParcelaProvider } from './hooks/parcela.hook.tsx';
import { ResultadoImpactoProvider } from './hooks/resultado-impacto.hook.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ParcelaProvider>
        <ResultadoImpactoProvider>
          <LocationProvider>
            <CompareProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </CompareProvider>
          </LocationProvider>
        </ResultadoImpactoProvider>
      </ParcelaProvider>
    </AuthProvider>
  </StrictMode>,
);
