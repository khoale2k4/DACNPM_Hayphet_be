const nodemailer = require("nodemailer");
const crypto = require('crypto');
const db = require('../models/index');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
require('dotenv').config();
/**
 * Creates a new user in the database.
 * 
 * This function takes user registration information from the request body,
 * hashes the password, and then saves the new user in the database.
 *
 * @param {Object} body - The registration information for the new user.
 * @returns {Promise<string>} A promise that resolves to a success message 
 * @throws {Error} Will throw an error if there is an issue during user creation.
 */
let createUser = async body => {
  //body of html file which contains register information
  return new Promise(async (resolve, reject) => {
    try {
      if (!body.email) {
        resolve({
          errCode: 2,
          message: 'Missing email'
        });
      }
      if (!body.name) {
        resolve({
          errCode: 6,
          message: 'Missing nickname.'
        });
      }
      let emailExists = await checkUserEmail(body.email);
      if (emailExists) {
        resolve({
          errCode: 1,
          message: 'This email is already in use.'
        });
      }
      // Check if username is provided and already exists
      if (body.username) {
        let usernameExists = await checkUsername(body.username);
        if (usernameExists) {
          resolve({
            errCode: 5,
            message: 'This username is already taken.'
          });
        }
      }
      let hashedPwFromBcrypt = await hashUserPassword(body.password);
      await db.User.create({
        username: body.username || null,
        name: body.name,
        email: body.email,
        hashed_pw: hashedPwFromBcrypt,
        role: 'user',
        authProvider: 'local'
      });
      resolve({
        errCode: 0,
        message: 'Ok'
      });
    } catch (e) {
      reject(e);
    }
  });
};
let generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};
let sendOtpEmail = async (email, otp) => {
  if (process.env.NODE_ENV === 'development') {
    return otp; // Skip sending email in development mode
  }
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.OTP_EMAIL_ADDRESS,
      pass: process.env.OTP_EMAIL_PASSWORD
    }
  });
  const htmlTemplate = `<p>OTP xác thực:<br><br>
        <strong style="font-size: 20px; color: red;">${otp}</strong>
        <br><br>
        Vui lòng không tiết lộ OTP cho bất kỳ ai.
        <br><br>
        </p>`;
  const mailOptions = {
    from: 'dacnpm.tuanphatfanclub@gmail.com',
    to: email,
    subject: 'Xác thực OTP',
    html: htmlTemplate
  };
  await transporter.sendMail(mailOptions);
  return otp;
};
let forgotPassword_sendCode = username => {
  return new Promise(async (resolve, reject) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        resolve({
          errCode: 0,
          message: 'Ok. Authentication code has been sent',
          email: '*****@gmail.com'
        });
        return;
      }
      let user = await db.User.findOne({
        where: {
          username: username
        }
      });
      if (!user) {
        resolve({
          errCode: 1,
          message: 'User not found.'
        });
      }
      if (!user.email) {
        resolve({
          errCode: 2,
          message: 'Email not found.'
        });
      }
      await db.ConfirmationCode.update({
        status: 'used'
      },
      // New status
      {
        where: {
          email: user.email,
          status: 'active'
        }
      } // Conditions for the update
      );
      let otp = await sendOtpEmail(user.email, generateOTP());
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.ConfirmationCode.create({
        email: user.email,
        code: otp,
        expiresAt: expiresAt
      });
      const maskedEmail = user.email.replace(/^(.{2})(.*)(@gmail\.com)$/, '$1*****$3');
      resolve({
        errCode: 0,
        message: 'Ok. Authentication code has been sent',
        email: maskedEmail
      });
    } catch (e) {
      reject(e);
    }
  });
};
let forgotPassword_verify = (email, code) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        resolve({
          errCode: 0,
          message: 'Ok'
        });
        return;
      }
      let check = await checkAuthCode(email, code);
      if (check) {
        resolve({
          errCode: 0,
          message: 'Ok'
        });
      } else {
        resolve({
          errCode: 1,
          message: 'Invalid authentication code.'
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};
let handleUserSignin_sentAuthCode = email => {
  return new Promise(async (resolve, reject) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        resolve({
          errCode: 0,
          message: 'Ok. Authentication code has been sent'
        });
        return;
      }
      if (!email) {
        resolve({
          errCode: 4,
          message: "Missing email"
        });
      }
      let check = await checkUserEmail(email);
      if (check) {
        resolve({
          errCode: 1,
          message: 'This email is already in used.'
        });
      }
      await db.ConfirmationCode.update({
        status: 'used'
      },
      // New status
      {
        where: {
          email: email,
          status: 'active'
        }
      } // Conditions for the update
      );
      let otp = await sendOtpEmail(email, generateOTP());
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.ConfirmationCode.create({
        email: email,
        code: otp,
        expiresAt: expiresAt
      });
      resolve({
        errCode: 0,
        message: 'Ok. Authentication code has been sent'
      });
    } catch (e) {
      reject(e);
    }
  });
};
let handleUserSignin_verifyAuthCode = (userData, authCode) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        let createUserMessage = await createUser(userData);
        resolve({
          errCode: createUserMessage.errCode,
          message: createUserMessage.message
        });
        return;
      }
      let check = await checkAuthCode(userData.email, authCode);
      if (check) {
        let createUserMessage = await createUser(userData);
        resolve({
          errCode: createUserMessage.errCode,
          message: createUserMessage.message
        });
      } else {
        resolve({
          errCode: 3,
          message: 'Invalid authentication code.'
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};
let getUserByUsername = username => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: {
          username: username
        }
      });
      if (user) {
        resolve(user);
      }
      resolve(undefined);
    } catch (e) {
      reject(e);
    }
  });
};
/**
 * This function hash a string.
 * 
 * @param {string} password - The password string that need to be hashed. 
 * @returns {Promise<string>} - The hashed password.
 */
