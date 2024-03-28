const passport = require("passport");
const User = require("../Models/user.model");
const FacebookStrategy = require("passport-facebook").Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: `${SERVER_URL}/auth/google/callback`,
      profileFields: ["id", "displayName", "email", "photos"],
    },
    async function (accessToken, refreshToken, profile, done) {
      // console.log(profile);
      try {
        const oldUser = await User.findOne({ email: profile.emails[0].value });

        if (oldUser) {
          return done(null, oldUser);
        }
      } catch (err) {
        console.log(err);
      }

      // register user
      try {
        const newUser = await new User.create({
          provider: "facebook",
          facebookId: profile.id,
          username: `user${profile.id}`,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0].value,
        });

        done(null, newUser);
      } catch (err) {
        console.log(err);
      }
    }
  )
);
