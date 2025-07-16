# 🌾 Multi-Farmer Platform Architecture

## Overview

The Smart Krushi Companion has been transformed into a comprehensive Multi-Farmer Platform with a hierarchical role-based access control system. This platform supports three distinct user roles with different levels of access and functionality.

## 🏗️ System Architecture

### Role Hierarchy
```
Admin (Super User)
├── Coordinator 1
│   ├── Farmer 1
│   ├── Farmer 2
│   └── Farmer 3
├── Coordinator 2
│   ├── Farmer 4
│   ├── Farmer 5
│   └── Farmer 6
└── Coordinator 3
    ├── Farmer 7
    └── Farmer 8
```

### User Roles & Permissions

#### 👑 **Admin**
- **Access**: Full system access
- **Permissions**: 
  - Manage all coordinators and farmers
  - Create/delete users and fields
  - View all data and analytics
  - System configuration
  - Billing and subscription management
- **Platform**: Web App only
- **Key Features**:
  - Dashboard with system-wide analytics
  - User management interface
  - Field management across all users
  - System reports and insights

#### 👨‍💼 **Coordinator**
- **Access**: Manage assigned farmers
- **Permissions**:
  - Manage farmers under their supervision
  - Create/update fields for managed farmers
  - View analytics for managed farmers
  - Generate reports for their region
- **Platform**: Web App only
- **Key Features**:
  - Farmer management dashboard
  - Field assignment and monitoring
  - Regional analytics and reports
  - Communication tools with farmers

#### 👨‍🌾 **Farmer**
- **Access**: Own data and fields only
- **Permissions**:
  - View own field data
  - Access reports and recommendations
  - Update profile information
  - View sensor data and alerts
- **Platform**: 
  - **Mobile App**: Read-only access (primary interface)
  - **Web App**: Limited access (profile, basic reports)
- **Key Features**:
  - Real-time sensor data
  - Crop recommendations
  - Weather alerts
  - Chatbot assistance

## 📱 Platform Access Strategy

### Mobile App (Farmer-Focused)
- **Target Users**: Farmers only
- **Access Level**: Read-only
- **Primary Features**:
  - Dashboard with sensor data
  - Field monitoring
  - Weather information
  - Chatbot for assistance
  - Disease detection
  - Land health reports
  - Push notifications

### Web App (Management-Focused)
- **Target Users**: Admins, Coordinators, Farmers
- **Access Level**: Full management capabilities
- **Primary Features**:
  - User management (Admin/Coordinator)
  - Field management
  - Analytics and reporting
  - Bulk operations
  - System configuration

## 🗄️ Database Schema

### Enhanced User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: 'admin' | 'coordinator' | 'farmer',
  
  // Hierarchical relationships
  managedBy: ObjectId (ref: User),
  managedUsers: [ObjectId] (ref: User),
  
  // Field relationships
  ownedFields: [ObjectId] (ref: Field),
  assignedFields: [ObjectId] (ref: Field),
  
  // Profile information
  phoneNumber: String,
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: { lat: Number, lng: Number }
  },
  profile: {
    avatar: String,
    farmingExperience: Number,
    landHolding: Number,
    primaryCrops: [String]
  },
  
  // Permissions and status
  permissions: [String],
  isActive: Boolean,
  isVerified: Boolean,
  
  // Device tracking
  deviceInfo: {
    mobileAppVersion: String,
    lastMobileLogin: Date,
    webAppLastLogin: Date
  }
}
```

### Field Model
```javascript
{
  _id: ObjectId,
  name: String,
  fieldId: String (unique),
  
  // Ownership and management
  owner: ObjectId (ref: User),
  assignedTo: [{
    user: ObjectId (ref: User),
    role: 'manager' | 'worker' | 'viewer',
    assignedAt: Date
  }],
  
  // Location and physical details
  location: {
    coordinates: { lat: Number, lng: Number },
    address: {
      state: String,
      district: String,
      village: String,
      pincode: String
    },
    area: {
      value: Number,
      unit: 'acres' | 'hectares' | 'sq_meters'
    }
  },
  
  // Agricultural information
  soilInfo: {
    type: String,
    ph: Number,
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number
  },
  
  currentCrop: {
    name: String,
    variety: String,
    plantedDate: Date,
    status: String,
    yield: { expected: Number, actual: Number }
  },
  
  // Sensor configuration
  sensors: [{
    sensorId: String,
    type: String,
    status: String,
    lastReading: { value: Number, timestamp: Date }
  }],
  
  // Historical data
  cropHistory: [{
    crop: String,
    season: String,
    yield: Number,
    notes: String
  }],
  
  // Financial tracking
  financial: {
    investment: { seeds: Number, fertilizers: Number, labor: Number },
    revenue: { expected: Number, actual: Number },
    profit: Number
  }
}
```

## 🔐 Access Control System

### Authentication Middleware
- **JWT-based authentication**
- **Role-based authorization**
- **Permission-based access control**
- **Field-level access control**
- **Platform-specific access restrictions**

### Key Middleware Functions
```javascript
// Basic authentication
auth(req, res, next)

// Role-based authorization
authorize('admin', 'coordinator')(req, res, next)

// Permission-based authorization
hasPermission('manage_farmers')(req, res, next)

// Field access control
fieldAccess(req, res, next)

// User management authorization
canManageUser(req, res, next)

