import { questions } from '../../config/db.js';
import { convertToMongoDbId } from '../index.js';

export const findAllSelfReviewQuestions = async() => {
  return await questions
    .find({ questionTypeId: 0 })
    .toArray();
};

export const findAllManagerQuestions = async() => {
  return await questions
    .find({ questionTypeId: 1 })
    .toArray();
};

export const findAllEmployeeQuestions = async() => {
  return await questions
    .find({ questionTypeId: 1 })
    .toArray();
};

export const findQuestionsByIds = async(ids) => {
  return await questions
    .find({ _id: { $in: ids.map(id => convertToMongoDbId(id)) } })
    .toArray();
};

export const isAllQuestionsIncluded = async(reviewAnswerArray) => {
  const questionTypeId = reviewAnswerArray?.at(0)?.questionTypeId;
  const questionArrays = await questions
    .find({ questionTypeId })
    .toArray();

  let result = true;
  questionArrays.forEach(({ _id }) => {
    if (reviewAnswerArray.findIndex(({ questionId }) => questionId === _id.toString()) === -1) {
      result = false;
    }
  });
  return result;
};
