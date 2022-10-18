import { MongoClient } from 'mongodb';
import app from '../index.js';

let dbClient,
  hiveDb,
  employees,
  questions,
  reviews,
  reviewAnswers,
  rewards;

const PORT = process.env.PORT || 5000;

MongoClient
  .connect(process.env.MONGODB_URI)
  .then((client) => {
    dbClient = client;
    hiveDb = client.db('Hive');
    employees = hiveDb.collection('Employees');
    questions = hiveDb.collection('Questions');
    reviews = hiveDb.collection('Reviews');
    reviewAnswers = hiveDb.collection('ReviewAnswers');
    rewards = hiveDb.collection('Rewards');

    app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
  }, (err) => {
    console.error(err);
  })
  .catch((err) => {
    console.error(err);
  });

export {
  dbClient,
  hiveDb,
  employees,
  questions,
  reviews,
  reviewAnswers,
  rewards,
};
