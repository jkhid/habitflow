import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, Search, Flame, Users, ChevronRight } from 'lucide-react';
import { Card, Button, Input, Avatar, FriendCardSkeleton, ActivityCardSkeleton } from '../components/ui';
import CheerButton from '../components/CheerButton';
import { useToast } from '../context/ToastContext';
import { friendsAPI, socialAPI, usersAPI } from '../services/api';

const Friends = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendSearch, setAddFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchFeed();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (addFriendSearch.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addFriendSearch]);

  const fetchFriends = async () => {
    try {
      const response = await friendsAPI.getAll();
      setFriends(response.data.friends || []);
    } catch (err) {
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await friendsAPI.getRequests();
      setRequests(response.data);
    } catch (err) {
      console.error('Failed to load friend requests');
    }
  };

  const fetchFeed = async () => {
    try {
      const response = await socialAPI.getFeed();
      setFeed(response.data.activities || []);
    } catch (err) {
      toast.error('Failed to load activity feed');
    } finally {
      setFeedLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const response = await usersAPI.searchUsers(addFriendSearch);
      // Filter out existing friends and self
      const friendIds = friends.map(f => f.id);
      setSearchResults(response.data.filter(u => !friendIds.includes(u.id)));
    } catch (err) {
      console.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendsAPI.acceptRequest(friendshipId);
      // Refresh data
      fetchFriends();
      fetchRequests();
      toast.success('Friend request accepted!');
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await friendsAPI.declineRequest(friendshipId);
      setRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r.id !== friendshipId),
      }));
      toast.info('Friend request declined');
    } catch (err) {
      toast.error('Failed to decline request');
    }
  };

  const handleCheer = async (checkInId, hasCheered) => {
    // Optimistic update
    setFeed(prev => prev.map(item => {
      if (item.checkInId === checkInId) {
        return {
          ...item,
          hasCheered: !hasCheered,
          cheerCount: hasCheered ? item.cheerCount - 1 : item.cheerCount + 1,
        };
      }
      return item;
    }));

    try {
      if (hasCheered) {
        await socialAPI.removeCheer(checkInId);
      } else {
        await socialAPI.cheer(checkInId);
      }
    } catch (err) {
      // Revert optimistic update
      setFeed(prev => prev.map(item => {
        if (item.checkInId === checkInId) {
          return {
            ...item,
            hasCheered: hasCheered,
            cheerCount: hasCheered ? item.cheerCount + 1 : item.cheerCount - 1,
          };
        }
        return item;
      }));
      toast.error('Failed to update cheer');
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendsAPI.sendRequest(userId);
      setSentRequests(prev => [...prev, userId]);
      toast.success('Friend request sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    }
  };

  const filteredFriends = friends.filter(f =>
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <p className="text-gray-500 mt-1">Connect and cheer on your friends</p>
        </div>
        <Button onClick={() => setShowAddFriendModal(true)}>
          <UserPlus className="w-5 h-5 mr-2" />
          Add Friend
        </Button>
      </div>

      {/* Friend Requests */}
      {requests.received?.length > 0 && (
        <Card className="mb-6 border-indigo-100 bg-indigo-50/50">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3">
            Friend Requests ({requests.received.length})
          </h3>
          <div className="space-y-3">
            {requests.received.map(request => (
              <div key={request.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar src={request.user?.profilePicture} name={request.user?.username} />
                  <div>
                    <span className="font-medium text-gray-900">{request.user?.username}</span>
                    <p className="text-xs text-gray-500">{formatTimeAgo(request.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDeclineRequest(request.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['feed', 'friends'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'feed' ? 'Activity Feed' : `My Friends (${friends.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'feed' ? (
        <div className="space-y-4">
          {feedLoading ? (
            <>
              <ActivityCardSkeleton />
              <ActivityCardSkeleton />
              <ActivityCardSkeleton />
            </>
          ) : feed.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity from friends</p>
              <p className="text-sm text-gray-400 mt-1">Add friends to see their activity</p>
            </Card>
          ) : (
            feed.map(activity => (
              <Card key={activity.id} className="hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => navigate(`/friend/${activity.user?.id}`)}
                    className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <Avatar src={activity.user?.profilePicture} name={activity.user?.username} size="lg" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/friend/${activity.user?.id}`)}
                        className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {activity.user?.username}
                      </button>
                      <span className="text-gray-500">completed</span>
                      <span className="font-medium text-indigo-600">{activity.habit?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {activity.currentStreak || 0} day streak
                      </span>
                      <span>{formatTimeAgo(activity.createdAt)}</span>
                    </div>
                  </div>
                  <CheerButton
                    cheered={activity.hasCheered}
                    count={activity.cheerCount || 0}
                    onCheer={() => handleCheer(activity.checkInId, activity.hasCheered)}
                  />
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FriendCardSkeleton />
              <FriendCardSkeleton />
              <FriendCardSkeleton />
              <FriendCardSkeleton />
            </div>
          ) : filteredFriends.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No friends match your search' : 'No friends yet'}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setShowAddFriendModal(true)}>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add Friends
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredFriends.map(friend => {
                const topHabits = [...(friend.habits || [])].sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0)).slice(0, 3);
                const totalStreak = (friend.habits || []).reduce((sum, h) => sum + (h.currentStreak || 0), 0);

                return (
                  <Card
                    key={friend.id}
                    className="hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(`/friend/${friend.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar src={friend.profilePicture} name={friend.username} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">{friend.username}</p>
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-gray-500">
                          Friends since {new Date(friend.friendsSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        {totalStreak > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-orange-500">
                            <Flame className="w-4 h-4" />
                            <span className="font-medium">{totalStreak} total streaks</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {topHabits.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Top Habits</p>
                        <div className="space-y-2">
                          {topHabits.map(habit => (
                            <div key={habit.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 truncate">{habit.name}</span>
                              <span className="flex items-center gap-1 text-orange-500 font-medium">
                                <Flame className="w-3 h-3" />
                                {habit.currentStreak || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Friend</h2>
              <button
                onClick={() => {
                  setShowAddFriendModal(false);
                  setAddFriendSearch('');
                  setSearchResults([]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by username..."
                value={addFriendSearch}
                onChange={(e) => setAddFriendSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {addFriendSearch.length < 2 ? (
                <p className="text-center text-gray-500 py-8">
                  Type at least 2 characters to search
                </p>
              ) : searching ? (
                <p className="text-center text-gray-500 py-8">
                  Searching...
                </p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No users found
                </p>
              ) : (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={user.profilePicture} name={user.username} />
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        {user.mutualFriends > 0 && (
                          <p className="text-xs text-gray-500">
                            {user.mutualFriends} mutual friend{user.mutualFriends > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {sentRequests.includes(user.id) ? (
                      <span className="text-sm text-gray-500 px-3 py-1">Request Sent</span>
                    ) : (
                      <Button size="sm" onClick={() => handleSendRequest(user.id)}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Friends;
