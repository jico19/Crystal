import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { OrgThemeProvider } from './lib/OrgThemeContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OrgThemeProvider>
      <App />
    </OrgThemeProvider>
  </StrictMode>
);
