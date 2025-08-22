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
  const { data: stats } = useDashboardStats();
  const { data: recentApis } = useFeaturedApis();
  const { data: favorites } = useFavoriteApis();

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
          {/* Éléments de fond décoratifs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
          </div>
          
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto">
              {/* En-tête de bienvenue modernisé */}
              <div className="mb-8 sm:mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                        Bonjour, {user?.firstName} ! 👋
                      </h1>
                      <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                        Voici un aperçu de votre activité sur ECOSYSTE
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs sm:text-sm">
                          <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          En ligne
                        </Badge>
                        <Badge variant="outline" className="border-green-200 text-green-700 text-xs sm:text-sm">
                          <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          <span className="hidden sm:inline">Compte vérifié</span>
                          <span className="sm:hidden">Vérifié</span>
                        </Badge>
                        {user?.accountType === 'enterprise' && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm">
                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            Entreprise
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Button variant="outline" size="sm" className="border-gray-200 hover:border-blue-300 text-xs sm:text-sm">
                      <Bell className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Notifications</span>
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-200 hover:border-blue-300 text-xs sm:text-sm">
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Paramètres</span>
                    </Button>
                  </div>
                </div>
                
                {/* Barre de progression du profil */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Progression du profil</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-blue-600">85%</span>
                    </div>
                    <Progress value={85} className="h-2 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="hidden sm:inline">Complétez votre profil pour débloquer toutes les fonctionnalités</span>
                      <span className="sm:hidden">Complétez votre profil</span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Statistiques rapides modernisées */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon;
                  const isPositive = Math.random() > 0.5; // Simulation de tendance
                  const changePercent = Math.floor(Math.random() * 20) + 1;
                  
                  return (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="p-3 sm:p-6">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                          </div>
                          <div className="flex items-center space-x-1">
                            {isPositive ? (
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            ) : (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                            )}
                            <span className={`text-xs sm:text-sm font-medium ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {changePercent}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                            {stat.title}
                          </p>
                          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                            {stat.value}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                            <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${
                              isPositive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {isPositive ? 'En hausse' : 'En baisse'}
                            </span>
                            <span className="text-xs text-gray-500 hidden sm:inline">vs mois dernier</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Actions rapides modernisées */}
                <Card className="lg:col-span-1 bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">Actions Rapides</span>
                    </CardTitle>
                    <CardDescription>
                      Accédez rapidement aux fonctionnalités principales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/catalog">
                      <Button className="w-full justify-between group hover:shadow-md transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0">
                        <span className="flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>Explorer le Catalogue</span>
                        </span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    
                    <Link href="/search">
                      <Button className="w-full justify-between group hover:shadow-md transition-all duration-300" variant="outline">
                        <span className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>Rechercher des API</span>
                        </span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>

                    {user?.accountType === 'enterprise' && (
                      <Link href="/dashboard/team">
                        <Button className="w-full justify-between group hover:shadow-md transition-all duration-300" variant="outline">
                          <span className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Gérer l&apos;Équipe</span>
                          </span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                    
                    <Link href="/dashboard/analytics">
                      <Button className="w-full justify-between group hover:shadow-md transition-all duration-300" variant="outline">
                        <span className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>Voir Analytics</span>
                        </span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Widget de performance */}
                <Card className="bg-gradient-to-br from-white to-green-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent text-sm sm:text-base">Performance</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Métriques de performance en temps réel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Temps de réponse</span>
                        <span className="text-xs sm:text-sm font-semibold text-green-600">245ms</span>
                      </div>
                      <Progress value={75} className="h-1.5 sm:h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Disponibilité</span>
                        <span className="text-xs sm:text-sm font-semibold text-green-600">99.9%</span>
                      </div>
                      <Progress value={99.9} className="h-1.5 sm:h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Taux de succès</span>
                        <span className="text-xs sm:text-sm font-semibold text-green-600">98.5%</span>
                      </div>
                      <Progress value={98.5} className="h-1.5 sm:h-2" />
                    </div>
                    
                    <div className="pt-2 sm:pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Dernière MAJ</span>
                        <span className="hidden sm:inline">Il y a 2 min</span>
                        <span className="sm:hidden">2 min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* API Recommandées modernisées */}
                <Card className="bg-gradient-to-br from-white to-purple-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent text-sm sm:text-base">API Recommandées</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Découvrez des API qui pourraient vous intéresser
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {recentApis && recentApis.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {recentApis.slice(0, 3).map((api) => (
                          <div key={api.id} className="group p-3 sm:p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-purple-200 transition-all duration-300 bg-white/50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors text-sm sm:text-base truncate">{api.name}</h4>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs flex-shrink-0">
                                    <span className="hidden sm:inline">Nouveau</span>
                                    <span className="sm:hidden">New</span>
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{api.description}</p>
                                <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                                    {api.category}
                                  </Badge>
                                  <div className="flex items-center space-x-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                    <span className="text-xs font-medium text-gray-700">
                                      {api.rating}/5
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 hidden sm:flex">
                                    <Eye className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {Math.floor(Math.random() * 1000) + 100} vues
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Link href={`/catalog/${api.id}`}>
                                <Button size="sm" className="ml-2 sm:ml-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 group-hover:shadow-md transition-all duration-300 flex-shrink-0">
                                  <Eye className="h-3 w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">Voir</span>
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                        <Link href="/catalog">
                          <Button variant="outline" className="w-full group hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 h-10 sm:h-11">
                            <span className="flex items-center space-x-2">
                              <Layers className="h-4 w-4" />
                              <span className="text-sm sm:text-base">Voir toutes les API</span>
                            </span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Database className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Aucune recommandation</h3>
                        <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm px-4">
                          Explorez notre catalogue pour découvrir des API adaptées à vos besoins
                        </p>
                        <Link href="/catalog">
                          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 h-10 sm:h-11">
                            <Globe className="h-4 w-4 mr-2" />
                            <span className="text-sm sm:text-base">Explorer le Catalogue</span>
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Section d'activité récente et analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                {/* Activité récente modernisée */}
                <Card className="bg-gradient-to-br from-white to-orange-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-gray-900 to-orange-800 bg-clip-text text-transparent text-sm sm:text-base">Activité Récente</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-orange-600 p-1 sm:p-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Vos dernières interactions avec les API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {stats.recentActivity.map((activity, index) => (
                          <div key={index} className="group flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-orange-200 transition-all duration-300 bg-white/50">
                            <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors text-sm sm:text-base truncate">{activity.action}</p>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                              <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                                  API
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(activity.timestamp).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Aucune activité récente</h3>
                        <p className="text-gray-600 text-xs sm:text-sm px-4">
                          Vos interactions avec les API apparaîtront ici
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Widget de graphiques */}
                <Card className="bg-gradient-to-br from-white to-indigo-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                          <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-gray-900 to-indigo-800 bg-clip-text text-transparent text-sm sm:text-base">Analytics</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-indigo-600 p-1 sm:p-2">
                          <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-indigo-600 p-1 sm:p-2">
                          <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Visualisation de vos données d'utilisation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {/* Graphique simulé */}
                      <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 sm:p-4 flex items-end justify-between">
                        {[40, 65, 45, 80, 55, 70, 85].map((height, index) => (
                          <div key={index} className="flex flex-col items-center space-y-1 sm:space-y-2">
                            <div 
                              className="w-4 sm:w-6 bg-gradient-to-t from-indigo-500 to-blue-400 rounded-t transition-all duration-1000 hover:from-indigo-600 hover:to-blue-500"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-xs text-gray-500">
                              {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Métriques rapides */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-2 sm:p-3 bg-white/50 rounded-lg">
                          <p className="text-lg sm:text-2xl font-bold text-indigo-600">2.4k</p>
                          <p className="text-xs text-gray-600">Requêtes totales</p>
                        </div>
                        <div className="text-center p-2 sm:p-3 bg-white/50 rounded-lg">
                          <p className="text-lg sm:text-2xl font-bold text-green-600">98.2%</p>
                          <p className="text-xs text-gray-600">Taux de succès</p>
                        </div>
                      </div>
                      
                      <Link href="/dashboard/analytics">
                        <Button variant="outline" className="w-full group hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 h-10 sm:h-11">
                          <span className="flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-sm sm:text-base">Voir Analytics Détaillées</span>
                          </span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section widgets supplémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mt-8 sm:mt-12">
                {/* Widget notifications */}
                <Card className="bg-gradient-to-br from-white to-yellow-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                        <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 bg-white/50 rounded-lg">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">Maintenance API</p>
                          <p className="text-xs text-gray-600">Dans 2h</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 bg-white/50 rounded-lg">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">Nouvelle API</p>
                          <p className="text-xs text-gray-600">Disponible</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2 sm:mt-3 text-xs hover:bg-yellow-50 h-8 sm:h-9">
                      <span className="hidden sm:inline">Voir toutes</span>
                      <span className="sm:hidden">Toutes</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Widget équipe */}
                <Card className="bg-gradient-to-br from-white to-purple-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">Équipe</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="flex -space-x-1 sm:-space-x-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white" />
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white" />
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white" />
                        </div>
                        <span className="text-xs text-gray-600">3 membres actifs</span>
                      </div>
                      <div className="text-center">
                        <p className="text-base sm:text-lg font-bold text-purple-600">12</p>
                        <p className="text-xs text-gray-600">API partagées</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2 sm:mt-3 text-xs hover:bg-purple-50 h-8 sm:h-9">
                      <span className="hidden sm:inline">Gérer l'équipe</span>
                      <span className="sm:hidden">Équipe</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Widget système */}
                <Card className="bg-gradient-to-br from-white to-green-50/50 border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <Layers className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">Système</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Statut</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <span className="hidden sm:inline">Opérationnel</span>
                          <span className="sm:hidden">OK</span>
                        </Badge>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Charge CPU</span>
                          <span className="font-medium">23%</span>
                        </div>
                        <Progress value={23} className="h-1 sm:h-1.5" />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Mémoire</span>
                          <span className="font-medium">67%</span>
                        </div>
                        <Progress value={67} className="h-1 sm:h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer du dashboard */}
              <div className="mt-8 sm:mt-16 text-center">
                <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-full border border-gray-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    <span className="hidden sm:inline">Tous les systèmes opérationnels</span>
                    <span className="sm:hidden">Systèmes OK</span>
                  </span>
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                    99.9%
                    <span className="hidden sm:inline"> uptime</span>
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
    </AuthGuard>
  </ResponsiveLayout>
  );
}