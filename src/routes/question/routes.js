import express from 'express';
import { getEmployeeReviewQuestions, getManagerReviewQuestions } from '../question/controllers.js';

const router = express.Router();

router.get('/getManagerReviewForm', async(req, res) => {
  const json = await getManagerReviewQuestions();
  res.respond(json);
});

router.get('/getEmployeeReviewForm', async(req, res) => {
  const json = await getEmployeeReviewQuestions();
  res.respond(json);
});

export default router;
