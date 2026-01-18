const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Auth validators
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validate,
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

// Profile validators
const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
  validate,
];

// Habit validators
const createHabitValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Habit name is required (max 100 characters)'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Description must be max 500 characters'),
  body('frequencyGoal')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Frequency goal must be between 1 and 7 times per week'),
  validate,
];

const updateHabitValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Habit name must be max 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Description must be max 500 characters'),
  body('frequencyGoal')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Frequency goal must be between 1 and 7'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  validate,
];

// Check-in validators
const checkInValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('note')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Note must be max 500 characters'),
  validate,
];

// Cheer validators
const cheerValidation = [
  body('emoji')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be 1-10 characters'),
  validate,
];

// UUID param validator
const uuidParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  validate,
];

// Pagination validators
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

module.exports = {
  validate,
  signupValidation,
  loginValidation,
  updateProfileValidation,
  createHabitValidation,
  updateHabitValidation,
  checkInValidation,
  cheerValidation,
  uuidParam,
  paginationValidation,
};
