const Field = require('../models/Field');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// Create new field
const createField = async (req, res) => {
  try {
    const {
      name,
      fieldId,
      location,
      soilInfo,
      currentCrop,
      sensors,
      irrigation
    } = req.body;

    // Check if fieldId already exists
    const existingField = await Field.findOne({ fieldId });
    if (existingField) {
      return res.status(400).json({
        error: 'Field ID already exists',
        message: {
          english: 'Field with this ID already exists',
          marathi: 'या ID सह शेत आधीपासून अस्तित्वात आहे'
        }
      });
    }

    // Determine field owner based on user role
    let owner = req.user._id;
    
    // If admin/coordinator is creating field for a farmer
    if (req.body.farmerId && (req.user.role === 'admin' || req.user.role === 'coordinator')) {
      const farmer = await User.findById(req.body.farmerId);
      if (!farmer || farmer.role !== 'farmer') {
        return res.status(400).json({
          error: 'Invalid farmer',
          message: {
            english: 'Specified farmer does not exist',
            marathi: 'निर्दिष्ट केलेला शेतकरी अस्तित्वात नाही'
          }
        });
      }
      
      // Check if coordinator can manage this farmer
      if (req.user.role === 'coordinator' && farmer.managedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: 'Cannot create field for this farmer',
          message: {
            english: 'You can only create fields for farmers you manage',
            marathi: 'तुम्ही फक्त तुमच्या व्यवस्थापनाखालील शेतकऱ्यांसाठी शेत तयार करू शकता'
          }
        });
      }
      
      owner = farmer._id;
    }

    const field = new Field({
      name,
      fieldId,
      owner,
      location,
      soilInfo,
      currentCrop,
      sensors,
      irrigation,
      createdBy: req.user._id
    });

    await field.save();

    // Update user's owned fields
    await User.findByIdAndUpdate(owner, {
      $push: { ownedFields: field._id }
    });

    res.status(201).json({
      success: true,
      message: {
        english: 'Field created successfully',
        marathi: 'शेत यशस्वीरित्या तयार केले'
      },
      field
    });

  } catch (error) {
    logger.error('Create field error:', error);
    res.status(500).json({
      error: 'Failed to create field',
      message: {
        english: 'Failed to create field',
        marathi: 'शेत तयार करण्यात अयशस्वी'
      }
    });
  }
};

