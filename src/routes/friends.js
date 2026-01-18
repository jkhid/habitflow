const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uuidParam, paginationValidation } = require('../middleware/validators');

const router = express.Router();

// GET /api/friends - Get friends list
router.get('/', authenticate, paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: req.user.id },
          { addresseeId: req.user.id },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // Extract friend data (the other person in the friendship)
    const friends = friendships.map((f) => {
      const friend = f.requesterId === req.user.id ? f.addressee : f.requester;
      return {
        ...friend,
        friendshipId: f.id,
        friendsSince: f.updatedAt,
      };
    });

    const total = await prisma.friendship.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: req.user.id },
          { addresseeId: req.user.id },
        ],
      },
    });

    res.json({
      friends,
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

// GET /api/friends/requests - Get pending friend requests
router.get('/requests', authenticate, async (req, res, next) => {
  try {
    const [received, sent] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          addresseeId: req.user.id,
          status: 'PENDING',
        },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: {
          requesterId: req.user.id,
          status: 'PENDING',
        },
        include: {
          addressee: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      received: received.map((r) => ({
        id: r.id,
        user: r.requester,
        createdAt: r.createdAt,
      })),
      sent: sent.map((s) => ({
        id: s.id,
        user: s.addressee,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/friends/request/:userId - Send friend request
router.post('/request/:userId', authenticate, uuidParam('userId'), async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for existing friendship
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user.id, addresseeId: userId },
          { requesterId: userId, addresseeId: req.user.id },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'Already friends with this user' });
      }
      if (existingFriendship.status === 'PENDING') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
      // If declined, update to pending
      if (existingFriendship.status === 'DECLINED') {
        const updated = await prisma.friendship.update({
          where: { id: existingFriendship.id },
          data: {
            status: 'PENDING',
            requesterId: req.user.id,
            addresseeId: userId,
          },
        });
        return res.json({ message: 'Friend request sent', friendship: updated });
      }
    }

    // Create new friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: req.user.id,
        addresseeId: userId,
      },
      include: {
        addressee: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Friend request sent',
      friendship: {
        id: friendship.id,
        user: friendship.addressee,
        status: friendship.status,
        createdAt: friendship.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/friends/accept/:friendshipId - Accept friend request
router.post('/accept/:friendshipId', authenticate, uuidParam('friendshipId'), async (req, res, next) => {
  try {
    const { friendshipId } = req.params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        addresseeId: req.user.id,
        status: 'PENDING',
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    res.json({
      message: 'Friend request accepted',
      friend: updated.requester,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/friends/decline/:friendshipId - Decline friend request
router.post('/decline/:friendshipId', authenticate, uuidParam('friendshipId'), async (req, res, next) => {
  try {
    const { friendshipId } = req.params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        addresseeId: req.user.id,
        status: 'PENDING',
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'DECLINED' },
    });

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/friends/:friendshipId - Remove friend
router.delete('/:friendshipId', authenticate, uuidParam('friendshipId'), async (req, res, next) => {
  try {
    const { friendshipId } = req.params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        status: 'ACCEPTED',
        OR: [
          { requesterId: req.user.id },
          { addresseeId: req.user.id },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
