const { ROLES, PERMISSIONS } = require('../constants/roles');

module.exports = (sequelize, DataTypes) => {
  const RolePermissions = sequelize.define('RolePermissions', {
    role: {
      type: DataTypes.ENUM(...Object.values(ROLES)),
      allowNull: false,
      primaryKey: true
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Permissions must be an array');
          }
        },
        areValidPermissions(value) {
          const validPermissions = Object.values(PERMISSIONS);
          const invalidPermissions = value.filter(p => !validPermissions.includes(p));
          if (invalidPermissions.length > 0) {
            throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
          }
        }
      }
    }
  });

  // method to get permissions for a role
  RolePermissions.getPermissions = async function(role) {
    try {
      const rolePerms = await this.findByPk(role);
      return rolePerms ? rolePerms.permissions : [];
    } catch (error) {
      console.error('Error getting role permissions:', error);
      throw error;
    }
  };

  // method to update permissions for a role
  RolePermissions.updatePermissions = async function(role, permissions) {
    try {
      // Don't allow modifying admin permissions
      if (role === 'admin') {
        throw new Error('Cannot modify admin permissions');
      }

      const [rolePerms] = await this.upsert({
        role,
        permissions
      });
      return rolePerms;
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  };

  // method to get all role permissions
  RolePermissions.getAllRolePermissions = async function() {
    try {
      const allRoles = Object.values(ROLES);
      const allPermissions = {};

      // Get permissions for each role
      for (const role of allRoles) {
        if (role === 'admin') {
          // Admin has all permissions
          allPermissions[role] = Object.values(PERMISSIONS);
        } else {
          const permissions = await this.getPermissions(role);
          allPermissions[role] = permissions;
        }
      }

      return {
        roles: allPermissions,
        availablePermissions: Object.values(PERMISSIONS)
      };
    } catch (error) {
      console.error('Error getting all role permissions:', error);
      throw error;
    }
  };

  // method to get default permissions for a role
  RolePermissions.getDefaultPermissions = function(role) {
    // Admin has all permissions
    if (role === 'admin') {
      return Object.values(PERMISSIONS);
    }

    const defaultPermissions = {
      'security_officer': [
        PERMISSIONS.VIEW_INSPECTIONS,
        PERMISSIONS.NEW_INSPECTION,
        PERMISSIONS.VIEW_DRILLS,
        PERMISSIONS.NEW_DRILL
      ],
      'entrepreneur': [
        PERMISSIONS.VIEW_INSPECTIONS,
        PERMISSIONS.VIEW_DRILLS,
        PERMISSIONS.DASHBOARD
      ],
      'integrator': [],
      'maintenance': [],
      'control_center': [
        PERMISSIONS.VIEW_INSPECTIONS
      ]
    };

    return defaultPermissions[role] || [];
  };

  RolePermissions.getInitialFaultPermissions = function(role) {
    if (role === 'admin') {
      return [
        PERMISSIONS.NEW_FAULT,
        PERMISSIONS.VIEW_FAULTS,
        PERMISSIONS.UPDATE_FAULT_STATUS,
        PERMISSIONS.UPDATE_FAULT_DETAILS
      ];
    }

    const initialFaultPermissions = {
      'security_officer': [
        PERMISSIONS.VIEW_FAULTS,
        PERMISSIONS.NEW_FAULT
      ],
      'entrepreneur': [
        PERMISSIONS.VIEW_FAULTS
      ],
      'integrator': [
        PERMISSIONS.VIEW_FAULTS,
        PERMISSIONS.UPDATE_FAULT_STATUS,
        PERMISSIONS.UPDATE_FAULT_DETAILS
      ],
      'maintenance': [
        PERMISSIONS.VIEW_FAULTS,
        PERMISSIONS.UPDATE_FAULT_STATUS,
        PERMISSIONS.UPDATE_FAULT_DETAILS
      ],
      'control_center': [
        PERMISSIONS.VIEW_FAULTS,
        PERMISSIONS.NEW_FAULT,
        PERMISSIONS.UPDATE_FAULT_STATUS
      ]
    };

    return initialFaultPermissions[role] || [];
  };

  // Initialize role permissions if they don't exist
  RolePermissions.initializeRole = async function(role) {
    try {
      const existingPerms = await this.findByPk(role);
      if (!existingPerms) {
        const defaultPerms = this.getDefaultPermissions(role);
        const faultPerms = this.getInitialFaultPermissions(role);
        await this.create({
          role,
          permissions: [...defaultPerms, ...faultPerms]
        });
      }
    } catch (error) {
      console.error('Error initializing role permissions:', error);
      throw error;
    }
  };

  return RolePermissions;
};
