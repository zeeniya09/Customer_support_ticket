const Ticket = require('../models/Ticket');
const User = require('../models/User');

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
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'agent' }),
    ]);

    // Average satisfaction
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
    const agentStats = await Ticket.aggregate([
      { $match: { assignedAgent: { $ne: null } } },
      {
        $group: {
          _id: '$assignedAgent',
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          avgRating: { $avg: '$satisfaction.rating' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentName: '$agent.name',
          agentEmail: '$agent.email',
          totalAssigned: 1,
          resolved: 1,
          resolutionRate: {
            $cond: [
              { $gt: ['$totalAssigned', 0] },
              { $round: [{ $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100] }, 1] },
              0,
            ],
          },
          avgRating: { $round: ['$avgRating', 1] },
        },
      },
      { $sort: { resolved: -1 } },
    ]);

    res.json({ agentStats });
  } catch (error) {
    next(error);
  }
};
