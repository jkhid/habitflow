export const currentUser = {
  id: '1',
  username: 'johndoe',
  email: 'john@example.com',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  createdAt: '2024-01-15T00:00:00Z',
};

// Helper to generate check-in dates for last N days with given probability
const generateCheckIns = (probability = 0.7, daysBack = 90) => {
  const checkIns = [];
  const today = new Date('2026-01-16');

  for (let i = 0; i < daysBack; i++) {
    if (Math.random() < probability) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      checkIns.push({
        id: `ci-${Date.now()}-${i}`,
        date: date.toISOString().split('T')[0],
        note: i === 0 ? 'Today!' : '',
      });
    }
  }
  return checkIns;
};

// Generate consistent check-ins using seeded random
const seededCheckIns = (seed, probability = 0.7, daysBack = 90) => {
  const checkIns = [];
  const today = new Date('2026-01-16');

  // Simple seeded random
  let s = seed;
  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = 0; i < daysBack; i++) {
    if (random() < probability) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      checkIns.push({
        id: `ci-${seed}-${i}`,
        date: date.toISOString().split('T')[0],
        note: '',
      });
    }
  }
  return checkIns;
};

export const habits = [
  {
    id: '1',
    name: 'Morning Meditation',
    description: '10 minutes of mindfulness meditation to start the day with clarity and focus. Find a quiet space, sit comfortably, and breathe.',
    frequencyGoal: 7,
    currentStreak: 12,
    longestStreak: 21,
    completedToday: true,
    isActive: true,
    createdAt: '2025-10-15T00:00:00Z',
    checkIns: seededCheckIns(123, 0.75, 90),
  },
  {
    id: '2',
    name: 'Read 30 Minutes',
    description: 'Read non-fiction books to expand knowledge and improve critical thinking skills.',
    frequencyGoal: 5,
    currentStreak: 5,
    longestStreak: 14,
    completedToday: false,
    isActive: true,
    createdAt: '2025-11-01T00:00:00Z',
    checkIns: seededCheckIns(456, 0.55, 90),
  },
  {
    id: '3',
    name: 'Exercise',
    description: '30 min workout or 10k steps. Mix of cardio and strength training for overall fitness.',
    frequencyGoal: 5,
    currentStreak: 3,
    longestStreak: 30,
    completedToday: true,
    isActive: true,
    createdAt: '2025-09-01T00:00:00Z',
    checkIns: seededCheckIns(789, 0.6, 90),
  },
  {
    id: '4',
    name: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated throughout the day for better energy and focus.',
    frequencyGoal: 7,
    currentStreak: 8,
    longestStreak: 45,
    completedToday: true,
    isActive: true,
    createdAt: '2025-08-15T00:00:00Z',
    checkIns: seededCheckIns(101, 0.85, 90),
  },
  {
    id: '5',
    name: 'Journal',
    description: 'Write daily reflections about thoughts, feelings, and gratitude.',
    frequencyGoal: 7,
    currentStreak: 0,
    longestStreak: 7,
    completedToday: false,
    isActive: true,
    createdAt: '2025-12-01T00:00:00Z',
    checkIns: seededCheckIns(202, 0.3, 90),
  },
  {
    id: '6',
    name: 'Learn Spanish',
    description: '15 minutes on Duolingo or other language learning apps.',
    frequencyGoal: 5,
    currentStreak: 28,
    longestStreak: 28,
    completedToday: true,
    isActive: true,
    createdAt: '2025-12-15T00:00:00Z',
    checkIns: seededCheckIns(303, 0.9, 90),
  },
];

export const friends = [
  {
    id: '2',
    username: 'sarahsmith',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    friendsSince: '2024-06-15T00:00:00Z',
    habits: [
      { id: 'fh1', name: 'Morning Run', currentStreak: 15, longestStreak: 28, frequencyGoal: 5, checkIns: seededCheckIns(1001, 0.7, 90) },
      { id: 'fh2', name: 'Healthy Eating', currentStreak: 22, longestStreak: 22, frequencyGoal: 7, checkIns: seededCheckIns(1002, 0.8, 90) },
      { id: 'fh3', name: 'Read Before Bed', currentStreak: 6, longestStreak: 14, frequencyGoal: 7, checkIns: seededCheckIns(1003, 0.5, 90) },
    ],
  },
  {
    id: '3',
    username: 'mikejohnson',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    friendsSince: '2024-08-20T00:00:00Z',
    habits: [
      { id: 'fh4', name: 'Meditation', currentStreak: 30, longestStreak: 45, frequencyGoal: 7, checkIns: seededCheckIns(2001, 0.85, 90) },
      { id: 'fh5', name: 'Coding Practice', currentStreak: 45, longestStreak: 45, frequencyGoal: 6, checkIns: seededCheckIns(2002, 0.9, 90) },
      { id: 'fh6', name: 'Yoga', currentStreak: 14, longestStreak: 30, frequencyGoal: 5, checkIns: seededCheckIns(2003, 0.65, 90) },
      { id: 'fh7', name: 'Journaling', currentStreak: 0, longestStreak: 10, frequencyGoal: 7, checkIns: seededCheckIns(2004, 0.3, 90) },
    ],
  },
  {
    id: '4',
    username: 'emilywang',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    friendsSince: '2024-09-10T00:00:00Z',
    habits: [
      { id: 'fh8', name: 'Read 30 mins', currentStreak: 7, longestStreak: 21, frequencyGoal: 7, checkIns: seededCheckIns(3001, 0.7, 90) },
      { id: 'fh9', name: 'Learn Piano', currentStreak: 35, longestStreak: 35, frequencyGoal: 5, checkIns: seededCheckIns(3002, 0.8, 90) },
      { id: 'fh10', name: 'Stretching', currentStreak: 30, longestStreak: 30, frequencyGoal: 7, checkIns: seededCheckIns(3003, 0.9, 90) },
    ],
  },
  {
    id: '5',
    username: 'alexbrown',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    friendsSince: '2024-11-01T00:00:00Z',
    habits: [
      { id: 'fh11', name: 'Gym Workout', currentStreak: 21, longestStreak: 21, frequencyGoal: 5, checkIns: seededCheckIns(4001, 0.75, 90) },
      { id: 'fh12', name: 'No Sugar', currentStreak: 14, longestStreak: 30, frequencyGoal: 7, checkIns: seededCheckIns(4002, 0.6, 90) },
    ],
  },
];

