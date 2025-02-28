const express = require("express");
const cors = require("cors");
const path = require("path");
const { Question, syncDatabase } = require('./db');  // Import sequelize models

const app = express();
const port = 5000;

app.use((req, res, next) => {
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    console.log('Request Headers:', req.headers);
    if (req.method === 'POST' || req.method === 'PUT') {
        req.on('data', chunk => {
            console.log('Request Body:', chunk.toString());
        });
    }
    next(); // Move to the next middleware or route handler
});

app.use(cors({
    origin: 'http://localhost:5174',  // Allow only this origin
    methods: ['GET', 'POST'],  // Allow only GET and POST methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers
}));

// Sync the database (create tables if needed)
syncDatabase();

app.get("/questions", async (req, res) => {
    try {
        const questions = await Question.findAll({
            attributes: ['id', 'question', 'options', 'totalAttempts', 'correctAttempts']  // Return only necessary fields
        });
        res.json(questions);
    } catch (err) {
        console.error("Error fetching questions:", err);
        res.status(500).send({ error: "Error fetching questions" });
    }
});

app.post("/check", express.json(), async (req, res) => {
    const { questionID, answer } = req.body;
    
    try {
        // Find the question by ID
        const question = await Question.findOne({ where: { id: questionID } });

        if (!question) return res.status(404).send({ error: "Question not found" });

        // Update totalAttempts and correctAttempts
        question.totalAttempts += 1;
        if (answer === question.correct) {
            question.correctAttempts += 1;
        }

        // Save the updated question
        await question.save();

        if (answer === question.correct) {
            res.send({ correct: true,
                correctAttempts: question.correctAttempts,
                totalAttempts: question.totalAttempts
             });
        } else {
            res.send({ correct: false, 
                feedback: question.feedback, 
                correctAttempts: question.correctAttempts,
                totalAttempts: question.totalAttempts
            });
        }
    } catch (err) {
        console.error("Error checking answer:", err);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
