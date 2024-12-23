require("passport");
let callbackUser = (req, res) => {
  // res.redirect(`${process.env.CLIENT_URL}/login-success/${req.user?.id}`);

  res.redirect(`${process.env.CLIENT_URL}/login-success`);
};
const loginSuccess = async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    const formattedDate = new Date(user.createdAt).toLocaleDateString('en-GB');
    user.setDataValue('createdAt', formattedDate);
    user.setDataValue('updatedAt', formattedDate);
    res.status(200).json({
      errCode: 0,
      message: "Ok",
      user: req.user
    });
  } else {
    res.status(401).json({
      errCode: 1,
      message: "User is not logged in"
    });
  }
};
const userLogout = (req, res) => {
  req.logout(err => {
    if (err) {
      return res.status(500).json({
        errCode: 1,
        message: "Logout failed."
      });
    }
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({
          errCode: 1,
          message: "Failed to destroy session."
        });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      // res.redirect(`${process.env.CLIENT_URL}/login`); // Redirect to login page after logout
      res.status(200).json({
        errCode: 0,
        message: "Logout successful."
      });
    });
  });
};
module.exports = {
  loginSuccess: loginSuccess,
  userLogout: userLogout,
  callbackUser: callbackUser
};