// Get fields based on user role and access
const getFields = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, farmerId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Role-based field access
    if (req.user.role === 'admin') {
      // Admin can see all fields
      if (farmerId) {
        query.owner = farmerId;
      }
    } else if (req.user.role === 'coordinator') {
      // Coordinator can see fields of managed farmers
      const managedUsers = await req.user.getManagedUsers();
      const managedUserIds = managedUsers.map(u => u._id);
      query.owner = { $in: managedUserIds };
      
      if (farmerId) {
        // Ensure the farmer is managed by this coordinator
        if (!managedUserIds.includes(farmerId)) {
          return res.status(403).json({
            error: 'Access denied',
            message: {
              english: 'You can only view fields of farmers you manage',
              marathi: 'तुम्ही फक्त तुमच्या व्यवस्थापनाखालील शेतकऱ्यांचे शेत पाहू शकता'
            }
          });
        }
        query.owner = farmerId;
      }
    } else {
      // Farmers can only see their own fields
      query.owner = req.user._id;
    }

    // Status filtering
    if (status) query.status = status;

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { fieldId: { $regex: search, $options: 'i' } },
        { 'location.address.village': { $regex: search, $options: 'i' } }
      ];
    }

    const fields = await Field.find(query)
      .populate('owner', 'name email role')
      .populate('assignedTo.user', 'name email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });

    const total = await Field.countDocuments(query);

    res.json({
      success: true,
      fields,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalFields: total
      }
    });

  } catch (error) {
    logger.error('Get fields error:', error);
    res.status(500).json({
      error: 'Failed to fetch fields',
      message: {
        english: 'Failed to fetch fields',
        marathi: 'शेत मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Get field by ID (with access control)
const getFieldById = async (req, res) => {
  try {
    const { fieldId } = req.params;

    // Use field from middleware if available
    const field = req.field || await Field.findOne({ fieldId })
      .populate('owner', 'name email role')
      .populate('assignedTo.user', 'name email role')
      .populate('notes.author', 'name');

    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Check access (if not already checked by middleware)
    if (!req.field) {
      const canAccess = await req.user.canAccessField(field._id);
      if (!canAccess) {
        return res.status(403).json({
          error: 'Field access denied',
          message: {
            english: 'You do not have permission to access this field',
            marathi: 'तुम्हाला या शेतावर प्रवेश करण्याची परवानगी नाही'
          }
        });
      }
    }

    res.json({
      success: true,
      field
    });

  } catch (error) {
    logger.error('Get field by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch field',
      message: {
        english: 'Failed to fetch field details',
        marathi: 'शेत तपशील मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Update field (with access control)
const updateField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const updateData = req.body;

    // Use field from middleware
    const field = req.field;
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Prevent ownership changes through this endpoint
    if (updateData.owner) {
      delete updateData.owner;
    }

    // Update field
    const updatedField = await Field.findByIdAndUpdate(
      field._id,
      { ...updateData, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('owner', 'name email role');

    res.json({
      success: true,
      message: {
        english: 'Field updated successfully',
        marathi: 'शेत यशस्वीरित्या अद्ययावत केले'
      },
      field: updatedField
    });

  } catch (error) {
    logger.error('Update field error:', error);
    res.status(500).json({
      error: 'Failed to update field',
      message: {
        english: 'Failed to update field',
        marathi: 'शेत अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

// Delete field (with cascade handling)
const deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;

    // Use field from middleware
    const field = req.field;
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Remove from owner's owned fields
    await User.findByIdAndUpdate(field.owner, {
      $pull: { ownedFields: field._id }
    });

    // Remove from assigned users' assigned fields
    for (const assignment of field.assignedTo) {
      await User.findByIdAndUpdate(assignment.user, {
        $pull: { assignedFields: field._id }
      });
    }

    // Delete field
    await Field.findByIdAndDelete(field._id);

    res.json({
      success: true,
      message: {
        english: 'Field deleted successfully',
        marathi: 'शेत यशस्वीरित्या हटवले गेले'
      }
    });

  } catch (error) {
    logger.error('Delete field error:', error);
    res.status(500).json({
      error: 'Failed to delete field',
      message: {
        english: 'Failed to delete field',
        marathi: 'शेत हटवण्यात अयशस्वी'
      }
    });
  }
};

// Assign field to user
const assignField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { userId, role = 'viewer' } = req.body;

    // Use field from middleware
    const field = req.field;
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: {
          english: 'User not found',
          marathi: 'वापरकर्ता सापडला नाही'
        }
      });
    }

    // Check if already assigned
    const existingAssignment = field.assignedTo.find(
      a => a.user.toString() === userId
    );
    if (existingAssignment) {
      return res.status(400).json({
        error: 'User already assigned',
        message: {
          english: 'User is already assigned to this field',
          marathi: 'वापरकर्ता या शेताला आधीपासून नियुक्त केले आहे'
        }
      });
    }

    // Add assignment
    field.assignedTo.push({
      user: userId,
      role,
      assignedAt: new Date()
    });

    await field.save();

    // Update user's assigned fields
    await User.findByIdAndUpdate(userId, {
      $push: { assignedFields: field._id }
    });

    res.json({
      success: true,
      message: {
        english: 'Field assigned successfully',
        marathi: 'शेत यशस्वीरित्या नियुक्त केले'
      },
      field
    });

  } catch (error) {
    logger.error('Assign field error:', error);
    res.status(500).json({
      error: 'Failed to assign field',
      message: {
        english: 'Failed to assign field',
        marathi: 'शेत नियुक्त करण्यात अयशस्वी'
      }
    });
  }
};

// Remove field assignment
const removeFieldAssignment = async (req, res) => {
  try {
    const { fieldId, userId } = req.params;

    // Use field from middleware
    const field = req.field;
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Remove assignment
    field.assignedTo = field.assignedTo.filter(
      a => a.user.toString() !== userId
    );

    await field.save();

    // Update user's assigned fields
    await User.findByIdAndUpdate(userId, {
      $pull: { assignedFields: field._id }
    });

    res.json({
      success: true,
      message: {
        english: 'Field assignment removed successfully',
        marathi: 'शेत नियुक्ती यशस्वीरित्या काढली गेली'
      },
      field
    });

  } catch (error) {
    logger.error('Remove field assignment error:', error);
    res.status(500).json({
      error: 'Failed to remove field assignment',
      message: {
        english: 'Failed to remove field assignment',
        marathi: 'शेत नियुक्ती काढण्यात अयशस्वी'
      }
    });
  }
};

// Add note to field
const addFieldNote = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { content, type = 'general' } = req.body;

    // Use field from middleware
    const field = req.field;
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Add note
    field.notes.push({
      content,
      type,
      author: req.user._id,
      timestamp: new Date()
    });

    await field.save();

    res.json({
      success: true,
      message: {
        english: 'Note added successfully',
        marathi: 'टीप यशस्वीरित्या जोडली गेली'
      },
      field
    });

  } catch (error) {
    logger.error('Add field note error:', error);
    res.status(500).json({
      error: 'Failed to add note',
      message: {
        english: 'Failed to add note',
        marathi: 'टीप जोडण्यात अयशस्वी'
      }
    });
  }
};

// Get field statistics
const getFieldStats = async (req, res) => {
  try {
    const { fieldId } = req.params;

    // Use field from middleware
    const field = req.field;
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Calculate statistics
    const stats = {
      totalSensors: field.sensors.length,
      activeSensors: field.sensors.filter(s => s.status === 'active').length,
      totalNotes: field.notes.length,
      cropHistoryCount: field.cropHistory.length,
      areaInAcres: field.areaInAcres,
      currentCropStatus: field.currentCrop?.status || 'none',
      lastActivity: field.updatedAt
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Get field stats error:', error);
    res.status(500).json({
      error: 'Failed to get field statistics',
      message: {
        english: 'Failed to get field statistics',
        marathi: 'शेत आकडेवारी मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Get yield trends (average per month, in quintal, last 12 months)
const getYieldTrends = async (req, res) => {
  try {
    const now = new Date();
    let start, end;
    if (req.query.start) {
      // Accept YYYY-MM or ISO
      start = new Date(req.query.start.length === 7 ? req.query.start + '-01' : req.query.start);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 months ago
    }
    if (req.query.end) {
      end = new Date(req.query.end.length === 7 ? req.query.end + '-01' : req.query.end);
      // Set to end of month if YYYY-MM
      if (req.query.end.length === 7) {
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
      }
    } else {
      end = now;
    }
    const cropFilter = req.query.crop;
    const cropsFilter = req.query.crops ? req.query.crops.split(',').map(c => c.trim()).filter(Boolean) : null;

    // Get all fields
    const fields = await Field.find({});
    // Collect all yield records (from cropHistory and currentCrop if harvested)
    let yields = [];
    let cropSet = new Set();
    fields.forEach(field => {
      // Crop history
      (field.cropHistory || []).forEach(ch => {
        if (ch.harvestedDate && ch.yield && ch.yieldUnit && ch.crop) {
          cropSet.add(ch.crop);
          const date = new Date(ch.harvestedDate);
          if (date >= start && date <= end) {
            let yieldQuintal = ch.yield;
            if (ch.yieldUnit === 'kg') yieldQuintal = ch.yield / 100;
            if (ch.yieldUnit === 'ton') yieldQuintal = ch.yield * 10;
            yields.push({ date, yield: yieldQuintal, crop: ch.crop });
          }
        } else if (ch.crop) {
          cropSet.add(ch.crop);
        }
      });
      // Current crop (if harvested in range)
      const cc = field.currentCrop;
      if (cc && cc.status === 'harvested' && cc.yield && cc.yield.actual && cc.yield.unit && cc.expectedHarvest && cc.name) {
        cropSet.add(cc.name);
        const date = new Date(cc.expectedHarvest);
        if (date >= start && date <= end) {
          let yieldQuintal = cc.yield.actual;
          if (cc.yield.unit === 'kg') yieldQuintal = cc.yield.actual / 100;
          if (cc.yield.unit === 'ton') yieldQuintal = cc.yield.actual * 10;
          yields.push({ date, yield: yieldQuintal, crop: cc.name });
        }
      } else if (cc && cc.name) {
        cropSet.add(cc.name);
      }
    });
    // Prepare monthly keys for the range
    const monthlyKeys = [];
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyKeys.push({ key, month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear() });
      d.setMonth(d.getMonth() + 1);
    }
    // Multi-crop support
    let datasets = [];
    let cropsToProcess = cropsFilter || (cropFilter ? [cropFilter] : [null]);
    if (cropsToProcess.length === 0 || cropsToProcess[0] === null) cropsToProcess = [null];
    for (const crop of cropsToProcess) {
      // Filter yields for this crop (or all if crop is null)
      const filteredYields = crop ? yields.filter(y => y.crop === crop) : yields;
      // Group by month/year
      const monthly = {};
      monthlyKeys.forEach(m => {
        monthly[m.key] = { sum: 0, count: 0, month: m.month, year: m.year };
      });
      filteredYields.forEach(y => {
        const key = `${y.date.getFullYear()}-${y.date.getMonth() + 1}`;
        if (monthly[key]) {
          monthly[key].sum += y.yield;
          monthly[key].count += 1;
        }
      });
      // Prepare result
      const data = Object.values(monthly).map(m => ({
        month: m.month,
        year: m.year,
        averageYield: m.count > 0 ? parseFloat((m.sum / m.count).toFixed(2)) : 0
      }));
      datasets.push({ crop: crop || 'All Crops', data });
    }
    res.json({ success: true, yieldTrends: datasets, crops: Array.from(cropSet).sort() });
  } catch (error) {
    logger.error('Get yield trends error:', error);
    res.status(500).json({ error: 'Failed to get yield trends' });
  }
};

module.exports = {
  createField,
  getFields,
  getFieldById,
  updateField,
  deleteField,
  assignField,
  removeFieldAssignment,
  addFieldNote,
  getFieldStats,
  getYieldTrends
}; 