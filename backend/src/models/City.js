const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: String,
  centroid: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },
  stats: {
    livingCostIndex: Number,
    rentMedian: Number,
    commuteTips: String,
    safetyNote: String,
    alumCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('City', CitySchema);
