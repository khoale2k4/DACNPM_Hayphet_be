const userService = require('../services/user-services');
const passport = require('passport');
const {
  User
} = require('../models');
//API

// localhost:{port}/api/login
let handleLogin = async (req, res, next) => {
  const {
    username,
    password
  } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      errCode: 4,
      message: "Missing parameter."
    });
  }
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(400).json({
        errCode: info.errCode || null,
        message: info.message || null
      });
    }

    // If user is authenticated, store user info in session
    req.logIn(user, err => {
      if (err) {
        return next(err);
      }
      // Send the user data (excluding password) in the response
      return res.status(200).json({
        errCode: 0,
        message: 'Ok',
        user: user
      });
    });
  })(req, res, next);
};

//localhost{port}/api/create-new-user
let handleUserSignin_sentAuthCode = async (req, res) => {
  if (!process.env.NODE_ENV === 'development') {
    // disable this in development
    if (!req.body.email || !req.body.password || !req.body.username || !req.body.name) {
      return res.status(400).json({
        errCode: 4,
        message: 'Missing parameter.'
      });
    }
  }
  let message = await userService.handleUserSignin_sentAuthCode(req.body.email);
  // let message = await userService.createUser(req.body);
  return res.status(200).json({
    errCode: message.errCode,
    message: message.message
  });
};
let handleUserSignin_verifyAuthCode = async (req, res) => {
  if (!process.env.NODE_ENV === "development") {
    // disable this in development
    if (!req.body.email || !req.body.password || !req.body.username || !req.body.name || !req.body.code) {
      return res.status(400).json({
        errCode: 4,
        message: "Missing parameter."
      });
    }
  }
  let message = await userService.handleUserSignin_verifyAuthCode(req.body, req.body.code);
  return res.status(200).json({
    errCode: message.errCode,
    message: message.message
  });
};
let forgotPassword_send = async (req, res) => {
  if (!process.env.NODE_ENV === 'development') {
    // disable this in development
    if (!req.body.username) {
      res.status(400).json({
        errCode: 3,
        message: 'Missing input'
      });
    }
  }
  let response = await userService.forgotPassword_sendCode(req.body.username);
  res.status(200).json({
    errCode: response.errCode,
    message: response.message,
    email: response.email || null
  });
};
let forgotPassword_verify = async (req, res) => {
  if (!process.env.NODE_ENV === 'development') {
    // disable this in development
    if (!req.body.code || !req.body.password || !req.body.username) {
      res.status(400).json({
        errCode: 3,
        message: 'Missing input'
      });
    }
  }
  let user = await userService.getUserByUsername(req.body.username);
  if (!user) {
    res.status(400).json({
      errCode: 2,
      message: 'User not found'
    });
  }
  let response = await userService.forgotPassword_verify(user.email, req.body.code);
  if (response.errCode === 0) {
    //change user password
    await userService.updateUserInfo(user.id, {
      password: req.body.password
    });
  }
  res.status(200).json({
    errCode: response.errCode,
    message: response.message
  });
};
let updateUserInfo = async (req, res) => {
  const {
    name,
    description
  } = req.body;
  const userId = req.user.id;
  const avatar = req.file ? req.file.path : null;
  if (!name && !avatar && !description) {
    return res.status(400).json({
      errCode: 4,
      message: "Missing parameter."
    });
  }
  const imageUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${req.file.filename}`;
  let updateData = {};
  if (name) updateData.name = name;
  if (avatar) updateData.avatar = imageUrl;
  if (description) updateData.description = description;
  try {
    await userService.updateUserInfo(userId, updateData);
    return res.status(200).json({
      errCode: 0,
      message: "User information updated successfully.",
      data: {
        name: name,
        description: description,
        avatar: imageUrl
      }
    });
  } catch (e) {
    return res.status(500).json({
      errCode: 1,
      message: "An error occurred while updating user information."
    });
  }
};
module.exports = {
  handleLogin: handleLogin,
  handleUserSignin_sentAuthCode: handleUserSignin_sentAuthCode,
  handleUserSignin_verifyAuthCode: handleUserSignin_verifyAuthCode,
  forgotPassword_send: forgotPassword_send,
  forgotPassword_verify: forgotPassword_verify,
  updateUserInfo: updateUserInfo
};