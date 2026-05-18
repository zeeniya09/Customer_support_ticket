const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    ticketId: {
      type: Number,
      required: true,
      index: true,
    },
    authorId: {
      type: Number,
      required: true,
    },
    body: { type: String, required: true },
    isInternal: { type: Boolean, default: false }, // internal notes for agents only
  },
  { timestamps: true }
);

commentSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
