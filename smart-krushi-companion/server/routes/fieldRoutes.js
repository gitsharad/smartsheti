const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const { 
  auth, 
  authorize, 
  hasPermission, 
  fieldAccess,
  mobileAppAccess,
  webAppAccess 
} = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Mobile app access control (read-only for farmers)
router.use(mobileAppAccess);

// Web app access control
router.use(webAppAccess);

// Field routes with role-based access
router.post('/', authorize('admin', 'coordinator'), fieldController.createField);
router.get('/', fieldController.getFields);
router.get('/stats', authorize('admin', 'coordinator'), fieldController.getFieldStats);

// Field-specific routes with access control
router.get('/:fieldId', fieldAccess, fieldController.getFieldById);
router.put('/:fieldId', fieldAccess, fieldController.updateField);
router.delete('/:fieldId', fieldAccess, authorize('admin', 'coordinator'), fieldController.deleteField);

// Field assignment routes
router.post('/:fieldId/assign', fieldAccess, authorize('admin', 'coordinator'), fieldController.assignField);
router.delete('/:fieldId/assign/:userId', fieldAccess, authorize('admin', 'coordinator'), fieldController.removeFieldAssignment);

// Field notes
router.post('/:fieldId/notes', fieldAccess, fieldController.addFieldNote);

// Bulk field operations (admin only)
router.post('/bulk-create', authorize('admin'), async (req, res) => {
  try {
    const { fields, farmerId } = req.body;
    
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        error: 'Invalid fields data',
        message: {
          english: 'Please provide valid fields data',
          marathi: 'कृपया वैध शेत डेटा प्रदान करा'
        }
      });
    }

    const createdFields = [];
    const errors = [];

    for (const fieldData of fields) {
      try {
        // Add farmerId to each field
        fieldData.farmerId = farmerId;
        
        // Create field using existing controller logic
        const field = new (require('../models/Field'))({
          ...fieldData,
          createdBy: req.user._id
        });

        await field.save();
        createdFields.push(field);

        // Update user's owned fields
        await require('../models/User').findByIdAndUpdate(field.owner, {
          $push: { ownedFields: field._id }
        });

      } catch (error) {
        errors.push({
          fieldId: fieldData.fieldId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: {
        english: `Created ${createdFields.length} fields successfully`,
        marathi: `${createdFields.length} शेत यशस्वीरित्या तयार केले`
      },
      createdFields,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    res.status(500).json({
      error: 'Bulk field creation failed',
      message: {
        english: 'Failed to create fields in bulk',
        marathi: 'शेत मोठ्या प्रमाणात तयार करण्यात अयशस्वी'
      }
    });
  }
});

// Field analytics and reporting
router.get('/analytics/overview', authorize('admin', 'coordinator'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'coordinator') {
      const managedUsers = await req.user.getManagedUsers();
      const managedUserIds = managedUsers.map(u => u._id);
      query.owner = { $in: managedUserIds };
    }

    const fields = await require('../models/Field').find(query);
    
    const analytics = {
      totalFields: fields.length,
      activeFields: fields.filter(f => f.status === 'active').length,
      totalArea: fields.reduce((sum, f) => sum + (f.areaInAcres || 0), 0),
      averageArea: fields.length > 0 ? fields.reduce((sum, f) => sum + (f.areaInAcres || 0), 0) / fields.length : 0,
      byStatus: {
        active: fields.filter(f => f.status === 'active').length,
        inactive: fields.filter(f => f.status === 'inactive').length,
        maintenance: fields.filter(f => f.status === 'maintenance').length,
        harvested: fields.filter(f => f.status === 'harvested').length
      },
      byCrop: fields.reduce((acc, f) => {
        const crop = f.currentCrop?.name || 'none';
        acc[crop] = (acc[crop] || 0) + 1;
        return acc;
      }, {}),
      bySoilType: fields.reduce((acc, f) => {
        const soilType = f.soilInfo?.type || 'unknown';
        acc[soilType] = (acc[soilType] || 0) + 1;
        return acc;
      }, {}),
      sensorStats: {
        total: fields.reduce((sum, f) => sum + f.sensors.length, 0),
        active: fields.reduce((sum, f) => sum + f.sensors.filter(s => s.status === 'active').length, 0)
      }
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get field analytics',
      message: {
        english: 'Failed to get field analytics',
        marathi: 'शेत विश्लेषण मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Yield trends analytics
const { getYieldTrends } = require('../controllers/fieldController');
router.get('/analytics/yield-trends', authorize('admin', 'coordinator'), getYieldTrends);

// Field search and filtering
router.get('/search/advanced', async (req, res) => {
  try {
    const { 
      status, 
      crop, 
      soilType, 
      minArea, 
      maxArea, 
      location,
      page = 1, 
      limit = 10 
    } = req.query;

    let query = {};

    // Role-based access
    if (req.user.role === 'coordinator') {
      const managedUsers = await req.user.getManagedUsers();
      const managedUserIds = managedUsers.map(u => u._id);
      query.owner = { $in: managedUserIds };
    } else if (req.user.role === 'farmer') {
      query.owner = req.user._id;
    }

    // Apply filters
    if (status) query.status = status;
    if (crop) query['currentCrop.name'] = { $regex: crop, $options: 'i' };
    if (soilType) query['soilInfo.type'] = soilType;
    if (minArea || maxArea) {
      query['location.area.value'] = {};
      if (minArea) query['location.area.value'].$gte = parseFloat(minArea);
      if (maxArea) query['location.area.value'].$lte = parseFloat(maxArea);
    }
    if (location) {
      query.$or = [
        { 'location.address.village': { $regex: location, $options: 'i' } },
        { 'location.address.district': { $regex: location, $options: 'i' } },
        { 'location.address.state': { $regex: location, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const fields = await require('../models/Field').find(query)
      .populate('owner', 'name email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });

    const total = await require('../models/Field').countDocuments(query);

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
    res.status(500).json({
      error: 'Search failed',
      message: {
        english: 'Failed to search fields',
        marathi: 'शेत शोधण्यात अयशस्वी'
      }
    });
  }
});

// Field export functionality
router.get('/export/csv', authorize('admin', 'coordinator'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'coordinator') {
      const managedUsers = await req.user.getManagedUsers();
      const managedUserIds = managedUsers.map(u => u._id);
      query.owner = { $in: managedUserIds };
    }

    const fields = await require('../models/Field').find(query)
      .populate('owner', 'name email');

    // Generate CSV
    const csvHeader = 'Field ID,Name,Owner,Status,Area (acres),Current Crop,Soil Type,Location,Village,District,State\n';
    const csvRows = fields.map(field => {
      return [
        field.fieldId,
        field.name,
        field.owner?.name || 'Unknown',
        field.status,
        field.areaInAcres || 0,
        field.currentCrop?.name || 'None',
        field.soilInfo?.type || 'Unknown',
        `${field.location?.coordinates?.lat || 0},${field.location?.coordinates?.lng || 0}`,
        field.location?.address?.village || '',
        field.location?.address?.district || '',
        field.location?.address?.state || ''
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fields-export.csv');
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      error: 'Export failed',
      message: {
        english: 'Failed to export fields',
        marathi: 'शेत निर्यात करण्यात अयशस्वी'
      }
    });
  }
});

module.exports = router; 