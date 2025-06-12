require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Quiz = require('./models/Quiz');

const QUIZ_JSON_PATH = path.join(__dirname, '../CS5610_KambazQuiz/src/Kambaz/Database/quizs.json');

function toDate(val) {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function transformQuestion(q) {
  // Only keep fields defined in the schema
  return {
    _id: q._id,
    type: q.type,
    title: q.title,
    question: q.question,
    points: q.points,
    choices: Array.isArray(q.choices) ? q.choices.map(c => ({ id: c.id, text: c.text })) : undefined,
    correctOption: q.correctOption,
    correctAnswer: q.correctAnswer,
    possibleAnswers: q.possibleAnswers,
  };
}

function isValidQuestion(q) {
  return q && q._id && q.type && q.title !== undefined && q.question !== undefined && q.points !== undefined;
}

function transformQuiz(q) {
  // Only keep fields defined in the schema
  const questions = Array.isArray(q.questionList)
    ? q.questionList.map(transformQuestion).filter(isValidQuestion)
    : [];
  return {
    _id: q._id,
    title: q.title,
    course: q.course,
    description: q.description,
    points: q.points,
    dueDate: toDate(q.dueDate),
    availableFrom: toDate(q.availableFrom),
    availableUntil: toDate(q.availableUntil),
    published: q.published,
    questions,
    shuffleAnswers: q.shuffleAnswers,
    timeLimit: q.timeLimit,
    attempts: q.attempts,
  };
}

function isValidQuiz(q) {
  return q && q._id && q.title && q.course;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove all existing quizzes
    await Quiz.deleteMany({});
    console.log('Cleared existing quizzes');

    // Read quizzes from JSON
    const quizzesData = JSON.parse(fs.readFileSync(QUIZ_JSON_PATH, 'utf-8'));

    // Transform and validate quizzes
    const quizzes = quizzesData
      .map(transformQuiz)
      .filter(isValidQuiz);

    // Insert quizzes
    await Quiz.insertMany(quizzes);
    console.log(`Seeded ${quizzes.length} quizzes successfully`);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed(); 