const Ticket = require('../models/sql/Ticket');
const User = require('../models/sql/User');
const { sequelize } = require('../config/mysql');
const { Op } = require('sequelize');

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
      Ticket.count(),
      Ticket.count({ where: { status: 'open' } }),
      Ticket.count({ where: { status: 'in_progress' } }),
      Ticket.count({ where: { status: 'resolved' } }),
      Ticket.count({ where: { status: 'closed' } }),
      Ticket.count({ where: { priority: 'critical', status: { [Op.in]: ['open', 'in_progress'] } } }),
      User.count({ where: { role: 'customer' } }),
      User.count({ where: { role: 'agent' } }),
    ]);

    // Average satisfaction
    const satResult = await Ticket.findAll({
      where: { satisfactionRating: { [Op.ne]: null } },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('satisfactionRating')), 'avg'],
        [sequelize.fn('COUNT', sequelize.col('satisfactionRating')), 'count']
      ],
      raw: true,
    });

    const avgVal = satResult[0].avg ? parseFloat(satResult[0].avg) : 0;
    const avgSatisfaction = Math.round(avgVal * 10) / 10;
    const totalRatings = satResult[0].count || 0;

    // Tickets by category
    const byCategory = await Ticket.findAll({
      attributes: [
        ['category', '_id'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: 'category',
      order: [[sequelize.col('count'), 'DESC']],
      raw: true,
    });

    // Tickets by priority
    const byPriority = await Ticket.findAll({
      attributes: [
        ['priority', '_id'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: 'priority',
      raw: true,
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Tickets per day - Requires raw grouping strategy in SQL format
    // Date extraction syntax depends slightly on standard SQL
    const perDayQuery = `
      SELECT DATE(createdAt) as _id, COUNT(id) as count 
      FROM tickets 
      WHERE createdAt >= :thirtyDaysAgo 
      GROUP BY DATE(createdAt) 
      ORDER BY DATE(createdAt) ASC
    `;
    const perDay = await sequelize.query(perDayQuery, {
      replacements: { thirtyDaysAgo },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      overview: {
        totalTickets, openTickets, inProgressTickets, resolvedTickets,
        closedTickets, criticalTickets, totalCustomers, totalAgents,
        avgSatisfaction, totalRatings,
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
    const rawQuery = `
      SELECT 
        u.id, 
        u.name as agentName, 
        u.email as agentEmail,
        COUNT(t.id) as totalAssigned,
        SUM(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved,
        AVG(t.satisfactionRating) as avgRating
      FROM users u
      JOIN tickets t ON u.id = t.assignedAgentId
      WHERE u.role = 'agent'
      GROUP BY u.id
      ORDER BY resolved DESC
    `;
    const agents = await sequelize.query(rawQuery, { type: sequelize.QueryTypes.SELECT });

    const agentStats = agents.map(a => {
      const total = parseInt(a.totalAssigned) || 0;
      const resolved = parseInt(a.resolved) || 0;
      const resRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;
      return {
        ...a,
        totalAssigned: total,
        resolved,
        resolutionRate: resRate,
        avgRating: a.avgRating ? Math.round(parseFloat(a.avgRating) * 10) / 10 : 0,
      };
    });

    res.json({ agentStats });
  } catch (error) {
    next(error);
  }
};
