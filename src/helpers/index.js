Object.isEmpty = (obj) => {
  if (obj == null || typeof obj !== 'object') {
    return true;
  }
  return Object.keys(obj).length === 0 &&
         Object.getPrototypeOf(obj) === Object.prototype;
};
