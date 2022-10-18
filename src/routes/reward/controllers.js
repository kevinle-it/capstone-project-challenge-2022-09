import { INTERNAL_SERVER_ERROR, OK } from '../../helpers/httpMessage/index.js';
import { findAllRewards } from '../../helpers/reward/index.js';

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
        }))
      );
    }
    return INTERNAL_SERVER_ERROR('Cannot get reward list');
  } catch (e) {
    return INTERNAL_SERVER_ERROR(e.message);
  }
};
