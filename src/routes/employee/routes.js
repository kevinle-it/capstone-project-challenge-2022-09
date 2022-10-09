import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { getAllEmployees, getAllManagers, login, registerEmployee } from './controllers.js';

const router = express.Router();

router.post('/register', async(req, res) => {
  const json = await registerEmployee(req.body);
  res.respond(json);
});

router.post('/login', async(req, res) => {
  const json = await login(req.body);
  res.respond(json);
});

router.get('/getAllManagers', async(req, res) => {
  const json = await getAllManagers();
  res.respond(json);
});

router.get(
  '/getAllUsers',
  authenticate,
  authorize([0, 2]),
  async(req, res) => {
    const json = await getAllEmployees();
    res.respond(json);
  }
);

export default router;
