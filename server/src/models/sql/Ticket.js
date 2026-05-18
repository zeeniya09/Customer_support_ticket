const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');
const User = require('./User'); // Import for relationships

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ticketId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('billing', 'technical_issue', 'account_access', 'feature_request', 'general_inquiry', 'uncategorized'),
    defaultValue: 'uncategorized',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'low',
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  // MySQL Foreign keys
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  assignedAgentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  slaDeadline: {
    type: DataTypes.DATE,
  },
  satisfactionRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  satisfactionFeedback: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'tickets',
  timestamps: true,
});

// Relationships
User.hasMany(Ticket, { foreignKey: 'customerId', as: 'customerTickets' });
Ticket.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Ticket, { foreignKey: 'assignedAgentId', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedAgentId', as: 'assignedAgent' });

module.exports = Ticket;
