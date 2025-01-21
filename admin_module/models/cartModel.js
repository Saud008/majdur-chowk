const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    items: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "services_mst",
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user_mst",
    },
  },
  { collection: "cart" }
);

const Cart = mongoose.model("Cart", CartSchema, "cart");

module.exports = Cart;
