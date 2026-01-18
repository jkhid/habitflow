import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Target, TrendingUp, Calendar, Edit2, Trash2, X, Undo2 } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import HeatMap from '../components/HeatMap';
import AnimatedCheckIn from '../components/AnimatedCheckIn';
import { habitsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

// Skeleton components for loading states
const StatCardSkeleton = () => (
  <Card>
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div>
        <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  </Card>
);

const HabitDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header skeleton */}
    <div className="flex items-center gap-4 mb-6 animate-pulse">
      <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="flex-1">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>

    {/* Check-in section skeleton */}
    <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 animate-pulse">
        <div>
          <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </Card>

    {/* Stats skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>

    {/* Heat map skeleton */}
    <Card className="mb-6">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </Card>

    {/* Recent activity skeleton */}
    <Card>
      <div className="animate-pulse">
        <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  </div>
);

const HabitDetail = () => {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [habit, setHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    frequencyGoal: 7,
  });

  // Fetch habit data
  useEffect(() => {
    const fetchHabit = async () => {
      try {
        setLoading(true);
        const response = await habitsAPI.getOne(habitId);
        setHabit(response.data);
        setEditForm({
          name: response.data.name,
          description: response.data.description || '',
          frequencyGoal: response.data.frequencyGoal,
        });
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to load habit';
        toast.error(message);
        if (error.response?.status === 404) {
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHabit();
  }, [habitId, navigate, toast]);

  // Calculate stats from check-ins
  const stats = useMemo(() => {
    if (!habit) return null;

    const checkIns = habit.checkIns || [];
    const totalDays = 90;
    const completedDays = checkIns.length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    // Calculate this week's completions
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekCompletions = checkIns.filter(ci => {
      const ciDate = new Date(ci.date);
      return ciDate >= startOfWeek && ciDate <= today;
    }).length;

    return {
      completionRate,
      completedDays,
      totalDays,
      thisWeekCompletions,
    };
  }, [habit]);

  // Check if completed today and get today's check-in
  const todayCheckIn = useMemo(() => {
    if (!habit?.checkIns) return null;
    const today = new Date().toISOString().split('T')[0];
    return habit.checkIns.find(ci => ci.date.split('T')[0] === today) || null;
  }, [habit]);

  const completedToday = !!todayCheckIn;

  const handleUndoCheckIn = async () => {
    if (!todayCheckIn) return;

    const previousHabit = { ...habit };

    // Optimistic update
    setHabit(prev => ({
      ...prev,
      currentStreak: Math.max(0, prev.currentStreak - 1),
      checkIns: prev.checkIns.filter(ci => ci.id !== todayCheckIn.id),
    }));

    try {
      const response = await habitsAPI.removeCheckIn(habitId, todayCheckIn.id);
      setHabit(prev => ({
        ...prev,
        currentStreak: response.data.currentStreak ?? prev.currentStreak,
      }));
      toast.success('Check-in undone');
    } catch (error) {
      // Revert on error
      setHabit(previousHabit);
      const message = error.response?.data?.error || 'Failed to undo check-in';
      toast.error(message);
    }
  };

  const handleCheckIn = async () => {
    if (checkingIn || completedToday) return;

    // Optimistic update
    const today = new Date().toISOString().split('T')[0];
    const optimisticCheckIn = {
      id: `temp-${Date.now()}`,
      date: today,
      note: '',
    };

    const previousHabit = { ...habit };
    setHabit(prev => ({
      ...prev,
      currentStreak: prev.currentStreak + 1,
      longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
      checkIns: [optimisticCheckIn, ...(prev.checkIns || [])],
    }));

    setCheckingIn(true);
    try {
      const response = await habitsAPI.checkIn(habitId);
      // Update with real data from server
      setHabit(prev => ({
        ...prev,
        currentStreak: response.data.currentStreak,
        longestStreak: response.data.longestStreak,
        checkIns: prev.checkIns.map(ci =>
          ci.id === optimisticCheckIn.id ? response.data.checkIn : ci
        ),
      }));
      toast.success('Check-in recorded!');
    } catch (error) {
      // Revert on error
      setHabit(previousHabit);
      const message = error.response?.data?.error || 'Failed to check in';
      toast.error(message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const response = await habitsAPI.update(habitId, editForm);
      setHabit(prev => ({
        ...prev,
        name: response.data.name,
        description: response.data.description,
        frequencyGoal: response.data.frequencyGoal,
      }));
      setShowEditModal(false);
      toast.success('Habit updated!');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update habit';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    try {
      await habitsAPI.delete(habitId);
      toast.success('Habit deleted');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete habit';
      toast.error(message);
      setDeleting(false);
    }
  };

  if (loading) {
    return <HabitDetailSkeleton />;
  }

  if (!habit) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <p className="text-gray-500">Habit not found</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const checkIns = habit.checkIns || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{habit.name}</h1>
          <p className="text-gray-500 mt-1">{habit.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => {
            setEditForm({
              name: habit.name,
              description: habit.description || '',
              frequencyGoal: habit.frequencyGoal,
            });
            setShowEditModal(true);
          }}>
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Check-in Section */}
      <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {completedToday ? "You've completed this habit today!" : "Ready to check in?"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {completedToday
                ? `Amazing! Keep your ${habit.currentStreak} day streak going!`
                : "Click the button to mark today as complete"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {completedToday && (
              <button
                onClick={handleUndoCheckIn}
                className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
                title="Undo check-in"
              >
                <Undo2 className="w-5 h-5" />
              </button>
            )}
            <AnimatedCheckIn
              completed={completedToday}
              onCheckIn={handleCheckIn}
              loading={checkingIn}
            />
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{habit.currentStreak}</p>
              <p className="text-xs text-gray-500">Current Streak</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{habit.longestStreak}</p>
              <p className="text-xs text-gray-500">Longest Streak</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.completionRate}%</p>
              <p className="text-xs text-gray-500">Completion Rate</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.thisWeekCompletions}/{habit.frequencyGoal}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Calendar</h2>
        <HeatMap checkIns={checkIns} />
      </Card>

      {/* Recent Check-ins */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {checkIns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No check-ins yet. Start your streak today!</p>
        ) : (
          <div className="space-y-3">
            {checkIns.slice(0, 7).map((checkIn, idx) => {
              const date = new Date(checkIn.date);
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];

              const checkInDateStr = checkIn.date.split('T')[0];
              const isToday = checkInDateStr === todayStr;
              const isYesterday = checkInDateStr === yesterdayStr;

              return (
                <div
                  key={checkIn.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isToday
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {isToday ? 'Today' : isYesterday ? 'Yesterday' : date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {checkIn.note && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{checkIn.note}</p>
                    )}
                  </div>
                  <div className="text-emerald-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Habit</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                disabled={saving}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input
                label="Habit Name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={saving}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Goal
                </label>
                <select
                  value={editForm.frequencyGoal}
                  onChange={(e) => setEditForm(prev => ({ ...prev, frequencyGoal: parseInt(e.target.value) }))}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}x per week</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Habit?</h2>
              <p className="text-gray-500 mb-6">
                This will permanently delete "{habit.name}" and all its check-in history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HabitDetail;
