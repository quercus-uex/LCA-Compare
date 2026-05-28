import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './hooks/auth.hook.tsx';
import { ParcelaProvider } from './hooks/parcela.hook.tsx';
import { ResultadoImpactoProvider } from './hooks/resultado-impacto.hook.tsx';
import { LocationProvider } from './hooks/location.hook.tsx';
import { CompareProvider } from './hooks/compare.hook.tsx';

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
