import { ObjectId } from 'mongodb';

Object.isEmpty = (obj) => {
  if (obj == null || typeof obj !== 'object') {
    return true;
  }
  return Object.keys(obj).length === 0 &&
         Object.getPrototypeOf(obj) === Object.prototype;
};

export const convertToMongoDbId = (id) =>
  id && typeof id === 'string'
    ? new ObjectId(id)
    : (id instanceof ObjectId || typeof id === 'number') && id;
