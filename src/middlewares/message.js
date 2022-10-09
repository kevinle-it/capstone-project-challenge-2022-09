import { respond } from '../helpers/httpMessage/index.js';

export const responseHelper = (req, res, next) => {
  res.respond = respond(req, res);
  next();
};
