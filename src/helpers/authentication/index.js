import jwt from 'jsonwebtoken';

export const generateToken = (payload, expireIn) => {
  return jwt.sign(
    payload,
    process.env.TOKEN_SECRET_KEY,
    { expiresIn: process.env.TOKEN_EXPIRE_TIME || expireIn || '2h' },
  );
};
