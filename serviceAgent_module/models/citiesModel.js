const mongoose = require("mongoose");

const citiesSchema = new mongoose.Schema(
  {
    cityName: String,
    stateName: String,
    countryName: String,
    isActive: Boolean,
  },
  { collection: "cities_mst" }
);

const cities = mongoose.model("cities_mst", citiesSchema, "cities_mst");
module.exports = cities;
