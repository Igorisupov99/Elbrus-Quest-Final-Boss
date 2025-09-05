import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAppSelector((state) => state.auth);
  const hasToken = !!localStorage.getItem('accessToken');
  const location = useLocation();


  if (loading || (hasToken && !user)) {
    return <div>Загрузка...</div>;
  }

  if (!user && !hasToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
