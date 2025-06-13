const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  userAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
});

const QuizAttemptSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  quiz: { type: String, required: true, ref: 'Quiz' },
  user: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  score: { type: Number, default: 0 },
  totalPoints: { type: Number, required: true },
  answers: [AnswerSchema],
  attemptNumber: { type: Number, required: true }
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema); 