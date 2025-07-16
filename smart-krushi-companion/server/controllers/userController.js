const User = require('../models/User');
const Field = require('../models/Field');
const { logger } = require('../utils/logger');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Register new user (with role-based validation)


// Get users based on role hierarchy
const getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'admin') {
      // Admin can see all users
      if (role) query.role = role;
    } else if (req.user.role === 'coordinator') {
      // Coordinator can only see managed farmers
      query.role = 'farmer';
      query.managedBy = req.user._id;
    } else {
      // Farmers can only see themselves
      query._id = req.user._id;
    }

    // Status filtering
    if (status) query.isActive = status === 'active';

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('managedBy', 'name email role')
      .populate('managedUsers', 'name email role')
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalUsers: total
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: {
        english: 'Failed to fetch users',
        marathi: 'वापरकर्ते मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Get user by ID (with access control)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Use targetUser from middleware if available
    const user = req.targetUser || await User.findById(userId)
      .populate('managedBy', 'name email role')
      .populate('managedUsers', 'name email role')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: {
          english: 'User not found',
          marathi: 'वापरकर्ता सापडला नाही'
        }
      });
    }

    // Get user's fields
    const fields = await Field.find({ owner: user._id })
      .select('name fieldId location currentCrop status')
      .limit(5);

    // Get user statistics
    const stats = await getUserStats(user._id);

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        fields,
        stats
      }
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: {
        english: 'Failed to fetch user details',
        marathi: 'वापरकर्ता तपशील मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Update user (with role-based restrictions)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Use targetUser from middleware
    const user = req.targetUser;
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: {
          english: 'User not found',
          marathi: 'वापरकर्ता सापडला नाही'
        }
      });
    }

    // Prevent role changes through this endpoint
    if (updateData.role) {
      delete updateData.role;
    }

    // Prevent managedBy changes through this endpoint
    if (updateData.managedBy) {
      delete updateData.managedBy;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...updateData, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: {
        english: 'User updated successfully',
        marathi: 'वापरकर्ता यशस्वीरित्या अद्ययावत केला'
      },
      user: updatedUser
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: {
        english: 'Failed to update user',
        marathi: 'वापरकर्ता अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

// Delete user (with cascade handling)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Use targetUser from middleware
    const user = req.targetUser;
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: {
          english: 'User not found',
          marathi: 'वापरकर्ता सापडला नाही'
        }
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Self-deletion not allowed',
        message: {
          english: 'You cannot delete your own account',
          marathi: 'तुम्ही तुमचे स्वतःचे खाते हटवू शकत नाही'
        }
      });
    }

    // Handle managed users
    if (user.managedUsers.length > 0) {
      // Reassign managed users to admin or delete them
      if (req.user.role === 'admin') {
        // Admin can reassign or delete
        await User.updateMany(
          { managedBy: user._id },
          { managedBy: req.user._id }
        );
      } else {
        return res.status(400).json({
          error: 'Cannot delete user with managed users',
          message: {
            english: 'Cannot delete user who manages other users',
            marathi: 'इतर वापरकर्त्यांचे व्यवस्थापन करणाऱ्या वापरकर्त्याला हटवू शकत नाही'
          }
        });
      }
    }

    // Handle owned fields
    const ownedFields = await Field.find({ owner: user._id });
    if (ownedFields.length > 0) {
      // Reassign fields to manager or delete them
      if (req.user.role === 'admin') {
        await Field.updateMany(
          { owner: user._id },
          { owner: req.user._id }
        );
      } else {
        return res.status(400).json({
          error: 'Cannot delete user with owned fields',
          message: {
            english: 'Cannot delete user who owns fields',
            marathi: 'शेतांचे मालक असलेल्या वापरकर्त्याला हटवू शकत नाही'
          }
        });
      }
    }

    // Remove from manager's managedUsers array
    if (user.managedBy) {
      await User.findByIdAndUpdate(user.managedBy, {
        $pull: { managedUsers: user._id }
      });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: {
        english: 'User deleted successfully',
        marathi: 'वापरकर्ता यशस्वीरित्या हटवला गेला'
      }
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: {
        english: 'Failed to delete user',
        marathi: 'वापरकर्ता हटवण्यात अयशस्वी'
      }
    });
  }
};

// Get user statistics
const getUserStats = async (userId) => {
  try {
    const fields = await Field.find({ owner: userId });
    const activeFields = fields.filter(f => f.status === 'active');
    
    return {
      totalFields: fields.length,
      activeFields: activeFields.length,
      totalArea: fields.reduce((sum, f) => sum + (f.areaInAcres || 0), 0),
      currentCrops: activeFields.map(f => f.currentCrop?.name).filter(Boolean),
      lastActivity: fields.length > 0 ? Math.max(...fields.map(f => f.updatedAt)) : null
    };
  } catch (error) {
    logger.error('Get user stats error:', error);
    return {};
  }
};

// Get user profile (for mobile app)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('managedBy', 'name email role')
      .select('-password');

    // Get user's fields
    const fields = await Field.find({ owner: user._id })
      .select('name fieldId location currentCrop status')
      .sort({ updatedAt: -1 });

    // Get statistics
    const stats = await getUserStats(user._id);

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        fields,
        stats
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: {
        english: 'Failed to fetch profile',
        marathi: 'प्रोफाइल मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, location, profile, notifications } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        name, 
        phoneNumber, 
        location, 
        profile, 
        notifications,
        lastUpdatedBy: req.user._id 
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: {
        english: 'Profile updated successfully',
        marathi: 'प्रोफाइल यशस्वीरित्या अद्ययावत केले'
      },
      user: updatedUser
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: {
        english: 'Failed to update profile',
        marathi: 'प्रोफाइल अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: {
          english: 'Current password is incorrect',
          marathi: 'सध्याचा संकेतशब्द चुकीचा आहे'
        }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: {
        english: 'Password changed successfully',
        marathi: 'संकेतशब्द यशस्वीरित्या बदलला गेला'
      }
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: {
        english: 'Failed to change password',
        marathi: 'संकेतशब्द बदलण्यात अयशस्वी'
      }
    });
  }
};

module.exports = {
//  register,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  changePassword
}; 