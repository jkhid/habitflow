import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Target, Calendar, UserMinus, MessageCircle } from 'lucide-react';
import { Card, Button, Avatar } from '../components/ui';
import HeatMap from '../components/HeatMap';
import CheerButton from '../components/CheerButton';
import { usersAPI, friendsAPI, socialAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

// Skeleton components
const StatCardSkeleton = () => (
  <Card className="text-center">
    <div className="animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-2" />
      <div className="h-7 w-12 bg-gray-200 rounded mx-auto mb-1" />
      <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
    </div>
  </Card>
);

const FriendDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header skeleton */}
    <div className="flex items-center gap-4 mb-6 animate-pulse">
      <div className="w-9 h-9 bg-gray-200 rounded-lg" />
      <div className="h-8 w-32 bg-gray-200 rounded" />
    </div>

    {/* Profile card skeleton */}
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 animate-pulse">
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
        <div className="flex-1 text-center sm:text-left">
          <div className="h-8 w-40 bg-gray-200 rounded mx-auto sm:mx-0 mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto sm:mx-0" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
          <div className="h-9 w-9 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </Card>

    {/* Stats skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>

    {/* Habits skeleton */}
    <div className="h-6 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <div className="animate-pulse">
            <div className="flex justify-between mb-4">
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded-full" />
            </div>
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const FriendDetail = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removingFriend, setRemovingFriend] = useState(false);
  const [cheeredCheckIns, setCheeredCheckIns] = useState({});
  const [cheeringCheckIn, setCheeringCheckIn] = useState(null);

  // Fetch friend data
  useEffect(() => {
    const fetchFriend = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getUser(friendId);
        setFriend(response.data);

        // Initialize cheered state from check-ins
        const cheered = {};
        response.data.habits?.forEach(habit => {
          habit.checkIns?.forEach(checkIn => {
            if (checkIn.hasCheered) {
              cheered[checkIn.id] = true;
            }
          });
        });
        setCheeredCheckIns(cheered);
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to load friend profile';
        toast.error(message);
        if (error.response?.status === 404) {
          navigate('/friends');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFriend();
  }, [friendId, navigate, toast]);

  const stats = useMemo(() => {
    if (!friend?.habits || friend.habits.length === 0) return null;

    const totalStreaks = friend.habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0);
    const longestStreak = Math.max(...friend.habits.map(h => h.longestStreak || 0));
    const avgCompletion = Math.round(
      friend.habits.reduce((sum, h) => {
        const checkInsCount = h.checkIns?.length || 0;
        const rate = (checkInsCount / 90) * 100;
        return sum + rate;
      }, 0) / friend.habits.length
    );

    return {
      totalStreaks,
      longestStreak,
      avgCompletion,
      habitCount: friend.habits.length,
    };
  }, [friend]);

  const handleRemoveFriend = async () => {
    if (!friend?.friendshipId || removingFriend) return;

    setRemovingFriend(true);
    try {
      await friendsAPI.removeFriend(friend.friendshipId);
      toast.success('Friend removed');
      navigate('/friends');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to remove friend';
      toast.error(message);
      setRemovingFriend(false);
    }
  };

  const handleCheer = async (checkInId) => {
    if (cheeringCheckIn === checkInId) return;

    const wasChered = cheeredCheckIns[checkInId];

    // Optimistic update
    setCheeredCheckIns(prev => ({
      ...prev,
      [checkInId]: !prev[checkInId],
    }));

    setCheeringCheckIn(checkInId);
    try {
      if (wasChered) {
        await socialAPI.removeCheer(checkInId);
      } else {
        await socialAPI.cheer(checkInId);
        toast.success('Cheer sent!');
      }
    } catch (error) {
      // Revert on error
      setCheeredCheckIns(prev => ({
        ...prev,
        [checkInId]: wasChered,
      }));
      const message = error.response?.data?.error || 'Failed to send cheer';
      toast.error(message);
    } finally {
      setCheeringCheckIn(null);
    }
  };

  if (loading) {
    return <FriendDetailSkeleton />;
  }

  if (!friend) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <p className="text-gray-500">Friend not found</p>
          <Button className="mt-4" onClick={() => navigate('/friends')}>
            Back to Friends
          </Button>
        </Card>
      </div>
    );
  }

  // Check if user is actually a friend
  if (friend.friendshipStatus !== 'ACCEPTED') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <p className="text-gray-500">You are not friends with this user</p>
          <Button className="mt-4" onClick={() => navigate('/friends')}>
            Back to Friends
          </Button>
        </Card>
      </div>
    );
  }

  const sortedHabits = [...(friend.habits || [])].sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/friends')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Friend Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar
            src={friend.profilePicture}
            name={friend.username}
            className="w-24 h-24 border-4 border-white shadow-lg"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{friend.username}</h2>
            {friend.friendsSince && (
              <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                Friends since {new Date(friend.friendsSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled>
              <MessageCircle className="w-4 h-4 mr-1" />
              Message
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50"
              onClick={handleRemoveFriend}
              disabled={removingFriend}
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="inline-flex p-3 rounded-xl bg-orange-100 mb-2">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStreaks}</p>
            <p className="text-sm text-gray-500">Total Streaks</p>
          </Card>

          <Card className="text-center">
            <div className="inline-flex p-3 rounded-xl bg-emerald-100 mb-2">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.longestStreak}</p>
            <p className="text-sm text-gray-500">Best Streak</p>
          </Card>

          <Card className="text-center">
            <div className="inline-flex p-3 rounded-xl bg-indigo-100 mb-2">
              <Calendar className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgCompletion}%</p>
            <p className="text-sm text-gray-500">Avg Completion</p>
          </Card>

          <Card className="text-center">
            <div className="inline-flex p-3 rounded-xl bg-purple-100 mb-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.habitCount}</p>
            <p className="text-sm text-gray-500">Active Habits</p>
          </Card>
        </div>
      )}

      {/* Habits */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {friend.username}'s Habits
      </h2>

      {sortedHabits.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500">{friend.username} hasn't created any habits yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedHabits.map((habit) => {
            const checkInsCount = habit.checkIns?.length || 0;
            const completionRate = Math.round((checkInsCount / 90) * 100);

            // Get the most recent check-in to cheer
            const recentCheckIn = habit.checkIns?.[0];
            const isCheered = recentCheckIn ? cheeredCheckIns[recentCheckIn.id] : false;

            return (
              <Card key={habit.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{habit.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Flame className={`w-4 h-4 ${habit.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                        {habit.currentStreak || 0} day streak
                      </span>
                      <span>Best: {habit.longestStreak || 0}</span>
                      <span>{completionRate}% completion</span>
                    </div>
                  </div>
                  {recentCheckIn && (
                    <CheerButton
                      cheered={isCheered}
                      count={recentCheckIn.cheerCount || (isCheered ? 1 : 0)}
                      onCheer={() => handleCheer(recentCheckIn.id)}
                      loading={cheeringCheckIn === recentCheckIn.id}
                    />
                  )}
                </div>

                <div className="overflow-x-auto pb-2">
                  <HeatMap checkIns={habit.checkIns || []} days={90} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FriendDetail;
