let socketServer = null;

function setSocketServer(io) {
  socketServer = io;
}

function userRoom(userId) {
  return `user:${String(userId)}`;
}

function notifyUser(userId, event, payload) {
  if (!socketServer || !userId || typeof event !== 'string') return;
  socketServer.to(userRoom(userId)).emit(event, payload);
}

module.exports = { setSocketServer, userRoom, notifyUser };
