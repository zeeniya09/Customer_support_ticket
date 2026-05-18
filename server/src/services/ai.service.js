/**
 * Simple keyword-based ticket categorization.
 * Can be replaced with a real AI/ML model in production.
 */

const CATEGORY_KEYWORDS = {
  billing: [
    'payment', 'invoice', 'charge', 'refund', 'billing',
    'subscription', 'plan', 'price', 'cost', 'credit card',
  ],
  technical: [
    'error', 'bug', 'crash', 'slow', 'not working', 'broken',
    'api', 'server', 'database', 'timeout', 'performance',
  ],
  account: [
    'login', 'password', 'reset', 'account', 'profile',
    'register', 'sign up', 'two-factor', '2fa', 'locked',
  ],
  bug: [
    'bug', 'defect', 'issue', 'glitch', 'malfunction',
    'incorrect', 'wrong', 'unexpected behavior',
  ],
  feature_request: [
    'feature', 'request', 'suggestion', 'improve', 'enhancement',
    'wish', 'would like', 'add support for',
  ],
};

const PRIORITY_KEYWORDS = {
  critical: ['urgent', 'critical', 'emergency', 'down', 'outage', 'blocker', 'production down'],
  high: ['important', 'asap', 'high priority', 'cannot use', 'data loss'],
  low: ['minor', 'cosmetic', 'nice to have', 'low priority', 'when possible'],
};

/**
 * Auto-detect category based on title + description.
 * Returns best match or 'general'.
 */
const detectCategory = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  let bestCategory = 'general';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
};

/**
 * Auto-detect priority based on title + description.
 * Returns best match or 'medium'.
 */
const detectPriority = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return priority;
    }
  }

  return 'medium';
};

module.exports = { detectCategory, detectPriority };
