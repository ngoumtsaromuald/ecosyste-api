'use client';

import { useState } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ResponsiveGrid, APICardGrid } from '@/components/layout/ResponsiveGrid';
import { TouchOptimizedCard, APICard } from '@/components/ui/TouchOptimizedCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useApis, useApiCategories, useFavoriteMutation } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Star, 
  Heart, 
  ExternalLink,
  Loader2,
  Database,
  Grid3X3,
  List,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { user } = useAuth();
  
  const { data: apis, isLoading } = useApis();
  const { data: categories } = useApiCategories();
  const { addToFavorites, removeFromFavorites } = useFavoriteMutation();

  // Filtrer et trier les API
  const filteredApis = apis?.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         api.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || api.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
        return b.rating - a.rating;
      case 'popularity':
      default:
        return b.rating - a.rating;
    }
  });

  const handleToggleFavorite = async (apiId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter des favoris');
      return;
    }
    
    try {
      // Vérifier si l'API est déjà en favoris
      const api = apis?.find(a => a.id === apiId);
      if (api?.isFavorite) {
        await removeFromFavorites(apiId);
        toast.success('Retiré des favoris!');
      } else {
        await addToFavorites(apiId);
        toast.success('Ajouté aux favoris!');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Section Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="h-4 w-4 mr-2" />
                Catalogue Premium
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-slide-up">
                Explorez Notre
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Catalogue d'API
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto animate-fade-in">
                Découvrez une collection soigneusement sélectionnée d'API performantes pour accélérer vos projets
              </p>
              
              {/* Statistiques rapides */}
              <ResponsiveGrid variant="MetricsGrid" className="gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-10 lg:mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 animate-scale-in">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg mx-auto mb-3 sm:mb-4">
                    <Database className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{apis?.length || 0}</div>
                  <div className="text-blue-100 text-xs sm:text-sm">API disponibles</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 animate-scale-in" style={{animationDelay: '0.1s'}}>
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg mx-auto mb-3 sm:mb-4">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{categories?.length || 0}</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Catégories</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 animate-scale-in" style={{animationDelay: '0.2s'}}>
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg mx-auto mb-3 sm:mb-4">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">99.9%</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Disponibilité</div>
                </div>
              </ResponsiveGrid>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">

            {/* Filtres et recherche */}
            <Card className="mb-6 sm:mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-4 sm:space-y-6">
                  {/* Barre de recherche principale */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Recherchez parmi nos API premium..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>

                  {/* Filtres avancés */}
                  <div className="flex flex-col sm:flex-row lg:flex-row gap-3 sm:gap-4">
                    {/* Filtre par catégorie */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white/50 backdrop-blur-sm h-10 sm:h-11">
                          <Filter className="h-4 w-4 mr-2 text-gray-500" />
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tri */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trier par
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white/50 backdrop-blur-sm h-10 sm:h-11">
                          <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                          <SelectValue placeholder="Popularité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="popularity">
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Popularité
                            </div>
                          </SelectItem>
                          <SelectItem value="rating">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-2" />
                              Note
                            </div>
                          </SelectItem>
                          <SelectItem value="name">
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Nom
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mode d'affichage */}
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Affichage
                      </label>
                      <div className="flex border-2 border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm overflow-hidden">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className={`rounded-none px-3 sm:px-4 py-2 flex-1 sm:flex-initial ${
                            viewMode === 'grid' 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-transparent text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Grid3X3 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Grille</span>
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className={`rounded-none px-3 sm:px-4 py-2 flex-1 sm:flex-initial ${
                            viewMode === 'list' 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-transparent text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <List className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Liste</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Résultats */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                </div>
                <p className="mt-4 text-gray-600 animate-pulse">Chargement des API...</p>
              </div>
            ) : filteredApis && filteredApis.length > 0 ? (
              <>
                {/* En-tête des résultats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-base sm:text-lg font-semibold text-gray-900">
                        {filteredApis.length} API{filteredApis.length > 1 ? 's' : ''} trouvée{filteredApis.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 w-fit">
                      <Zap className="h-3 w-3 mr-1" />
                      <span className="text-xs sm:text-sm">Résultats pertinents</span>
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Mise à jour en temps réel
                  </div>
                </div>
              
                <APICardGrid viewMode={viewMode} className="gap-4 sm:gap-6 lg:gap-8">
                   {filteredApis.map((api, index) => (
                     <APICard 
                       key={api.id} 
                       api={api} 
                       viewMode={viewMode}
                       onToggleFavorite={() => handleToggleFavorite(api.id)}
                       style={{animationDelay: `${index * 0.1}s`}}
                     />
                   ))}
                 </APICardGrid>
            </>
            ) : (
              <div className="text-center py-12 sm:py-16 lg:py-20">
                <div className="max-w-md mx-auto px-4">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Database className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    Aucune API trouvée
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                    Nous n'avons trouvé aucune API correspondant à vos critères de recherche.
                    <br className="hidden sm:block" />Essayez de modifier vos filtres ou votre recherche.
                  </p>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <Button 
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-200 hover:shadow-lg text-sm sm:text-base"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Réinitialiser les filtres
                    </Button>
                    
                    <p className="text-xs sm:text-sm text-gray-500">
                      Ou explorez toutes nos API disponibles
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}