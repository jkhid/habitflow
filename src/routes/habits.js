const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const {
  createHabitValidation,
  updateHabitValidation,
  checkInValidation,
  uuidParam,
  paginationValidation,
} = require('../middleware/validators');

const router = express.Router();

// Helper function to calculate streak
const calculateStreak = (checkIns) => {
  if (!checkIns.length) return 0;

  // Sort check-ins by date descending
  const sortedCheckIns = [...checkIns].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get the most recent check-in date
  const lastCheckInDate = new Date(sortedCheckIns[0].date);
  lastCheckInDate.setHours(0, 0, 0, 0);

  // If last check-in wasn't today or yesterday, streak is broken
  if (lastCheckInDate < yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = lastCheckInDate;

  for (let i = 1; i < sortedCheckIns.length; i++) {
    const checkInDate = new Date(sortedCheckIns[i].date);
    checkInDate.setHours(0, 0, 0, 0);

    const expectedPrevDate = new Date(currentDate);
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);

    if (checkInDate.getTime() === expectedPrevDate.getTime()) {
      streak++;
      currentDate = checkInDate;
    } else if (checkInDate.getTime() < expectedPrevDate.getTime()) {
      // Gap in streak, stop counting
      break;
    }
    // Skip same-day duplicates (shouldn't happen with unique constraint)
  }

  return streak;
};

// GET /api/habits - Get all habits for current user
router.get('/', authenticate, paginationValidation, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const activeOnly = req.query.active === 'true';

    const where = {
      userId: req.user.id,
      ...(activeOnly && { isActive: true }),
    };

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        include: {
          checkIns: {
            orderBy: { date: 'desc' },
            take: 7,
          },
          _count: {
            select: { checkIns: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.habit.count({ where }),
    ]);

    // Add check-in status for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habitsWithStatus = habits.map((habit) => {
      const todayCheckIn = habit.checkIns.find((ci) => {
        const ciDate = new Date(ci.date);
        ciDate.setHours(0, 0, 0, 0);
        return ciDate.getTime() === today.getTime();
      });

      return {
        ...habit,
        completedToday: !!todayCheckIn,
        todayCheckIn: todayCheckIn || null,
        totalCheckIns: habit._count.checkIns,
      };
    });

    res.json({
      habits: habitsWithStatus,
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

// GET /api/habits/:habitId - Get single habit with details
router.get('/:habitId', authenticate, uuidParam('habitId'), async (req, res, next) => {
  try {
    const { habitId } = req.params;

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: req.user.id,
      },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 30,
          include: {
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
        },
        _count: {
          select: { checkIns: true },
        },
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({
      ...habit,
      totalCheckIns: habit._count.checkIns,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/habits - Create new habit
router.post('/', authenticate, createHabitValidation, async (req, res, next) => {
  try {
    const { name, description, frequencyGoal } = req.body;

    const habit = await prisma.habit.create({
      data: {
        userId: req.user.id,
        name,
        description,
        frequencyGoal: frequencyGoal || 1,
      },
    });

    res.status(201).json(habit);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/habits/:habitId - Update habit
router.patch('/:habitId', authenticate, uuidParam('habitId'), updateHabitValidation, async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const { name, description, frequencyGoal, isActive } = req.body;

    // Verify ownership
    const existing = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(frequencyGoal !== undefined && { frequencyGoal }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(habit);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/habits/:habitId - Delete habit
router.delete('/:habitId', authenticate, uuidParam('habitId'), async (req, res, next) => {
  try {
    const { habitId } = req.params;

    // Verify ownership
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: req.user.id,
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    await prisma.habit.delete({
      where: { id: habitId },
    });

    res.json({ message: 'Habit deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/habits/:habitId/checkin - Check in for a habit
router.post('/:habitId/checkin', authenticate, uuidParam('habitId'), checkInValidation, async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const { date, note } = req.body;

    // Verify ownership
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: req.user.id,
      },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Use provided date or today
    const checkInDate = date ? new Date(date) : new Date();
    checkInDate.setHours(0, 0, 0, 0);

    // Prevent future check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate > today) {
      return res.status(400).json({ error: 'Cannot check in for future dates' });
    }

    // Check for existing check-in on this date
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        habitId,
        date: checkInDate,
      },
    });

    if (existingCheckIn) {
      return res.status(409).json({ error: 'Already checked in for this date' });
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        habitId,
        userId: req.user.id,
        date: checkInDate,
        note,
      },
    });

    // Recalculate streaks
    const allCheckIns = await prisma.checkIn.findMany({
      where: { habitId },
      orderBy: { date: 'desc' },
    });

    const currentStreak = calculateStreak(allCheckIns);
    const longestStreak = Math.max(currentStreak, habit.longestStreak);

    // Update habit streaks
    await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentStreak,
        longestStreak,
        lastCheckIn: checkInDate,
      },
    });

    res.status(201).json({
      checkIn,
      currentStreak,
      longestStreak,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/habits/:habitId/checkin/:checkInId - Remove check-in
router.delete('/:habitId/checkin/:checkInId', authenticate, uuidParam('habitId'), async (req, res, next) => {
  try {
    const { habitId, checkInId } = req.params;

    // Verify ownership
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id: checkInId,
        habitId,
        userId: req.user.id,
      },
    });

    if (!checkIn) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    await prisma.checkIn.delete({
      where: { id: checkInId },
    });

    // Recalculate streaks
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    const remainingCheckIns = await prisma.checkIn.findMany({
      where: { habitId },
      orderBy: { date: 'desc' },
    });

    const currentStreak = calculateStreak(remainingCheckIns);

    await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentStreak,
        lastCheckIn: remainingCheckIns[0]?.date || null,
      },
    });

    res.json({
      message: 'Check-in removed',
      currentStreak,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/habits/:habitId/checkins - Get check-in history
router.get('/:habitId/checkins', authenticate, uuidParam('habitId'), paginationValidation, async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Verify ownership
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: req.user.id,
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where: { habitId },
        include: {
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
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.checkIn.count({ where: { habitId } }),
    ]);

    res.json({
      checkIns,
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
