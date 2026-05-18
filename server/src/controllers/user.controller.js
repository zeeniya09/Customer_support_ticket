const User = require('../models/sql/User'); // MySQL
const ActivityLog = require('../models/ActivityLog'); // MongoDB
const { Op } = require('sequelize');

// GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Sequelize parallel querying
    const [users, total] = await Promise.all([
      User.findAll({
        where: filter,
        order: [['createdAt', 'DESC']],
        offset: offset,
        limit: parseInt(limit),
      }),
      User.count({ where: filter }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/role
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.role = role;
    await user.save();

    // Log the change in MongoDB for the MySQL user
    await ActivityLog.create({
      userId: req.user.id,
      action: 'user_role_changed',
      entity: 'User',
      entityId: user.id,
      metadata: { newRole: role },
    });

    res.json({ message: 'User role updated', user });
  } catch (error) {
    next(error);
  }
};
