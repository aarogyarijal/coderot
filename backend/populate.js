const fs = require('fs');
const { Question, sequelize } = require('./db');

// Function to populate database using questions from questions.json
const populateDatabase = async () => {
  try {
    // Read the questions from questions.json file
    const questionsData = JSON.parse(fs.readFileSync('./questions.json', 'utf-8'));

    // Sync database (create tables if they don't exist)
    await sequelize.sync({ force: true });  // This will drop existing tables and create them again

    // Insert each question into the database
    for (const question of questionsData) {
      await Question.create({
        question: question.question,
        options: question.options,
        correct: question.correct,
        feedback: question.feedback,
        totalAttempts: question.totalAttempts || 0,
        correctAttempts: question.correctAttempts || 0,
      });
    }

    console.log("Database populated with questions from questions.json!");
  } catch (err) {
    console.error("Error populating the database:", err);
  }
};

// Call the function to populate the database
populateDatabase();
