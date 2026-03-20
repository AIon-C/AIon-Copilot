import { AuthScreen } from '@/features/auth/components/auth-screen';
import { GuestGuard } from '@/features/auth/components/guest-guard';

const AuthPage = () => {
  return (
    <GuestGuard>
      <AuthScreen />
    </GuestGuard>
  );
};

export default AuthPage;
