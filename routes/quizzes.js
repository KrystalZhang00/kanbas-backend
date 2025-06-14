const express = require('express');
const Quiz = require('../models/Quiz');

const router = express.Router();

// Middleware to check if user has faculty/admin permissions
const requireFacultyRole = (req, res, next) => {
  const { role } = req.query;
  // Check if body has userRole, if yes use it, if not use query role
  const userRole = req.body && req.body.userRole ? req.body.userRole : role;
  
  if (userRole !== 'FACULTY' && userRole !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Access denied. Faculty or Admin role required for this operation.' 
    });
  }
  next();
};

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

// GET /api/quizzes/:quizId - Get single quiz
router.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { role } = req.query;
    
    const quiz = await Quiz.findOne({ _id: quizId });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Students can only view published quizzes
    if (role === 'STUDENT' && !quiz.published) {
      return res.status(403).json({ error: 'Quiz not available' });
    }
    
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz', details: err.message });
  }
});

// POST /api/courses/:courseId/quizzes - FACULTY/ADMIN ONLY
router.post('/api/courses/:courseId/quizzes', requireFacultyRole, async (req, res) => {
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

// PUT /api/quizzes/:quizId - FACULTY/ADMIN ONLY
router.put('/api/quizzes/:quizId', requireFacultyRole, async (req, res) => {
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

// DELETE /api/quizzes/:quizId - FACULTY/ADMIN ONLY
router.delete('/api/quizzes/:quizId', requireFacultyRole, async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findOneAndDelete({ _id: quizId });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully', quiz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quiz', details: err.message });
  }
});

module.exports = router; 