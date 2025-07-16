const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  severity: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Low',
    required: true
  },
  status: {
    type: String,
    enum: ['Unacknowledged', 'Assigned', 'Acknowledged'],
    default: 'Unacknowledged',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert; 