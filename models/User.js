const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    minlength: 3,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 3
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  dob: { 
    type: String, 
    required: false  // Optional field based on your signup form
  },
  role: { 
    type: String, 
    required: true,
    enum: ['STUDENT', 'FACULTY', 'TA', 'ADMIN'],
    default: 'STUDENT'
  },
  loginId: { 
    type: String, 
    required: true,
    unique: true
  },
  section: { 
    type: String, 
    required: true,
    default: 'S101'
  },
  lastActivity: { 
    type: String, 
    required: true
  },
  totalActivity: { 
    type: String, 
    required: true,
    default: '00:00:00'
  }
}, {
  timestamps: false,  // Don't add createdAt/updatedAt since we have our own fields
  _id: false  // Use our custom _id field
});

// Note: Indexes are automatically created by unique: true in schema fields

module.exports = mongoose.model('User', UserSchema); 