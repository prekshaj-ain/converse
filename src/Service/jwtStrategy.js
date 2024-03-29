const passport = require("passport");
const { JWT_ACCESS_SECRET } = require("../Config/serverConfig");
const User = require("../Models/user.model");

const JwtStrategy = require("passport-jwt").Strategy;

const jwtFromRequest = (req) => {
  let token = null;
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization) {
    token = req.headers.authorization.replace("Bearer ", "");
  }
  return token;
};
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest,
      secretOrKey: JWT_ACCESS_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select(
          "-password -refreshToken"
        );

        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      } catch (err) {
        done(err, false);
      }
    }
  )
);
