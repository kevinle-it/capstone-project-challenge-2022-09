import { generateToken } from '../authentication/index.js';

export const OK = (data, header) => {
  return {
    status: 200,
    ...header && { header },
    ...data && { data },
  };
};

export const BAD_REQUEST = (message) => {
  return {
    status: 400,
    ...message && {
      data: {
        message,
      },
    },
  };
};

export const UNAUTHORIZED = (message) => {
  return {
    status: 401,
    ...message && {
      data: {
        message,
      },
    },
  };
};

export const FORBIDDEN = (message) => {
  return {
    status: 403,
    ...message && {
      data: {
        message,
      },
    },
  };
};

export const INTERNAL_SERVER_ERROR = (message) => {
  return {
    status: 500,
    ...message && {
      data: {
        message,
      },
    },
  };
};

export const respond = (req, res) => (data) => {
  if (data.status) {
    res.status(data.status);
  } else {
    return res.status(500).send({
      status: 500,
      data: {
        message: 'Something went wrong!',
      },
    });
  }

  if (data.status === 200) {
    const curUnixTimeInSeconds = Math.round(Date.now() / 1000);
    let refreshedToken;
    if (req?.token?.sub &&
        curUnixTimeInSeconds < req?.token?.exp &&
        req?.token?.exp - curUnixTimeInSeconds < 600) { // to be expired in next 10 minutes
      refreshedToken = generateToken({
        sub: req?.token?.sub,
      });
    }
    res.header({
      ...refreshedToken && { Authorization: refreshedToken },
      ...data.header,
    });
  } else {
    console.error(data);
  }

  res.send({
    ...data.status && { status: data.status },
    ...data.data && { data: data.data },
  });
};
