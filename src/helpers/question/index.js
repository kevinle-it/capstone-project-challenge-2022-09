import { questions } from '../../config/db.js';

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
