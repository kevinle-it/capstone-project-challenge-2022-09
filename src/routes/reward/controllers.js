import { isEmployeeExist, redeemPoints } from '../../helpers/employee/index.js';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from '../../helpers/httpMessage/index.js';
import {
  deleteEmployeeRedeemedRewardRecord,
  findAllRewards,
  findRewardBy,
  recordEmployeeRedeemedReward,
} from '../../helpers/reward/index.js';

export const getRewards = async() => {
  try {
    const rewards = await findAllRewards();
    if (Array.isArray(rewards) && rewards.length > 0) {
      return OK(
        rewards.map(reward => ({
          rewardId: reward._id,
          rewardTitle: reward.title,
          rewardDescription: reward.description,
          rewardPointsRequired: reward.pointsRequired,
        })),
      );
    }
    return INTERNAL_SERVER_ERROR('Cannot get reward list');
  } catch (e) {
    return INTERNAL_SERVER_ERROR(e.message);
  }
};

export const redeemReward = async(employeeId, rewardId) => {
  try {
    const employee = await isEmployeeExist({ id: employeeId });
    if (!employee) {
      return BAD_REQUEST('Employee not found');
    }
    const reward = await findRewardBy(rewardId);
    if (!reward) {
      return BAD_REQUEST('Reward not found');
    }
    let remainingPoints = employee.numCollectedPoints - employee.numRedeemedPoints;
    if (reward.pointsRequired > remainingPoints) {
      return BAD_REQUEST('Not enough points to redeem reward');
    }

    const newEmployeeRedeemedReward = await recordEmployeeRedeemedReward({ employeeId, rewardId });
    if (newEmployeeRedeemedReward.acknowledged) {
      if (reward.pointsRequired === 0) {
        return OK({ remainingPoints });
      }
      const result = await redeemPoints({ employeeId, points: reward.pointsRequired });
      if (result &&
          result.acknowledged &&
          result.matchedCount === 1 &&
          result.modifiedCount === 1) {
        remainingPoints -= reward.pointsRequired;
        return OK({ remainingPoints });
      }
      await deleteEmployeeRedeemedRewardRecord(newEmployeeRedeemedReward.insertedId);
    }
    return INTERNAL_SERVER_ERROR('Something went wrong');
  } catch (e) {
    return INTERNAL_SERVER_ERROR(e.message);
  }
};
