import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { MainPage } from './pages/MainPage/MainPage';
import { Register } from './pages/Register/Register';
import { Login } from './pages/Login/Login';
import { Profile } from './pages/Profile/Profile';
import { LobbyPage } from './pages/LobbyPage/LobbyPage';
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute';
<<<<<<< HEAD
=======
import { useAppSelector } from './store/hooks';
// import MainPageChat from './components/MainPageChat/MainPageChat';
>>>>>>> 34ee7b6f8571395f2331afad2353d533f94475a0

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
        {/* <Route path="/chat" element={<MainPageChat />} /> */}
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
