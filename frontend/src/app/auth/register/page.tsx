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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Building2, ArrowRight, Sparkles, Shield, Zap, Github, Chrome, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
  accountType: z.enum(['individual', 'enterprise'], {
    message: 'Veuillez sélectionner un type de compte',
  }),
  companyName: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions d\'utilisation',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.accountType === 'enterprise' && !data.companyName) {
    return false;
  }
  return true;
}, {
  message: 'Le nom de l\'entreprise est requis pour un compte entreprise',
  path: ['companyName'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const accountType = watch('accountType');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.accountType,
      });
      toast.success('Compte créé avec succès! Vérifiez votre email pour confirmer votre compte.');
      router.push('/auth/login');
    } catch {
      toast.error('Erreur lors de la création du compte. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-secondary/10">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm sm:max-w-md lg:max-w-lg w-full space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ECOSYSTE
              </h1>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Créer un compte</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
                Rejoignez la communauté ECOSYSTE et découvrez des milliers d'API
              </p>
            </div>
            
            {/* Features badges */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              <Badge variant="secondary" className="flex items-center space-x-1 text-xs sm:text-sm">
                <Shield className="w-3 h-3" />
                <span>Sécurisé</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1 text-xs sm:text-sm">
                <Zap className="w-3 h-3" />
                <span>Rapide</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1 text-xs sm:text-sm">
                <CheckCircle className="w-3 h-3" />
                <span>Gratuit</span>
              </Badge>
            </div>
          </div>

        <Card className="backdrop-blur-sm bg-card/95 border-2 shadow-2xl">
          <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Créer un compte</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
              Commencez votre parcours avec ECOSYSTE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {/* OAuth Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-10 sm:h-11 border-2 hover:bg-muted/50 transition-colors text-sm sm:text-base"
                onClick={() => toast.info('Connexion Google bientôt disponible!')}
              >
                <Chrome className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Continuer avec Google
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-10 sm:h-11 border-2 hover:bg-muted/50 transition-colors text-sm sm:text-base"
                onClick={() => toast.info('Connexion GitHub bientôt disponible!')}
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Continuer avec GitHub
              </Button>
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 sm:px-3 text-muted-foreground">Ou avec votre email</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                     Prénom
                   </Label>
                   <div className="relative">
                     <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="firstName"
                       placeholder="John"
                       {...register('firstName')}
                       className={`pl-10 h-10 sm:h-11 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                         errors.firstName ? 'border-destructive focus:border-destructive' : ''
                       }`}
                     />
                   </div>
                   {errors.firstName && (
                     <p className="text-xs sm:text-sm text-destructive font-medium">{errors.firstName.message}</p>
                   )}
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                     Nom
                   </Label>
                   <div className="relative">
                     <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="lastName"
                       placeholder="Doe"
                       {...register('lastName')}
                       className={`pl-10 h-10 sm:h-11 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                         errors.lastName ? 'border-destructive focus:border-destructive' : ''
                       }`}
                     />
                   </div>
                   {errors.lastName && (
                     <p className="text-xs sm:text-sm text-destructive font-medium">{errors.lastName.message}</p>
                   )}
                 </div>
               </div>

              <div className="space-y-2">
                 <Label htmlFor="email" className="text-sm font-medium text-foreground">
                   Adresse email
                 </Label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                   <Input
                     id="email"
                     type="email"
                     placeholder="john.doe@example.com"
                     {...register('email')}
                     className={`pl-10 sm:pl-11 h-10 sm:h-11 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                       errors.email ? 'border-destructive focus:border-destructive' : ''
                     }`}
                   />
                 </div>
                 {errors.email && (
                   <p className="text-xs sm:text-sm text-destructive font-medium">{errors.email.message}</p>
                 )}
               </div>

              <div className="space-y-2">
                 <Label htmlFor="accountType" className="text-sm font-medium text-foreground">
                   Type de compte
                 </Label>
                 <Select onValueChange={(value) => setValue('accountType', value as 'individual' | 'enterprise')}>
                   <SelectTrigger className={`h-10 sm:h-11 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                     errors.accountType ? 'border-destructive focus:border-destructive' : ''
                   }`}>
                     <SelectValue placeholder="Sélectionnez un type de compte" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="individual">
                       <div className="flex items-center space-x-2">
                         <User className="w-4 h-4" />
                         <span>Compte individuel</span>
                       </div>
                     </SelectItem>
                     <SelectItem value="enterprise">
                       <div className="flex items-center space-x-2">
                         <Building2 className="w-4 h-4" />
                         <span>Compte entreprise</span>
                       </div>
                     </SelectItem>
                   </SelectContent>
                 </Select>
                 {errors.accountType && (
                   <p className="text-xs sm:text-sm text-destructive font-medium">{errors.accountType.message}</p>
                 )}
               </div>

              {accountType === 'enterprise' && (
                 <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                   <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                     Nom de l'entreprise
                   </Label>
                   <div className="relative">
                     <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                     <Input
                       id="companyName"
                       placeholder="Nom de votre entreprise"
                       {...register('companyName')}
                       className={`pl-10 sm:pl-11 h-10 sm:h-11 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                         errors.companyName ? 'border-destructive focus:border-destructive' : ''
                       }`}
                     />
                   </div>
                   {errors.companyName && (
                     <p className="text-xs sm:text-sm text-destructive font-medium">{errors.companyName.message}</p>
                   )}
                 </div>
               )}

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
                     className={`pl-10 sm:pl-11 pr-10 sm:pr-11 h-10 sm:h-11 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
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

              <div className="space-y-2">
                 <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                   Confirmer le mot de passe
                 </Label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                   <Input
                     id="confirmPassword"
                     type={showConfirmPassword ? 'text' : 'password'}
                     placeholder="Confirmez votre mot de passe"
                     {...register('confirmPassword')}
                     className={`pl-10 sm:pl-11 pr-10 sm:pr-11 h-10 sm:h-11 border-2 focus:border-primary transition-colors text-sm sm:text-base ${
                       errors.confirmPassword ? 'border-destructive focus:border-destructive' : ''
                     }`}
                   />
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-muted/50"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   >
                     {showConfirmPassword ? (
                       <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                     ) : (
                       <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                     )}
                   </Button>
                 </div>
                 {errors.confirmPassword && (
                   <p className="text-xs sm:text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
                 )}
               </div>

              <div className="space-y-2">
                 <div className="flex items-start space-x-2 sm:space-x-3">
                   <Checkbox
                     id="acceptTerms"
                     {...register('acceptTerms')}
                     className={`mt-0.5 sm:mt-1 border-2 w-4 h-4 sm:w-5 sm:h-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
                       errors.acceptTerms ? 'border-destructive' : 'border-muted-foreground'
                     }`}
                   />
                   <Label htmlFor="acceptTerms" className="text-xs sm:text-sm text-muted-foreground leading-relaxed cursor-pointer">
                     J&apos;accepte les{' '}
                     <Link href="/terms" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline">
                       conditions d&apos;utilisation
                     </Link>{' '}
                     et la{' '}
                     <Link href="/privacy" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline">
                       politique de confidentialité
                     </Link>
                   </Label>
                 </div>
                 {errors.acceptTerms && (
                   <p className="text-xs sm:text-sm text-destructive font-medium ml-6 sm:ml-7">{errors.acceptTerms.message}</p>
                 )}
               </div>

              <Button 
                 type="submit" 
                 className="w-full h-10 sm:h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all group"
                 disabled={isSubmitting}
               >
                 {isSubmitting ? (
                   <div className="flex items-center space-x-2">
                     <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                     <span className="hidden sm:inline">Création du compte...</span>
                     <span className="sm:hidden">Création...</span>
                   </div>
                 ) : (
                   <div className="flex items-center space-x-2">
                     <span className="hidden sm:inline">Créer mon compte</span>
                     <span className="sm:hidden">Créer compte</span>
                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </div>
                 )}
               </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Déjà un compte ?</span>
                <span className="sm:hidden">Déjà un compte ?</span>{' '}
                <Link 
                  href="/auth/login" 
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            En créant un compte, vous acceptez nos{' '}
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