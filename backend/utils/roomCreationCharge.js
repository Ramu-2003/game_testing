const User = require('../models/User');

const ROOM_CREATION_COST = 1;
const LEGACY_G_THUNDER_BALANCE = 20;

async function chargeRoomCreation(userId, userModel = User) {
  if (!userId) return { success: false, reason: 'USER_NOT_FOUND' };

  // Older account documents may not have persisted the schema default yet.
  await userModel.updateOne(
    { _id: userId, $or: [{ gThunderPoints: { $exists: false } }, { gThunderPoints: null }] },
    { $set: { gThunderPoints: LEGACY_G_THUNDER_BALANCE } }
  );

  // The balance predicate makes simultaneous room creations safe from overspending.
  const updatedUser = await userModel.findOneAndUpdate(
    { _id: userId, gThunderPoints: { $gte: ROOM_CREATION_COST } },
    { $inc: { gThunderPoints: -ROOM_CREATION_COST } },
    { new: true }
  );

  if (!updatedUser) return { success: false, reason: 'INSUFFICIENT_GTHUNDER' };

  return {
    success: true,
    charged: ROOM_CREATION_COST,
    balance: updatedUser.gThunderPoints,
  };
}

async function refundRoomCreation(userId, userModel = User) {
  if (!userId) return;
  await userModel.updateOne(
    { _id: userId },
    { $inc: { gThunderPoints: ROOM_CREATION_COST } }
  );
}

module.exports = { ROOM_CREATION_COST, chargeRoomCreation, refundRoomCreation };
