import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Organization } from '@crystal/types';

interface OrgThemeContextValue {
  org: Organization | null;
  isLoading: boolean;
  error: string | null;
}

const OrgThemeContext = createContext<OrgThemeContextValue>({
  org: null,
  isLoading: true,
  error: null,
});

export const useOrgTheme = () => useContext(OrgThemeContext);

interface OrgThemeProviderProps {
  children: React.ReactNode;
}

export const OrgThemeProvider: React.FC<OrgThemeProviderProps> = ({ children }) => {
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrgTheme() {
      try {
        setIsLoading(true);
        setError(null);

        const domain = window.location.hostname || 'localhost';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        
        const response = await fetch(`${apiUrl}/api/v1/organizations/by-domain?domain=${encodeURIComponent(domain)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load organization theme (${response.status})`);
        }

        const json = await response.json();
        
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Organization branding not found');
        }

        if (isMounted) {
          const orgData: Organization = json.data;
          setOrg(orgData);

          // 1. Inject CSS custom properties into :root
          if (orgData.branding_theme) {
            document.documentElement.style.setProperty('--primary', orgData.branding_theme.primary_color);
            document.documentElement.style.setProperty('--secondary', orgData.branding_theme.secondary_color);
            document.documentElement.style.setProperty('--accent', orgData.branding_theme.accent_color);
          }

          // 2. Update document title
          if (orgData.name) {
            document.title = `${orgData.name} - Home Care`;
          }

          // 3. Update favicon if present
          if (orgData.branding_theme?.favicon_url) {
            const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
            favicon.type = 'image/x-icon';
            favicon.rel = 'shortcut icon';
            favicon.href = orgData.branding_theme.favicon_url;
            document.getElementsByTagName('head')[0].appendChild(favicon);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unknown organization theme error';
          console.error('[OrgThemeProvider Error]', message);
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchOrgTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-300">Loading organization theme...</span>
        </div>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-6 text-center space-y-3">
          <span className="inline-block p-2 rounded-full bg-red-500/20 text-red-400">⚠️</span>
          <h2 className="text-xl font-bold">Theme Error</h2>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <OrgThemeContext.Provider value={{ org, isLoading, error }}>
      {children}
    </OrgThemeContext.Provider>
  );
};
