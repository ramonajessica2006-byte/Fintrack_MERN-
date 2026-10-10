const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      enum: [
        "first_saver",
        "three_day_streak",
        "seven_day_streak",
        "goal_achiever",
        "challenge_champion",
      ],
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A user can unlock each specific achievement badge only once
achievementSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Achievement", achievementSchema);
