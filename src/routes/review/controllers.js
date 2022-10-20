import moment from 'moment';
import { ROLE_ID } from '../../helpers/employee/constants.js';
import {
  addPoints,
  calcAvgOverallRating,
  findAllEmployeesUnderSameTeamWith,
  isEmployeeExist,
} from '../../helpers/employee/index.js';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from '../../helpers/httpMessage/index.js';
import { QUESTION_TYPE_ID } from '../../helpers/question/constants.js';
import { findQuestionsByIds, isAllQuestionsIncluded } from '../../helpers/question/index.js';
import { REVIEW_TYPE } from '../../helpers/review/constants.js';
import {
  createNewReview,
  deleteReview,
  getAllManagerReviewQuestionAndAnswerSet,
  getAllPeerReviewQuestionAndAnswerSet,
  getAllSelfReviewQuestionAndAnswerSet,
  hasDoneSelfReview,
  hasGotAllPeerReviews,
  hasGotManagerReview,
  isReviewExist,
  isValidAnswer,
  recordAllQuestionsAndAnswers,
  updateAvgPeersOverallRating,
  updateManagerOverallRating,
  updateSelfOverallRating,
} from '../../helpers/review/index.js';

export const review = async({
                              fromEmployeeId,
                              toEmployeeId,
                              questionAnswerArray,
                              overallRating,
                            }) => {
  try {
    const teammates = await findAllEmployeesUnderSameTeamWith(toEmployeeId);
    if (teammates.findIndex(emp => emp._id.toString() === fromEmployeeId.toString()) === -1) {
      return BAD_REQUEST('Invalid review request. Employees are not teammates.');
    }

    if (await isReviewExist({ fromEmployeeId, toEmployeeId })) {
      return BAD_REQUEST('Review already exists');
    }

    const fromEmployee = await isEmployeeExist({ id: fromEmployeeId });
    const toEmployee = await isEmployeeExist({ id: toEmployeeId });
    if (!(fromEmployee && toEmployee)) {
      return BAD_REQUEST('Employee(s) not found');
    }

    if (!Array.isArray(questionAnswerArray) || questionAnswerArray.length === 0) {
      return BAD_REQUEST('Missing question & answer array');
    }
    if (questionAnswerArray.some(
      ({ answer }) =>
        answer == null ||
        answer?.toString()?.length === 0,
    )) {
      return BAD_REQUEST('Missing some question answers');
    }
    if (!overallRating) {
      return BAD_REQUEST('Missing overall rating');
    }

    const questionArray = await findQuestionsByIds(
      questionAnswerArray.map(({ quesId }) => quesId),
    );
    const reviewAnswerArray = questionArray?.map(({
                                                    _id,
                                                    question,
                                                    questionTypeId,
                                                    answerTypeId,
                                                  },
                                                  index) =>
      ({
        questionId: _id.toString(),
        question,
        questionTypeId,
        answerTypeId,
        answer: questionAnswerArray[index]?.answer,
      }));

    const questionTypeId = reviewAnswerArray?.at(0)?.questionTypeId;
    if (typeof questionTypeId !== 'number' ||
        !Object.values(QUESTION_TYPE_ID).includes(questionTypeId)) {
      return BAD_REQUEST('Question type is undefined');
    }
    if (!reviewAnswerArray.every(({ questionTypeId: qTypeId }) => qTypeId === questionTypeId)) {
      return BAD_REQUEST('Inconsistent question type');
    }
    if (!await isAllQuestionsIncluded(reviewAnswerArray)) {
      return BAD_REQUEST('Missing some questions for current review type');
    }
    // Check if every answer is valid and match its type
    let invalidAnswerIdx;
    if (
      !reviewAnswerArray.every(
        ({ answerTypeId, answer }, index) => {
          if (isValidAnswer({ answerTypeId, answer })) {
            return true;
          }
          invalidAnswerIdx = index;
          return false;
        },
      )
    ) {
      const questionId = reviewAnswerArray?.at(invalidAnswerIdx)?.questionId;
      const question = reviewAnswerArray?.at(invalidAnswerIdx)?.question;
      const answerTypeId = reviewAnswerArray?.at(invalidAnswerIdx)?.answerTypeId;
      const answer = reviewAnswerArray?.at(invalidAnswerIdx)?.answer;

      return BAD_REQUEST(`Invalid answer: ${answer} of answer type: ${answerTypeId}
       for question: ${question} with id: ${questionId}`);
    }

    const newReview = await createNewReview({
      fromEmployeeId,
      toEmployeeId,
      overallRating,
      date: new Date(moment.utc().toISOString()),
    });
    if (newReview.acknowledged) {
      // Check employee roles to determine review type to update overall ratings of toEmployee later below
      const fromEmployeeRole = fromEmployee.roleId;
      const toEmployeeRole = toEmployee.roleId;
      let reviewType;
      switch (fromEmployeeRole) {
        case ROLE_ID.EMPLOYEE:
          switch (toEmployeeRole) {
            case ROLE_ID.EMPLOYEE:
              if (fromEmployeeId === toEmployeeId) {  // employee's self-review
                reviewType = REVIEW_TYPE.SELF.EMPLOYEE;
              } else {  // employee's peer review
                reviewType = REVIEW_TYPE.PEER;
              }
              break;
            case ROLE_ID.MANAGER:
              reviewType = REVIEW_TYPE.EMPLOYEE_TO_MANAGER;
              break;
            default:
              return BAD_REQUEST('Receiver employee\'s role is not a manager or employee');
          }
          break;
        case ROLE_ID.MANAGER:
          switch (toEmployeeRole) {
            case ROLE_ID.EMPLOYEE:
              reviewType = REVIEW_TYPE.MANAGER_TO_EMPLOYEE;
              break;
            case ROLE_ID.MANAGER:
              if (fromEmployeeId !== toEmployeeId) {
                return BAD_REQUEST('Unsupported review type between managers');
              }
              reviewType = REVIEW_TYPE.SELF.MANAGER;
              break;
            default:
              return BAD_REQUEST('Receiver employee\'s role is not a manager or employee');
          }
          break;
        default:
          return BAD_REQUEST('Requested employee\'s role is not a manager or employee');
      }

      switch (reviewType) {
        case REVIEW_TYPE.SELF.EMPLOYEE:
        case REVIEW_TYPE.SELF.MANAGER:
          if (questionTypeId !== QUESTION_TYPE_ID.SELF_REVIEW) {
            await deleteReview(newReview.insertedId.toString());
            return BAD_REQUEST('Question type and employee role do not match');
          }
          if (reviewType === REVIEW_TYPE.SELF.EMPLOYEE) {
            await doEmployeeSelfReview({ toEmployee, overallRating });
          } else {
            await doManagerSelfReview({ toEmployee, overallRating });
          }
          break;
        case REVIEW_TYPE.PEER:
        case REVIEW_TYPE.EMPLOYEE_TO_MANAGER:
        case REVIEW_TYPE.MANAGER_TO_EMPLOYEE:
          if (questionTypeId !== QUESTION_TYPE_ID.MANAGER_EMPLOYEE_REVIEW) {
            await deleteReview(newReview.insertedId.toString());
            return BAD_REQUEST('Question type and employee role do not match');
          }
          if (reviewType === REVIEW_TYPE.PEER) {
            await doEmployeePeerReview({ toEmployee });
          } else if (reviewType === REVIEW_TYPE.EMPLOYEE_TO_MANAGER) {
            await doEmployeeReviewManager({ toEmployee });
          } else {
            await doManagerReviewEmployee({ toEmployee, overallRating });
          }
          break;
        default:
          break;
      }

      const docs = reviewAnswerArray.map(({ questionId, answer }) => ({
        reviewId: newReview.insertedId.toString(),
        questionId,
        answer,
      }));
      const isRecorded = await recordAllQuestionsAndAnswers(docs);

      if (!isRecorded) {
        await deleteReview(newReview.insertedId.toString());
        return BAD_REQUEST('Questions and Answers array cannot be recorded');
      }
    }
    return OK();
  } catch (e) {
    return INTERNAL_SERVER_ERROR(e.message);
  }
};

