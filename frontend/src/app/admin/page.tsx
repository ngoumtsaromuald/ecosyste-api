'use client';

import React from 'react';
import { Suspense } from 'react';
import ElasticsearchAdmin from '../../components/admin/ElasticsearchAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  Database, 
  Activity, 
  Users, 
  Server, 
  BarChart3, 
  Settings, 
  Bell, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Eye, 
  Download,
  Layers,
  Monitor,
  Zap
} from 'lucide-react';

// Loading component for the admin page
function AdminPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Cluster health skeleton */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Indices skeleton */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Main admin page component
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Éléments de fond décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Page Header modernisé */}
      <div className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                    Administration
                  </h1>
                  <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Système actif
                  </Badge>
                </div>
                <p className="text-gray-600 text-lg">
                  Gestion et monitoring de l'infrastructure système
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Dernière mise à jour: il y a 2 min</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Activity className="h-4 w-4" />
                    <span>Uptime: 99.9%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions de l'en-tête */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                <Bell className="h-4 w-4 mr-2" />
                Alertes
                <Badge className="ml-2 bg-red-100 text-red-700 border-red-200 text-xs">
                  2
                </Badge>
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-12">
        {/* Métriques système modernisées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* CPU Usage */}
          <Card className="bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">+2.3%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                  <span className="text-2xl font-bold text-gray-900">23.4%</span>
                </div>
                <Progress value={23.4} className="h-2" />
                <p className="text-xs text-gray-500">8 cores disponibles</p>
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card className="bg-gradient-to-br from-white to-green-50/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-orange-600 font-medium">+5.1%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Mémoire</p>
                  <span className="text-2xl font-bold text-gray-900">67.8%</span>
                </div>
                <Progress value={67.8} className="h-2" />
                <p className="text-xs text-gray-500">10.8GB / 16GB utilisés</p>
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card className="bg-gradient-to-br from-white to-purple-50/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <HardDrive className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">+1.2%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Stockage</p>
                  <span className="text-2xl font-bold text-gray-900">45.2%</span>
                </div>
                <Progress value={45.2} className="h-2" />
                <p className="text-xs text-gray-500">452GB / 1TB utilisés</p>
              </div>
            </CardContent>
          </Card>

          {/* Network */}
          <Card className="bg-gradient-to-br from-white to-orange-50/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Wifi className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Actif</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Réseau</p>
                  <span className="text-2xl font-bold text-gray-900">1.2GB/s</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>↑ 234MB/s</span>
                  <span>↓ 967MB/s</span>
                </div>
                <p className="text-xs text-gray-500">Latence: 12ms</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Monitor className="h-5 w-5 text-white" />
                </div>
                <span>Services Système</span>
              </CardTitle>
              <CardDescription>
                État des services critiques de l'infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Elasticsearch', status: 'healthy', uptime: '99.9%', icon: Database },
                  { name: 'Redis Cache', status: 'healthy', uptime: '99.8%', icon: Zap },
                  { name: 'PostgreSQL', status: 'healthy', uptime: '99.9%', icon: Database },
                  { name: 'API Gateway', status: 'warning', uptime: '98.2%', icon: Layers }
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        service.status === 'healthy' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        <service.icon className={`h-4 w-4 ${
                          service.status === 'healthy' ? 'text-green-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    <Badge className={`${
                      service.status === 'healthy' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>
                      {service.status === 'healthy' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Opérationnel</>
                      ) : (
                        <><AlertTriangle className="h-3 w-3 mr-1" />Attention</>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-indigo-50/50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Analytics</span>
              </CardTitle>
              <CardDescription>
                Métriques d'utilisation en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">1,247</p>
                  <p className="text-sm text-gray-600">Requêtes/min</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Utilisateurs actifs</span>
                    <span className="font-semibold">342</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API calls/h</span>
                    <span className="font-semibold">74.8k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Erreurs</span>
                    <span className="font-semibold text-red-600">0.02%</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full hover:bg-indigo-50 hover:border-indigo-300">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outils de gestion avancés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span>Gestion des Utilisateurs</span>
              </CardTitle>
              <CardDescription>
                Administration des comptes et permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Utilisateurs actifs</p>
                      <p className="text-sm text-gray-500">Dernières 24h</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">1,247</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir tous
                  </Button>
                  <Button variant="outline" className="hover:bg-green-50 hover:border-green-300">
                    <Settings className="h-4 w-4 mr-2" />
                    Gérer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <span>Alertes & Monitoring</span>
              </CardTitle>
              <CardDescription>
                Surveillance système et notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  {[
                    { type: 'warning', message: 'CPU usage élevé sur le serveur #2', time: '2 min' },
                    { type: 'info', message: 'Mise à jour système programmée', time: '1h' },
                    { type: 'success', message: 'Backup automatique terminé', time: '3h' }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className={`p-1 rounded-full ${
                        alert.type === 'warning' ? 'bg-orange-100' :
                        alert.type === 'info' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                        ) : alert.type === 'info' ? (
                          <Clock className="h-3 w-3 text-blue-600" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <p className="text-xs text-gray-500">Il y a {alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full hover:bg-red-50 hover:border-red-300">
                  <Bell className="h-4 w-4 mr-2" />
                  Voir toutes les alertes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Elasticsearch Admin Component */}
        <Card className="mb-12 bg-gradient-to-br from-white to-slate-50/50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-slate-700 to-gray-800 rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span>Administration Elasticsearch</span>
            </CardTitle>
            <CardDescription>
              Gestion des indices, clusters et configuration avancée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<AdminPageSkeleton />}>
              <ElasticsearchAdmin />
            </Suspense>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card className="mb-12 bg-gradient-to-br from-white to-indigo-50/50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span>Actions Rapides</span>
            </CardTitle>
            <CardDescription>
              Outils d'administration et de maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-20 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Redémarrer Services</span>
                </div>
              </Button>
              <Button className="h-20 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <Download className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Export Données</span>
                </div>
              </Button>
              <Button className="h-20 bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <Settings className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Configuration</span>
                </div>
              </Button>
              <Button className="h-20 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Rapports</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer modernisé */}
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Système opérationnel</span>
            <span className="text-xs text-green-600">• Dernière vérification: {new Date().toLocaleTimeString()}</span>
          </div>
          <p className="text-xs text-gray-500 mt-4">Administration ECOSYSTE • Version 2.1.0</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2024 Ecosyste Admin. Tous droits réservés.</p>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Système opérationnel</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Metadata for the page
export const metadata = {
  title: 'Administration - Ecosyste',
  description: 'Interface d\'administration pour la gestion du cluster Elasticsearch',
};