// Platform access control
mobileAppAccess(req, res, next)
webAppAccess(req, res, next)
```

## 🚀 API Endpoints

### User Management
```
POST   /api/v1/users/register          # Create user (Admin only)
GET    /api/v1/users                   # List users (Admin/Coordinator)
GET    /api/v1/users/:userId           # Get user details
PUT    /api/v1/users/:userId           # Update user
DELETE /api/v1/users/:userId           # Delete user
GET    /api/v1/users/stats             # User statistics
POST   /api/v1/users/bulk-assign       # Bulk assign farmers

# Coordinator-specific
POST   /api/v1/farmers                 # Create farmer
GET    /api/v1/farmers                 # List managed farmers
GET    /api/v1/farmers/:userId         # Get farmer details

# Profile management
GET    /api/v1/profile                 # Get own profile
PUT    /api/v1/profile                 # Update profile
PUT    /api/v1/change-password         # Change password
```

### Field Management
```
POST   /api/v1/fields                  # Create field
GET    /api/v1/fields                  # List fields
GET    /api/v1/fields/:fieldId         # Get field details
PUT    /api/v1/fields/:fieldId         # Update field
DELETE /api/v1/fields/:fieldId         # Delete field

# Field assignments
POST   /api/v1/fields/:fieldId/assign  # Assign field to user
DELETE /api/v1/fields/:fieldId/assign/:userId  # Remove assignment

# Field operations
POST   /api/v1/fields/:fieldId/notes   # Add field note
GET    /api/v1/fields/stats            # Field statistics
GET    /api/v1/fields/analytics/overview  # Field analytics
GET    /api/v1/fields/search/advanced  # Advanced search
GET    /api/v1/fields/export/csv       # Export fields

# Bulk operations
POST   /api/v1/fields/bulk-create      # Bulk create fields
```

## 📊 Analytics & Reporting

### System-wide Analytics (Admin)
- Total users by role
- Field distribution and status
- Sensor coverage and health
- Revenue and investment tracking
- Regional performance metrics

### Regional Analytics (Coordinator)
- Managed farmers performance
- Field productivity metrics
- Crop yield analysis
- Financial summaries
- Weather impact assessment

### Individual Analytics (Farmer)
- Personal field performance
- Crop yield history
- Investment vs. revenue tracking
- Weather correlation analysis
- Improvement recommendations

## 🔄 Data Flow

### Mobile App Data Flow
```
Farmer → Mobile App → API (Read-only) → Database
                    ↓
                Real-time Updates
                    ↓
                Push Notifications
```

### Web App Data Flow
```
Admin/Coordinator → Web App → API (Full access) → Database
                                    ↓
                            Analytics Engine
                                    ↓
                            Report Generation
```

## 🛡️ Security Features

### Data Protection
- **Field-level access control**
- **Role-based data filtering**
- **Encrypted data transmission**
- **Secure token management**
- **Rate limiting and DDoS protection**

### Privacy Controls
- **User data isolation**
- **Hierarchical data access**
- **Audit logging**
- **Data retention policies**
- **GDPR compliance features**

## 📈 Scalability Features

### Performance Optimization
- **Database indexing for queries**
- **Caching strategies**
- **Load balancing support**
- **Horizontal scaling capability**
- **Microservices architecture ready**

### Multi-tenancy Support
- **Organization-based isolation**
- **Resource allocation controls**
- **Billing and subscription management**
- **Custom branding options**
- **API rate limiting per organization**

## 🚀 Deployment Strategy

### Production Environment
- **Containerized deployment (Docker)**
- **Load balancer configuration**
- **Database clustering**
- **CDN for static assets**
- **Monitoring and alerting**

### Development Workflow
- **Git-based version control**
- **Automated testing pipeline**
- **Staging environment**
- **Feature branch deployment**
- **Rollback capabilities**

## 📋 Implementation Checklist

### Phase 1: Core Infrastructure
- [x] Enhanced User model with role hierarchy
- [x] Field model with ownership and assignment
- [x] Authentication and authorization middleware
- [x] Role-based access control
- [x] Platform-specific access restrictions

### Phase 2: API Development
- [x] User management endpoints
- [x] Field management endpoints
- [x] Analytics and reporting APIs
- [x] Bulk operations support
- [x] Search and filtering capabilities

### Phase 3: Mobile App Updates
- [ ] Read-only access implementation
- [ ] Role-based UI restrictions
- [ ] Enhanced error handling
- [ ] Offline data caching
- [ ] Push notification system

### Phase 4: Web App Development
- [ ] Admin dashboard
- [ ] Coordinator management interface
- [ ] User management panels
- [ ] Analytics and reporting
- [ ] Bulk operations interface

### Phase 5: Advanced Features
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Machine learning integration
- [ ] Mobile app management
- [ ] API documentation

## 🎯 Benefits of Multi-Farmer Platform

### For Farmers
- **Simplified mobile experience**
- **Real-time field monitoring**
- **Expert guidance and support**
- **Reduced complexity**

### For Coordinators
- **Efficient farmer management**
- **Regional insights and analytics**
- **Streamlined communication**
- **Performance tracking**

### For Admins
- **System-wide oversight**
- **Scalable user management**
- **Comprehensive analytics**
- **Business intelligence**

### For the Platform
- **Scalable architecture**
- **Role-based security**
- **Multi-tenant support**
- **Revenue optimization**

This architecture provides a solid foundation for a scalable, secure, and user-friendly Multi-Farmer Platform that can grow with your business needs. 