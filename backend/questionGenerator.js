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
Message UID: ${Date.now()} - Nonce: ${Math.random().toString(36).substring(2,10)}
Unique ID: ${Date.now()}-${Math.floor(Math.random()*1000)}
Generate 10 unique coding multiple-choice questions in valid JSON format.
Message UID: ${Date.now()} - Nonce: ${Math.random().toString(36).substring(2,10)}
Unique ID: ${Date.now()}-${Math.floor(Math.random()*1000)}
Each of the 10 questions should follow this json format:
{
  "question": "Question text",
  "options": [
    "Option A content",
    "Option B content",
    "Option C content",
    "Option D content"
    ],
  "correct": "Option A content",
  "feedback": "Explanation why A is correct",
  "tags": {
      "difficulty": "{Easy, Medium, Hard}",
      "skillArea": "{Some vague skill area}",
      "language": "{coding language}",
      "concepts": [
        "concept 1",
        "concept 2",...
      ]
    }
}
Message UID: ${Date.now()} - Nonce: ${Math.random().toString(36).substring(2,10)}
Unique ID: ${Date.now()}-${Math.floor(Math.random()*1000)}
Requirements:
- Return only valid JSON (no markdown) (DOUBLE CHECK json FORMAT)(This is critical)
- Include 5 different questions
- Cover various academic subjects
- Ensure options have logical distinctions
- Difficulty levels should vary
Message UID: ${Date.now()} - Nonce: ${Math.random().toString(36).substring(2,10)}
Unique ID: ${Date.now()}-${Math.floor(Math.random()*1000)}
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