const doEmployeeSelfReview = async({ toEmployee, overallRating }) => {
  const { _id, roleId: toEmployeeRole } = toEmployee;
  const toEmployeeId = _id.toString();

  await updateSelfOverallRating({ employeeId: toEmployeeId, overallRating });

  // Check if employee has got all other review types to calculate avgOverallRating
  if (await hasGotAllPeerReviews(toEmployeeId) &&
      await hasGotManagerReview(toEmployeeId)) {
    const { avgPeersOverallRating, managerOverallRating } = toEmployee;

    if (avgPeersOverallRating != null &&
        avgPeersOverallRating > 0 &&
        managerOverallRating != null &&
        managerOverallRating > 0) {
      const avgOverallRating = calcAvgOverallRating({
        roleId: toEmployeeRole,
        selfOverallRating: overallRating,
        avgPeersOverallRating,
        managerOverallRating,
      });
      await addPoints({ employeeId: toEmployeeId, avgOverallRating });
    }
  }
};

const doEmployeePeerReview = async({ toEmployee }) => {
  const { _id, roleId: toEmployeeRole } = toEmployee;
  const toEmployeeId = _id.toString();

  const avgPeersOverallRating = await updateAvgPeersOverallRating({ employeeId: toEmployeeId });

  // Check if employee has got all other review types to calculate avgOverallRating
  if (await hasDoneSelfReview(toEmployeeId) &&
      await hasGotAllPeerReviews(toEmployeeId) &&
      await hasGotManagerReview(toEmployeeId)) {
    const { selfOverallRating, managerOverallRating } = toEmployee;

    if (selfOverallRating != null &&
        selfOverallRating > 0 &&
        avgPeersOverallRating != null &&
        avgPeersOverallRating > 0 &&
        managerOverallRating != null &&
        managerOverallRating > 0) {
      const avgOverallRating = calcAvgOverallRating({
        roleId: toEmployeeRole,
        selfOverallRating,
        avgPeersOverallRating,
        managerOverallRating,
      });
      await addPoints({ employeeId: toEmployeeId, avgOverallRating });
    }
  }
};

