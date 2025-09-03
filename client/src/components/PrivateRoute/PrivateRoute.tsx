import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAppSelector((state) => state.auth);

  const hasToken = Boolean(localStorage.getItem('accessToken'));

  if (loading || (!user && hasToken)) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
