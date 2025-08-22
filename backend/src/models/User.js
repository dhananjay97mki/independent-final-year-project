const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'alumni'], required: true },
  passoutYear: Number,
  batch: String,
  department: String,
  currentCity: {
    name: String,
    country: String,
    loc: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
    }
  },
  placement: {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    role: String,
    officeCity: String,
    startDate: Date
  },
  companiesFollowed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
  avatar: String,
  preferences: {
    allowMap: { type: Boolean, default: true },
    allowDM: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
