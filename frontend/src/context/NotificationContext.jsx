import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { friendsAPI, socialAPI } from '../services/api';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadCheers, setUnreadCheers] = useState(0);
  const [lastActivity, setLastActivity] = useState(null);

  // Track previous values to detect new items
  const prevRequestsCount = useRef(0);
  const prevCheersCount = useRef(0);

  // Polling interval refs
  const pollIntervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Fetch friend requests and cheers in parallel
      const [requestsRes, cheersRes] = await Promise.all([
        friendsAPI.getRequests(),
        socialAPI.getCheers({ limit: 10 }),
      ]);

      const newRequests = requestsRes.data.received || [];
      const newCheersTotal = cheersRes.data.pagination?.total || 0;

      // Check for new friend requests
      if (newRequests.length > prevRequestsCount.current && prevRequestsCount.current > 0) {
        const diff = newRequests.length - prevRequestsCount.current;
        toast.info(`You have ${diff} new friend request${diff > 1 ? 's' : ''}!`);
      }

      // Check for new cheers
      if (newCheersTotal > prevCheersCount.current && prevCheersCount.current > 0) {
        const diff = newCheersTotal - prevCheersCount.current;
        toast.success(`You received ${diff} new cheer${diff > 1 ? 's' : ''}!`);
      }

      prevRequestsCount.current = newRequests.length;
      prevCheersCount.current = newCheersTotal;

      setPendingRequests(newRequests);
      setUnreadCheers(newCheersTotal);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated, toast]);

  // Start polling when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      fetchNotifications();

      // Poll every 30 seconds
      pollIntervalRef.current = setInterval(fetchNotifications, 30000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    } else {
      // Clear state when logged out
      setPendingRequests([]);
      setUnreadCheers(0);
      prevRequestsCount.current = 0;
      prevCheersCount.current = 0;
    }
  }, [isAuthenticated, fetchNotifications]);

  // Achievement notifications
  const notifyAchievement = useCallback((type, data) => {
    switch (type) {
      case 'streak_record':
        toast.success(`New personal record! ${data.streak} day streak on "${data.habitName}"!`, {
          title: 'Achievement Unlocked',
          duration: 6000,
        });
        break;
      case 'streak_milestone':
        const milestoneMessages = {
          7: 'One week streak! Keep it up!',
          14: 'Two weeks strong!',
          21: 'Three weeks! You\'re on fire!',
          30: 'One month streak! Incredible!',
          60: 'Two months! You\'re unstoppable!',
          90: 'Three months! Legendary!',
          100: '100 days! You\'re a habit master!',
          365: 'One year streak! Unbelievable!',
        };
        if (milestoneMessages[data.streak]) {
          toast.success(milestoneMessages[data.streak], {
            title: `${data.streak} Day Streak`,
            duration: 6000,
          });
        }
        break;
      case 'first_checkin':
        toast.success('You completed your first check-in! Great start!', {
          title: 'First Step',
          duration: 5000,
        });
        break;
      case 'all_habits_complete':
        toast.success('All habits completed for today! Amazing work!', {
          title: 'Perfect Day',
          duration: 5000,
        });
        break;
      default:
        break;
    }
  }, [toast]);

  // Refresh notifications manually
  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const value = {
    pendingRequests,
    unreadCheers,
    lastActivity,
    notifyAchievement,
    refreshNotifications,
    pendingRequestsCount: pendingRequests.length,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
