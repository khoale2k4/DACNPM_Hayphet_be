// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  // console.log(req.user);
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({
      message: 'Bạn cần đăng nhập để thực hiện hành động này'
    });
  }
}

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  // console.log(req.user);
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({
      message: 'Bạn không có quyền truy cập'
    });
  }
}

// Middleware to check if user is a moderator
function isModerator(req, res, next) {
  if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin')) {
    return next();
  } else {
    return res.status(403).json({
      message: 'Bạn không có quyền truy cập'
    });
  }
}
module.exports = {
  isAuthenticated: isAuthenticated,
  isAdmin: isAdmin,
  isModerator: isModerator
};