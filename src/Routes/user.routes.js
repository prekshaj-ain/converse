const { Router } = require("express");
const {
  userRegisterValidator,
  userLoginValidator,
} = require("../Validators/user.validator");
const { validate } = require("../Validators/validation");
const {
  registerUser,
  loginUser,
  refreshToken,
  verifyEmail,
  logoutUser,
  handleSocialLogin,
  getCurrentUser,
  updateUserAvatar,
} = require("../Controllers/user.controller");
const { verifyJWT } = require("../Middlewares/auth.middleware");
const passport = require("passport");
const { upload } = require("../Middlewares/multer.middleware");

const router = Router();

// Unsecured route
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/refresh-token").post(refreshToken);
router.route("/verify-email/:verificationToken").get(verifyEmail);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/avatar")
  .patch(verifyEmail, upload.single("avatar"), updateUserAvatar);

// SSO routes
router.route("/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  (req, res) => {
    res.send("redirecting to google...");
  }
);

router.route("/github").get(
  passport.authenticate("github", {
    scope: ["profile", "email"],
  }),
  (req, res) => {
    res.send("redirecting to github...");
  }
);

router
  .route("/google/callback")
  .get(passport.authenticate("google"), handleSocialLogin);

router
  .route("/github/callback")
  .get(passport.authenticate("github"), handleSocialLogin);

module.exports = router;
