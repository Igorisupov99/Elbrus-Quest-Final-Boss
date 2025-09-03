import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { MainPage } from './pages/MainPage/MainPage';
import { Register } from './pages/Register/Register';
import { Login } from './pages/Login/Login';
import { Profile } from './pages/Profile/Profile';
import { LobbyPage } from './pages/LobbyPage/LobbyPage';
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute';

export function App() {
  const location = useLocation();

  const hideHeaderRoutes = ['/lobby'];
  const shouldHideHeader = hideHeaderRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  return (
    <>
      {!shouldHideHeader && <Header />}
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
          path="/lobby/:id"
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
