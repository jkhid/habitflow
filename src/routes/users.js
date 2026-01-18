const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { updateProfileValidation, uuidParam } = require('../middleware/validators');

const router = express.Router();

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            habits: true,
            checkIns: true,
          },
        },
      },
    });

    // Get total streak count
    const habits = await prisma.habit.findMany({
      where: { userId: req.user.id, isActive: true },
      select: { currentStreak: true },
    });

    const totalActiveStreaks = habits.reduce((sum, h) => sum + h.currentStreak, 0);

    res.json({
      ...user,
      totalActiveStreaks,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/me - Update current user profile
router.patch('/me', authenticate, updateProfileValidation, async (req, res, next) => {
  try {
    const { username, profilePicture } = req.body;

    // Check if username is taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: req.user.id },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username && { username }),
        ...(profilePicture !== undefined && { profilePicture }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:userId - Get user profile by ID
router.get('/:userId', authenticate, uuidParam('userId'), async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            habits: { where: { isActive: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check friendship status
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user.id, addresseeId: userId },
          { requesterId: userId, addresseeId: req.user.id },
        ],
      },
    });

    // Get full habit data with check-ins if friends
    let habits = [];
    let habitStats = null;
    if (friendship?.status === 'ACCEPTED') {
      habits = await prisma.habit.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          frequencyGoal: true,
          currentStreak: true,
          longestStreak: true,
          checkIns: {
            orderBy: { date: 'desc' },
            take: 90,
            select: {
              id: true,
              date: true,
              note: true,
              cheers: {
                select: {
                  id: true,
                  giverId: true,
                  emoji: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Add hasCheered flag and cheerCount to each check-in
      habits = habits.map(habit => ({
        ...habit,
        checkIns: habit.checkIns.map(checkIn => ({
          ...checkIn,
          hasCheered: checkIn.cheers.some(c => c.giverId === req.user.id),
          cheerCount: checkIn.cheers.length,
        })),
      }));

      habitStats = {
        totalActiveHabits: habits.length,
        totalActiveStreaks: habits.reduce((sum, h) => sum + h.currentStreak, 0),
        longestStreak: Math.max(...habits.map((h) => h.longestStreak), 0),
      };
    }

    res.json({
      ...user,
      friendshipStatus: friendship?.status || null,
      friendshipId: friendship?.id || null,
      friendsSince: friendship?.status === 'ACCEPTED' ? friendship.updatedAt : null,
      habits,
      habitStats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/search?q=query - Search users
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user.id } },
          {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
      },
      take: 20,
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
