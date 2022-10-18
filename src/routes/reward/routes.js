import express from 'express';
import { getRewards } from './controllers.js';

const router = express.Router();

router.get('/getRewards',
  async(req, res) => {
    const json = await getRewards();
    res.respond(json);
  },
);

export default router;
