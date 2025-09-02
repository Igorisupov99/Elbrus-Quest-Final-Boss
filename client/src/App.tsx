import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { MainPage } from './pages/MainPage/MainPage';
import { Register } from './pages/Register/Register';
import { Login } from './pages/Login/Login';
import { Profile } from './pages/Profile/Profile';
import { LobbyPage } from './pages/LobbyPage/LobbyPage';
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute';
import { useAppSelector } from './store/hooks';

export function App() {
  const loading = useAppSelector((state) => state.auth.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Загрузка...
      </div>
    );
  }

  const hideHeaderRoutes = ['/lobby'];

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/lobby"
          element={
            <PrivateRoute>
              <LobbyPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}
