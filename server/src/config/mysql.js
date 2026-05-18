const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Create Sequelize instance using SQLite since MySQL isn't installed locally
const sequelize = new Sequelize({
  dialect: 'sqlite',
  // This will auto-create a file called database.sqlite in your server folder
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false, // Set to console.log to see SQL queries during dev
});

// Function to test the connection (and sync DB)
const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL (SQLite) connected successfully.');
  } catch (error) {
    console.error('❌ SQL connection error:', error.message);
  }
};

module.exports = { sequelize, connectMySQL };
