import { INTERNAL_SERVER_ERROR, OK } from '../../helpers/httpMessage/index.js';
import { findAllEmployeeQuestions, findAllManagerQuestions } from '../../helpers/question/index.js';

export const getManagerReviewQuestions = async() => {
  try {
    const questions = await findAllManagerQuestions();
    return OK(questions);
  } catch (e) {
    return INTERNAL_SERVER_ERROR(e.message);
  }
};

export const getEmployeeReviewQuestions = async() => {
  try {
    const questions = await findAllEmployeeQuestions();
    return OK(questions);
  } catch (e) {
    return INTERNAL_SERVER_ERROR(e.message);
  }
};
