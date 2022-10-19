import express from 'express';
import { getRewards, redeemReward } from './controllers.js';

const router = express.Router();

router.get('/getRewards',
  async(req, res) => {
    const json = await getRewards();
    res.respond(json);
  },
);

router.post('/redeemReward',
  async(req, res) => {
    const { sub: employeeId } = req.token;
    const { rewardId } = req.body;
    const json = await redeemReward(employeeId, rewardId);
    res.respond(json);
  },
);

export default router;
