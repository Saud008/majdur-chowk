const mongoose = require("mongoose");

// Define Feedback schema
const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_mst", // Reference to User model
      required: true,
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceCategory__mst", // Reference to User model
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  { collection: "feedback_mst" }
);

// Create Feedback model
const Feedback = mongoose.model("feedback_mst", feedbackSchema, "feedback_mst");

module.exports = Feedback;
