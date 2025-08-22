'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  Layers, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Shield,
  BarChart3,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/search', label: 'Recherche', icon: Search },
  { href: '/catalog', label: 'Catalogue', icon: Layers },
  { href: '/dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { href: '/profile', label: 'Profil', icon: User },
  { href: '/admin', label: 'Administration', icon: Shield, adminOnly: true },
  { href: '/settings', label: 'Paramètres', icon: Settings },
  { href: '/help', label: 'Aide', icon: HelpCircle },
];

interface MobileNavigationProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  user, 
  onLogout 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const filteredItems = navigationItems.filter(item => 
    !item.adminOnly || (user?.role === 'admin')
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden p-2 hover:bg-gray-100 transition-colors"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="w-80 p-0 bg-gradient-to-b from-white to-gray-50"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold text-white">
                ECOSYSTE
              </SheetTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-3 mt-4 p-3 bg-white/10 rounded-lg">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-blue-100 truncate">
                    {user.email}
                  </p>
                </div>
                {user.role === 'admin' && (
                  <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Navigation Items */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 group",
                      active 
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        active 
                          ? "bg-blue-100 text-blue-600" 
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        active ? "text-blue-600" : "text-gray-400"
                      )} />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Notifications */}
            {user && (
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Bell className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Notifications
                  </span>
                  <Badge className="bg-orange-500 text-white text-xs ml-auto">
                    3
                  </Badge>
                </div>
                <p className="text-xs text-orange-700">
                  Vous avez 3 nouvelles notifications
                </p>
              </div>
            )}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {user ? (
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={() => {
                  onLogout?.();
                  setIsOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800" 
                  asChild
                >
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    Se connecter
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-gray-100" 
                  asChild
                >
                  <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                    S'inscrire
                  </Link>
                </Button>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                ECOSYSTE v2.1.0
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;