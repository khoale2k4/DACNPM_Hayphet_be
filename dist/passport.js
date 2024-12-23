const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./models/index');
const userService = require('./services/user-services');
const LocalStrategy = require('passport-local').Strategy;
// Local strategy for local login
passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    let userData = await userService.handleUserLogin(username, password);
    if (userData.errCode !== 0) {
      return done(null, false, {
        errCode: userData.errCode,
        message: userData.message
      });
    }
    return done(null, userData.user);
  } catch (error) {
    return done(error);
  }
}));

// Set up Passport with Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  scope: ["profile", "email"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await db.User.findOne({
      where: {
        googleId: profile.id
      }
    });
    if (!user) {
      // If user doesn't exist, create a new record
      user = await db.User.create({
        email: profile.emails[0].value,
        googleId: profile.id,
        name: profile.displayName,
        avatar: profile.photos[0].value,
        authProvider: "google",
        role: 'user'
      });
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  done(null, user.id);
  // done(null, { 
  //   id: user.id, 
  //   avatar: user.avatar, 
  //   role: user.role, 
  //   name: user.name
  // });
});
passport.deserializeUser(async (id, done) => {
  //  console.log("Deserializing user with ID:", id);  // Check the ID being passed for deserialization
  try {
    const user = await db.User.findOne({
      where: {
        id: id
      },
      attributes: ['id', 'name', 'role', 'avatar', 'authProvider', 'post_count', 'like_count', 'follower_count', 'description', 'createdAt', 'updatedAt']
    });
    if (!user) {
      console.log("User not found!");
      return done(null, false); // User not found, handle appropriately
    }
    // console.log("Deserialized user:", user);  // Check the full user object
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});