require("dotenv").config();
const axios = require("axios");
const schedule = require("node-schedule");
const { Question, syncDatabase } = require("./db");
const fs = require("fs/promises");
const path = require("path");
const { populateDatabase } = require("./populate");

// DeepSeek client configuration
const deepseek = axios.create({
  baseURL: process.env.DEEPSEEK_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    "Content-Type": "application/json",
  },
});

const generationPrompt = `
Generate 5 unique multiple-choice questions suitable for a coding or computer science quiz. Format each question as a JSON object following this schema:

{
  "question": "The main question text.",
  "options": [
    "Option A's description",
    "Option B's description",
    "Option C's description",
    "Option D's description"
  ],
  "correct": "The exact content of the correct option (e.g., 'Option A\\'s description')",
  "feedback": "A concise explanation for why the chosen 'correct' option is the right answer and why other options are incorrect or less suitable.",
  "tags": {
    "difficulty": "One of: Easy, Medium, Hard",
    "skillArea": "A relevant domain or skill (e.g., 'Object-Oriented Programming', 'Database Management', 'Front-end Development', 'Operating Systems', 'Cybersecurity')",
    "language": "The primary programming language or technology relevant to the question (e.g., 'Python', 'SQL', 'JavaScript', 'C++', 'General Programming Concepts')",
    "concepts": [
      "Specific concept 1 (e.g., 'Polymorphism')",
      "Specific concept 2 (e.g., 'SQL Joins')",
      "Specific concept 3 (e.g., 'Asynchronous JavaScript')"
    ]
  }
}

Constraints:
- The output must be **valid JSON and nothing else**.
- Each question's options must be clearly distinct and plausible.
- Include a variety of difficulty levels (Easy, Medium, Hard) among the 5 questions.
- Questions should cover a range of academic subjects within computer science or programming.
`;

// Validation function
function validateQuestion(q) {
  return (
    q.question &&
    typeof q.options === "object" &&
    Object.keys(q.options).length === 4 &&
    q.correct &&
    q.options.includes(q.correct) &&
    Array.isArray(q.tags)
  );
}

// Main generation logic
async function generateQuestions() {
  try {
    console.log("[Generator] Starting question generation...");
    const response = await deepseek.post("", {
      messages: [{ role: "user", content: generationPrompt }],
      model: "deepseek-chat",
      response_format: {
        type: 'json_object'
    },
      temperature: 1.2,
    });

    // Remove code block markers
    const rawContent = response.data.choices[0].message.content;
    const cleanedContent = rawContent
      .replace(/```json/g, "") // Remove starting ```json
      .replace(/```/g, "") // Remove any remaining ```
      .trim();

    const data = JSON.parse(cleanedContent);
    console.log("--------RESPONSE-------\n", data);
    const questions = data.questions;
    for (const q of questions) {
      if (validateQuestion(q)) {
        await Question.create({
          question: q.question,
          options: q.options,
          correct: q.correct,
          feedback: q.feedback,
          tags: q.tags,
        });
      }
    }

    console.log(`[Generator] Added ${questions.length} new questions`);
    await exportQuestionsToJson(questions);
  } catch (error) {
    console.error("[Generator] Error:", error);
  }
}

// JSON export function
async function exportQuestionsToJson(newQuestions) {
  try {
    const filePath = path.join(__dirname, "questions.json");
    let existingQuestions = [];

    // Check if file exists and read existing content
    try {
      const data = await fs.readFile(filePath, "utf-8");
      existingQuestions = JSON.parse(data);
    } catch (readError) {
      console.warn("[Generator] No existing questions.json found, creating a new one.");
    }

    // Ensure it's an array before appending
    if (!Array.isArray(existingQuestions)) {
      console.warn("[Generator] Invalid JSON format. Resetting to an empty array.");
      existingQuestions = [];
    }

    // Append new questions
    existingQuestions.push(...newQuestions);

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(existingQuestions, null, 2)).then(() => populateDatabase());

    console.log("[Generator] Updated questions.json");
  } catch (error) {
    console.error("[Generator] Export error:", error);
  }
}

// Service initialization
async function initializeGenerator() {
  await syncDatabase();

  schedule.scheduleJob(process.env.GENERATION_INTERVAL, generateQuestions);
  console.log(
    `[Generator] Service started. Next run: ${process.env.GENERATION_INTERVAL}`
  );
}

module.exports = {
  generateQuestions,
  exportQuestionsToJson,
  initializeGenerator,
};
