module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for initial registration
    },
    role: {
      type: DataTypes.ENUM(
        'admin',             // מנהל על
        'security_officer',  // קצין ביטחון
        'entrepreneur',      // יזם
        'integrator',        // אינטגרטור
        'maintenance',       // אחזקה
        'control_center'     // מוקד
      ),
      allowNull: false
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      },
      validate: {
        isValidForRole(value) {
          // organizationId should only be set for integrator and maintenance roles
          if (['integrator', 'maintenance'].includes(this.role)) {
            if (!value) {
              throw new Error('Organization is required for integrator and maintenance roles');
            }
          } else {
            if (value) {
              throw new Error('Organization should only be set for integrator and maintenance roles');
            }
          }
        }
      }
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
        }
      }
    },
    passwordChangeRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  User.associate = function(models) {
    // Entrepreneur's sites
    User.hasMany(models.Site, {
      foreignKey: 'entrepreneurId',
      as: 'sites'
    });

    // User belongs to an organization (only for integrator and maintenance roles)
    User.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
  };

  // Permission check methods
  User.prototype.hasPermission = function(permission) {
    return this.role === 'admin' || this.permissions.includes(permission);
  };

  User.prototype.hasAnyPermission = function(permissions) {
    return this.role === 'admin' || permissions.some(permission => this.permissions.includes(permission));
  };

  User.prototype.hasAllPermissions = function(permissions) {
    return this.role === 'admin' || permissions.every(permission => this.permissions.includes(permission));
  };

  // Role permission methods
  User.getRolePermissions = async function(role) {
    try {
      const RolePermissions = sequelize.models.RolePermissions;
      const rolePermissions = await RolePermissions.findOne({ where: { role } });
      return rolePermissions ? rolePermissions.permissions : [];
    } catch (error) {
      console.error('Error getting role permissions:', error);
      throw error;
    }
  };

  User.updateRolePermissions = async function(role, permissions) {
    const transaction = await sequelize.transaction();
    try {
      const RolePermissions = sequelize.models.RolePermissions;

      // Don't allow modifying admin permissions
      if (role === 'admin') {
        throw new Error('Cannot modify admin permissions');
      }

      // Validate permissions array
      if (!Array.isArray(permissions)) {
        throw new Error('Permissions must be an array');
      }

      // Get current permissions to check what changed
      const currentPermissions = await this.getRolePermissions(role);

      // Update role permissions
      await RolePermissions.upsert(
        { 
          role, 
          permissions,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { transaction }
      );

      // Update all users with this role
      const [updatedCount] = await this.update(
        { permissions },
        { 
          where: { role },
          transaction
        }
      );

      // Log the changes
      const addedPermissions = permissions.filter(p => !currentPermissions.includes(p));
      const removedPermissions = currentPermissions.filter(p => !permissions.includes(p));
      console.log(`Updated permissions for role ${role}:`, {
        addedPermissions,
        removedPermissions,
        usersUpdated: updatedCount
      });

      await transaction.commit();

      return {
        role,
        permissions,
        changes: {
          added: addedPermissions,
          removed: removedPermissions
        },
        usersUpdated: updatedCount
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating role permissions:', error);
      throw error;
    }
  };

  // Get default permissions for a role
  User.getDefaultPermissions = async function(role) {
    try {
      if (role === 'admin') {
        // Admin has all permissions
        const { PERMISSIONS } = require('../constants/roles');
        return Object.values(PERMISSIONS);
      }

      // Get permissions from RolePermissions model
      return await this.getRolePermissions(role);
    } catch (error) {
      console.error('Error getting default permissions:', error);
      throw error;
    }
  };

  return User;
};
