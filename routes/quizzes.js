const express = require('express');
const Quiz = require('../models/Quiz');

const router = express.Router();

// GET /api/courses/:courseId/quizzes
router.get('/api/courses/:courseId/quizzes', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { role } = req.query; // Get user role from query parameter
    
    let filter = { course: courseId };
    
    // Students should only see published quizzes
    if (role === 'STUDENT') {
      filter.published = true;
    }
    // Faculty/Admin can see all quizzes (published and unpublished)
    
    const quizzes = await Quiz.find(filter);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quizzes', details: err.message });
  }
});

// POST /api/courses/:courseId/quizzes
router.post('/api/courses/:courseId/quizzes', async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizData = req.body;
    // Ensure course is set
    quizData.course = courseId;
    // Generate a unique _id if not provided
    if (!quizData._id) {
      quizData._id = Date.now().toString();
    }
    // Ensure questions is an array
    quizData.questions = Array.isArray(quizData.questions) ? quizData.questions : [];
    const quiz = await Quiz.create(quizData);
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quiz', details: err.message });
  }
});

// PUT /api/quizzes/:quizId
router.put('/api/quizzes/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const updatedQuiz = req.body;
    // Ensure questions is an array
    updatedQuiz.questions = Array.isArray(updatedQuiz.questions) ? updatedQuiz.questions : [];
    const quiz = await Quiz.findOneAndUpdate({ _id: quizId }, updatedQuiz, { new: true });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quiz', details: err.message });
  }
});

module.exports = router; 