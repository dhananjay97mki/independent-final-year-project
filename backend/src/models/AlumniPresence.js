const mongoose = require('mongoose');
// Aggregated presence counts, not individual users
const AlumniPresenceSchema = new mongoose.Schema({
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  counts: {
    total: { type: Number, default: 0 },
    byBatch: { type: Map, of: Number, default: {} },
    byCompany: { type: Map, of: Number, default: {} }
  },
  lastComputedAt: Date
});

module.exports = mongoose.model('AlumniPresence', AlumniPresenceSchema);
