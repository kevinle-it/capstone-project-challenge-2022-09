import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import employeeRoutes from './employee/routes.js';
import questionRoutes from './question/routes.js';

const router = express.Router();

router.use('/employee', employeeRoutes);
router.use('/question', authenticate, questionRoutes);

export default router;
