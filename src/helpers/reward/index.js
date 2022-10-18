import { rewards } from '../../config/db.js';

export const findAllRewards = async() => {
  return await rewards
    .find()
    .toArray();
};
