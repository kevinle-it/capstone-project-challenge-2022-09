import express from 'express';
import './helpers/index.js';
import { responseHelper } from './middlewares/message.js';
import routes from './routes/index.js';

const app = express();

app.use(express.json());
app.use(responseHelper);

app.use(routes);

export default app;
