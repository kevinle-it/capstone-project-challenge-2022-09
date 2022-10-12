import express from 'express';
import { authorize } from '../../middlewares/auth.js';
import {
  getEmployeeReviewQuestions,
  getManagerReviewQuestions,
  getSelfReviewQuestions,
} from '../question/controllers.js';

const router = express.Router();

router.get('/getSelfReviewForm', async(req, res) => {
  const json = await getSelfReviewQuestions();
  res.respond(json);
});

router.get(
  '/getManagerReviewForm',
  authorize([0, 2]),
  async(req, res) => {
    const json = await getManagerReviewQuestions();
    res.respond(json);
  }
);

router.get('/getEmployeeReviewForm', async(req, res) => {
  const json = await getEmployeeReviewQuestions();
  res.respond(json);
});

export default router;
