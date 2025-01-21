const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    title: String,
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceCategory_mst",
      required: true,
    },
  },
  { collection: "subCategory_mst" }
);

const subCategory = mongoose.model(
  "subCategory_mst",
  subCategorySchema,
  "subCategory_mst"
);

module.exports = subCategory;
