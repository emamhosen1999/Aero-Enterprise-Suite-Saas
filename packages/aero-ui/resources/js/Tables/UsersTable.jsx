import React, { useState, useMemo, useEffect } from "react";
import { Link, usePage } from '@inertiajs/react';
import { showToast } from '@/utils/toastUtils';
import { getProfileAvatarTokens } from '@/Components/ProfileAvatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableColumn, 
  TableHeader, 
  TableRow, 
  User,
  Chip,
  Tooltip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Switch,
  Pagination,
  Spinner,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import {
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  UserIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  HashtagIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowPathIcon,
  ClockIcon,
  BriefcaseIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";

// Theme utility function (consistent with UsersList)
const getThemeRadius = () => {
  return 'var(--borderRadius, 12px)';
};

/**
 * Helper to get routes based on context
 */
const getRoutes = (context) => {
  const isAdmin = context === 'admin';
  return {
    // Device routes - consistent naming
    devices: 'devices.admin.list',
    devicesToggle: 'devices.admin.toggle',
    devicesReset: 'devices.admin.reset',
    devicesDeactivate: 'devices.admin.deactivate',
    // User management routes
    toggleStatus: 'users.toggleStatus',
    updateRoles: 'users.updateRole',
    destroy: 'users.destroy',
    restore: 'users.restore',
    lock: 'users.lock',
    unlock: 'users.unlock',
    forcePasswordReset: 'users.forcePasswordReset',
    resendVerification: 'users.resendVerification',
  };
};

const UsersTable = ({ 
  allUsers, 
  roles, 
  isMobile, 
  isTablet, 
  setUsers,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  totalUsers = 0,
  onEdit,
  loading = false,
  updateUserOptimized,
  deleteUserOptimized,
  toggleUserStatusOptimized,
  updateUserRolesOptimized,
  // Device management functions

  // Context for route generation
  context = 'tenant',
  
  // Onboarding callback
  onOnboardEmployee,
  
  // HRM module check
  hrmModuleInstalled = false,
  
  // Selection for bulk operations
  selectedUsers = [],
  onSelectionChange = () => {},
}) => {
  // Get routes for the current context
  const routes = getRoutes(context);
  
  // Get current user's auth info
  const { auth } = usePage().props;
  
  // Helper to check if a user has Super Admin role
  const isSuperAdmin = (user) => {
    if (!user) return false;
    
    // Check for platform admin context flags (from HandleInertiaRequests)
    if (user.is_super_admin === true || user.is_platform_super_admin === true) {
      return true;
    }
    
    // Check roles array (tenant context or user list items)
    if (user.roles && Array.isArray(user.roles)) {
      const roleNames = user.roles.map(r => typeof r === 'object' ? r.name : r);
      return roleNames.some(name => 
        name.toLowerCase().includes('super') && name.toLowerCase().includes('admin')
      );
    }
    
    // Check single role field (admin context)
    if (user.role && typeof user.role === 'string') {
      return user.role.toLowerCase().includes('super') && user.role.toLowerCase().includes('admin');
    }
    
    return false;
  };
  
  // Check if current logged-in user is Super Admin
  // Also check the auth-level flags for admin context
  const currentUserIsSuperAdmin = useMemo(() => {
    // First check auth-level flags (set by HandleInertiaRequests)
    if (auth?.isSuperAdmin === true || auth?.isPlatformSuperAdmin === true) {
      return true;
    }
    // Fall back to checking the user object
    return isSuperAdmin(auth?.user);
  }, [auth?.user, auth?.isSuperAdmin, auth?.isPlatformSuperAdmin]);
  
  // Count total Super Admins in the user list
  const superAdminCount = useMemo(() => {
    return (allUsers || []).filter(user => isSuperAdmin(user)).length;
  }, [allUsers]);
  
  // Check if current user can EDIT another user
  // Super Admins can edit other Super Admins (including themselves)
  // Non-Super Admins cannot edit Super Admins
  const canEditUser = (targetUser) => {
    if (isSuperAdmin(targetUser)) {
      return currentUserIsSuperAdmin;
    }
    return true;
  };
  
  // Check if current user can DELETE another user
  // Super Admins can delete other Super Admins, but:
  // - Cannot delete themselves if they are the ONLY Super Admin
  // - Can delete themselves if there are other Super Admins
  const canDeleteUser = (targetUser) => {
    const targetIsSuperAdmin = isSuperAdmin(targetUser);
    const isCurrentUser = targetUser.id === auth?.user?.id;
    
    // Non-Super Admins cannot delete Super Admins
    if (targetIsSuperAdmin && !currentUserIsSuperAdmin) {
      return false;
    }
    
    // If trying to delete self and is Super Admin
    if (isCurrentUser && currentUserIsSuperAdmin) {
      // Can only delete self if there's more than one Super Admin
      return superAdminCount > 1;
    }
    
    // Super Admins can delete other Super Admins
    // Regular users can be deleted by anyone with permission
    return true;
  };
  
  // Legacy function for backward compatibility - used for edit actions
  const canManageUser = canEditUser;
  
  const [loadingStates, setLoadingStates] = useState({});

  // Device detection functions (copied from UserDeviceManagement)
  const getDeviceIcon = (userAgent, className = "w-5 h-5") => {
    const ua = userAgent?.toLowerCase() || '';
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <DevicePhoneMobileIcon className={`${className} text-primary`} />;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return <DeviceTabletIcon className={`${className} text-secondary`} />;
    } else {
      return <ComputerDesktopIcon className={`${className} text-default-500`} />;
    }
  };

  const getDeviceType = (userAgent) => {
    const ua = userAgent?.toLowerCase() || '';
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile Device';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

 




  const statusColorMap = {
    active: "success",
    inactive: "danger",
  };

  // Set loading state for specific operations
  const setLoading = (userId, operation, loading) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${userId}-${operation}`]: loading
    }));
  };

  const isLoading = (userId, operation) => {
    return loadingStates[`${userId}-${operation}`] || false;
  };

  async function handleRoleChange(userId, newRoleNames) {
    setLoading(userId, 'role', true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        // Use context-aware route and HTTP method for role updates
        // Admin context uses PATCH, tenant context uses POST
        const isAdminContext = context === 'admin';
        const updateRoute = isAdminContext 
          ? route('admin.users.update-roles', { user: userId })
          : route('users.updateRole', { id: userId });
        
        // Admin uses PATCH, tenant uses POST
        const response = isAdminContext
          ? await axios.patch(updateRoute, { roles: newRoleNames })
          : await axios.post(updateRoute, { roles: newRoleNames });
        
        if (response.status === 200) {
          // Only update the affected user locally without refreshing the entire table
          if (updateUserRolesOptimized) {
            updateUserRolesOptimized(userId, newRoleNames);
          }
          resolve([response.data.message || 'Role updated successfully']);
        }
      } catch (error) {
        if (error.response?.status === 422) {
          reject(error.response.data.errors || ['Failed to update user role.']);
        } else {
          reject(['An unexpected error occurred. Please try again later.']);
        }
      } finally {
        setLoading(userId, 'role', false);
      }
    });
    showToast.promise(promise, {
      loading: 'Updating user role...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
    
    // Return the promise to allow parent components to track completion
    return promise;
  }



  const handleDelete = async (userId) => {
    setLoading(userId, 'delete', true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(route(routes.destroy, { id: userId }), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
          },
          body: JSON.stringify({ user_id: userId }),
        });
        const data = await response.json();
        if (response.ok) {
          if (deleteUserOptimized) {
            deleteUserOptimized(userId);
          }
          resolve([data.message]);
        } else {
          reject([data.message]);
        }
      } catch (error) {
        reject(['An error occurred while deleting user. Please try again.']);
      } finally {
        setLoading(userId, 'delete', false);
      }
    });
    showToast.promise(promise, {
      loading: 'Deleting user...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Restore soft-deleted user
  const handleRestoreUser = async (user) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('users.restore', { id: user.id }));
        if (response.status === 200) {
          // Refresh the users list
          if (updateUserOptimized) {
            updateUserOptimized(response.data.user);
          }
          resolve([response.data.message || 'User restored successfully']);
        }
      } catch (error) {
        reject(error.response?.data?.errors || [error.response?.data?.error || 'Failed to restore user']);
      }
    });
    
    showToast.promise(promise, {
      loading: 'Restoring user...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Lock user account - call parent to show lock modal
  const handleLockAccount = (user) => {
    // This will trigger the parent component to show LockAccountModal
    if (onEdit) {
      // Use onEdit to pass the user and trigger the modal
      // The parent will handle showing the LockAccountModal
      onEdit(user, 'lock');
    }
  };

  // Unlock user account
  const handleUnlockAccount = async (user) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('users.unlock', { id: user.id }));
        if (response.status === 200) {
          if (updateUserOptimized) {
            updateUserOptimized(response.data.user);
          }
          resolve([response.data.message || 'Account unlocked successfully']);
        }
      } catch (error) {
        reject(error.response?.data?.errors || [error.response?.data?.error || 'Failed to unlock account']);
      }
    });
    
    showToast.promise(promise, {
      loading: 'Unlocking account...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Force password reset
  const handleForcePasswordReset = async (user) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('users.forcePasswordReset', { id: user.id }));
        if (response.status === 200) {
          if (updateUserOptimized) {
            updateUserOptimized(response.data.user);
          }
          resolve([response.data.message || 'Password reset forced successfully']);
        }
      } catch (error) {
        reject(error.response?.data?.errors || [error.response?.data?.error || 'Failed to force password reset']);
      }
    });
    
    showToast.promise(promise, {
      loading: 'Setting password reset...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Resend email verification
  const handleResendVerification = async (user) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('users.resendVerification', { id: user.id }));
        if (response.status === 200) {
          resolve([response.data.message || 'Verification email sent successfully']);
        }
      } catch (error) {
        reject(error.response?.data?.errors || [error.response?.data?.error || 'Failed to resend verification email']);
      }
    });
    
    showToast.promise(promise, {
      loading: 'Sending verification email...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Selection handlers
  const isUserSelected = (user) => {
    return selectedUsers.some(u => u.id === user.id);
  };

  const handleUserToggle = (user) => {
    // Only allow selecting users who can be onboarded (no employee_id)
    if (user.employee_id) return;
    
    if (isUserSelected(user)) {
      onSelectionChange(selectedUsers.filter(u => u.id !== user.id));
    } else {
      onSelectionChange([...selectedUsers, user]);
    }
  };

  const handleSelectAll = () => {
    // Only select users without employee_id
    const selectableUsers = allUsers.filter(u => !u.employee_id);
    
    if (selectedUsers.length === selectableUsers.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all selectable
      onSelectionChange(selectableUsers);
    }
  };

  const columns = useMemo(() => {
    const baseColumns = hrmModuleInstalled ? [
      { name: <Checkbox 
          isSelected={selectedUsers.length > 0 && selectedUsers.length === allUsers.filter(u => !u.employee_id).length}
          onChange={handleSelectAll}
          isIndeterminate={selectedUsers.length > 0 && selectedUsers.length < allUsers.filter(u => !u.employee_id).length}
        />, uid: "select" },
      { name: "#", uid: "sl" },
      { name: "USER", uid: "user" },
      { name: "EMAIL", uid: "email" },
      { name: "STATUS", uid: "status" },
      { name: "ROLES", uid: "roles" },
      { name: "ACTIONS", uid: "actions" }
    ] : [
      { name: "#", uid: "sl" },
      { name: "USER", uid: "user" },
      { name: "EMAIL", uid: "email" },
      { name: "STATUS", uid: "status" },
      { name: "ROLES", uid: "roles" },
      { name: "ACTIONS", uid: "actions" }
    ];

    
    return baseColumns;
  }, [isMobile, isTablet, context, hrmModuleInstalled, selectedUsers, allUsers]);

  // Function to toggle user status - optimized to avoid full reloads
  const toggleUserStatus = async (userId, currentStatus) => {
    if (isLoading(userId, 'status')) return; // Prevent multiple calls
    
    setLoading(userId, 'status', true);
    try {
      // In this implementation, we use the handler passed from the parent
      if (toggleUserStatusOptimized) {
        toggleUserStatusOptimized(userId, !currentStatus);
        showToast.success(`User status ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else if (setUsers) {
        // Fallback to the older method if the optimized handler is not available
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, active: !currentStatus } : user
          )
        );
        showToast.success(`User status ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast.error('Failed to update user status');
    } finally {
      setLoading(userId, 'status', false);
    }
  };

  // Render cell content based on column type
  const renderCell = (user, columnKey, rowIndex) => {
 
    const cellValue = user[columnKey];
    
    switch (columnKey) {
      case "select":
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              isSelected={isUserSelected(user)}
              onChange={() => handleUserToggle(user)}
              isDisabled={user.employee_id}
              aria-label={`Select ${user.name}`}
            />
          </div>
        );
      case "sl":
        // Calculate serial number based on pagination
        const startIndex = pagination?.currentPage && pagination?.perPage 
          ? Number((pagination.currentPage - 1) * pagination.perPage) 
          : 0;
        // Since rowIndex might be undefined, ensure it has a numeric value
        const safeIndex = typeof rowIndex === 'number' ? rowIndex : 0;
        const serialNumber = startIndex + safeIndex + 1;
        return (
          <div className="flex items-center justify-center">
            <div 
              className="flex items-center justify-center w-8 h-8 border shadow-sm"
              style={{
                background: `var(--theme-content2, #F4F4F5)`,
                borderColor: `var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 8px)`,
                color: `var(--theme-foreground, #000000)`,
              }}
            >
              <span 
                className="text-sm font-bold"
                style={{
                  fontFamily: `var(--fontFamily, "Inter")`,
                }}
              >
                {serialNumber}
              </span>
            </div>
          </div>
        );
        
      case "user":
        return (
          <div className="flex items-center gap-2">
            <User
              className="w-fit max-w-full"
              avatarProps={{
                src: user?.profile_image_url || user?.profile_image,
                name: user?.name || "Unnamed User",
                size: "sm",
                ...getProfileAvatarTokens({
                  name: user?.name || "Unnamed User",
                  size: 'sm',
                }),
              }}
              name={
                <div className="flex items-center gap-1.5">
                  <span 
                    className="text-sm font-semibold whitespace-nowrap text-default-900"
                    style={{
                      fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                  >
                    {user?.name || "Unnamed User"}
                  </span>
                  {user.account_locked_at && (
                    <Tooltip content="Account Locked">
                      <LockClosedIcon className="w-4 h-4 text-danger" />
                    </Tooltip>
                  )}
                </div>
              }
              description={
                <span 
                  className="text-xs text-default-500"
                  style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                  }}
                >
                  ID: {user?.id}
                </span>
              }
            />
          </div>
        );
        
      case "email":
        return (
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-md"
              style={{
                background: `var(--theme-content2, #F4F4F5)`,
                color: `var(--theme-default-500, #6B7280)`,
              }}
            >
              <EnvelopeIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span 
                className="text-sm font-medium text-default-900"
                style={{
                  fontFamily: `var(--fontFamily, "Inter")`,
                }}
              >
                {user.email}
              </span>
              {!user.email_verified_at && (
                <Tooltip content="Email not verified">
                  <Chip
                    size="sm"
                    variant="flat"
                    color="warning"
                    className="h-5 px-1.5"
                  >
                    <span className="text-xs font-medium">Unverified</span>
                  </Chip>
                </Tooltip>
              )}
            </div>
          </div>
        );
        
      case "phone":
        return (
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-md"
              style={{
                background: `var(--theme-content2, #F4F4F5)`,
                color: `var(--theme-default-500, #6B7280)`,
              }}
            >
              <PhoneIcon className="w-3.5 h-3.5" />
            </div>
            <span 
              className="text-sm font-medium text-default-900"
              style={{
                fontFamily: `var(--fontFamily, "Inter")`,
              }}
            >
              {user.phone || "N/A"}
            </span>
          </div>
        );
        
      case "department":
        return (
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-md"
              style={{
                background: `var(--theme-content2, #F4F4F5)`,
                color: `var(--theme-default-500, #6B7280)`,
              }}
            >
              <BuildingOfficeIcon className="w-3.5 h-3.5" />
            </div>
            <span 
              className="text-sm font-medium text-default-900"
              style={{
                fontFamily: `var(--fontFamily, "Inter")`,
              }}
            >
              {user?.department?.name || "N/A"}
            </span>
          </div>
        );

    
        
      case "status":
        // Show deleted indicator if user is soft-deleted
        if (user.deleted_at) {
          return (
            <div className="flex items-center justify-center">
              <Chip
                size="sm"
                variant="flat"
                color="danger"
                startContent={<TrashIcon className="w-3.5 h-3.5" />}
              >
                Deleted
              </Chip>
            </div>
          );
        }
        
        return (
          <div className="flex items-center justify-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={user.active}
                onChange={() => toggleUserStatus(user.id, user.active)}
                disabled={isLoading(user.id, 'status')}
              />
              <div 
                className="w-11 h-6 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer transition-all duration-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  backgroundColor: user.active 
                    ? `var(--theme-success, #10B981)` 
                    : `var(--theme-danger, #EF4444)`,
                  
                }}
              ></div>
              {isLoading(user.id, 'status') && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner size="sm" color="default" />
                </div>
              )}
            </label>
            <span 
              className="text-xs font-medium"
              style={{
                color: user.active 
                  ? `var(--theme-success, #10B981)` 
                  : `var(--theme-danger, #EF4444)`,
                fontFamily: `var(--fontFamily, "Inter")`,
              }}
            >
              {user.active ? "Active" : "Inactive"}
            </span>
          </div>
        );
        
      case "roles":
        // Get simple role names for display
        const roleNames = user.roles?.map(role => 
          typeof role === 'object' && role !== null ? role.name : role
        ) || [];
        
        // Convert the role names to a Set for selection
        const roleSet = new Set(roleNames);
        
        // Create a simple string representation of roles
        const selectedValue = Array.from(roleSet).join(", ") || "No Roles";
        
        // Check if this user is a Super Admin - only Super Admins can change Super Admin roles
        const targetIsSuperAdmin = isSuperAdmin(user);
        const canChangeRoles = targetIsSuperAdmin ? currentUserIsSuperAdmin : true;
        
        // If user cannot change roles, show tooltip-wrapped disabled button without dropdown
        if (!canChangeRoles) {
          return (
            <div className="flex items-center">
              <Tooltip content="Only Super Administrators can modify Super Admin roles">
                <Button 
                  className="capitalize"
                  variant="solid"
                  size="sm"
                  isDisabled
                  radius={getThemeRadius()}
                  style={{
                    background: `var(--theme-default-200, #E5E7EB)`,
                    color: `var(--theme-default-500, #6B7280)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    borderRadius: getThemeRadius(),
                  }}
                >
                  {selectedValue}
                </Button>
              </Tooltip>
            </div>
          );
        }
        
        return (
          <div className="flex items-center">
            <Dropdown 
              isDisabled={isLoading(user.id, 'role')}
              className="max-w-[220px]"
              aria-label={`Role selection for ${user.name || 'user'}`}
            >
              <DropdownTrigger>
                <Button 
                  className="capitalize"
                  variant="solid"
                  size="sm"
                  radius={getThemeRadius()}
                  startContent={isLoading(user.id, 'role') ? <Spinner size="sm" /> : null}
                  style={{
                    background: `var(--theme-primary, #3B82F6)`,
                    color: 'white',
                    fontFamily: `var(--fontFamily, "Inter")`,
                    borderRadius: getThemeRadius(),
                    cursor: 'pointer',
                  }}
                >
                  {selectedValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection={false}
                aria-label="Role selection"
                closeOnSelect={false}
                selectedKeys={roleSet}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={(keys) => {
                  const newRoles = Array.from(keys);
                  handleRoleChange(user.id, newRoles);
                }}
              >
                {(roles || []).map((role) => (
                  <DropdownItem 
                    key={typeof role === 'object' && role !== null ? role.name : role}
                  >
                    {typeof role === 'object' && role !== null ? role.name : role}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
        
      case "actions":
        // Build dropdown items dynamically to avoid fragment issues
        const actionItems = [];
        
        // Edit User
        actionItems.push(
          <DropdownItem 
            key="edit"
            onPress={() => {
              if (onEdit) onEdit(user);
            }}
            className="text-amber-500"
            startContent={<PencilIcon className="w-4 h-4" />}
          >
            Edit
          </DropdownItem>
        );
        
        // Onboard as Employee (only if HRM installed and user doesn't have employee record)
        if (hrmModuleInstalled && onOnboardEmployee && !user.employee_id) {
          actionItems.push(
            <DropdownItem
              key="onboard-employee"
              onPress={() => {
                if (onOnboardEmployee) onOnboardEmployee(user);
              }}
              className="text-success"
              startContent={<UserPlusIcon className="w-4 h-4" />}
            >
              Onboard as Employee
            </DropdownItem>
          );
        }
        
        // View Device History
        actionItems.push(
          <DropdownItem
            key="view-devices"
            href={route(routes.devices, { userId: user.id })}
            as={Link}
            startContent={<DevicePhoneMobileIcon className="w-4 h-4" />}
            className="text-blue-500"
          >
            View Device History
          </DropdownItem>
        );
        
        // Lock/Unlock Account
        if (user.account_locked_at) {
          actionItems.push(
            <DropdownItem
              key="unlock"
              onPress={() => handleUnlockAccount(user)}
              className="text-success"
              startContent={<LockOpenIcon className="w-4 h-4" />}
            >
              Unlock Account
            </DropdownItem>
          );
        } else if (user.id !== auth?.user?.id) {
          actionItems.push(
            <DropdownItem
              key="lock"
              onPress={() => handleLockAccount(user)}
              className="text-warning"
              startContent={<LockClosedIcon className="w-4 h-4" />}
            >
              Lock Account
            </DropdownItem>
          );
        }
        
        // Force Password Reset
        if (user.id !== auth?.user?.id) {
          actionItems.push(
            <DropdownItem
              key="force-password-reset"
              onPress={() => handleForcePasswordReset(user)}
              className="text-purple-500"
              startContent={<ArrowPathIcon className="w-4 h-4" />}
            >
              Force Password Reset
            </DropdownItem>
          );
        }
        
        // Resend Email Verification (only if not verified)
        if (!user.email_verified_at) {
          actionItems.push(
            <DropdownItem
              key="resend-verification"
              onPress={() => handleResendVerification(user)}
              className="text-cyan-500"
              startContent={<EnvelopeIcon className="w-4 h-4" />}
            >
              Resend Verification
            </DropdownItem>
          );
        }
        
        // Restore User (only if soft deleted)
        if (user.deleted_at) {
          actionItems.push(
            <DropdownItem
              key="restore"
              onPress={() => handleRestoreUser(user)}
              className="text-success"
              startContent={<ArrowPathIcon className="w-4 h-4" />}
            >
              Restore User
            </DropdownItem>
          );
        }
        
        // Delete User - Protected for Super Admins and last Super Admin check
        const isCurrentUserTarget = user.id === auth?.user?.id;
        const userIsSuperAdmin = isSuperAdmin(user);
        
        if (canDeleteUser(user)) {
          actionItems.push(
            <DropdownItem 
              key="delete"
              onPress={() => handleDelete(user.id)}
              className="text-danger"
              color="danger"
              startContent={
                isLoading(user.id, 'delete') ? (
                  <div className="animate-spin">
                    <ArrowPathIcon className="w-4 h-4" />
                  </div>
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )
              }
              isDisabled={isLoading(user.id, 'delete')}
            >
              {isLoading(user.id, 'delete') ? 'Deleting...' : 'Delete'}
            </DropdownItem>
          );
        } else {
          // Determine the reason for restriction
          let restrictionMessage = 'Delete (Super Admin Only)';
          if (isCurrentUserTarget && currentUserIsSuperAdmin && superAdminCount <= 1) {
            restrictionMessage = 'Cannot delete (Last Super Admin)';
          } else if (userIsSuperAdmin && !currentUserIsSuperAdmin) {
            restrictionMessage = 'Delete (Super Admin Only)';
          }
          
          actionItems.push(
            <DropdownItem 
              key="delete-disabled"
              isDisabled
              className="text-default-400"
              startContent={<TrashIcon className="w-4 h-4" />}
            >
              {restrictionMessage}
            </DropdownItem>
          );
        }
        
        return (
          <div className="flex justify-center items-center">
            <Dropdown aria-label={`Actions for ${user.name || 'user'}`}>
              <DropdownTrigger>
                <Button 
                  isIconOnly
                  size="sm"
                  variant="solid"
                  radius={getThemeRadius()}
                  style={{
                    background: `var(--theme-content2, #F4F4F5)`,
                    color: `var(--theme-default-500, #6B7280)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    borderRadius: getThemeRadius(),
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User Actions"
                style={{
                  background: `var(--theme-content1, #FFFFFF)`,
                  border: `1px solid var(--theme-divider, #E5E7EB)`,
                  borderRadius: getThemeRadius(),
                }}
              >
                {actionItems}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
        
      default:
        return cellValue;
    }
  };

  const renderPagination = () => {
    if (!allUsers || !totalUsers || loading) return null;
    
    return (
      <div 
        className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t"
        style={{
          borderColor: `var(--theme-divider, #E4E4E7)`,
          background: `var(--theme-content2, #F4F4F5)`,
          borderRadius: `0 0 var(--borderRadius, 12px) var(--borderRadius, 12px)`,
        }}
      >
        <span 
          className="text-sm text-default-600 mb-3 sm:mb-0 font-medium"
          style={{
            fontFamily: `var(--fontFamily, "Inter")`,
          }}
        >
          Showing{' '}
          <span className="font-semibold text-default-900">
            {((pagination.currentPage - 1) * pagination.perPage) + 1}
          </span>
          {' '}to{' '}
          <span className="font-semibold text-default-900">
            {Math.min(pagination.currentPage * pagination.perPage, totalUsers)}
          </span>
          {' '}of{' '}
          <span className="font-semibold text-default-900">{totalUsers}</span>
          {' '}users
        </span>
        
        <Pagination
          total={Math.ceil(totalUsers / pagination.perPage)}
          initialPage={pagination.currentPage}
          page={pagination.currentPage}
          onChange={onPageChange}
          size={isMobile ? "sm" : "md"}
          variant="flat"
          showControls
          radius={getThemeRadius()}
          style={{
            fontFamily: `var(--fontFamily, "Inter")`,
          }}
          classNames={{
            wrapper: "gap-1",
            item: "bg-default-100 hover:bg-default-200 text-default-700 font-medium border border-default-200",
            cursor: "bg-primary text-primary-foreground font-semibold shadow-md",
            prev: "bg-default-100 hover:bg-default-200 text-default-700 border border-default-200",
            next: "bg-default-100 hover:bg-default-200 text-default-700 border border-default-200",
          }}
        />
      </div>
    );
  };

  return (
    <div 
      className="w-full flex flex-col border rounded-lg shadow-lg" 
      style={{ 
        maxHeight: 'calc(100vh - 240px)',
        borderColor: `var(--theme-divider, #E4E4E7)`,
        background: `var(--theme-content1, #FFFFFF)`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
      }}
    >
      {/* Table Container with Single Scroll */}
      <div 
        className="flex-1 overflow-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `var(--theme-divider, #E4E4E7) transparent`,
        }}
      >
        <Table
          
          removeWrapper
          selectionMode="none"
          isCompact={isMobile}
          classNames={{
            base: "min-w-[900px]",
            wrapper: "p-0 shadow-none",
            th: "text-default-600 border-b font-semibold text-xs sticky top-0 z-30",
            td: "border-b py-4 px-3",
            table: "border-collapse w-full",
            thead: "sticky top-0 z-30",
            tbody: "",
            tr: "hover:bg-default-50 transition-colors duration-150",
            emptyWrapper: "text-center h-32",
            loadingWrapper: "h-32",
          }}
          style={{
            '--table-border-color': 'var(--theme-divider, #E4E4E7)',
            '--table-header-bg': 'var(--theme-content2, #F4F4F5)',
            '--table-row-hover': 'var(--theme-default-50, #F9FAFB)',
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.uid} 
                align={column.uid === "actions" ? "center" : column.uid === "sl" ? "center" : "start"}
                width={
                  
                  column.uid === "user" ? 280 : 
                  column.uid === "email" ? 240 :
                  column.uid === "phone" ? 140 :
                  column.uid === "department" ? 160 :
                  column.uid === "device_status" ? 160 :
                  column.uid === "status" ? 120 :
                  column.uid === "roles" ? 180 :
                  column.uid === "actions" ? 120 :
                  undefined
                }
                
                style={{
                  background: 'var(--table-header-bg)',
                  borderColor: 'var(--table-border-color)',
                  fontFamily: `var(--fontFamily, "Inter")`,
                  fontSize: '0.75rem',
                  fontWeight: '600',
                 
                  
                }}
              >
                <div className="flex items-center gap-2 py-1">
                  {column.uid === "sl" && <HashtagIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "user" && <UserIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "email" && <EnvelopeIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "phone" && <PhoneIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "department" && <BuildingOfficeIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "device_status" && <DevicePhoneMobileIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "status" && <CheckCircleIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "roles" && <ShieldCheckIcon className="w-3 h-3 text-default-400" />}
                  {column.uid === "actions" && <EllipsisVerticalIcon className="w-3 h-3 text-default-400" />}
                  <span>{column.name}</span>
                </div>
              </TableColumn>
            )}
          </TableHeader>
          <TableBody 
            items={allUsers || []} 
            emptyContent={
              <div className="flex flex-col items-center justify-center py-8">
                <UserGroupIcon className="w-12 h-12 text-default-300 mb-3" />
                <p className="text-default-500 font-medium">No users found</p>
                <p className="text-default-400 text-sm">Try adjusting your search or filters</p>
              </div>
            }
            loadingContent={
              <div className="flex justify-center items-center py-8">
                <Spinner size="lg" color="primary" />
              </div>
            }
            isLoading={loading}
          >
            {(item, index) => {
              const itemIndex = allUsers ? allUsers.findIndex(user => user.id === item.id) : index;
              return (
                <TableRow 
                  key={item.id} 
                  className="group"
                  style={{
                    background: 'var(--theme-content1, #FFFFFF)',
                  }}
                >
                  {(columnKey) => (
                    <TableCell 
                      
                      style={{
                        
                        borderColor: 'var(--table-border-color)',
                        fontFamily: `var(--fontFamily, "Inter")`,
                        
                        background: 'inherit',
                      }}
                    >
                      {renderCell(item, columnKey, itemIndex)}
                    </TableCell>
                  )}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Footer - Outside scroll area */}
      {renderPagination()}
    </div>
  );
};

export default UsersTable;
