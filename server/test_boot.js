const fs = require('fs');
try {
  require('./src/index.js');
} catch (e) {
  fs.writeFileSync('err.json', JSON.stringify({ message: e.message, stack: e.stack }), 'utf-8');
}
