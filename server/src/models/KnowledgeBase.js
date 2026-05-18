const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['getting_started', 'billing', 'technical', 'faq', 'policies', 'other'],
      default: 'faq',
    },
    authorId: {
      type: Number,
      required: true,
    },
    published: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug from title
knowledgeBaseSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

knowledgeBaseSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
