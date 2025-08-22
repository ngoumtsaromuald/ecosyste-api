import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { TouchOptimizedCard } from '@/components/ui/TouchOptimizedCard';
import { 
  Search, 
  Database, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight, 
  Star, 
  Users, 
  Code, 
  Sparkles,
  CheckCircle,
  TrendingUp,
  Layers
} from 'lucide-react';

const features = [
  {
    icon: Database,
    title: 'Catalogue Complet',
    description: 'Découvrez des milliers d\'API organisées par catégories et cas d\'usage.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Search,
    title: 'Recherche Avancée',
    description: 'Trouvez rapidement les API qui correspondent à vos besoins spécifiques.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart3,
    title: 'Analytics Détaillées',
    description: 'Suivez l\'utilisation et les performances de vos API intégrées.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Zap,
    title: 'Intégration Rapide',
    description: 'Documentation claire et exemples de code pour une intégration facile.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Sécurité Garantie',
    description: 'Toutes les API sont vérifiées et respectent les standards de sécurité.',
    gradient: 'from-red-500 to-rose-500'
  },
  {
    icon: Globe,
    title: 'Communauté Active',
    description: 'Rejoignez une communauté de développeurs passionnés d\'API.',
    gradient: 'from-indigo-500 to-blue-500'
  },
];

const stats = [
  { label: 'API disponibles', value: '2,500+', icon: Database },
  { label: 'Développeurs actifs', value: '50K+', icon: Users },
  { label: 'Intégrations réussies', value: '1M+', icon: CheckCircle },
  { label: 'Uptime moyen', value: '99.9%', icon: TrendingUp },
];

const benefits = [
  'Accès gratuit aux API publiques',
  'Documentation interactive complète',
  'Support technique 24/7',
  'Monitoring en temps réel',
  'Communauté de développeurs',
  'Outils de test intégrés'
];

export default function Home() {
  return (
    <ResponsiveLayout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/80"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm sm:text-base px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Plateforme API Nouvelle Génération
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Découvrez l'écosystème
              <span className="text-gradient block mt-2">API parfait</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              ECOSYSTE révolutionne la façon dont vous découvrez, évaluez et intégrez les API. 
              Une plateforme intelligente pour développeurs exigeants.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 py-4 h-auto">
                <Link href="/search" className="flex items-center">
                  Commencer l'exploration
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-4 h-auto">
                <Link href="/catalog" className="flex items-center">
                  Parcourir le catalogue
                  <Database className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center justify-center mb-2">
                      <Icon className="h-6 w-6 text-primary mr-2" />
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <Badge className="mb-4 sm:mb-6 bg-accent/10 text-accent border-accent/20">
              <Star className="w-4 h-4 mr-2" />
              Fonctionnalités Avancées
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Pourquoi choisir 
              <span className="text-gradient">ECOSYSTE</span> ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Une plateforme complète et intelligente pour découvrir, évaluer et intégrer 
              les API dont vous avez besoin avec une expérience développeur exceptionnelle.
            </p>
          </div>
          
          <ResponsiveGrid variant="default" className="gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <TouchOptimizedCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  variant="elevated"
                  size="md"
                  className="h-full group animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </TouchOptimizedCard>
              );
            })}
          </ResponsiveGrid>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="animate-fade-in order-2 lg:order-1">
              <Badge className="mb-4 sm:mb-6 bg-accent/10 text-accent border-accent/20">
                <Code className="w-4 h-4 mr-2" />
                Avantages Développeur
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                Tout ce dont vous avez besoin pour 
                <span className="text-gradient">réussir</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                ECOSYSTE vous offre tous les outils et ressources nécessaires pour 
                développer des applications robustes et performantes.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-base sm:text-lg text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/register" className="flex items-center">
                    Créer un compte gratuit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="animate-fade-in order-1 lg:order-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
                <Card className="relative bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">API Integration</CardTitle>
                        <CardDescription>Exemple d'intégration simple</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                      <div className="text-muted-foreground mb-2">// Intégration en 3 lignes</div>
                      <div><span className="text-blue-400">import</span> <span className="text-foreground">&#123; EcosysteAPI &#125;</span> <span className="text-blue-400">from</span> <span className="text-green-400">'@ecosyste/sdk'</span></div>
                      <div><span className="text-blue-400">const</span> <span className="text-foreground">api = </span><span className="text-blue-400">new</span> <span className="text-foreground">EcosysteAPI()</span></div>
                      <div><span className="text-blue-400">const</span> <span className="text-foreground">data = </span><span className="text-blue-400">await</span> <span className="text-foreground">api.fetch()</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-r from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Prêt à transformer votre développement ?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              Rejoignez des milliers de développeurs qui font confiance à ECOSYSTE 
              pour leurs intégrations API.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8 py-4 h-auto">
                <Link href="/auth/register" className="flex items-center">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-4 h-auto border-white/20 text-white hover:bg-white/10">
                <Link href="/catalog" className="flex items-center">
                  Explorer les API
                  <Database className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-white/80 px-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                <span className="text-sm sm:text-base">Gratuit pour commencer</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                <span className="text-sm sm:text-base text-center sm:text-left">Aucune carte de crédit requise</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                <span className="text-sm sm:text-base">Support 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ResponsiveLayout>
  );
}