// Users available for search (not yet friends)
export const searchableUsers = [
  { id: '8', username: 'oliviamartin', profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia', mutualFriends: 3 },
  { id: '9', username: 'jameswright', profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', mutualFriends: 1 },
  { id: '10', username: 'sophiagarcia', profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia', mutualFriends: 2 },
  { id: '11', username: 'williamtaylor', profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=william', mutualFriends: 0 },
  { id: '12', username: 'avaanderson', profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ava', mutualFriends: 4 },
  { id: '13', username: 'noahthomas', profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=noah', mutualFriends: 1 },
];

export const friendRequests = {
  received: [
    {
      id: 'fr1',
      user: {
        id: '6',
        username: 'davidlee',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
      },
      createdAt: '2026-01-14T00:00:00Z',
    },
  ],
  sent: [
    {
      id: 'fr2',
      user: {
        id: '7',
        username: 'jessicamiller',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica',
      },
      createdAt: '2026-01-13T00:00:00Z',
    },
  ],
};

export const activityFeed = [
  {
    id: 'a1',
    type: 'habit_completion',
    user: {
      id: '2',
      username: 'sarahsmith',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    },
    habit: { id: 'h1', name: 'Morning Run', currentStreak: 15 },
    date: '2026-01-16',
    createdAt: '2026-01-16T07:30:00Z',
    cheerCount: 3,
    hasCheered: false,
  },
  {
    id: 'a2',
    type: 'habit_completion',
    user: {
      id: '3',
      username: 'mikejohnson',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    },
    habit: { id: 'h2', name: 'Meditation', currentStreak: 30 },
    date: '2026-01-16',
    createdAt: '2026-01-16T06:15:00Z',
    cheerCount: 5,
    hasCheered: true,
  },
  {
    id: 'a3',
    type: 'habit_completion',
    user: {
      id: '4',
      username: 'emilywang',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    },
    habit: { id: 'h3', name: 'Read 30 mins', currentStreak: 7 },
    date: '2026-01-15',
    createdAt: '2026-01-15T21:00:00Z',
    cheerCount: 2,
    hasCheered: false,
  },
  {
    id: 'a4',
    type: 'habit_completion',
    user: {
      id: '5',
      username: 'alexbrown',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    },
    habit: { id: 'h4', name: 'Gym Workout', currentStreak: 21 },
    date: '2026-01-15',
    createdAt: '2026-01-15T18:45:00Z',
    cheerCount: 8,
    hasCheered: true,
  },
];

export const leaderboard = [
  {
    rank: 1,
    id: '3',
    username: 'mikejohnson',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    totalActiveStreaks: 89,
    longestStreak: 45,
    activeHabits: 6,
    isCurrentUser: false,
    badges: ['streak_master', 'early_bird', 'consistent'],
  },
  {
    rank: 2,
    id: '4',
    username: 'emilywang',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    totalActiveStreaks: 72,
    longestStreak: 30,
    activeHabits: 5,
    isCurrentUser: false,
    badges: ['streak_master', 'perfectionist'],
  },
  {
    rank: 3,
    id: '1',
    username: 'johndoe',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    totalActiveStreaks: 56,
    longestStreak: 45,
    activeHabits: 6,
    isCurrentUser: true,
    badges: ['early_bird', 'social_butterfly'],
  },
  {
    rank: 4,
    id: '2',
    username: 'sarahsmith',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    totalActiveStreaks: 43,
    longestStreak: 21,
    activeHabits: 4,
    isCurrentUser: false,
    badges: ['consistent', 'rising_star'],
  },
  {
    rank: 5,
    id: '5',
    username: 'alexbrown',
    profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    totalActiveStreaks: 35,
    longestStreak: 21,
    activeHabits: 3,
    isCurrentUser: false,
    badges: ['newcomer'],
  },
];

// Badge definitions
export const badgeDefinitions = {
  streak_master: { name: 'Streak Master', icon: 'flame', color: 'orange', description: '30+ day streak' },
  early_bird: { name: 'Early Bird', icon: 'sunrise', color: 'amber', description: 'Complete habits before 8am' },
  consistent: { name: 'Consistent', icon: 'calendar', color: 'emerald', description: '90% completion rate' },
  perfectionist: { name: 'Perfectionist', icon: 'star', color: 'purple', description: '100% weekly goal' },
  social_butterfly: { name: 'Social Butterfly', icon: 'users', color: 'blue', description: '10+ friends' },
  rising_star: { name: 'Rising Star', icon: 'trending', color: 'pink', description: 'Most improved this week' },
  newcomer: { name: 'Newcomer', icon: 'sparkles', color: 'indigo', description: 'Just getting started' },
};
