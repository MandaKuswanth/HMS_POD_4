const { body } = require('express-validator');

const registerPatientValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').trim().notEmpty().withMessage('Phone is required').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required').isISO8601().withMessage('Valid date is required'),
    body('gender').notEmpty().withMessage('Gender is required').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
    body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('address').notEmpty().withMessage('Address is required')
];

module.exports = {
    registerPatientValidation
};
