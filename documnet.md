const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: {
    line1: String,
    city: String,
    state: String,
    zip: String,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);


const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  is_available: { type: Boolean, default: true },
  rating: { type: Number, min: 0, max: 5 },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  created_at: { type: Date, default: Date.now },
});

// Create a geospatial index for location
workerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Worker', workerSchema);


const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Service', serviceSchema);


const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  services: [
    {
      service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
    },
  ],
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Pending' },
  payment_status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);


const assignmentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Completed'], default: 'Pending' },
  assigned_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Assignment', assignmentSchema);


const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Admin', adminSchema);
