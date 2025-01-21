const mongoose = require("mongoose");

// Define a schema for the services collection
const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceCategory_mst", // Reference to the 'ServiceCategory' model
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subCategory_mst", // Reference to the 'SubCategory' model
      required: true,
    },
    image: {
      type: String,
    },
    // Add more fields as needed
  },
  { collection: "services_mst" }
);

// Create a Mongoose model from the schema
const Service = mongoose.model("services_mst", serviceSchema, "services_mst");

module.exports = Service;
