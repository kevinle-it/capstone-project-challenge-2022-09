import { employees } from '../../config/db.js';
import { convertToMongoDbId } from '../index.js';
import { ROLE_ID } from './constants.js';

export const isEmployeeExist = async({ id, email }) => {
  // Check if employee already exist
  // Validate if employee exist in our database
  if (!(id || email)) {
    return false;
  }
  const _id = convertToMongoDbId(id);

  // return null if not found, else return employee object
  return await employees.findOne({
    ...((_id && { _id }) || (email && { email })),
  });
};

export const isManager = async({ id, email }) => {
  // Check if employee already exist
  // Validate if employee is a manager in our database
  if (!(id || email)) {
    return false;
  }
  const _id = convertToMongoDbId(id);

  const foundManager = await employees.findOne({
    ...((_id && { _id }) || (email && { email })),
    roleId: 2,
  });
  return !!foundManager;
};

export const createNewEmployee = async({
                                         firstName,
                                         lastName,
                                         email,
                                         encryptedPassword,
                                         profileSummary,
                                         imgUrl,
                                         roleId,
                                         managerId,
                                         selfOverallRating,
                                         avgPeersOverallRating,
                                         managerOverallRating,
                                         hasNominated,
                                         numVotes,
                                         numCollectedPoints,
                                         numRedeemedPoints,
                                         numCollectedMonthlyRewards,
                                         numRedeemedMonthlyRewards,
                                       }) => {
  // Create employee in our database
  return await employees.insertOne({
    firstName,
    lastName,
    email: email.toLowerCase(), // sanitize: convert email to lowercase
    encryptedPassword,
    ...profileSummary && { profileSummary },
    ...imgUrl && { imgUrl },
    roleId,
    ...roleId === ROLE_ID.EMPLOYEE && { managerId: convertToMongoDbId(managerId) },
    ...(selfOverallRating && { selfOverallRating }) || { selfOverallRating: 0 },
    ...(avgPeersOverallRating && { avgPeersOverallRating }) || { avgPeersOverallRating: 0 },
    ...roleId === ROLE_ID.EMPLOYEE && ((managerOverallRating && { managerOverallRating }) || { managerOverallRating: 0 }),
    ...(hasNominated && { hasNominated }) || { hasNominated: false },
    ...(numVotes && { numVotes }) || { numVotes: 0 },
    ...(numCollectedPoints && { numCollectedPoints }) || { numCollectedPoints: 0 },
    ...(numRedeemedPoints && { numRedeemedPoints }) || { numRedeemedPoints: 0 },
    ...(numCollectedMonthlyRewards && { numCollectedMonthlyRewards }) || { numCollectedMonthlyRewards: 0 },
    ...(numRedeemedMonthlyRewards && { numRedeemedMonthlyRewards }) || { numRedeemedMonthlyRewards: 0 },
  });
};

export const findAllManagers = async() => {
  return await employees
    .find({ roleId: 2 })
    .project({ encryptedPassword: 0 })  // exclude a field
    .toArray();
};

export const findAllEmployees = async() => {
  return await employees
    .find()
    .project({ encryptedPassword: 0 })
    .toArray();
};

export const findAllPeersOf = async(employeeId) => {
  // return an array including all team members and
  // excluding him/herself and the team manager
  return await employees.aggregate([
    { $match: { _id: convertToMongoDbId(employeeId) } },
    {
      $lookup: {
        from: 'Employees',
        let: {
          id: {
            $cond: {
              if: { $eq: ['$roleId', ROLE_ID.EMPLOYEE] },
              then: '$managerId',
              else: '$_id', // if employeeId's role is manager
            },
          },
        },
        pipeline: [{
          $match: {
            $expr: {
              $and: [
                { $eq: ['$managerId', '$$id'] },
                { $ne: ['$_id', convertToMongoDbId(employeeId)] },
              ],
            },
          },
        }, {
          // hide sensitive data before proceeding to the next stage
          $project: { encryptedPassword: 0 },
        }],
        as: 'teammates', // produce result as an array named teammates
      },
    },
    { $unwind: '$teammates' },
    { $replaceRoot: { newRoot: '$teammates' } },
  ]).toArray();
};

export const findAllEmployeesUnderSameTeamWith = async(employeeId) => {
  // return an array including all team members and the manager
  return await employees.aggregate([
    { $match: { _id: convertToMongoDbId(employeeId) } },
    {
      $lookup: {
        from: 'Employees',
        let: {
          id: {
            $cond: {
              if: { $eq: ['$roleId', ROLE_ID.EMPLOYEE] },
              then: '$managerId',
              else: '$_id', // if employeeId's role is manager
            },
          },
        },
        pipeline: [{
          $match: {
            $expr: {
              $or: [
                { $eq: ['$managerId', '$$id'] },
                { $eq: ['$_id', '$$id'] },
              ],
            },
          },
        }, {
          // hide sensitive data before proceeding to the next stage
          $project: { encryptedPassword: 0 },
        }],
        as: 'teammates', // produce result as an array named teammates
      },
    },
    { $unwind: '$teammates' },
    { $replaceRoot: { newRoot: '$teammates' } },
  ]).toArray();
};

export const calcAvgOverallRating = ({
                                       roleId,
                                       selfOverallRating,
                                       avgPeersOverallRating,
                                       managerOverallRating,
                                     }) => {
  switch (roleId) {
    case ROLE_ID.EMPLOYEE:
      return selfOverallRating * 0.2 + avgPeersOverallRating * 0.3 + managerOverallRating * 0.5;
    case ROLE_ID.MANAGER:
      return selfOverallRating * 0.4 + avgPeersOverallRating * 0.6;
    default:
      return 0;
  }
};

export const addPoints = async({ employeeId, avgOverallRating }) => {
  let result;
  if (avgOverallRating > 4) {
    result = await employees.findOneAndUpdate(
      { _id: convertToMongoDbId(employeeId) },
      { $inc: { numCollectedPoints: 2 } },
      { returnDocument: 'after' },
    );
  } else if (avgOverallRating > 3) {
    result = await employees.findOneAndUpdate(
      { _id: convertToMongoDbId(employeeId) },
      { $inc: { numCollectedPoints: 1 } },
      { returnDocument: 'after' },
    );
  }
  return result &&
         result.acknowledged &&
         result.matchedCount === 1 &&
         result.modifiedCount === 1 &&
         result;
};

export const redeemPoints = async({ employeeId, points }) => {
  return await employees.updateOne(
    { _id: convertToMongoDbId(employeeId) },
    { $inc: { numRedeemedPoints: points } },
  );
};
