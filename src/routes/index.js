import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import employeeRoutes from './employee/routes.js';
import questionRoutes from './question/routes.js';
import reviewRoutes from './review/routes.js';
import rewardRoutes from './reward/routes.js';

const router = express.Router();

router.use('/employee', employeeRoutes);
router.use('/question', authenticate, questionRoutes);
router.use('/review', authenticate, reviewRoutes);
router.use('/reward', authenticate, rewardRoutes);

export default router;
