const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "services_mst",
      required: true,
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceCategory_mst",
      required: true,
    },
    serviceProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceAgent_mst",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_mst",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("booking", bookingSchema);
