Object.isEmpty = (obj) => {
  if (obj == null || typeof obj !== 'object') {
    return true;
  }
  return Object.keys(obj).length === 0 &&
         Object.getPrototypeOf(obj) === Object.prototype;
};

export const respond = (json, res) => {
  res.status(json.status);

  if (json.status === 200) {
    res.header(json.header);
  } else {
    console.error(json);
  }

  res.send({
    status: json.status,
    data: json.data,
  });
};
