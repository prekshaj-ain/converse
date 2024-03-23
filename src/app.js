const express = require("express");
const cors = require("cors");

const { CORS_ORIGIN } = require("./Config/serverConfig");

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

module.exports = app;
