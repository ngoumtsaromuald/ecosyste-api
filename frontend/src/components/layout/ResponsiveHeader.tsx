'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Bell, 
  User, 
  Settings,
  LogOut,
  Home,
  Layers,
  BarChart3,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNavigation } from './MobileNavigation';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const desktopNavItems: NavigationItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/catalog', label: 'Catalogue', icon: Layers },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
];

interface ResponsiveHeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({ 
  user, 
  onLogout,
  showSearch = true,
  onSearch
}) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState('');

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const filteredDesktopItems = desktopNavItems.filter(item => 
    !item.adminOnly || (user?.role === 'admin')
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et Navigation Mobile */}
          <div className="flex items-center space-x-4">
            {/* Mobile Navigation */}
            <MobileNavigation user={user} onLogout={onLogout} />
            
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-800 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="hidden sm:block">ECOSYSTE</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {filteredDesktopItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100",
                    active 
                      ? "bg-blue-50 text-blue-700 border border-blue-200" 
                      : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search Bar - Hidden on small screens */}
          {showSearch && (
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Rechercher des APIs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>
              </form>
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Visible on small screens */}
            {showSearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden p-2 hover:bg-gray-100"
                asChild
              >
                <Link href="/search">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {user ? (
              <>
                {/* Notifications */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative p-2 hover:bg-gray-100 hidden sm:flex"
                >
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    3
                  </Badge>
                </Button>

                {/* User Menu - Desktop */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-32">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 hover:bg-gray-100"
                    asChild
                  >
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 hover:bg-red-50 hover:text-red-600"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Avatar - Mobile */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden p-1"
                  asChild
                >
                  <Link href="/profile">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </Link>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex"
                  asChild
                >
                  <Link href="/auth/login">
                    Se connecter
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                  asChild
                >
                  <Link href="/auth/register">
                    <span className="hidden sm:inline">S'inscrire</span>
                    <span className="sm:hidden">Inscription</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="lg:hidden border-t bg-gray-50 px-4 py-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher des APIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

export default ResponsiveHeader;