let hashUserPassword = password => {
  return new Promise((resolve, reject) => {
    try {
      let hashed_pw = bcrypt.hashSync(password, salt);
      resolve(hashed_pw);
    } catch (e) {
      reject(e);
    }
  });
};
let checkAuthCode = (email, userAuthCode) => {
  return new Promise(async (resolve, reject) => {
    try {
      let authCodeInDb = await db.ConfirmationCode.findOne({
        where: {
          email: email,
          status: "active"
        }
      });
      if (authCodeInDb) {
        if (authCodeInDb.code === userAuthCode) {
          if (authCodeInDb.expiresAt > new Date()) {
            authCodeInDb.status = "used"; // Update the status only when both checks pass
            await authCodeInDb.save();
            return resolve(true); // Return success only when code matches and is valid
          }
        }
      }
      resolve(false);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Retrieves user information by user ID.
 * 
 * If the user is found, it resolves with the user data; 
 * otherwise, it resolves with an empty object.
 *
 * @param {number} id - The ID of the user to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the user object if found, or an empty object if not found.
 * @throws {Error} Will throw an error if there is an issue during the retrieval process.
 */
let getUserInfoByID = id => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findByPk(id, {
        raw: true
      });
      if (user) {
        resolve(user);
      } else {
        resolve({});
      }
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Updates user information for a given user ID.
 * 
 * Field name must be the same as ones stored in database.
 * 
 * @param {number} id - The ID of the user to update.
 * @param {Object} [updateData] - An object containing the fields to update, can be leaved as null.
 */
let updateUserInfo = (id, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!updateData || Object.keys(updateData).length === 0) {
        resolve();
      }
      let user = await db.User.findByPk(id);
      if (updateData.hasOwnProperty('password')) {
        updateData.hashed_pw = await hashUserPassword(updateData.password);
      }
      if (user) {
        for (const key in updateData) {
          user[key] = updateData[key];
        }
        await user.save();
        resolve();
      } else {
        resolve();
      }
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Handles user login by checking email and password credentials.
 *
 * @param {string} username - The email of the user trying to log in.
 * @param {string} userPassword - The password of the user trying to log in.
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 * - `errCode` {number}: An error code (0 for success, 1 if account doesn't exist, 2 if user not found, 3 if wrong password).
 * - `message` {string}: A message describing the result.
 * - `user` {Object|undefined}: An object with the user information (excluding `hashed_pw`) if login is successful, otherwise undefined.
 *
 * @throws Will reject with an error if any exception occurs during the login process.
 */
let handleUserLogin = (username, userPassword) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = {};
      let isExist = await checkUsername(username);
      if (isExist) {
        let user = await db.User.findOne({
          where: {
            username: username
          },
          attributes: ['id', 'name', 'role', 'avatar', 'hashed_pw'],
          raw: true
        });
        if (user) {
          //compare password
          let isMatch = bcrypt.compareSync(userPassword, user.hashed_pw);
          if (isMatch) {
            userData.errCode = 0;
            userData.message = 'Ok';
            delete user.hashed_pw;
            userData.user = user;
          } else {
            userData.errCode = 3;
            userData.message = 'Wrong password';
          }
        } else {
          userData.errCode = 2, userData.message = 'User is not found';
        }
      } else {
        userData.errCode = 1;
        userData.message = 'Account is not exist.';
      }
      resolve(userData);
    } catch (e) {
      reject(e);
    }
  });
};
let checkUsername = username => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: {
          username: username
        }
      });
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (e) {
      reject(e);
    }
  });
};
let checkUserEmail = userEmail => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: {
          email: userEmail,
          authProvider: 'local'
        }
      });
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (e) {
      reject(e);
    }
  });
};
module.exports = {
  createUser: createUser,
  getUserInfoByID: getUserInfoByID,
  updateUserInfo: updateUserInfo,
  hashUserPassword: hashUserPassword,
  handleUserLogin: handleUserLogin,
  handleUserSignin_sentAuthCode: handleUserSignin_sentAuthCode,
  handleUserSignin_verifyAuthCode: handleUserSignin_verifyAuthCode,
  forgotPassword_sendCode: forgotPassword_sendCode,
  forgotPassword_verify: forgotPassword_verify,
  getUserByUsername: getUserByUsername
};