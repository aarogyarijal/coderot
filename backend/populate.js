const fs = require('fs');
const { Question, sequelize } = require('./db');

// Function to populate database using questions from questions.json
const populateDatabase = async () => {
  try {
    // Read the questions from questions.json file
    const rawData = fs.readFileSync('./questions.json', { encoding: 'utf8', flag: 'r' }).trim();
    if (!rawData) throw new Error("JSON file is empty.");
    console.log("Raw Data:", rawData); // Debugging step
    const questionsData = JSON.parse(rawData);
    console.log("Parsed Data:", questionsData);
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
        tags: question.tags || []
      });
    }

    console.log("Database populated with questions from questions.json!");
  } catch (err) {
    console.error("Error populating the database:", err);
  }
};

module.exports = {
  // Call the function to populate the database
  populateDatabase
}