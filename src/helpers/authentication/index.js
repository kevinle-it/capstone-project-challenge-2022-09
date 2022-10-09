import jwt from 'jsonwebtoken';

export const TOKEN_EXPIRE_TIME = '2h';

export const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.TOKEN_SECRET_KEY,
    { expiresIn: process.env.TOKEN_EXPIRE_TIME || TOKEN_EXPIRE_TIME },
  );
};
