const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Required only for normal email/password accounts.
    // Google OAuth users do not need a password.
    password: {
      type: String,
      default: null,
    },

    // Google account ID
    googleId: {
      type: String,
      default: null,
    },

    // Identifies how the account was created
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    userType: {
      type: String,
      enum: ["student", "adult"],
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);