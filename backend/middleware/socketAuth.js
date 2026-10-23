const jwt = require('jsonwebtoken');

function authenticateSocket(socket, next) {
  const token = socket.handshake?.auth?.token;
  if (!token || !process.env.JWT_SECRET) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) return next(new Error('Invalid authentication token'));
    socket.data.userId = String(decoded.id);
    return next();
  } catch {
    return next(new Error('Invalid authentication token'));
  }
}

function resolveSocketUserId(socket, requestedUserId) {
  const authenticatedUserId = socket.data?.userId;
  if (!authenticatedUserId || requestedUserId === undefined || requestedUserId === null) return null;
  return String(authenticatedUserId) === String(requestedUserId) ? String(authenticatedUserId) : null;
}

module.exports = { authenticateSocket, resolveSocketUserId };
