import express from 'express';
import { getReviewDetails, review } from '../review/controllers.js';

const router = express.Router();

router.post(
  ['/reviewSelf', '/reviewPeer', '/employeeReviewManager', '/managerReviewEmployee'],
  async(req, res) => {
    const { sub: fromEmployeeId } = req.token;
    const {
      receiverId: toEmployeeId,
      questionAnswers,
      overallRating,
    } = req.body;

    const json = await review({
      fromEmployeeId,
      toEmployeeId,
      questionAnswerArray: questionAnswers,
      overallRating,
    });
    res.respond(json);
  },
);

router.get('/getReviewDetails', async(req, res) => {
  const { sub: employeeId } = req.token;
  const json = await getReviewDetails(employeeId);
  res.respond(json);
});

export default router;
