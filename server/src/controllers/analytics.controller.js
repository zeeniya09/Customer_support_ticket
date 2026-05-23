const Ticket = require('../models/Ticket'); // MongoDB
const User = require('../models/sql/User'); // SQL
const { sequelize } = require('../config/mysql');

// GET /api/analytics/overview
exports.getOverview = async (req, res, next) => {
  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      totalCustomers,
      totalAgents,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ status: 'closed' }),
      Ticket.countDocuments({ priority: 'critical', status: { $in: ['open', 'in_progress'] } }),
      User.count({ where: { role: 'customer' } }),
      User.count({ where: { role: 'agent' } }),
    ]);

    // Average satisfaction via MongoDB aggregation
    const satResult = await Ticket.aggregate([
      { $match: { 'satisfaction.rating': { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$satisfaction.rating' }, count: { $sum: 1 } } },
    ]);

    const avgSatisfaction = satResult.length > 0 ? Math.round(satResult[0].avg * 10) / 10 : 0;
    const totalRatings = satResult.length > 0 ? satResult[0].count : 0;

    // Tickets by category
    const byCategory = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Tickets by priority
    const byPriority = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Tickets created per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const perDay = await Ticket.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      overview: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        criticalTickets,
        totalCustomers,
        totalAgents,
        avgSatisfaction,
        totalRatings,
      },
      byCategory,
      byPriority,
      perDay,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/agents
exports.getAgentPerformance = async (req, res, next) => {
  try {
    // 1. Get performance stats from MongoDB
    const agentStats = await Ticket.aggregate([
      { $match: { assignedAgentId: { $ne: null } } },
      {
        $group: {
          _id: '$assignedAgentId',
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          avgRating: { $avg: '$satisfaction.rating' },
        },
      },
    ]);

    // 2. Fetch Agent names from SQL
    const agentIds = agentStats.map(s => s._id);
    const agents = await User.findAll({
      where: { id: agentIds },
      attributes: ['id', 'name', 'email']
    });
    
    const userMap = agents.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    // 3. Merge data
    const finalStats = agentStats.map(stat => {
      const agent = userMap[stat._id] || { name: 'Unknown', email: 'N/A' };
      return {
        agentName: agent.name,
        agentEmail: agent.email,
        totalAssigned: stat.totalAssigned,
        resolved: stat.resolved,
        resolutionRate: stat.totalAssigned > 0 
          ? Math.round((stat.resolved / stat.totalAssigned) * 1000) / 10 
          : 0,
        avgRating: stat.avgRating ? Math.round(stat.avgRating * 10) / 10 : 0,
      };
    }).sort((a, b) => b.resolved - a.resolved);

    res.json({ agentStats: finalStats });
  } catch (error) {
    next(error);
  }
};
