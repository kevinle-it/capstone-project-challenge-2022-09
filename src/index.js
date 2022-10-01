import * as dotenv from 'dotenv'
dotenv.config()

import express from "express";

const app = express();
const PORT = 5000;

app.use(express.json());

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
