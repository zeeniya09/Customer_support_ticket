const User = require('../models/User'); // MongoDB

// GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const mappedUsers = users.map(u => {
      const uObj = u.toJSON();
      uObj.id = u._id;
      return uObj;
    });

    res.json({
      users: mappedUsers,
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
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const uObj = user.toJSON();
    uObj.id = user._id;
    res.json({ user: uObj });
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

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.role = role;
    await user.save();

    const uObj = user.toJSON();
    uObj.id = user._id;

    res.json({ message: 'User role updated', user: uObj });
  } catch (error) {
    next(error);
  }
};

