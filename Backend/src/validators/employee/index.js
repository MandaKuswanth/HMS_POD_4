const { body } = require('express-validator');

const createEmployeeValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Valid email is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('designation').trim().notEmpty().withMessage('Designation is required'),
    body('joiningDate').optional().isISO8601().withMessage('Valid joining date is required')
];

const selfRegisterValidation = [
    ...createEmployeeValidation,
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const updateEmployeeValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().trim().matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    body('email').optional().trim().isEmail().withMessage('Valid email is required'),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
    body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty')
];

module.exports = {
    createEmployeeValidation,
    selfRegisterValidation,
    updateEmployeeValidation
};
