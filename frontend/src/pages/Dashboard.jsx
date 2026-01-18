import { useState, useEffect } from 'react';
import { Plus, Flame, Target, CheckCircle2, Sparkles, Rocket } from 'lucide-react';
import { Button, Card, Input, HabitCardSkeleton, StatCardSkeleton } from '../components/ui';
import HabitCard from '../components/HabitCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { habitsAPI } from '../services/api';

const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', frequencyGoal: 7 });

  const { user } = useAuth();
  const toast = useToast();
  const { notifyAchievement } = useNotifications();

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await habitsAPI.getAll();
      setHabits(response.data.habits || []);
    } catch (err) {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  // Check if habit was completed today
  const isCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.checkIns?.some(c => c.date?.split('T')[0] === today);
  };

  const completedToday = habits.filter(h => isCompletedToday(h)).length;
  const totalStreak = habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0);
  const longestStreak = habits.length > 0
    ? Math.max(...habits.map(h => h.longestStreak || 0))
    : 0;

  const handleCheckIn = async (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || isCompletedToday(habit)) return;

    const previousStreak = habit.currentStreak || 0;
    const previousLongestStreak = habit.longestStreak || 0;
    const wasFirstCheckIn = !habit.checkIns || habit.checkIns.length === 0;

    // Optimistic update
    const today = new Date().toISOString();
    const tempCheckIn = { id: 'temp-' + Date.now(), date: today };

    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          checkIns: [...(h.checkIns || []), tempCheckIn],
          currentStreak: (h.currentStreak || 0) + 1,
          longestStreak: Math.max(h.longestStreak || 0, (h.currentStreak || 0) + 1),
        };
      }
      return h;
    }));

    try {
      const response = await habitsAPI.checkIn(habitId);
      const newStreak = response.data.currentStreak ?? previousStreak + 1;
      const newLongestStreak = response.data.longestStreak ?? previousLongestStreak;

      // Update with real data from server
      setHabits(prev => {
        const updated = prev.map(h => {
          if (h.id === habitId) {
            return {
              ...h,
              checkIns: h.checkIns.map(c =>
                c.id === tempCheckIn.id ? response.data.checkIn : c
              ),
              currentStreak: newStreak,
              longestStreak: newLongestStreak,
            };
          }
          return h;
        });

        // Check if all habits are now complete
        const allComplete = updated.every(h => isCompletedToday(h) || h.id === habitId);
        if (allComplete && updated.length > 1) {
          setTimeout(() => notifyAchievement('all_habits_complete'), 500);
        }

        return updated;
      });

      toast.success('Habit completed!');

      // Achievement notifications
      if (wasFirstCheckIn) {
        setTimeout(() => notifyAchievement('first_checkin'), 300);
      }

      // Check for streak milestones
      const milestones = [7, 14, 21, 30, 60, 90, 100, 365];
      if (milestones.includes(newStreak)) {
        setTimeout(() => notifyAchievement('streak_milestone', { streak: newStreak, habitName: habit.name }), 600);
      }

      // Check for new record
      if (newLongestStreak > previousLongestStreak && previousLongestStreak > 0) {
        setTimeout(() => notifyAchievement('streak_record', { streak: newLongestStreak, habitName: habit.name }), 800);
      }

    } catch (err) {
      // Revert optimistic update
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          return {
            ...h,
            checkIns: h.checkIns.filter(c => c.id !== tempCheckIn.id),
            currentStreak: habit.currentStreak,
            longestStreak: habit.longestStreak,
          };
        }
        return h;
      }));
      toast.error('Failed to check in');
    }
  };

  const handleUndoCheckIn = async (habitId, checkInId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Store previous state for rollback
    const previousHabit = { ...habit };

    // Optimistic update - remove the check-in
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          checkIns: h.checkIns.filter(c => c.id !== checkInId),
          currentStreak: Math.max(0, (h.currentStreak || 1) - 1),
          todayCheckIn: null,
        };
      }
      return h;
    }));

    try {
      const response = await habitsAPI.removeCheckIn(habitId, checkInId);

      // Update with real streak from server
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          return {
            ...h,
            currentStreak: response.data.currentStreak ?? 0,
          };
        }
        return h;
      }));

      toast.success('Check-in undone');
    } catch (err) {
      // Revert on error
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          return previousHabit;
        }
        return h;
      }));
      toast.error('Failed to undo check-in');
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;

    setCreating(true);

    try {
      const response = await habitsAPI.create(newHabit);
      setHabits(prev => [{ ...response.data, checkIns: [] }, ...prev]);
      setNewHabit({ name: '', description: '', frequencyGoal: 7 });
      setShowAddModal(false);
      toast.success('Habit created! Start your streak today!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create habit');
    } finally {
      setCreating(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.username || 'there'}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Track your habits and build consistency</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto active-press">
          <Plus className="w-5 h-5 mr-2" />
          New Habit
        </Button>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Habits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HabitCardSkeleton />
              <HabitCardSkeleton />
              <HabitCardSkeleton />
              <HabitCardSkeleton />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover-lift">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs sm:text-sm">Completed Today</p>
                  <p className="text-2xl sm:text-3xl font-bold">{completedToday}/{habits.length}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white hover-lift">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm">Total Active Streaks</p>
                  <p className="text-2xl sm:text-3xl font-bold">{totalStreak}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover-lift">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-indigo-100 text-xs sm:text-sm">Best Streak Ever</p>
                  <p className="text-2xl sm:text-3xl font-bold">{longestStreak}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Habits Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Habits</h2>
            {habits.length === 0 ? (
              <Card className="text-center py-12 sm:py-16 animate-scale-in">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Journey</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Create your first habit and begin building the life you want, one day at a time.
                </p>
                <Button onClick={() => setShowAddModal(true)} size="lg" className="active-press">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Your First Habit
                </Button>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-400">Popular habits to get started:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {['Morning Exercise', 'Read 30 mins', 'Meditate', 'Drink Water', 'Journal'].map(h => (
                      <button
                        key={h}
                        onClick={() => {
                          setNewHabit(prev => ({ ...prev, name: h }));
                          setShowAddModal(true);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 text-sm rounded-full transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map((habit, index) => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayCheckIn = habit.checkIns?.find(c => c.date?.split('T')[0] === today);
                  return (
                    <div
                      key={habit.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <HabitCard
                        habit={{
                          ...habit,
                          completedToday: !!todayCheckIn,
                          todayCheckIn,
                        }}
                        onCheckIn={handleCheckIn}
                        onUndoCheckIn={handleUndoCheckIn}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-md animate-scale-in">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Habit</h2>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <Input
                label="Habit Name"
                placeholder="e.g., Morning Meditation"
                value={newHabit.name}
                onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                required
                autoFocus
              />
              <Input
                label="Description (optional)"
                placeholder="e.g., 10 minutes of mindfulness"
                value={newHabit.description}
                onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Goal
                </label>
                <select
                  value={newHabit.frequencyGoal}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, frequencyGoal: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}x per week{n === 7 ? ' (Daily)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 active-press"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 active-press" loading={creating}>
                  Create Habit
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