const doEmployeeReviewManager = async({ toEmployee }) => {
  const { _id, roleId: toEmployeeRole } = toEmployee;
  const toEmployeeId = _id.toString();

  // Employee reviews manager (deemed peer review type)
  const avgPeersOverallRating = await updateAvgPeersOverallRating({ employeeId: toEmployeeId });

  // Check if manager has got all other review types to calculate avgOverallRating
  if (await hasDoneSelfReview(toEmployeeId) &&
      await hasGotAllPeerReviews(toEmployeeId)) {
    const { selfOverallRating } = toEmployee;

    if (selfOverallRating != null &&
        selfOverallRating > 0 &&
        avgPeersOverallRating != null &&
        avgPeersOverallRating > 0) {
      const avgOverallRating = calcAvgOverallRating({
        roleId: toEmployeeRole,
        selfOverallRating,
        avgPeersOverallRating,
      });
      await addPoints({ employeeId: toEmployeeId, avgOverallRating });
    }
  }
};

const doManagerReviewEmployee = async({ toEmployee, overallRating }) => {
  const { _id, roleId: toEmployeeRole } = toEmployee;
  const toEmployeeId = _id.toString();

  // Manager reviews employee
  await updateManagerOverallRating({ employeeId: toEmployeeId, overallRating });

  // Check if manager has got all other review types to calculate avgOverallRating
  if (await hasDoneSelfReview(toEmployeeId) &&
      await hasGotAllPeerReviews(toEmployeeId)) {
    const { selfOverallRating, avgPeersOverallRating } = toEmployee;

    if (selfOverallRating != null &&
        selfOverallRating > 0 &&
        avgPeersOverallRating != null &&
        avgPeersOverallRating > 0) {
      const avgOverallRating = calcAvgOverallRating({
        roleId: toEmployeeRole,
        selfOverallRating,
        avgPeersOverallRating,
        managerOverallRating: overallRating,
      });
      await addPoints({ employeeId: toEmployeeId, avgOverallRating });
    }
  }
};

const doManagerSelfReview = async({ toEmployee, overallRating }) => {
  const { _id, roleId: toEmployeeRole } = toEmployee;
  const toEmployeeId = _id.toString();

  // Is manager's self-review
  await updateSelfOverallRating({ employeeId: toEmployeeId, overallRating });

  // Check if manager has got all other review types to calculate avgOverallRating
  if (await hasGotAllPeerReviews(toEmployeeId)) {
    const { avgPeersOverallRating } = toEmployee;
    if (avgPeersOverallRating != null &&
        avgPeersOverallRating > 0) {
      const avgOverallRating = calcAvgOverallRating({
        roleId: toEmployeeRole,
        selfOverallRating: overallRating,
        avgPeersOverallRating,
      });
      await addPoints({ employeeId: toEmployeeId, avgOverallRating });
    }
  }
};

export const getReviewDetails = async(employeeId) => {
  const employee = await isEmployeeExist({ id: employeeId });
  if (!employee) {
    return BAD_REQUEST('Employee not found');
  }
  const selfReviewDetails = {
    questions: await getAllSelfReviewQuestionAndAnswerSet(employeeId),
    selfOverallRating: employee.selfOverallRating,
  };
  const peerReviewDetails = {
    questions: await getAllPeerReviewQuestionAndAnswerSet(employeeId),
    avgPeersOverallRating: employee.avgPeersOverallRating,
  };
  let managerReviewDetails;
  if (employee.roleId === ROLE_ID.EMPLOYEE) {
    managerReviewDetails = {
      questions: await getAllManagerReviewQuestionAndAnswerSet(employeeId),
      managerOverallRating: employee.managerOverallRating,
    };
  }
  const avgOverallRating = calcAvgOverallRating({
    roleId: employee.roleId,
    selfOverallRating: employee.selfOverallRating,
    avgPeersOverallRating: employee.avgPeersOverallRating,
    ...employee.roleId === ROLE_ID.EMPLOYEE && { managerOverallRating: employee.managerOverallRating },
  });
  return OK({
    selfReviewDetails,
    peerReviewDetails,
    ...employee.roleId === ROLE_ID.EMPLOYEE && { managerReviewDetails },
    avgOverallRating,
  });
};
