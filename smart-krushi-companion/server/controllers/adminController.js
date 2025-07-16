const User = require('../models/User');
const Field = require('../models/Field');
let Alert;
try { Alert = require('../models/Alert'); } catch (e) { Alert = null; }
const { Parser } = require('json2csv');
const multer = require('multer');
const csvParse = require('csv-parse');
const upload = multer({ dest: 'uploads/' });
const { SensorData } = require('../utils/mongoClient');

exports.getOverviewStats = async (req, res) => {
  try {
    const totalCoordinators = await User.countDocuments({ role: 'coordinator' });
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const activeFields = await Field.countDocuments({ status: 'active' });
    let recentAlerts = 0;
    if (Alert) {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      recentAlerts = await Alert.countDocuments({ createdAt: { $gte: since } });
    }
    res.json({ totalCoordinators, totalFarmers, activeFields, recentAlerts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
};

exports.getCoordinators = async (req, res) => {
  try {
    // Get all coordinators
    const coordinators = await User.find({ role: 'coordinator' }, 'name email phoneNumber status');
    // Get farmer counts for each coordinator
    const farmerCounts = await User.aggregate([
      { $match: { role: 'farmer', managedBy: { $ne: null } } },
      { $group: { _id: '$managedBy', count: { $sum: 1 } } }
    ]);
    // Map counts to coordinator IDs
    const countMap = {};
    farmerCounts.forEach(fc => { countMap[fc._id.toString()] = fc.count; });
    // Attach farmerCount to each coordinator
    const result = coordinators.map(c => ({
      _id: c._id,
      name: c.name,
      email: c.email,
      phoneNumber: c.phoneNumber,
      status: c.status,
      farmerCount: countMap[c._id.toString()] || 0
    }));
    res.json({ coordinators: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coordinators' });
  }
};

exports.deactivateCoordinator = async (req, res) => {
  try {
    const coordinator = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'coordinator' },
      { status: 'Inactive', isActive: false },
      { new: true }
    );
    if (!coordinator) return res.status(404).json({ error: 'Coordinator not found' });
    res.json({ message: 'Coordinator deactivated', coordinator });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate coordinator' });
  }
};

exports.editCoordinator = async (req, res) => {
  try {
    const { name, email, phoneNumber, status } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (phoneNumber) update.phoneNumber = phoneNumber;
    if (status) update.status = status;

    const coordinator = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'coordinator' },
      update,
      { new: true }
    );
    if (!coordinator) return res.status(404).json({ error: 'Coordinator not found' });
    res.json({ message: 'Coordinator updated', coordinator });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coordinator' });
  }
};

exports.getFarmers = async (req, res) => {
  try {
    // Populate coordinator name for each farmer
    const farmers = await User.find({ role: 'farmer' })
      .populate({ path: 'managedBy', select: 'name' });
    // Format for frontend
    const result = farmers.map(f => ({
      _id: f._id,
      name: f.name,
      email: f.email,
      phoneNumber: f.phoneNumber,
      status: f.status,
      coordinator: f.managedBy ? f.managedBy._id : '',
      coordinatorName: f.managedBy ? f.managedBy.name : '',
      ownedFields: f.ownedFields,
    }));
    res.json({ farmers: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
};

exports.assignCoordinatorToFarmer = async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    const farmer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'farmer' },
      { managedBy: coordinatorId },
      { new: true }
    );
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Coordinator assigned', farmer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign coordinator' });
  }
};

exports.deactivateFarmer = async (req, res) => {
  try {
    const farmer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'farmer' },
      { status: 'Inactive', isActive: false },
      { new: true }
    );
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Farmer deactivated', farmer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate farmer' });
  }
};

exports.editFarmer = async (req, res) => {
  try {
    const { name, email, phoneNumber, status } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (phoneNumber) update.phoneNumber = phoneNumber;
    if (status) update.status = status;

    const farmer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'farmer' },
      update,
      { new: true }
    );
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Farmer updated', farmer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update farmer' });
  }
};

exports.exportFarmers = async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer' })
      .populate({ path: 'managedBy', select: 'name' });
    const data = farmers.map(f => ({
      name: f.name,
      email: f.email,
      phoneNumber: f.phoneNumber,
      status: f.status,
      coordinator: f.managedBy ? f.managedBy.name : '',
    }));
    const fields = ['name', 'email', 'phoneNumber', 'status', 'coordinator'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('farmers.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export farmers' });
  }
};

