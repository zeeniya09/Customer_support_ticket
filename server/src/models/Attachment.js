const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    ticketId: {
      type: Number,
      required: true,
      index: true,
    },
    uploadedById: {
      type: Number,
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
