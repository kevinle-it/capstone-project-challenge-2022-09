import express from 'express';
import { employees } from './config/db.js';

const app = express();

app.use(express.json());

app.get('/', async(req, res) => {
  const emps = await employees.find().toArray();
  res.send(emps);
});

export default app;
