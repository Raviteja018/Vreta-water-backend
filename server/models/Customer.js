const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (value) {
        return /^\d{10}$/.test(value); // ✅ Exactly 10 digits
      },
      message: 'Phone number must be exactly 10 digits',
    },
  },
  location: {
    type: String,
    required: true,
    enum:['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Other'],
    trim:true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'follow-up', 'closed', 'interested', 'not interested', 'not answered'],
    default: 'new'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Customer = mongoose.model('Customer', CustomerSchema)
module.exports = Customer;
