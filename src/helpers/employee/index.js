import { ObjectId } from 'mongodb';
import { employees } from '../../config/db.js';
import { ROLE_IDS } from './constants.js';

export const isEmployeeExist = async({ id, email }) => {
  // Check if employee already exist
  // Validate if employee exist in our database
  const _id =
    typeof id === 'string'
      ? new ObjectId(id)
      : typeof id === 'number' && id;

  const foundEmployee = await employees.findOne({
    ...((id && { _id }) || (email && { email })),
  });

  return !!foundEmployee;
};

export const isManager = async({ id, email }) => {
  // Check if employee already exist
  // Validate if employee is a manager in our database
  const foundManager = await employees.findOne({
    ...((id && { _id: new ObjectId(id) }) || (email && { email })),
    roleId: 2,
  });

  return !!foundManager;
};

export const createNewEmployee = async({
                                         firstName,
                                         lastName,
                                         email,
                                         encryptedPassword,
                                         profileSummary,
                                         imgUrl,
                                         roleId,
                                         managerId,
                                       }) => {
  // Create employee in our database
  return await employees.insertOne({
    firstName,
    lastName,
    email: email.toLowerCase(), // sanitize: convert email to lowercase
    encryptedPassword,
    ...profileSummary && { profileSummary },
    ...imgUrl && { imgUrl },
    roleId,
    ...roleId === ROLE_IDS.EMPLOYEE && { managerId },
  });
};
