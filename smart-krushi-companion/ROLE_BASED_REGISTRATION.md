# Role-Based Registration System

## Overview

The Smart Krishi platform now implements a hierarchical role-based registration system where users can only register other users based on their role and permissions.

## Role Hierarchy

### 1. Superadmin
- **Can register:** Admins, Coordinators, Farmers
- **Permissions:** Full system access, can manage all users
- **Registration access:** `/add-admin`, `/add-coordinator`, `/add-farmer`

### 2. Admin
- **Can register:** Coordinators, Farmers
- **Permissions:** Can manage coordinators and farmers, view reports, system settings
- **Registration access:** `/add-coordinator`, `/add-farmer`

### 3. Coordinator
- **Can register:** Farmers (under their management)
- **Permissions:** Can manage farmers, view reports, manage fields
- **Registration access:** `/add-farmer`

### 4. Farmer
- **Can register:** No one
- **Permissions:** View own data, reports, manage own fields
- **Registration access:** None

## User Registration Flow

### Initial Setup
1. **Create Superadmin:** Run the script to create the initial superadmin
   ```bash
   cd server
   npm run create-superadmin
   ```
   This creates a superadmin with:
   - Email: `superadmin@smartkrishi.com`
   - Password: `SuperAdmin123!`

### Registration Process
1. **Login:** Users must first login to access registration features
2. **Role-based Links:** After login, users see "Add User" links based on their role
3. **Registration Forms:** Users fill out role-specific registration forms
4. **Automatic Assignment:** The system automatically assigns the correct `managedBy` relationships

## Frontend Implementation

### Dashboard Updates
- Role-based "Add User" buttons appear in the header
- Superadmin sees: "Add Admin", "Add Coordinator", "Add Farmer"
- Admin sees: "Add Coordinator", "Add Farmer"
- Coordinator sees: "Add Farmer"
- Farmer sees: No registration links

### New Pages
- `/add-admin` - Superadmin can register new admins
- `/add-coordinator` - Superadmin/Admin can register new coordinators
- `/add-farmer` - Superadmin/Admin/Coordinator can register new farmers

### Registration Form Features
- **AddAdmin:** Simple form for admin registration
- **AddCoordinator:** Simple form for coordinator registration
- **AddFarmer:** Form with coordinator dropdown (for admin/superadmin) or automatic assignment (for coordinator)

## Backend Implementation

### Authentication Required
- All registration endpoints now require authentication
- Users must be logged in to register other users

### Role-based Permissions
```javascript
// Superadmin can register admins, coordinators, and farmers
if (currentUserRole === 'superadmin') {
  if (!['admin', 'coordinator', 'farmer'].includes(targetRole)) {
    return res.status(403).json({ error: 'Superadmin can only register admins, coordinators, and farmers' });
  }
}
// Admin can register coordinators and farmers
else if (currentUserRole === 'admin') {
  if (!['coordinator', 'farmer'].includes(targetRole)) {
    return res.status(403).json({ error: 'Admin can only register coordinators and farmers' });
  }
}
// Coordinator can only register farmers
else if (currentUserRole === 'coordinator') {
  if (targetRole !== 'farmer') {
    return res.status(403).json({ error: 'Coordinator can only register farmers' });
  }
}
// Farmers cannot register anyone
else {
  return res.status(403).json({ error: 'Farmers cannot register new users' });
}
```

### Automatic managedBy Assignment
- **Coordinator registration:** Automatically assigned to the registering admin/superadmin
- **Farmer registration by coordinator:** Automatically assigned to the registering coordinator
- **Farmer registration by admin/superadmin:** Requires coordinator selection from dropdown

## Database Schema Updates

### User Model
- Added `superadmin` to role enum
- Updated permissions to differentiate superadmin from admin
- Superadmin has `manage_admins` permission

### Role Permissions
```javascript
case 'superadmin':
  return ['manage_all', 'manage_admins', 'manage_coordinators', 'manage_farmers', 'view_reports', 'system_settings', 'billing'];
case 'admin':
  return ['manage_coordinators', 'manage_farmers', 'view_reports', 'system_settings', 'billing'];
case 'coordinator':
  return ['manage_farmers', 'view_reports', 'manage_fields', 'view_analytics'];
case 'farmer':
  return ['view_own_data', 'view_reports', 'manage_own_fields'];
```

## Security Features

1. **Authentication Required:** All registration requires login
2. **Role-based Access:** Users can only register users they're authorized to manage
3. **Automatic Hierarchy:** Proper `managedBy` relationships are automatically established
4. **Input Validation:** All form inputs are validated on both frontend and backend
5. **Error Handling:** Comprehensive error messages for unauthorized actions

## Usage Instructions

### For Superadmin
1. Login with superadmin credentials
2. See "Add Admin", "Add Coordinator", "Add Farmer" buttons
3. Click appropriate button to register new users
4. For farmers, select a coordinator from the dropdown

### For Admin
1. Login with admin credentials
2. See "Add Coordinator", "Add Farmer" buttons
3. Click appropriate button to register new users
4. For farmers, select a coordinator from the dropdown

### For Coordinator
1. Login with coordinator credentials
2. See "Add Farmer" button
3. Click to register new farmers (automatically assigned to you)

### For Farmer
1. Login with farmer credentials
2. No registration options available
3. Can only view own data and manage own fields

## Migration Notes

- Existing users remain unchanged
- New registration system is backward compatible
- Old `/register` route redirects to login
- All new registrations go through role-based forms

## Troubleshooting

### Common Issues
1. **401 Unauthorized:** User not logged in - must login first
2. **403 Forbidden:** User doesn't have permission to register that role
3. **400 Bad Request:** Missing required fields (like coordinator selection for farmers)
4. **Validation Errors:** Check that all required fields are filled correctly

### Debug Steps
1. Check user role in localStorage
2. Verify authentication token is valid
3. Ensure all required fields are provided
4. Check backend logs for detailed error messages 