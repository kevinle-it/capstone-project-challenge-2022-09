import moment from 'moment';
import { employeeRedeemedRewards, rewards } from '../../config/db.js';
import { convertToMongoDbId } from '../index.js';

export const findAllRewards = async() => {
  return await rewards
    .find()
    .toArray();
};

export const findRewardBy = async(id) => {
  return await rewards.findOne({
    _id: convertToMongoDbId(id),
  });
};

export const recordEmployeeRedeemedReward = async({ employeeId, rewardId }) => {
  return await employeeRedeemedRewards.insertOne({
    employeeId: convertToMongoDbId(employeeId),
    rewardId: convertToMongoDbId(rewardId),
    date: new Date(moment.utc().toISOString()),
  });
};

export const deleteEmployeeRedeemedRewardRecord = async(employeeRedeemedRewardsId) => {
  return await employeeRedeemedRewards.deleteOne({
    _id: convertToMongoDbId(employeeRedeemedRewardsId),
  });
};
