import jwt from 'jsonwebtoken';
import { isEmployeeExist } from '../helpers/employee/index.js';
import { FORBIDDEN, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '../helpers/httpMessage/index.js';

export const authenticate = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers.authorization;

  if (!token) {
    return res.respond(FORBIDDEN('A token is required for authentication'));
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    req.token = decoded;
  } catch (err) {
    return res.respond(UNAUTHORIZED('Invalid Token'));
  }
  next();
};

export const authorize = (...grantedRoleIds) => async(req, res, next) => {
  let roleIds = grantedRoleIds; // params passed in form of authorize(0, 1, 2)
  if (typeof grantedRoleIds[0] !== 'number') {
    roleIds = grantedRoleIds[0];  // params passed in form of authorize([0, 1, 2])
  }
  if (!req?.token) {
    return res.respond(INTERNAL_SERVER_ERROR('Something went wrong'));
  }
  const employee = await isEmployeeExist({ id: req?.token?.sub });
  if (employee && roleIds.includes(employee.roleId)) {
    return next();
  }
  return res.respond(UNAUTHORIZED('Request unauthorized'));
};
