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
      <section className="hero-section min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-accent/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 relative z-10">
          <div className="text-center animate-fade-in">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              <Sparkles className="w-4 h-4 mr-2" />
              Plateforme API Nouvelle Génération
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gradient-hero leading-tight">
              L&apos;Écosystème
              <br />
              <span className="text-foreground">des API</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Découvrez, testez et intégrez les meilleures API du marché avec notre plateforme 
              intelligente conçue pour les développeurs modernes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4">
              <Button size="lg" asChild className="button-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto group min-h-[48px] w-full sm:w-auto">
                <Link href="/catalog">
                  <span className="hidden sm:inline">Explorer le Catalogue</span>
                  <span className="sm:hidden">Explorer</span>
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all min-h-[48px] w-full sm:w-auto">
                <Link href="/auth/register">
                  <span className="hidden sm:inline">Commencer Gratuitement</span>
                  <span className="sm:hidden">Commencer</span>
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center animate-slide-up p-4 rounded-lg hover:bg-white/5 transition-colors" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl mb-3 transition-transform hover:scale-110">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground px-2">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in">
            <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20">
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
          </div>
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
                intégrer rapidement et efficacement les meilleures API du marché.
              </p>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 animate-slide-up p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ animationDelay: `${index * 100}ms` }}>
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium text-sm sm:text-base leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative animate-scale-in order-1 lg:order-2 mb-8 lg:mb-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-card/80 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="pb-4 sm:pb-6 p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl truncate">Interface Développeur</CardTitle>
                      <CardDescription className="text-sm">Conçue pour la productivité</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="bg-muted/50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">Temps d'intégration moyen</span>
                      <span className="text-xs sm:text-sm font-bold text-success flex-shrink-0">-75%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-success to-emerald-400 h-2 rounded-full w-3/4 transition-all duration-1000" />
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">Satisfaction développeur</span>
                      <span className="text-xs sm:text-sm font-bold text-primary flex-shrink-0">98%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full w-[98%] transition-all duration-1000" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground truncate pr-2">APIs testées aujourd'hui</span>
                    <span className="font-bold text-foreground flex-shrink-0">1,247</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in">
            <Badge className="mb-8 bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors">
              <Users className="w-4 h-4 mr-2" />
              Rejoignez 50,000+ Développeurs
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Prêt à transformer
              <br />
              votre développement ?
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
              Rejoignez des milliers de développeurs qui utilisent ECOSYSTE pour découvrir, 
              tester et intégrer les meilleures API du marché en quelques minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto group shadow-xl min-h-[48px] w-full sm:w-auto">
                <Link href="/auth/register">
                  <span className="hidden sm:inline">Créer un compte gratuit</span>
                  <span className="sm:hidden">Créer un compte</span>
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 border-white/30 text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto backdrop-blur-sm min-h-[48px] w-full sm:w-auto">
                <Link href="/catalog">
                  <span className="hidden sm:inline">Explorer les API</span>
                  <span className="sm:hidden">Explorer</span>
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
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
    </ResponsiveLayout>
  );
}
