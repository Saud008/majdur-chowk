//require mongoose
const mongoose = require("mongoose");

const userTypeSchema = new mongoose.Schema({
    userType: String
},{collection:"userType_mst"});

const userType = mongoose.model("userType_mst", userTypeSchema);

module.exports = userType;