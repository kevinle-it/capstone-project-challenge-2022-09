import { findAllEmployeeQuestions, findAllManagerQuestions } from '../../helpers/question/index.js';

export const getManagerReviewQuestions = async() => {
  try {
    const questions = await findAllManagerQuestions();
    return {
      status: 200,
      data: questions,
    };
  } catch (e) {
    return {
      status: 500,
      data: {
        message: e.message,
      },
    };
  }
};

export const getEmployeeReviewQuestions = async() => {
  try {
    const questions = await findAllEmployeeQuestions();
    return {
      status: 200,
      data: questions,
    };
  } catch (e) {
    return {
      status: 500,
      data: {
        message: e.message,
      },
    };
  }
};
