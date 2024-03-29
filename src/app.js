const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const { CORS_ORIGIN } = require("./Config/serverConfig");
const authRoute = require("./Routes/Auth/index");

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(passport.initialize());
require("./Service/facebookStrategy");
require("./Service/googleStrategy");
require("./Service/jwtStrategy");
require("./Service/localStrategy");

app.use("/auth", authRoutes);

module.exports = app;
