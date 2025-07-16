const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { 
  auth, 
  authorize, 
  hasPermission, 
  canManageUser,
  mobileAppAccess,
  webAppAccess 
} = require('../middleware/auth');



// Apply authentication to all routes
router.use(auth);

// Mobile app access control (read-only for farmers)
router.use(mobileAppAccess);

// Web app access control
router.use(webAppAccess);

// Public routes (for authenticated users)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Admin routes
//router.post('/register', authorize('admin'), userController.register);
router.get('/users', authorize('admin', 'coordinator'), userController.getUsers);
router.get('/users/:userId', authorize('admin', 'coordinator'), canManageUser, userController.getUserById);
router.put('/users/:userId', authorize('admin', 'coordinator'), canManageUser, userController.updateUser);
router.delete('/users/:userId', authorize('admin', 'coordinator'), canManageUser, userController.deleteUser);

// Coordinator routes (for managing farmers)
//router.post('/farmers', authorize('coordinator'), userController.register);
router.get('/farmers', authorize('coordinator'), userController.getUsers);
router.get('/farmers/:userId', authorize('coordinator'), canManageUser, userController.getUserById);
router.put('/farmers/:userId', authorize('coordinator'), canManageUser, userController.updateUser);
router.delete('/farmers/:userId', authorize('coordinator'), canManageUser, userController.deleteUser);

// Admin-specific management routes
router.get('/farmers/all', authorize('admin'), (req, res) => {
  req.query.role = 'farmer';
  userController.getUsers(req, res);
});

// Bulk operations (admin only)
router.post('/bulk-assign', authorize('admin'), async (req, res) => {
  try {
    const { coordinatorId, farmerIds } = req.body;
    
    // Validate coordinator
    const coordinator = await require('../models/User').findById(coordinatorId);
    if (!coordinator || coordinator.role !== 'coordinator') {
      return res.status(400).json({
        error: 'Invalid coordinator',
        message: {
          english: 'Specified coordinator does not exist',
          marathi: 'निर्दिष्ट केलेला समन्वयक अस्तित्वात नाही'
        }
      });
    }

    // Update farmers
    const result = await require('../models/User').updateMany(
      { _id: { $in: farmerIds }, role: 'farmer' },
      { managedBy: coordinatorId }
    );

    // Update coordinator's managed users
    await require('../models/User').findByIdAndUpdate(coordinatorId, {
      $addToSet: { managedUsers: { $each: farmerIds } }
    });

    res.json({
      success: true,
      message: {
        english: `${result.modifiedCount} farmers assigned to coordinator`,
        marathi: `${result.modifiedCount} शेतकऱ्यांना समन्वयकाला नियुक्त केले`
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Bulk assignment failed',
      message: {
        english: 'Failed to assign farmers to coordinator',
        marathi: 'शेतकऱ्यांना समन्वयकाला नियुक्त करण्यात अयशस्वी'
      }
    });
  }
});

// User statistics and analytics
router.get('/stats', authorize('admin', 'coordinator'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'coordinator') {
      const managedUsers = await req.user.getManagedUsers();
      const managedUserIds = managedUsers.map(u => u._id);
      query._id = { $in: managedUserIds };
    }

    const users = await require('../models/User').find(query);
    const fields = await require('../models/Field').find(
      req.user.role === 'coordinator' 
        ? { owner: { $in: users.map(u => u._id) } }
        : {}
    );

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalFields: fields.length,
      activeFields: fields.filter(f => f.status === 'active').length,
      totalArea: fields.reduce((sum, f) => sum + (f.areaInAcres || 0), 0),
      byRole: {
        farmers: users.filter(u => u.role === 'farmer').length,
        coordinators: users.filter(u => u.role === 'coordinator').length,
        admins: users.filter(u => u.role === 'admin').length
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get statistics',
      message: {
        english: 'Failed to get user statistics',
        marathi: 'वापरकर्ता आकडेवारी मिळवण्यात अयशस्वी'
      }
    });
  }
});

module.exports = router; 