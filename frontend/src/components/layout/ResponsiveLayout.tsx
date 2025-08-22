'use client';

import React from 'react';
import { ResponsiveHeader } from './ResponsiveHeader';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showSearch?: boolean;
  headerProps?: {
    user?: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    } | null;
    onLogout?: () => void;
    onSearch?: (query: string) => void;
  };
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

const containerSizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-none'
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  showHeader = true,
  showSearch = true,
  headerProps,
  containerSize = 'lg',
  padding = true
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {showHeader && (
        <ResponsiveHeader
          showSearch={showSearch}
          {...headerProps}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        'flex-1',
        showHeader && 'pt-0', // Header is sticky, no need for top padding
        className
      )}>
        <div className={cn(
          'mx-auto w-full',
          containerSizes[containerSize],
          padding && 'px-4 sm:px-6 lg:px-8'
        )}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-auto">
        <div className={cn(
          'mx-auto py-8 sm:py-12',
          containerSizes[containerSize],
          padding && 'px-4 sm:px-6 lg:px-8'
        )}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  ECOSYSTE
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                La plateforme de référence pour découvrir, tester et intégrer les meilleures API du marché.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Produit</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/catalog" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Catalogue API
                  </a>
                </li>
                <li>
                  <a href="/search" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Recherche
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="/analytics" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Analytics
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Ressources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/guides" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="/support" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="/community" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Communauté
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Légal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Conditions
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Cookies
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-500">
                © 2024 ECOSYSTE. Tous droits réservés.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Version 2.1.0</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Tous les systèmes opérationnels</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Specialized layout variants
export const PageLayout: React.FC<{
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}> = ({ children, title, description, className }) => {
  return (
    <ResponsiveLayout className={className}>
      {(title || description) && (
        <div className="py-8 sm:py-12 border-b">
          <div className="text-center">
            {title && (
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="py-8 sm:py-12">
        {children}
      </div>
    </ResponsiveLayout>
  );
};

export const DashboardLayout: React.FC<{
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
}> = ({ children, user, onLogout }) => {
  return (
    <ResponsiveLayout
      headerProps={{ user, onLogout }}
      containerSize="xl"
      className="bg-gray-50"
    >
      <div className="py-6 sm:py-8">
        {children}
      </div>
    </ResponsiveLayout>
  );
};

export const AuthLayout: React.FC<{
  children: React.ReactNode;
  title?: string;
  description?: string;
}> = ({ children, title, description }) => {
  return (
    <ResponsiveLayout
      showHeader={false}
      containerSize="sm"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
          </div>
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </ResponsiveLayout>
  );
};

export default ResponsiveLayout;