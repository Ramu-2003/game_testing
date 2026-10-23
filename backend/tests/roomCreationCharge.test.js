const test = require('node:test');
const assert = require('node:assert/strict');
const { ROOM_CREATION_COST, chargeRoomCreation } = require('../utils/roomCreationCharge');

function createUserModel(initialBalance) {
  let balance = initialBalance;
  return {
    get balance() { return balance; },
    async updateOne(filter, update) {
      if (filter.$or && balance == null) balance = update.$set.gThunderPoints;
      else if (update.$inc?.gThunderPoints) balance += update.$inc.gThunderPoints;
      return { acknowledged: true };
    },
    async findOneAndUpdate(filter, update) {
      if (balance == null || balance < filter.gThunderPoints.$gte) return null;
      balance += update.$inc.gThunderPoints;
      return { gThunderPoints: balance };
    },
  };
}

test('room creation costs exactly one G-THUNDER and returns the new balance', async () => {
  const userModel = createUserModel(3);
  const result = await chargeRoomCreation('player-1', userModel);

  assert.equal(ROOM_CREATION_COST, 1);
  assert.deepEqual(result, { success: true, charged: 1, balance: 2 });
  assert.equal(userModel.balance, 2);
});

test('room creation is rejected without deducting when the balance is below one', async () => {
  const userModel = createUserModel(0);
  const result = await chargeRoomCreation('player-1', userModel);

  assert.deepEqual(result, { success: false, reason: 'INSUFFICIENT_GTHUNDER' });
  assert.equal(userModel.balance, 0);
});

test('simultaneous room creations cannot spend the same last G-THUNDER twice', async () => {
  const userModel = createUserModel(1);
  const results = await Promise.all([
    chargeRoomCreation('player-1', userModel),
    chargeRoomCreation('player-1', userModel),
  ]);

  assert.equal(results.filter(result => result.success).length, 1);
  assert.equal(results.filter(result => !result.success).length, 1);
  assert.equal(userModel.balance, 0);
});

test('legacy users missing a persisted balance receive the schema default before the fee', async () => {
  const userModel = createUserModel(null);
  const result = await chargeRoomCreation('player-1', userModel);

  assert.equal(result.success, true);
  assert.equal(result.balance, 19);
});
