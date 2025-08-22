'use client';

import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardStats, useFeaturedApis, useFavoriteApis } from '@/hooks/use-api';
import Link from 'next/link';
import { 
  BarChart3, 
  Database, 
  Heart, 
  TrendingUp, 
  Users, 
  Zap,
  ArrowRight,
  Star,
  Activity,
  Globe,
  Shield,
  Clock,
  Target,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Eye,
  Download,
  Settings,
  Bell,
  Calendar,
  PieChart,
  LineChart,
  BarChart,
  Layers
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: featuredApis, isLoading: featuredLoading } = useFeaturedApis();
  const { data: favorites, isLoading: favoritesLoading } = useFavoriteApis();

  const quickStats = [
    {
      title: 'API Utilisées',
      value: stats?.usedApis || 0,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Favoris',
      value: favorites?.length || 0,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Requêtes ce mois',
      value: stats?.monthlyRequests || 0,
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Économies',
      value: `${stats?.savings || 0}€`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <AuthGuard>
      <ResponsiveLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto">
              {/* Dashboard content */}
              <div className="text-center py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Bonjour, {user?.firstName} ! 👋
                </h1>
                <p className="text-gray-600 mb-8">
                  Voici un aperçu de votre activité sur ECOSYSTE
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {quickStats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bgColor}`}>
                              <IconComponent className={`h-6 w-6 ${stat.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Additional dashboard content can be added here */}
                <div className="text-center">
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                    99.9% uptime
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    </AuthGuard>
  );
}