exports.importFarmers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fs = require('fs');
    const filePath = req.file.path;
    const farmers = [];

    fs.createReadStream(filePath)
      .pipe(csvParse({ columns: true, trim: true }))
      .on('data', row => {
        farmers.push(row);
      })
      .on('end', async () => {
        for (const farmer of farmers) {
          let coordinator = null;
          if (farmer.coordinator) {
            coordinator = await User.findOne({ name: farmer.coordinator, role: 'coordinator' });
          }
          await User.create({
            name: farmer.name,
            email: farmer.email,
            phoneNumber: farmer.phoneNumber,
            role: 'farmer',
            status: farmer.status || 'Active',
            managedBy: coordinator ? coordinator._id : undefined,
            isActive: farmer.status !== 'Inactive'
          });
        }
        fs.unlinkSync(filePath);
        res.json({ message: 'Farmers imported successfully', count: farmers.length });
      })
      .on('error', err => {
        res.status(500).json({ error: 'Failed to parse CSV' });
      });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import farmers' });
  }
};

exports.getFields = async (req, res) => {
  try {
    // Populate farmer name (owner or assigned user)
    const fields = await Field.find({})
      .populate({ path: 'owner', select: 'name' })
      .populate({ path: 'assignedTo', select: 'name' });
    // Format for frontend
    const result = fields.map(f => ({
      _id: f._id,
      name: f.name,
      farmerName: f.owner ? f.owner.name : (f.assignedTo ? f.assignedTo.name : ''),
      crop: f.cropType || f.crop || '',
      status: f.status || 'Healthy',
      lastSensorUpdate: f.lastSensorUpdate || f.updatedAt || f.createdAt,
      lat: Array.isArray(f.location?.coordinates)
        ? f.location.coordinates[0]
        : f.location?.coordinates?.lat,
      lng: Array.isArray(f.location?.coordinates)
        ? f.location.coordinates[1]
        : f.location?.coordinates?.lng
    }));
    res.json({ fields: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
};

exports.getFieldById = async (req, res) => {
  try {
    const { id } = req.params;
    const field = await Field.findById(id)
      .populate({ path: 'owner', select: 'name email role' })
      .populate({ path: 'assignedTo.user', select: 'name email role' });
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json({ field });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch field details' });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({})
      .populate({ path: 'farmer', select: 'name' })
      .populate({ path: 'assignedTo', select: 'name' });
    const result = alerts.map(a => ({
      _id: a._id,
      type: a.type,
      message: a.message,
      farmer: a.farmer ? a.farmer.name : '',
      severity: a.severity,
      status: a.status,
      assignedTo: a.assignedTo ? a.assignedTo.name : '',
      createdAt: a.createdAt
    }));
    res.json({ alerts: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'Acknowledged' },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert acknowledged', alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
};

exports.assignAlert = async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'Assigned', assignedTo: coordinatorId },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert assigned', alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign alert' });
  }
};

exports.updateFieldLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    const field = await Field.findById(id);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    // Only allow admins/coordinators to update
    if (!['admin', 'superadmin', 'coordinator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    // Ensure location and area exist
    field.location = field.location || {};
    field.location.coordinates = { lat, lng };
    if (!field.location.area) {
      field.location.area = { value: 1, unit: 'acres' }; // Default area
    }
    if (typeof field.location.area.value !== 'number') {
      field.location.area.value = 1;
    }
    if (!field.location.area.unit) {
      field.location.area.unit = 'acres';
    }
    await field.save();
    res.json({ success: true, field });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update field location', details: err.message });
  }
};

exports.getFieldSensorData = async (req, res) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    // Fetch all sensor data for this field in the date range
    const data = await SensorData.find({
      fieldId: id,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });
    // Group by type
    const moisture = [];
    const temperature = [];
    data.forEach(d => {
      if (typeof d.moisture === 'number') {
        moisture.push({ timestamp: d.timestamp, value: d.moisture });
      }
      if (typeof d.temperature === 'number') {
        temperature.push({ timestamp: d.timestamp, value: d.temperature });
      }
    });
    res.json({
      fieldId: id,
      sensors: [
        { type: 'moisture', readings: moisture },
        { type: 'temperature', readings: temperature }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
}; 