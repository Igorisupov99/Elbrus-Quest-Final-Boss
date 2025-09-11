import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { MainPage } from './pages/MainPage/MainPage';
import { Register } from './pages/Register/Register';
import { Login } from './pages/Login/Login';
import { Profile } from './pages/ProfilePage/Profile';
import { LobbyPage } from './pages/LobbyPage/LobbyPage';
import { AchievementsPage } from './pages/AchievementsPage/AchievementsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute';
import { useEffect } from 'react';
import { initAuth } from './store/authThunks';
import { useAppDispatch } from './store/hooks';
// import MainPageChat from './components/MainPageChat/MainPageChat';

export function App() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  const hideHeaderRoutes = ['/lobby'];
  const shouldHideHeader = hideHeaderRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <>
      {!shouldHideHeader && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainPage />
            </PrivateRoute>
          }
        />
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
          path="/lobby/:id"
          element={
            <PrivateRoute>
              <LobbyPage />
            </PrivateRoute>
          }
        />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route 
          path="/favorites" 
          element={
            <PrivateRoute>
              <FavoritesPage />
            </PrivateRoute>
          } 
        />
      </Routes>
    </>
  );
}
