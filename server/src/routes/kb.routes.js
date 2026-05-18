const express = require('express');
const router = express.Router();
const kbController = require('../controllers/kb.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public access for reading published articles
router.get('/', kbController.getArticles);
router.get('/:slug', kbController.getArticle);

// Admin-only for creating/editing
router.post('/', authenticate, authorize('admin'), kbController.createArticle);
router.patch('/:id', authenticate, authorize('admin'), kbController.updateArticle);
router.delete('/:id', authenticate, authorize('admin'), kbController.deleteArticle);

module.exports = router;
