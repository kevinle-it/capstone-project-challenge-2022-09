import express from 'express';
import employeeRoutes from './employee/routes.js';

const router = express.Router();

router.use('/employee', employeeRoutes);

export default router;
