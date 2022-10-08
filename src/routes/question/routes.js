import express from 'express';
import { respond } from '../../helpers/index.js';
import { getEmployeeReviewQuestions, getManagerReviewQuestions } from '../question/controllers.js';

const router = express.Router();

router.get('/getManagerReviewForm', async(req, res) => {
  const json = await getManagerReviewQuestions();
  respond(json, res);
});

router.get('/getEmployeeReviewForm', async(req, res) => {
  const json = await getEmployeeReviewQuestions();
  respond(json, res);
});

export default router;
