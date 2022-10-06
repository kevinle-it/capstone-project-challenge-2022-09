import express from 'express';
import { respond } from '../../helpers/index.js';
import { getAllManagers, login, registerEmployee } from './controllers.js';

const router = express.Router();

router.post('/register', async(req, res) => {
  const json = await registerEmployee(req.body);
  respond(json, res);
});

router.post('/login', async(req, res) => {
  const json = await login(req.body);
  respond(json, res);
});

router.get('/getAllManagers', async(req, res) => {
  const json = await getAllManagers();
  respond(json, res);
});

export default router;
