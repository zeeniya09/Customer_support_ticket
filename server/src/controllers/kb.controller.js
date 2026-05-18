const KnowledgeBase = require('../models/KnowledgeBase'); // MongoDB
const ActivityLog = require('../models/ActivityLog'); // MongoDB
const User = require('../models/sql/User'); // MySQL

// GET /api/kb
exports.getArticles = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Non-admins only see published articles
    if (!req.user || req.user.role !== 'admin') {
      filter.published = true;
    }

    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [articles, total] = await Promise.all([
      KnowledgeBase.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      KnowledgeBase.countDocuments(filter),
    ]);

    // Cross DB User fetch
    const authorIds = [...new Set(articles.map(a => a.authorId))];
    const users = await User.findAll({ where: { id: authorIds }, attributes: ['id', 'name'] });
    const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
    
    const populated = articles.map(a => {
      const aObj = a.toObject();
      aObj.author = userMap[a.authorId] || null;
      return aObj;
    });

    res.json({
      articles: populated,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/kb/:slug
exports.getArticle = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findOne({ slug: req.params.slug });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const author = await User.findByPk(article.authorId, { attributes: ['id', 'name'] });
    const popArticle = article.toObject();
    popArticle.author = author;

    // Increment views
    article.views += 1;
    await article.save();

    res.json({ article: popArticle });
  } catch (error) {
    next(error);
  }
};

// POST /api/kb
exports.createArticle = async (req, res, next) => {
  try {
    const { title, content, category, published } = req.body;

    const article = await KnowledgeBase.create({
      title,
      content,
      category: category || 'faq',
      published: published !== undefined ? published : false,
      authorId: req.user.id,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: 'kb_article_created',
      entity: 'KnowledgeBase',
      entityId: article._id, // Mongo ID stays inside Mongo
    });

    res.status(201).json({ message: 'Article created', article });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/kb/:id
exports.updateArticle = async (req, res, next) => {
  try {
    const updates = {};
    const allowed = ['title', 'content', 'category', 'published'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const article = await KnowledgeBase.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!article) return res.status(404).json({ message: 'Article not found' });

    await ActivityLog.create({
      userId: req.user.id,
      action: 'kb_article_updated',
      entity: 'KnowledgeBase',
      entityId: article._id,
    });

    res.json({ message: 'Article updated', article });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/kb/:id
exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    res.json({ message: 'Article deleted' });
  } catch (error) {
    next(error);
  }
};
