import express from 'express';
import employeeRoutes from './employee/routes.js';
import questionRoutes from './question/routes.js';

const router = express.Router();

router.use('/employee', employeeRoutes);
router.use('/question', questionRoutes);

export default router;
