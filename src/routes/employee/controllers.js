import bcrypt from 'bcrypt';
import { generateToken } from '../../helpers/authentication/index.js';
import { ROLE_IDS } from '../../helpers/employee/constants.js';
import { createNewEmployee, isEmployeeExist, isManager } from '../../helpers/employee/index.js';

export const registerEmployee = async({
                                        firstName,
                                        lastName,
                                        email,
                                        password,
                                        profileSummary,
                                        imgUrl,
                                        roleId,
                                        managerId,
                                      }) => {
  try {
    // Validate employee input
    let errDesc = {};
    if (!(firstName && lastName && email && password)) {
      errDesc = {
        ...!firstName && { firstName: 'First Name is required!' },
        ...!lastName && { lastName: 'Last Name is required!' },
        ...!email && { email: 'Email is required!' },
        ...!password && { password: 'Password is required!' },
      };
    }
    if (roleId !== 0 && !roleId) {
      errDesc.roleId = 'Role is required!';
    } else if (typeof roleId !== 'number') {
      errDesc.roleId = 'RoleId must be a number!';
    } else if (!Object.values(ROLE_IDS).includes(roleId)) {
      errDesc.roleId = 'Role not found!';
    } else if (roleId === 1) {
      if (!managerId) {
        errDesc.managerId = 'Manager is required!';
      } else if (
        typeof managerId === 'string' &&
        managerId.length !== 12 &&
        managerId.length !== 24
      ) {
        errDesc.managerId = 'ManagerId passed in must be a string of 12 bytes '
                            + 'or a string of 24 hex characters '
                            + 'or an integer.';
      } else if (!(await isManager({ id: managerId }))) {
        errDesc.managerId = 'Manager not found!';
      }
    }
    if (!(  // non-empty object check
      errDesc &&
      Object.keys(errDesc).length === 0 &&
      Object.getPrototypeOf(errDesc) === Object.prototype
    )) {
      return {
        status: 400,
        data: {
          message: errDesc,
        },
      };
    }

    if (await isEmployeeExist({ email })) {
      return {
        status: 400,
        data: {
          message: 'Employee Already Exist. Please Login.',
        },
      };
    }

    //Encrypt employee password
    const encryptedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await createNewEmployee({
      firstName,
      lastName,
      email,
      encryptedPassword,
      profileSummary,
      imgUrl,
      roleId,
      managerId,
    });

    if (newEmployee.acknowledged) {
      // Create token
      const token = generateToken({
        sub: newEmployee.insertedId,
      }, '2h');

      // Return new employee
      return {
        status: 200,
        header: {
          Authorization: token,
        },
        data: {
          firstName,
          lastName,
          email,
          ...profileSummary && { profileSummary },
          ...imgUrl && { imgUrl },
          roleId,
          ...roleId === ROLE_IDS.EMPLOYEE && { managerId },
        },
      };
    }
  } catch (err) {
    return {
      status: 500,
      data: {
        message: err.message,
      },
    };
  }
};
