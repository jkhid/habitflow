import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Flame, Medal, Crown, Star, Calendar, Users, TrendingUp, Sparkles, Sunrise } from 'lucide-react';
import { Card, Avatar, LeaderboardRowSkeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { socialAPI } from '../services/api';

const badgeDefinitions = {
  streak_master: { name: 'Streak Master', icon: 'flame', color: 'orange', description: '30+ day streak' },
  early_bird: { name: 'Early Bird', icon: 'sunrise', color: 'amber', description: 'Complete habits before 9 AM' },
  consistent: { name: 'Consistent', icon: 'calendar', color: 'emerald', description: '7 days in a row' },
  perfectionist: { name: 'Perfectionist', icon: 'star', color: 'purple', description: '100% completion rate this week' },
  social_butterfly: { name: 'Social Butterfly', icon: 'users', color: 'blue', description: '10+ friends' },
  rising_star: { name: 'Rising Star', icon: 'trending', color: 'pink', description: 'Most improved this week' },
  habit_hero: { name: 'Habit Hero', icon: 'sparkles', color: 'indigo', description: '5+ active habits' },
};

const BadgeIcon = ({ badge, size = 'sm' }) => {
  const def = badgeDefinitions[badge];
  if (!def) return null;

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const containerSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  const colorClasses = {
    orange: 'bg-orange-100 text-orange-500',
    amber: 'bg-amber-100 text-amber-500',
    emerald: 'bg-emerald-100 text-emerald-500',
    purple: 'bg-purple-100 text-purple-500',
    blue: 'bg-blue-100 text-blue-500',
    pink: 'bg-pink-100 text-pink-500',
    indigo: 'bg-indigo-100 text-indigo-500',
  };

  const icons = {
    flame: Flame,
    sunrise: Sunrise,
    calendar: Calendar,
    star: Star,
    users: Users,
    trending: TrendingUp,
    sparkles: Sparkles,
  };

  const IconComponent = icons[def.icon] || Star;

  return (
    <div
      className={`${containerSize} rounded-full ${colorClasses[def.color]} flex items-center justify-center`}
      title={`${def.name}: ${def.description}`}
    >
      <IconComponent className={iconSize} />
    </div>
  );
};

const Badge = ({ badge }) => {
  const def = badgeDefinitions[badge];
  if (!def) return null;

  const colorClasses = {
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses[def.color]}`}
      title={def.description}
    >
      <BadgeIcon badge={badge} size="sm" />
      {def.name}
    </span>
  );
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('friends');

  useEffect(() => {
    fetchLeaderboard();
  }, [scope]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await socialAPI.getLeaderboard({ scope });
      // API returns { leaderboard: [...], currentUserRank, pagination }
      const entries = response.data.leaderboard || [];
      // Backend already adds rank and isCurrentUser
      setLeaderboard(entries);
    } catch (err) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-semibold">{rank}</span>;
    }
  };

  const getRankBg = (rank, isCurrentUser) => {
    if (isCurrentUser) return 'bg-indigo-50 border-indigo-200';
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
      default:
        return 'bg-white border-gray-100';
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const currentUserEntry = leaderboard.find(u => u.isCurrentUser);

  const handleUserClick = (entry) => {
    if (!entry.isCurrentUser) {
      navigate(`/friend/${entry.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 mt-1">See who&apos;s building the best habits</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {['friends', 'global'].map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                scope === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'friends' ? 'Friends' : 'Global'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <>
          <div className="flex justify-center items-end gap-4 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-20 h-4 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-24 h-4 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-20 h-4 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
          </div>
          <Card padding={false} className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              <LeaderboardRowSkeleton />
              <LeaderboardRowSkeleton />
              <LeaderboardRowSkeleton />
              <LeaderboardRowSkeleton />
              <LeaderboardRowSkeleton />
            </div>
          </Card>
        </>
      ) : leaderboard.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No leaderboard data available</p>
          <p className="text-sm text-gray-400 mt-1">
            {scope === 'friends' ? 'Add friends to see the leaderboard' : 'Start tracking habits to join the leaderboard'}
          </p>
        </Card>
      ) : (
        <>
          {/* Podium */}
          {topThree.length > 0 && (
            <div className="flex justify-center items-end gap-4 mb-8">
              {[topThree[1], topThree[0], topThree[2]].map((entry, idx) => {
                if (!entry) return <div key={idx} className="w-20" />;
                const isFirst = idx === 1;
                return (
                  <div
                    key={entry.id}
                    onClick={() => handleUserClick(entry)}
                    className={`flex flex-col items-center cursor-pointer group ${isFirst ? 'order-2' : idx === 0 ? 'order-1' : 'order-3'}`}
                  >
                    <div className={`relative ${isFirst ? 'mb-2' : ''}`}>
                      {isFirst && (
                        <Crown className="w-8 h-8 text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce" />
                      )}
                      <div className="relative">
                        <Avatar
                          src={entry.profilePicture}
                          name={entry.username}
                          size="xl"
                          className={`border-4 transition-transform group-hover:scale-105 ${
                            isFirst ? 'border-yellow-400 w-24 h-24' : idx === 0 ? 'border-gray-300' : 'border-amber-500'
                          }`}
                        />
                        {entry.isCurrentUser && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                            You
                          </div>
                        )}
                      </div>
                    </div>
                    <p className={`font-semibold text-gray-900 mt-2 group-hover:text-indigo-600 transition-colors ${isFirst ? 'text-lg' : ''}`}>
                      {entry.username}
                    </p>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold">{entry.totalActiveStreaks || 0}</span>
                    </div>

                    {/* Badges for podium */}
                    {entry.badges && entry.badges.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {entry.badges.slice(0, 3).map(badge => (
                          <BadgeIcon key={badge} badge={badge} size="md" />
                        ))}
                      </div>
                    )}

                    <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isFirst
                        ? 'bg-yellow-100 text-yellow-700'
                        : idx === 0
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      #{entry.rank}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <Card padding={false} className="overflow-hidden">
              <div className="divide-y divide-gray-100">
                {rest.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => handleUserClick(entry)}
                    className={`flex items-center gap-4 p-4 ${getRankBg(entry.rank, entry.isCurrentUser)} border-l-4 transition-all hover:bg-gray-50 cursor-pointer group`}
                  >
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>
                    <Avatar src={entry.profilePicture} name={entry.username} className="transition-transform group-hover:scale-105" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold truncate group-hover:text-indigo-600 transition-colors ${entry.isCurrentUser ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {entry.username}
                        </p>
                        {entry.isCurrentUser && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {entry.activeHabits || 0} active habits
                      </p>
                      {/* Badges */}
                      {entry.badges && entry.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.badges.map(badge => (
                            <Badge key={badge} badge={badge} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-5 h-5" />
                        <span className="text-xl font-bold">{entry.totalActiveStreaks || 0}</span>
                      </div>
                      <p className="text-xs text-gray-500">total streaks</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Current user stats */}
          {currentUserEntry && (
            <Card className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-indigo-100 text-sm">Your Ranking</p>
                  <p className="text-3xl font-bold">
                    #{currentUserEntry.rank}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-100 text-sm">Your Badges</p>
                  <div className="flex gap-2 mt-1">
                    {currentUserEntry.badges?.map(badge => {
                      const def = badgeDefinitions[badge];
                      return (
                        <div
                          key={badge}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                          title={`${def?.name}: ${def?.description}`}
                        >
                          <BadgeIcon badge={badge} size="md" />
                        </div>
                      );
                    })}
                    {(!currentUserEntry.badges || currentUserEntry.badges.length === 0) && (
                      <p className="text-indigo-200 text-sm">No badges yet</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-indigo-100 text-sm">Total Active Streaks</p>
                  <p className="text-3xl font-bold flex items-center gap-2 justify-end">
                    <Flame className="w-6 h-6" />
                    {currentUserEntry.totalActiveStreaks || 0}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
