const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  type: { type: String, enum: ['multiple_choice', 'true_false', 'fill_in_blank'], required: true },
  title: String,
  question: String,
  points: Number,
  choices: [{ id: String, text: String }], // for multiple choice
  correctOption: String, // for multiple choice
  correctAnswer: Boolean, // for true/false
  possibleAnswers: [String], // for fill in blank
});

const QuizSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  course: { type: String, required: true }, // course ID
  description: String,
  points: Number,
  dueDate: String,
  availableFrom: String,
  availableUntil: String,
  published: Boolean,
  questions: [QuestionSchema],
  shuffleAnswers: Boolean,
  timeLimit: Number,
  attempts: Number,
  multipleAttempts: Boolean,
  showCorrectAnswers: String,
  quizType: { type: String, enum: ['Graded Quiz', 'Practice Quiz', 'Graded Survey', 'Ungraded Survey'], default: 'Graded Quiz' },
  assignmentGroup: { type: String, enum: ['Quizzes', 'Exams', 'Assignments', 'Project'], default: 'Quizzes' },
  accessCode: { type: String, default: '' },
  oneQuestionAtTime: { type: Boolean, default: true },
  webcamRequired: { type: Boolean, default: false },
  lockQuestionsAfterAnswering: { type: Boolean, default: false }
});

module.exports = mongoose.model('Quiz', QuizSchema); 