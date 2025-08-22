'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Shield,
  Zap,
  Github,
  Chrome
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success('Connexion réussie!');
      router.push('/dashboard');
    } catch {
      toast.error('Erreur de connexion. Vérifiez vos identifiants.');
    }
  };

  const handleOAuthLogin = (provider: string) => {
    toast.info(`Connexion ${provider} bientôt disponible !`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-1/2 w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 sm:mb-6 shadow-lg">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Bon retour sur ECOSYSTE
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Connectez-vous pour accéder à votre espace développeur
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 px-4 sm:px-6">
            <div className="flex items-center justify-center space-x-2">
              <Badge className="bg-success/10 text-success border-success/20 text-xs sm:text-sm">
                <Shield className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Sécurisé</span>
                <span className="sm:hidden">Sûr</span>
              </Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                <Zap className="w-3 h-3 mr-1" />
                Rapide
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-center text-foreground">
              Connexion
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base px-2">
              Saisissez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {/* OAuth Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-10 sm:h-12 border-2 hover:bg-muted/50 transition-all group text-sm sm:text-base"
                onClick={() => handleOAuthLogin('Google')}
              >
                <Chrome className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-600" />
                <span className="font-medium">Continuer avec Google</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-10 sm:h-12 border-2 hover:bg-muted/50 transition-all group text-sm sm:text-base"
                onClick={() => handleOAuthLogin('GitHub')}
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                <span className="font-medium">Continuer avec GitHub</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            </div>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground font-medium">
                  ou avec votre email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    {...register('email')}
                    className={`pl-10 sm:pl-11 h-10 sm:h-12 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                      errors.email ? 'border-destructive focus:border-destructive' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs sm:text-sm text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    {...register('password')}
                    className={`pl-10 sm:pl-11 pr-10 sm:pr-11 h-10 sm:h-12 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                      errors.password ? 'border-destructive focus:border-destructive' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-muted/50"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs sm:text-sm text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all group text-sm sm:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Se connecter</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-3 sm:pt-4 border-t border-border/50">
              <p className="text-sm sm:text-base text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link 
                  href="/auth/register" 
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 space-y-2 px-4">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            En vous connectant, vous acceptez nos{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Conditions d'utilisation
            </Link>
            {' '}et notre{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}