const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../Models/user.model");
const {
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  SERVER_URL,
} = require("../Config/serverConfig");

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${SERVER_URL}/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      console.log(profile);
      try {
        const oldUser = await User.findOne({ email: profile.email }).select(
          "-refreshToken -googleId"
        );

        if (oldUser) {
          return done(null, oldUser);
        }
      } catch (err) {
        console.log(err);
      }
      try {
        const newUser = await User.create({
          googleId: profile.id,
          username: profile.email.split("@")[0],
          email: profile.email,
          name: profile.displayName,
          avatar: profile.picture,
        });
        delete newUser.googleId;
        done(null, newUser);
      } catch (err) {
        console.log(err);
      }
    }
  )
);
