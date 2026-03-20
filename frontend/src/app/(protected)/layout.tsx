import { AuthGuard } from '@/features/auth/components/auth-guard';

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return <AuthGuard>{children}</AuthGuard>;
};

export default ProtectedLayout;
