'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps de cache par défaut
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
            // Retry automatique en cas d'erreur
            retry: (failureCount, error: Error) => {
              // Ne pas retry pour les erreurs 4xx
              if ('code' in error && typeof error.code === 'number' && error.code >= 400 && error.code < 500) {
                return false;
              }
              // Retry jusqu'à 3 fois pour les autres erreurs
              return failureCount < 3;
            },
            // Refetch automatique
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry pour les mutations
            retry: (failureCount, error: Error) => {
              if ('code' in error && typeof error.code === 'number' && error.code >= 400 && error.code < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}