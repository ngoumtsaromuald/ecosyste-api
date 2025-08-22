'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Server, 
  Activity, 
  RefreshCw, 
  Trash2, 
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { searchApi, ClusterHealth, IndexHealth } from '../../services/searchApi';
import { toast } from 'sonner';

interface ElasticsearchAdminProps {
  className?: string;
}

export default function ElasticsearchAdmin({ className = '' }: ElasticsearchAdminProps) {
  const [clusterHealth, setClusterHealth] = useState<ClusterHealth | null>(null);
  const [indices, setIndices] = useState<string[]>([]);
  const [indexHealths, setIndexHealths] = useState<Record<string, IndexHealth>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger la santé du cluster
      const health = await searchApi.getClusterHealth();
      setClusterHealth(health);

      // Charger la liste des indices
      const indicesList = await searchApi.getIndices();
      setIndices(indicesList);

      // Charger la santé de chaque index
      const healthPromises = indicesList.map(async (indexName) => {
        try {
          const indexHealth = await searchApi.getIndexHealth(indexName);
          return { indexName, health: indexHealth };
        } catch (err) {
          console.error(`Failed to get health for index ${indexName}:`, err);
          return null;
        }
      });

      const healthResults = await Promise.all(healthPromises);
      const healthMap: Record<string, IndexHealth> = {};
      
      healthResults.forEach(result => {
        if (result) {
          healthMap[result.indexName] = result.health;
        }
      });

      setIndexHealths(healthMap);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données Elasticsearch');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('Données actualisées');
  };

  const handleCreateIndex = async (indexName: string) => {
    try {
      await searchApi.createIndex(indexName);
      toast.success(`Index ${indexName} créé avec succès`);
      await loadData();
    } catch (err: any) {
      toast.error(`Erreur lors de la création de l'index: ${err.message}`);
    }
  };

  const handleDeleteIndex = async (indexName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'index ${indexName} ?`)) {
      return;
    }

    try {
      await searchApi.deleteIndex(indexName);
      toast.success(`Index ${indexName} supprimé avec succès`);
      await loadData();
    } catch (err: any) {
      toast.error(`Erreur lors de la suppression de l'index: ${err.message}`);
    }
  };

  const handleRefreshIndex = async (indexName: string) => {
    try {
      await searchApi.refreshIndex(indexName);
      toast.success(`Index ${indexName} actualisé`);
      await loadData();
    } catch (err: any) {
      toast.error(`Erreur lors de l'actualisation de l'index: ${err.message}`);
    }
  };

  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return <CheckCircle className="h-4 w-4" />;
      case 'yellow': return <AlertTriangle className="h-4 w-4" />;
      case 'red': return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              className="ml-2"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Administration Elasticsearch</h2>
          <p className="text-gray-600">Gestion et monitoring du cluster Elasticsearch</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Santé du cluster */}
      {clusterHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Santé du Cluster</span>
              <Badge className={getStatusColor(clusterHealth.cluster.status)}>
                {getStatusIcon(clusterHealth.cluster.status)}
                <span className="ml-1">{clusterHealth.cluster.status.toUpperCase()}</span>
              </Badge>
            </CardTitle>
            <CardDescription>
              Cluster: {clusterHealth.cluster.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Nœuds */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Nœuds</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{clusterHealth.cluster.nodes.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{clusterHealth.cluster.nodes.data}</span>
                  </div>
                </div>
              </div>

              {/* Shards */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Shards</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actifs:</span>
                    <span className="font-medium text-green-600">{clusterHealth.cluster.shards.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primaires:</span>
                    <span className="font-medium">{clusterHealth.cluster.shards.primary}</span>
                  </div>
                  {clusterHealth.cluster.shards.unassigned > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Non assignés:</span>
                      <span className="font-medium text-red-600">{clusterHealth.cluster.shards.unassigned}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Indices */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Indices</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium">{clusterHealth.indices.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents:</span>
                    <span className="font-medium">{clusterHealth.indices.docs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taille:</span>
                    <span className="font-medium">{formatBytes(clusterHealth.indices.size)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des indices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Indices ({indices.length})</span>
          </CardTitle>
          <CardDescription>
            Gestion des indices Elasticsearch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {indices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun index trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {indices.map((indexName) => {
                const health = indexHealths[indexName];
                
                return (
                  <div key={indexName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{indexName}</h4>
                        {health && (
                          <Badge className={getStatusColor(health.status)}>
                            {getStatusIcon(health.status)}
                            <span className="ml-1">{health.status.toUpperCase()}</span>
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefreshIndex(indexName)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteIndex(indexName)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {health && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Documents:</span>
                          <div className="font-medium">{health.docsCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Taille:</span>
                          <div className="font-medium">{formatBytes(health.storeSize)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Shards:</span>
                          <div className="font-medium">{health.shards.total}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Primaires:</span>
                          <div className="font-medium">{health.shards.primary}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export types
export type { ElasticsearchAdminProps };