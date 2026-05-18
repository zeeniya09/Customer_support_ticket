// SLA deadlines in hours based on ticket priority
const SLA_HOURS = {
  low: 48,
  medium: 24,
  high: 8,
  critical: 4,
};

/**
 * Calculate SLA deadline from now based on priority.
 * @param {string} priority - low | medium | high | critical
 * @returns {Date}
 */
const calculateSLADeadline = (priority) => {
  const hours = SLA_HOURS[priority] || SLA_HOURS.medium;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

module.exports = { SLA_HOURS, calculateSLADeadline };
