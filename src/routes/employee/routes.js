import express from 'express';
import { login, registerEmployee } from './controllers.js';

const router = express.Router();

router.post('/register', async(req, res) => {
  const json = await registerEmployee(req.body);

  if (json.status === 200) {
    res.status(json.status)
       .header(json.header)
       .send(json.data);
  } else {
    console.error(json);
    res.status(json.status)
       .send(json.data.message);
  }
});

router.post('/login', async(req, res) => {
  const json = await login(req.body);

  if (json.status === 200) {
    res.status(json.status)
       .header(json.header)
       .send(json.data);
  } else {
    console.error(json);
    res.status(json.status)
       .send(json.data.message);
  }
});

export default router;
