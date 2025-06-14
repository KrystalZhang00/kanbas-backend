const express = require('express');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const router = express.Router();

// Helper function to calculate score and correctness
const calculateResults = (quiz, answers) => {
  let score = 0;
  let totalPoints = 0;
  const processedAnswers = [];

  for (const question of quiz.questions) {
    totalPoints += question.points;
    const userAnswer = answers.find(a => a.questionId === question._id)?.userAnswer || "";
    let isCorrect = false;

    if (question.type === "multiple_choice") {
      isCorrect = userAnswer === question.correctOption;
    } else if (question.type === "true_false") {
      isCorrect = (userAnswer === "true" && question.correctAnswer === true) || 
                 (userAnswer === "false" && question.correctAnswer === false);
    } else if (question.type === "fill_in_blank") {
      isCorrect = question.possibleAnswers.some(
        answer => answer.toLowerCase() === userAnswer.toLowerCase()
      );
    }

    if (isCorrect) {
      score += question.points;
    }

    processedAnswers.push({
      questionId: question._id,
      userAnswer,
      isCorrect
    });
  }

  return { score, totalPoints, answers: processedAnswers };
};

// POST /api/quizzes/:quizId/attempts
router.post('/api/quizzes/:quizId/attempts', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { user, startTime, attemptNumber } = req.body;

    // Get quiz to validate and get total points
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is available using user's local time (from startTime)
    const userTime = new Date(startTime); // Use user's local time instead of server time
    const availableFrom = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
    const availableUntil = quiz.availableUntil ? new Date(quiz.availableUntil) : null;
    
    if ((availableFrom && userTime < availableFrom) || (availableUntil && userTime > availableUntil)) {
      return res.status(400).json({ error: 'Quiz is not available at this time' });
    }

    // Check attempt limit
    const previousAttempts = await QuizAttempt.countDocuments({ quiz: quizId, user });
    if (quiz.attempts && previousAttempts >= quiz.attempts) {
      return res.status(400).json({ error: 'Maximum attempts reached' });
    }

    // Create new attempt
    const attempt = await QuizAttempt.create({
      _id: Date.now().toString(),
      quiz: quizId,
      user,
      startTime: startTime,
      totalPoints: quiz.points || 0,
      answers: [],
      attemptNumber
    });

    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quiz attempt', details: err.message });
  }
});

// PUT /api/quiz-attempts/:attemptId/submit
router.put('/api/quiz-attempts/:attemptId/submit', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, submitTime } = req.body;

    // Get the attempt
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get the quiz
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is still available using user's local time
    const userSubmitTime = submitTime ? new Date(submitTime) : new Date();
    const dueDate = quiz.dueDate ? new Date(quiz.dueDate) : null;
    
    if (dueDate && userSubmitTime > dueDate) {
      return res.status(400).json({ error: 'Quiz is past due date' });
    }

    // Calculate results
    const { score, totalPoints, answers: processedAnswers } = calculateResults(quiz, answers);

    // Update attempt - store as string to maintain consistency
    attempt.endTime = submitTime || (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })();
    attempt.score = score;
    attempt.totalPoints = totalPoints;
    attempt.answers = processedAnswers;
    await attempt.save();

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit quiz attempt', details: err.message });
  }
});

// GET /api/quizzes/:quizId/attempts
router.get('/api/quizzes/:quizId/attempts', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { user } = req.query;  // Optional user filter

    const query = { quiz: quizId };
    if (user) {
      query.user = user;
    }

    const attempts = await QuizAttempt.find(query)
      .sort({ startTime: -1 });  // Most recent first

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz attempts', details: err.message });
  }
});

module.exports = router; 