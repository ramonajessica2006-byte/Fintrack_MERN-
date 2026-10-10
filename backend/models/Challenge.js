const mongoose = require("mongoose");

const challengeContributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    goalId: {
      type: String,
      default: null,
    },
    goalTitle: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const challengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
      index: true,
    },
    totalContributed: {
      type: Number,
      default: 0,
    },
    contributions: [challengeContributionSchema],
  },
  {
    timestamps: true,
  }
);

// Helper to evaluate and sync status
challengeSchema.methods.checkStatus = function () {
  const now = new Date();
  if (this.totalContributed >= this.targetAmount) {
    this.status = "completed";
  } else if (new Date(this.endDate) < now) {
    this.status = "expired";
  } else {
    this.status = "active";
  }
  return this.status;
};

module.exports = mongoose.model("Challenge", challengeSchema);
