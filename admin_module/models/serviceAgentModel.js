const mongoose = require("mongoose");

const serviceAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceCategory_mst",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
    },
  },
  { collection: "serviceAgent_mst" }
);

module.exports = mongoose.model(
  "serviceAgent_mst",
  serviceAgentSchema,
  "serviceAgent_mst"
);
