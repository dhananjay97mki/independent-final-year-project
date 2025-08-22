const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  logo: String,
  domains: [String],
  cities: [String]
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
