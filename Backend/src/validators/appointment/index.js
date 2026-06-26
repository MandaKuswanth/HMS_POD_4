const { body } = require('express-validator');

const bookAppointmentValidation = [
    body('doctorId').trim().notEmpty().withMessage('Doctor ID is required'),
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Valid date is required'),
    body('timeSlot').trim().notEmpty().withMessage('Time slot is required'),
    body('symptoms').optional().trim(),
    body('reasonForVisit').optional().trim()
];

const updateAppointmentStatusValidation = [
    body('status').trim().notEmpty().withMessage('Status is required').isIn(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).withMessage('Invalid status'),
    body('cancellationReason').optional().trim()
];

module.exports = {
    bookAppointmentValidation,
    updateAppointmentStatusValidation
};
