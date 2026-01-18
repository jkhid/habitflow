import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import HabitDetail from './pages/HabitDetail';
import FriendDetail from './pages/FriendDetail';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/habit/:habitId" element={<HabitDetail />} />
                  <Route path="/friends" element={<Friends />} />
                  <Route path="/friend/:friendId" element={<FriendDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
