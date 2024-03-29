import { Router } from "express";
import passport from "passport";
import asyncHandler from "../../Utils/asyncHandler";
import ApiError from "../../Utils/ApiError";
import ApiResponse from "../../Utils/ApiResponse";

const router = Router();

router.get(
  "/",
  passport.authenticate("facebook", {
    scope: ["public_profile", "email"],
  })
);

router.get(
  "/callback",
  passport.authenticate("facebook", {
    session: false,
  }),
  asyncHandler(async (req, res) => {
    console.log(req.user);
    const accessToken = await req.user.generateAccessToken();
    const refreshToken = await req.user.generateRefreshToken();

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: req.user,
            accessToken,
            refreshToken,
          },
          "User logged In Successfully"
        )
      );
  })
);

router.get(
  "/failure",
  asyncHandler(async (req, res) => {
    throw new ApiError(401, "Facebook authentication failed");
  })
);

module.exports = router;
