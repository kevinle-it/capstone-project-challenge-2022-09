import express from 'express';
import { respond } from '../../helpers';
import { login, registerEmployee } from './controllers.js';

const router = express.Router();

router.post('/register', async(req, res) => {
  const json = await registerEmployee(req.body);
  respond(json, res);
});

router.post('/login', async(req, res) => {
  const json = await login(req.body);
  respond(json, res);
});

export default router;
