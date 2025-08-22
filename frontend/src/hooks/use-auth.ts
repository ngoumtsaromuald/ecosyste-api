import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useRouter } from 'next/navigation';

/**
 * Hook personnalisé pour la gestion de l'authentification
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    setLoading,
  } = useAuthStore();

  const router = useRouter();

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    if (token && !user) {
      // Si on a un token mais pas d'utilisateur, récupérer les infos utilisateur
      refreshUser();
    }
  }, [token, user, refreshUser]);

  // Fonction de connexion avec gestion d'erreur
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  // Fonction d'inscription avec gestion d'erreur
  const handleRegister = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'individual' | 'enterprise';
  }) => {
    try {
      await register(userData);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role: 'individual' | 'enterprise') => {
    return user?.role === role;
  };

  // Fonction pour vérifier si l'utilisateur est connecté
  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/login');
      return false;
    }
    return true;
  };

  return {
    // État
    user,
    token,
    isAuthenticated,
    isLoading,
    
    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
    
    // Utilitaires
    hasRole,
    requireAuth,
    setLoading,
  };
}

/**
 * Hook pour protéger les routes authentifiées
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook pour rediriger les utilisateurs déjà connectés
 */
export function useRedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}