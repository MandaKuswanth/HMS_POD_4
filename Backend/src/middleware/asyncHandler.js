/**
 * @param {Function} fn - The asynchronous route handler function
 * @returns {Function} - Returns an express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;