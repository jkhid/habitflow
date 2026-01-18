const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { cheerValidation, uuidParam, paginationValidation } = require('../middleware/validators');

const router = express.Router();

// GET /api/social/feed - Get friend activity feed
router.get('/feed', authenticate, paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: req.user.id },
          { addresseeId: req.user.id },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === req.user.id ? f.addresseeId : f.requesterId
    );

    if (friendIds.length === 0) {
      return res.json({
        activities: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Get recent check-ins from friends
    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where: {
          userId: { in: friendIds },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          habit: {
            select: {
              id: true,
              name: true,
              currentStreak: true,
            },
          },
          cheers: {
            include: {
              giver: {
                select: {
                  id: true,
                  username: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.checkIn.count({
        where: {
          userId: { in: friendIds },
        },
      }),
    ]);

    // Check if current user has cheered each check-in
    const activities = checkIns.map((checkIn) => ({
      id: checkIn.id,
      type: 'habit_completion',
      user: checkIn.user,
      habit: checkIn.habit,
      date: checkIn.date,
      note: checkIn.note,
      createdAt: checkIn.createdAt,
      cheers: checkIn.cheers,
      cheerCount: checkIn.cheers.length,
      hasCheered: checkIn.cheers.some((c) => c.giverId === req.user.id),
    }));

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/social/cheer/:checkInId - Cheer a friend's check-in
router.post('/cheer/:checkInId', authenticate, uuidParam('checkInId'), cheerValidation, async (req, res, next) => {
  try {
    const { checkInId } = req.params;
    const { emoji } = req.body;

    // Get the check-in
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        user: true,
      },
    });

    if (!checkIn) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    // Can't cheer your own check-in
    if (checkIn.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot cheer your own check-in' });
    }

    // Check if they are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: req.user.id, addresseeId: checkIn.userId },
          { requesterId: checkIn.userId, addresseeId: req.user.id },
        ],
      },
    });

    if (!friendship) {
      return res.status(403).json({ error: 'Can only cheer friends\' check-ins' });
    }

    // Check for existing cheer
    const existingCheer = await prisma.cheer.findFirst({
      where: {
        checkInId,
        giverId: req.user.id,
      },
    });

    if (existingCheer) {
      return res.status(409).json({ error: 'Already cheered this check-in' });
    }

    // Create cheer
    const cheer = await prisma.cheer.create({
      data: {
        checkInId,
        giverId: req.user.id,
        receiverId: checkIn.userId,
        emoji: emoji || undefined,
      },
      include: {
        giver: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(201).json(cheer);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/social/cheer/:checkInId - Remove cheer from check-in
router.delete('/cheer/:checkInId', authenticate, uuidParam('checkInId'), async (req, res, next) => {
  try {
    const { checkInId } = req.params;

    const cheer = await prisma.cheer.findFirst({
      where: {
        checkInId,
        giverId: req.user.id,
      },
    });

    if (!cheer) {
      return res.status(404).json({ error: 'Cheer not found' });
    }

    await prisma.cheer.delete({
      where: { id: cheer.id },
    });

    res.json({ message: 'Cheer removed' });
  } catch (error) {
    next(error);
  }
});

// GET /api/social/leaderboard - Get leaderboard by total active streaks
router.get('/leaderboard', authenticate, paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const scope = req.query.scope || 'friends'; // 'friends' or 'global'

    let userIds = null;

    if (scope === 'friends') {
      // Get friend IDs + current user
      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: req.user.id },
            { addresseeId: req.user.id },
          ],
        },
        select: {
          requesterId: true,
          addresseeId: true,
        },
      });

      userIds = [req.user.id];
      friendships.forEach((f) => {
        const friendId = f.requesterId === req.user.id ? f.addresseeId : f.requesterId;
        userIds.push(friendId);
      });
    }

    // Get users with their total active streaks
    const users = await prisma.user.findMany({
      where: userIds ? { id: { in: userIds } } : undefined,
      select: {
        id: true,
        username: true,
        profilePicture: true,
        habits: {
          where: { isActive: true },
          select: {
            currentStreak: true,
            longestStreak: true,
          },
        },
      },
    });

    // Calculate total streaks and sort
    const leaderboard = users
      .map((user) => ({
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        totalActiveStreaks: user.habits.reduce((sum, h) => sum + h.currentStreak, 0),
        longestStreak: Math.max(...user.habits.map((h) => h.longestStreak), 0),
        activeHabits: user.habits.length,
        isCurrentUser: user.id === req.user.id,
      }))
      .sort((a, b) => b.totalActiveStreaks - a.totalActiveStreaks);

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Paginate
    const paginatedLeaderboard = leaderboard.slice(skip, skip + limit);
    const total = leaderboard.length;

    // Find current user's position
    const currentUserRank = leaderboard.findIndex((e) => e.id === req.user.id) + 1;

    res.json({
      leaderboard: paginatedLeaderboard,
      currentUserRank,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/social/cheers - Get cheers received by current user
router.get('/cheers', authenticate, paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [cheers, total] = await Promise.all([
      prisma.cheer.findMany({
        where: { receiverId: req.user.id },
        include: {
          giver: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          checkIn: {
            include: {
              habit: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cheer.count({ where: { receiverId: req.user.id } }),
    ]);

    res.json({
      cheers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
