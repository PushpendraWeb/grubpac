/**
 * @param {import('express').Response} res
 * @param {Record<string, unknown>} data
 * @param {string} message
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, data, message, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
}

/**
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=400]
 */
function sendError(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { sendSuccess, sendError };
