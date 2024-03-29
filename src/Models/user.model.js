const { default: mongoose } = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  JWT_ACCESS_EXPIRY,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_EXPIRY,
  JWT_REFRESH_SECRET,
} = require("../Config/serverConfig");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    refreshToken: {
      type: String,
    },
    bio: {
      type: String,
    },
    avatar: {
      type: String,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // Check if the password field is modified and exists
  if (this.isModified("password") && this.password) {
    try {
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(this.password, 10);
      this.password = hashedPassword; // Update the password field with the hashed password
    } catch (error) {
      return next(error);
    }
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  const refreshToken = jwt.sign(
    { _id: this._id, email: this.email },
    JWT_ACCESS_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRY,
    }
  );
  this.refreshToken = refreshToken;
  this.save();
  return refreshToken;
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id, email: this.email }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
