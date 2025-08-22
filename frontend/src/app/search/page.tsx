'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ResponsiveGrid, APICardGrid } from '@/components/layout/ResponsiveGrid';
import { TouchOptimizedCard, APICard } from '@/components/ui/TouchOptimizedCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSearchApis, useApiCategories, useFavoriteMutation } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { 
  Search, 
  Star, 
  Heart, 
  ExternalLink,
  Loader2,
  Database,
  X,
  SlidersHorizontal,
  Filter,
  Grid3X3,
  List,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Shield,
  Globe,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface SearchFilters {
  query: string;
  categories: string[];
  pricing: string[];
  rating: number;
  features: string[];
  protocols: string[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    categories: [],
    pricing: [],
    rating: 0,
    features: [],
    protocols: [],
  });

  const { data: searchResults, isLoading } = useSearchApis(filters.query, {
    category: filters.categories[0],
    pricing: filters.pricing,
    rating: filters.rating,
    tags: [...filters.features, ...filters.protocols]
  });
  const { data: categories } = useApiCategories();
  const { addToFavorites, removeFromFavorites } = useFavoriteMutation();

  // Options de filtres
  const pricingOptions = [
    { id: 'free', label: 'Gratuit' },
    { id: 'freemium', label: 'Freemium' },
    { id: 'paid', label: 'Payant' },
  ];

  const featureOptions = [
    { id: 'authentication', label: 'Authentification' },
    { id: 'rate-limiting', label: 'Limitation de débit' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'real-time', label: 'Temps réel' },
    { id: 'batch-processing', label: 'Traitement par lots' },
  ];

  const protocolOptions = [
    { id: 'rest', label: 'REST' },
    { id: 'graphql', label: 'GraphQL' },
    { id: 'websocket', label: 'WebSocket' },
    { id: 'grpc', label: 'gRPC' },
  ];

  // La recherche se fait automatiquement via useSearchApis quand les filtres changent

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFilterToggle = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter(item => item !== value)
        : [...(prev[key] as string[]), value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      categories: [],
      pricing: [],
      rating: 0,
      features: [],
      protocols: [],
    });
  };

  const handleToggleFavorite = async (apiId: string, isFavorite: boolean) => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter des favoris');
      return;
    }
    
    try {
      if (isFavorite) {
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

  const activeFiltersCount = 
    filters.categories.length + 
    filters.pricing.length + 
    filters.features.length + 
    filters.protocols.length + 
    (filters.rating > 0 ? 1 : 0);

  return (
    <ResponsiveLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20">
              <Search className="w-4 h-4 mr-2" />
              Recherche Intelligente
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Trouvez l'API 
              <span className="text-gradient">parfaite</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              Explorez notre catalogue de plus de 2,500 API avec des filtres intelligents 
              et des suggestions personnalisées pour accélérer votre développement.
            </p>
          </div>
          
          {/* Barre de recherche principale */}
          <div className="max-w-4xl mx-auto animate-scale-in">
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-4 sm:p-6">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 sm:h-6 sm:w-6" />
                  <Input
                    placeholder="Rechercher des API..."
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    className="pl-10 sm:pl-12 pr-12 sm:pr-4 py-3 sm:py-4 text-base sm:text-lg border-0 bg-transparent focus:ring-2 focus:ring-primary/20"
                  />
                  {filters.query && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange('query', '')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Suggestions rapides */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-sm text-muted-foreground mr-2">Suggestions:</span>
                  {['Paiement', 'Météo', 'Géolocalisation', 'Email', 'SMS'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('query', suggestion)}
                      className="text-xs hover:bg-primary hover:text-primary-foreground"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar avec filtres */}
          <div className="lg:w-80">
            <Card className="lg:sticky lg:top-4 bg-card/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-semibold">Filtres</span>
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 bg-primary/10 text-primary text-xs">{activeFiltersCount}</Badge>
                      )}
                    </div>
                  </CardTitle>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="hover:bg-destructive/10 hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                {/* Statistiques rapides */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-foreground">{searchResults?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Résultats</div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-foreground">2.5K+</div>
                    <div className="text-xs text-muted-foreground">API Total</div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Catégories */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Catégories</Label>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                    {categories?.map((category) => (
                      <div key={category.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={filters.categories.includes(category.name)}
                          onCheckedChange={() => handleArrayFilterToggle('categories', category.name)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`category-${category.id}`} className="text-sm flex-1 cursor-pointer">
                          {category.name}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {category.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Tarification */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    <Label className="font-medium">Tarification</Label>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {pricingOptions.map((option) => {
                      const isSelected = filters.pricing.includes(option.id);
                      return (
                        <div 
                          key={option.id} 
                          className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                          }`}
                          onClick={() => handleArrayFilterToggle('pricing', option.id)}
                        >
                          <Checkbox
                            id={`pricing-${option.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleArrayFilterToggle('pricing', option.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={`pricing-${option.id}`} className="text-sm font-medium cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Note minimale */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <Label className="font-medium">Note minimale</Label>
                  </div>
                  <Select 
                    value={filters.rating.toString()} 
                    onValueChange={(value) => handleFilterChange('rating', parseInt(value))}
                  >
                    <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/30">
                      <SelectValue placeholder="Toutes les notes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Toutes les notes</SelectItem>
                      <SelectItem value="1">⭐ 1+ étoiles</SelectItem>
                      <SelectItem value="2">⭐ 2+ étoiles</SelectItem>
                      <SelectItem value="3">⭐ 3+ étoiles</SelectItem>
                      <SelectItem value="4">⭐ 4+ étoiles</SelectItem>
                      <SelectItem value="5">⭐ 5 étoiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-border/50" />

                {/* Fonctionnalités */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-accent" />
                    <Label className="font-medium">Fonctionnalités</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {featureOptions.map((feature) => {
                      const isSelected = filters.features.includes(feature.id);
                      return (
                        <Button
                          key={feature.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleArrayFilterToggle('features', feature.id)}
                          className={`text-xs transition-all ${
                            isSelected 
                              ? 'bg-accent text-accent-foreground shadow-md' 
                              : 'hover:bg-accent/10 hover:text-accent hover:border-accent/30'
                          }`}
                        >
                          {feature.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Protocoles */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-success" />
                    <Label className="font-medium">Protocoles</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {protocolOptions.map((protocol) => {
                      const isSelected = filters.protocols.includes(protocol.id);
                      return (
                        <Button
                          key={protocol.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleArrayFilterToggle('protocols', protocol.id)}
                          className={`text-xs transition-all ${
                            isSelected 
                              ? 'bg-success text-white shadow-md' 
                              : 'hover:bg-success/10 hover:text-success hover:border-success/30'
                          }`}
                        >
                          {protocol.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Résultats */}
          <div className="flex-1">
            {/* En-tête des résultats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {isLoading ? 'Recherche...' : searchResults && searchResults.length > 0 
                    ? `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}` 
                    : 'Aucun résultat'
                  }
                </h2>
                {searchResults && searchResults.length > 0 && (
                  <Badge className="bg-primary/10 text-primary w-fit">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Pertinents
                  </Badge>
                )}
              </div>
              
              {/* Options d'affichage et tri */}
              {searchResults && searchResults.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-muted-foreground hidden sm:inline">Trier:</Label>
                    <Select defaultValue="relevance">
                      <SelectTrigger className="w-full sm:w-40 bg-muted/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">
                          <div className="flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Pertinence
                          </div>
                        </SelectItem>
                        <SelectItem value="rating">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-2" />
                            Note
                          </div>
                        </SelectItem>
                        <SelectItem value="usage">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Popularité
                          </div>
                        </SelectItem>
                        <SelectItem value="date">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Récent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="hidden sm:flex items-center border border-border/50 rounded-lg p-1 bg-muted/30">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <Search className="absolute inset-0 m-auto h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
                </div>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground text-center px-4">Recherche intelligente en cours...</p>
                <p className="text-sm text-muted-foreground mt-2 text-center">Analyse de plus de 2,500 API</p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <APICardGrid>
                {searchResults.map((api, index) => (
                  <TouchOptimizedCard
                    key={api.id}
                    title={api.name}
                    description={api.description}
                    variant="interactive"
                    size="md"
                    onClick={() => window.open(`/catalog/${api.id}`, '_blank')}
                    showArrow
                    badge={{
                      text: api.category,
                      variant: 'secondary'
                    }}
                    actions={{
                      primary: {
                        label: 'Voir détails',
                        onClick: () => window.open(`/catalog/${api.id}`, '_blank')
                      },
                      secondary: {
                        label: api.isFavorite ? 'Retiré' : 'Favoris',
                        onClick: () => handleToggleFavorite(api.id, api.isFavorite),
                        variant: 'outline'
                      }
                    }}
                    className="h-full animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="space-y-4">
                      {/* Protocoles et pricing */}
                      <div className="flex flex-wrap gap-2">
                        {api.protocols && api.protocols.map((protocol) => (
                          <Badge 
                            key={protocol} 
                            variant="outline" 
                            className="bg-success/10 text-success border-success/20 text-xs"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {protocol}
                          </Badge>
                        ))}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            api.pricing === 'Gratuit' 
                              ? 'bg-success/10 text-success border-success/20' 
                              : 'bg-warning/10 text-warning border-warning/20'
                          }`}
                        >
                          {api.pricing}
                        </Badge>
                      </div>
                      
                      {/* Statistiques */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${
                                    i < Math.floor(api.rating) 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-muted-foreground/30'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="font-medium">{api.rating}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{api.usageCount?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {new Date(api.updatedAt).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="sm:hidden">Récent</span>
                        </div>
                      </div>
                    </div>
                  </TouchOptimizedCard>
                ))}
              </APICardGrid>
            ) : (
              <div className="text-center py-12 sm:py-20 animate-fade-in">
                <div className="max-w-md mx-auto px-4">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Database className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                    {filters.query || activeFiltersCount > 0 
                      ? 'Aucun résultat trouvé' 
                      : 'Commencez votre recherche'
                    }
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                    {filters.query || activeFiltersCount > 0
                      ? 'Aucune API ne correspond à vos critères. Essayez de modifier vos filtres ou votre recherche.'
                      : 'Explorez notre catalogue de plus de 2,500 API. Utilisez la barre de recherche et les filtres pour trouver exactement ce dont vous avez besoin.'
                    }
                  </p>
                  {(filters.query || activeFiltersCount > 0) ? (
                    <div className="space-y-3">
                      <Button onClick={clearFilters} className="bg-gradient-to-r from-primary to-secondary text-white w-full sm:w-auto">
                        <X className="h-4 w-4 mr-2" />
                        Réinitialiser les filtres
                      </Button>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        <span className="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto mb-2 sm:mb-0">Suggestions:</span>
                        {['API REST', 'GraphQL', 'Webhook', 'OAuth'].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => handleFilterChange('query', suggestion)}
                            className="text-xs hover:bg-primary hover:text-primary-foreground"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto mb-2 sm:mb-0">Catégories populaires:</span>
                        {['Paiement', 'Authentification', 'Géolocalisation', 'Email'].map((category) => (
                          <Button
                            key={category}
                            variant="outline"
                            size="sm"
                            onClick={() => handleFilterChange('query', category)}
                            className="text-xs hover:bg-primary hover:text-primary-foreground"
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}