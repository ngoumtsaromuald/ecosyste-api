import { MainLayout } from '@/components/layout/main-layout';
import { AuthGuard } from '@/components/auth/auth-guard';
import { UserProfile } from '@/components/auth/user-profile';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
              <p className="text-gray-600 mt-2">
                Gérez vos informations personnelles et paramètres de compte
              </p>
            </div>
            
            <UserProfile />
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}