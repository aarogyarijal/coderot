const { Sequelize, DataTypes } = require('sequelize');

// Set up a SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'  // Path to SQLite database file
});

// Define the Question model
const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question: {
    type: DataTypes.STRING,
    allowNull: false
  },
  options: {
    type: DataTypes.JSONB,  // Store options as a JSON object
    allowNull: false
  },
  correct: {
    type: DataTypes.STRING,
    allowNull: false
  },
  feedback: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  correctAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Sync the database (create tables if they don't exist)
const syncDatabase = async () => {
  await sequelize.sync({ force: false });  // Don't drop tables if they already exist
};

module.exports = { sequelize, Question, syncDatabase };
