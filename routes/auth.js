const express = require('express');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/signin
router.post('/api/auth/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password (plain text comparison since no hashing)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last activity
    user.lastActivity = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await user.save();

    // Create session
    req.session.currentUser = {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      loginId: user.loginId,
      section: user.section,
      lastActivity: user.lastActivity,
      totalActivity: user.totalActivity
    };

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/signup
router.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, verifyPassword, firstName, lastName, email, dob, role } = req.body;

    // Validate required fields
    if (!username || !password || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    // Validate password match
    if (password !== verifyPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password length
    if (password.length < 3) {
      return res.status(400).json({ error: 'Password must be at least 3 characters long' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create new user
    const currentDate = new Date().toISOString().split('T')[0];
    const newUser = new User({
      _id: new Date().getTime().toString(),
      username: username.trim(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      dob: dob || currentDate,
      role: role || 'STUDENT',
      loginId: `00${new Date().getTime()}S`,
      section: 'S101',
      lastActivity: currentDate,
      totalActivity: '00:00:00'
    });

    await newUser.save();

    // Create session for new user
    req.session.currentUser = {
      _id: newUser._id,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      loginId: newUser.loginId,
      section: newUser.section,
      lastActivity: newUser.lastActivity,
      totalActivity: newUser.totalActivity
    };

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/profile - Get current user profile
router.get('/api/auth/profile', (req, res) => {
  if (!req.session.currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json(req.session.currentUser);
});

// PUT /api/auth/profile - Update user profile
router.put('/api/auth/profile', async (req, res) => {
  try {
    if (!req.session.currentUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.currentUser._id;
    const { firstName, lastName, email, dob } = req.body;

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (dob) user.dob = dob;

    await user.save();

    // Update session
    req.session.currentUser = {
      ...req.session.currentUser,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dob: user.dob
    };

    // Return updated user data (without password)
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Profile update error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/auth/check - Check if user is authenticated
router.get('/api/auth/check', (req, res) => {
  if (req.session.currentUser) {
    res.json({ authenticated: true, user: req.session.currentUser });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router; 