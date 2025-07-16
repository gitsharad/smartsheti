const User = require('../models/User');
const Field = require('../models/Field');
const { logger } = require('../utils/logger');

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let fields = [];
    if (user.role === 'farmer') {
      fields = await Field.find({ owner: user._id });
    } else if (user.role === 'coordinator') {
      fields = await Field.find({ 'assignedTo.user': user._id });
    } else if (user.role === 'admin') {
      fields = await Field.find({});
    }
    res.json({
      message: {
        english: 'Profile retrieved successfully',
        marathi: 'प्रोफाइल यशस्वीरित्या प्राप्त झाले'
      },
      user,
      fields
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(400).json({
      error: 'Failed to get profile',
      message: {
        english: 'Unable to retrieve profile',
        marathi: 'प्रोफाइल प्राप्त करण्यात अयशस्वी'
      }
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'phoneNumber', 'preferredLanguage', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({
      error: 'Invalid updates',
      message: {
        english: 'Some update fields are not allowed',
        marathi: 'काही अपडेट फील्ड्स अनुमत नाहीत'
      }
    });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();

    res.json({
      message: {
        english: 'Profile updated successfully',
        marathi: 'प्रोफाइल यशस्वीरित्या अपडेट झाले'
      },
      user: req.user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({
      error: 'Update failed',
      message: {
        english: 'Unable to update profile',
        marathi: 'प्रोफाइल अपडेट करण्यात अयशस्वी'
      }
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
}; 