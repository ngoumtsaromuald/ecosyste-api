'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  allowedRoles,
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Si l'authentification est requise mais l'utilisateur n'est pas connecté
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // Si l'utilisateur est connecté mais n'a pas les rôles requis
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }

    // Si l'utilisateur est connecté mais l'authentification n'est pas requise
    if (!requireAuth && user) {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoading, requireAuth, redirectTo, allowedRoles, router]);

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification de l&apos;authentification...</p>
        </div>
      </div>
    );
  }

  // Si l'authentification est requise et l'utilisateur n'est pas connecté
  if (requireAuth && !user) {
    return null; // Le redirect se fait dans useEffect
  }

  // Si l'utilisateur n'a pas les rôles requis
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // Le redirect se fait dans useEffect
  }

  // Si l'utilisateur est connecté mais l'authentification n'est pas requise
  if (!requireAuth && user) {
    return null; // Le redirect se fait dans useEffect
  }

  return <>{children}</>;
}