import { NavLink, useNavigate } from 'react-router-dom';
import { Flame, LayoutDashboard, Users, Trophy, User, LogOut, Moon, Sun, Bell } from 'lucide-react';
import { Avatar } from './ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/friends', label: 'Friends', icon: Users },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: User },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { pendingRequestsCount } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50 group-hover:shadow-indigo-300/50 transition-shadow">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">HabitFlow</span>
          </NavLink>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="hidden md:block">{label}</span>
                {/* Notification badge for Friends */}
                {path === '/friends' && pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 active-press"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User info */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-2">
                <Avatar
                  src={user.profilePicture}
                  name={user.username}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                  {user.username}
                </span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 active-press"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
