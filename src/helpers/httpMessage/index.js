import { generateToken, TOKEN_EXPIRE_TIME } from '../authentication/index.js';

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
    data.header && res.header(data.header);
  } else {
    console.error(data);
  }

  res.send({
    ...data.status && { status: data.status },
    ...data.data && { data: data.data },
  });
};
