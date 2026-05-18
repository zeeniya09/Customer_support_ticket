const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number }, // bytes
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
