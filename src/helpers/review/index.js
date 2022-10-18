import moment from 'moment';
import { employees, reviewAnswers, reviews } from '../../config/db.js';
import { ROLE_ID } from '../employee/constants.js';
import { findAllPeersOf, isEmployeeExist } from '../employee/index.js';
import { convertToMongoDbId } from '../index.js';
import { ANSWER_TYPE_ID } from '../question/constants.js';

const getFirstWeekdayUtcTimeOfCurrentWeek = () =>
  new Date(moment.utc().isoWeekday(1).startOf('day').toISOString());
const getLastWeekdayUtcTimeOfCurrentWeek = () =>
  new Date(moment.utc().isoWeekday(7).endOf('day').toISOString());

export const isReviewExist = async({ fromEmployeeId, toEmployeeId }) => {
  const review = await reviews.findOne({ fromEmployeeId, toEmployeeId });
  return !!review;
};

export const isValidAnswer = ({ answerTypeId, answer }) => {
  switch (answerTypeId) {
    case ANSWER_TYPE_ID.RATING_1_TO_5:
      return answer >= 1 && answer <= 5;
    case ANSWER_TYPE_ID.YES_OR_NO:
      return answer === 1 || answer === 0;
    default:
      return false;
  }
};

export const createNewReview = async({
                                       fromEmployeeId,
                                       toEmployeeId,
                                       overallRating,
                                       date,
                                     }) => {
  return await reviews.insertOne({
    fromEmployeeId: convertToMongoDbId(fromEmployeeId),
    toEmployeeId: convertToMongoDbId(toEmployeeId),
    overallRating,
    date,
  });
};

export const deleteReview = async(id) => {
  return await reviews.deleteOne({
    _id: convertToMongoDbId(id),
  });
};

export const recordAllQuestionsAndAnswers = async(reviewAnswerArray) => {
  let shouldInsert = true;
  const docs = reviewAnswerArray.map(({ reviewId, questionId, ...rest }) => {
    const _reviewId = convertToMongoDbId(reviewId);
    const _questionId = convertToMongoDbId(questionId);

    if (!(_reviewId && _questionId)) {
      shouldInsert = false;
    }
    return {
      reviewId: _reviewId,
      questionId: _questionId,
      ...rest,
    };
  });
  if (shouldInsert) {
    await reviewAnswers.insertMany(docs);
    return true;
  }
  return false;
};

export const updateSelfOverallRating = async({ employeeId, overallRating }) => {
  const result = await employees.updateOne(
    { _id: convertToMongoDbId(employeeId) },
    { $set: { selfOverallRating: overallRating } },
  );
  return result &&
         result.acknowledged &&
         // remove below line because if the field is already set with same value, updateOne won't modify that field
         // result.modifiedCount === 1 &&
         result.matchedCount === 1;
};

export const updateAvgPeersOverallRating = async({ employeeId }) => {
  const reviewArray = await reviews.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $ne: ['$fromEmployeeId', convertToMongoDbId(employeeId)] },
            { $eq: ['$toEmployeeId', convertToMongoDbId(employeeId)] },
            { $gte: ['$date', getFirstWeekdayUtcTimeOfCurrentWeek()] },
            { $lte: ['$date', getLastWeekdayUtcTimeOfCurrentWeek()] },
          ],
        },
      },
    },
    { $addFields: { reviewId: '$_id' } },
    // remove _id field of Reviews collection to prevent duplication on replaceRoot stage below
    // because Employees collection also has _id field
    { $project: { _id: 0 } },
    {
      $lookup: {
        from: 'Employees',
        localField: 'fromEmployeeId', // Reviews collection's field
        foreignField: '_id',  // Employees collection's field
        pipeline: [{
          $project: { encryptedPassword: 0 }, // hide sensitive data before proceeding to the next stage
        }],
        as: 'fromEmployee', // produce result as an array named fromEmployee
      },
    },
    // lookup stage above will join Reviews and Employees collections and return fromEmployee array
    // in the join result, so replaceRoot expression below will extract the first and only element in that array
    // out to $$ROOT (current document object). It means simply move the element to the outside of the array
    { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$fromEmployee', 0] }, '$$ROOT'] } } },
    // fromEmployeeId must have role Employee
    // Only support Employee reviews another Employee or Employee reviews Manager as Peer Review type
    { $match: { $expr: { $eq: ['$roleId', ROLE_ID.EMPLOYEE] } } },
    {
      // hide all fields of Employees collection except the fields of Reviews collection
      $project: {
        _id: 0,
        reviewId: 1,
        fromEmployeeId: 1,
        toEmployeeId: 1,
        overallRating: 1,
        date: 1,
      },
    },
    {
      $group: {
        _id: '$toEmployeeId',
        avgPeersOverallRating: {
          $avg: '$overallRating',
        },
      },
    },
  ]).toArray();

  if (Array.isArray(reviewArray) && reviewArray.length > 0) {
    const avgPeersOverallRating = reviewArray[0]?.avgPeersOverallRating;
    if (avgPeersOverallRating) {
      const result = await employees.updateOne(
        { _id: convertToMongoDbId(employeeId) },
        { $set: { avgPeersOverallRating } },
      );
      return result &&
             result.acknowledged &&
             result.matchedCount === 1 &&
             // remove below line because if the field is already set with same value, updateOne won't modify that field
             // result.modifiedCount === 1 &&
             avgPeersOverallRating;
    }
  }
  return false;
};

export const updateManagerOverallRating = async({ employeeId, overallRating }) => {
  const result = await employees.updateOne(
    { _id: convertToMongoDbId(employeeId) },
    { $set: { managerOverallRating: overallRating } },
  );
  return result &&
         result.acknowledged &&
         // remove below line because if the field is already set with same value, updateOne won't modify that field
         // result.modifiedCount === 1 &&
         result.matchedCount === 1;
};

export const hasDoneSelfReview = async(employeeId) => {
  const foundReview = await reviews.findOne({
    fromEmployeeId: convertToMongoDbId(employeeId),
    toEmployeeId: convertToMongoDbId(employeeId),
  });
  return !!foundReview;
};

export const hasGotAllPeerReviews = async(employeeId) => {
  if (!await isEmployeeExist({ id: employeeId })) {
    return false;
  }
  const peers = await findAllPeersOf(employeeId);
  if (Array.isArray(peers) && peers.length > 0) {
    const reviewArray = await reviews.aggregate([
      {
        $match: {
          fromEmployeeId: {
            $in: peers.map(({ _id }) => _id),
          },
          toEmployeeId: convertToMongoDbId(employeeId),
          date: {
            $gte: getFirstWeekdayUtcTimeOfCurrentWeek(),
            $lte: getLastWeekdayUtcTimeOfCurrentWeek(),
          },
        },
      },
    ]).toArray();

    if (Array.isArray(reviewArray) &&
        reviewArray.length > 0 &&
        peers.length === reviewArray.length) {
      return true;
    }
  }
  return false;
};

export const hasGotManagerReview = async(employeeId) => {
  const foundEmployee = await isEmployeeExist({ id: employeeId });
  if (foundEmployee?.roleId === ROLE_ID.MANAGER) {
    return false;
  }
  const foundReview = await reviews.findOne({
    fromEmployeeId: foundEmployee.managerId,
    toEmployeeId: convertToMongoDbId(employeeId),
  });
  return !!foundReview;
};
