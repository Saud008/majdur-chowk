const mongoose = require("mongoose");

const serviceCategorySchema = new mongoose.Schema({
    categoryName: String,
    categoryDescription: String,
    citiesAvailable: Array,
    imagePath: String,
    isActive: Boolean,
},{collection:"serviceCategory_mst"});

const serviceCategory = mongoose.model("serviceCategory_mst", serviceCategorySchema, "serviceCategory_mst");

module.exports = serviceCategory;