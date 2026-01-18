import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit2, Flame, Target, Users, Calendar, LogOut, Moon, Sun, Bell, BellOff, Shield, ChevronRight } from 'lucide-react';
import { Card, Button, Input, Avatar, StatCardSkeleton, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { usersAPI, habitsAPI, friendsAPI } from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    profilePicture: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
      });
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [habitsRes, friendsRes] = await Promise.all([
        habitsAPI.getAll(),
        friendsAPI.getAll(),
      ]);
      setHabits(habitsRes.data.habits || []);
      setFriendCount(friendsRes.data.friends?.length || 0);
    } catch (err) {
      console.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const totalStreaks = habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0);
  const longestStreak = habits.length > 0
    ? Math.max(...habits.map(h => h.longestStreak || 0))
    : 0;
  const totalCheckIns = habits.reduce((sum, h) => sum + (h.totalCheckIns || 0), 0);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await usersAPI.updateMe({
        username: profile.username,
        profilePicture: profile.profilePicture,
      });
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.info('Logged out successfully');
  };

  const stats = [
    { label: 'Active Habits', value: habits.length, icon: Target, color: 'indigo' },
    { label: 'Total Streaks', value: totalStreaks, icon: Flame, color: 'orange' },
    { label: 'Best Streak', value: longestStreak, icon: Flame, color: 'emerald' },
    { label: 'Friends', value: friendCount, icon: Users, color: 'blue' },
  ];

  const colorMap = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-500' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-500' },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar
              src={user?.profilePicture}
              name={user?.username}
              className="w-24 h-24 border-4 border-white shadow-lg"
            />
            <button
              onClick={() => setIsEditing(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <Calendar className="w-4 h-4" />
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditing(true)} className="active-press">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, color }, index) => (
            <Card
              key={label}
              className="text-center hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${colorMap[color].bg} mb-3`}>
                <Icon className={`w-6 h-6 ${colorMap[color].text}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Settings Section */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

        {/* Appearance */}
        <Card className="hover-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                {isDark ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">Appearance</p>
                <p className="text-sm text-gray-500">{isDark ? 'Dark mode' : 'Light mode'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isDark ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  isDark ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="hover-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${notificationsEnabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-emerald-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">
                  {notificationsEnabled ? 'Get notified about friend activity' : 'Notifications disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  notificationsEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Account Security - placeholder */}
        <Card className="hover-lift opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gray-100">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Account Security</p>
                <p className="text-sm text-gray-500">Password and security settings</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Habit Statistics */}
      {!loading && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Habit Statistics</h2>
          {habits.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No habits yet</p>
              <Button className="mt-4 active-press" onClick={() => navigate('/dashboard')}>
                Create Your First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.slice(0, 5).map((habit, index) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{habit.name}</span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Flame className={`w-4 h-4 ${habit.currentStreak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
                        {habit.currentStreak || 0} day streak
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${habit.longestStreak ? Math.min(((habit.currentStreak || 0) / habit.longestStreak) * 100, 100) : 0}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Current: {habit.currentStreak || 0}</span>
                      <span>Best: {habit.longestStreak || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
              {habits.length > 5 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-2 text-center text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View all {habits.length} habits
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Logout Button */}
      <Button
        variant="danger"
        className="w-full active-press"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Sign Out
      </Button>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-md animate-scale-in">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar
                    src={profile.profilePicture}
                    name={profile.username}
                    className="w-24 h-24"
                  />
                </div>
              </div>
              <Input
                label="Username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={profile.email}
                disabled
                className="bg-gray-50 opacity-60"
              />
              <Input
                label="Profile Picture URL"
                value={profile.profilePicture}
                onChange={(e) => setProfile(prev => ({ ...prev, profilePicture: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 active-press"
                  onClick={() => {
                    setIsEditing(false);
                    setProfile({
                      username: user?.username || '',
                      email: user?.email || '',
                      profilePicture: user?.profilePicture || '',
                    });
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 active-press" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
