const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const userType = require("./userTypeModel");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    userType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userType_mst",
    },
    fullName: String,
    emailAddress: String,
    password: String,
    isActive: Boolean,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    address: String,
    contact: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "user_mst" }
);

userSchema.pre("save", async function (next) {
  const user = this;
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

module.exports = mongoose.model("user_mst", userSchema, "user_mst");
