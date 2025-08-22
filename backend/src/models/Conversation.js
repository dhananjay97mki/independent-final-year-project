const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['dm', 'city', 'company'], required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' }, // if city chat
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // if company chat
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
