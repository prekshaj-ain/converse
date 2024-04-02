const passport = require("passport");
const ApiError = require("../Utils/ApiError");
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
} = require("../Config/serverConfig");
const { UserLoginType } = require("../constants");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;

try {
  passport.serializeUser((user, next) => {
    next(null, user._id);
  });

  passport.deserializeUser(async (id, next) => {
    try {
      const user = await User.findById(id);
      if (user) next(null, user); // return user of exist
      else next(new ApiError(404, "User does not exist"), null); // throw an error if user does not exist
    } catch (error) {
      next(
        new ApiError(
          500,
          "Something went wrong while deserializing the user. Error: " + error
        ),
        null
      );
    }
  });
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_, __, profile, next) => {
        // Check if the user with email already exist
        const user = await User.findOne({ email: profile._json.email });
        if (user) {
          // if user exists, check if user has registered with the GOOGLE SSO
          if (user.loginType !== UserLoginType.GOOGLE) {
            // If user is registered with some other method, we will ask him/her to use the same method as registered.
            next(
              new ApiError(
                400,
                "You have previously registered using " +
                  user.loginType?.toLowerCase()?.split("_").join(" ") +
                  ". Please use the " +
                  user.loginType?.toLowerCase()?.split("_").join(" ") +
                  " login option to access your account."
              ),
              null
            );
          } else {
            // If user is registered with the same login method we will send the saved user
            next(null, user);
          }
        } else {
          // If user with email does not exists, means the user is coming for the first time
          const createdUser = await User.create({
            email: profile._json.email,
            // There is a check for traditional logic so the password does not matter in this login method
            password: profile._json.sub, // Set user's password as sub (coming from the google)
            username: profile._json.email?.split("@")[0], // as email is unique, this username will be unique
            isEmailVerified: true, // email will be already verified
            avatar: {
              url: profile._json.picture,
              localPath: "",
            }, // set avatar as user's google picture
            loginType: UserLoginType.GOOGLE,
          });
          if (createdUser) {
            next(null, createdUser);
          } else {
            next(new ApiError(500, "Error while registering the user"), null);
          }
        }
      }
    )
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: GITHUB_CALLBACK_URL,
      },
      async (_, __, profile, next) => {
        const user = await User.findOne({ email: profile._json.email });
        if (user) {
          if (user.loginType !== UserLoginType.GITHUB) {
            next(
              new ApiError(
                400,
                "You have previously registered using " +
                  user.loginType?.toLowerCase()?.split("_").join(" ") +
                  ". Please use the " +
                  user.loginType?.toLowerCase()?.split("_").join(" ") +
                  " login option to access your account."
              ),
              null
            );
          } else {
            next(null, user);
          }
        } else {
          if (!profile._json.email) {
            next(
              new ApiError(
                400,
                "User does not have a public email associated with their account. Please try another login method"
              ),
              null
            );
          } else {
            // check of user with username same as github profile username already exist
            const userNameExist = await User.findOne({
              username: profile?.username,
            });

            const createdUser = await User.create({
              email: profile._json.email,
              password: profile._json.node_id, // password is redundant for the SSO
              username: userNameExist
                ? // if username already exist, set the emails first half as the username
                  profile._json.email?.split("@")[0]
                : profile?.username,
              isEmailVerified: true, // email will be already verified
              avatar: {
                url: profile._json.avatar_url,
                localPath: "",
              },
              loginType: UserLoginType.GITHUB,
            });
            if (createdUser) {
              next(null, createdUser);
            } else {
              next(new ApiError(500, "Error while registering the user"), null);
            }
          }
        }
      }
    )
  );
} catch (error) {
  console.error("PASSPORT ERROR: ", error);
}