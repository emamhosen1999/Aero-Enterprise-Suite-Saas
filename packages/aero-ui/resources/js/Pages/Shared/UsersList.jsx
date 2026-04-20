/**
 * Shared Users List Component
 * 
 * Used by both Tenant Users Management and Platform Admin Users Management.
 * The component adapts its behavior based on the `context` prop:
 * - 'tenant': Uses tenant-specific routes (users.*)
 * - 'admin': Uses platform admin routes (admin.users.*)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router, usePage } from "@inertiajs/react";
import { motion } from 'framer-motion';
import { hasRoute, safeRoute, safeNavigate } from '@/utils/routeUtils';
import { 
  Button,
  Chip,
  ButtonGroup,
  Card,
  CardBody,
  User,
  Pagination,
  Input,
  Select,
  SelectItem,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  Tooltip,
  Switch,
  Skeleton
} from "@heroui/react";

import { 
  UserPlusIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  Squares2X2Icon,
  TableCellsIcon,
  AdjustmentsHorizontalIcon,
  PencilIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  DevicePhoneMobileIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  EnvelopeIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import UsersTable from '@/Tables/UsersTable.jsx';
import AddEditUserForm from "@/Forms/AddEditUserForm.jsx";
import InviteUserForm from "@/Forms/InviteUserForm.jsx";
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * Route helper that returns the appropriate route based on context
 * Supports three contexts:
 * - 'admin': Platform admin routes (admin.users.*)
 * - 'tenant': Tenant routes for SaaS mode (users.*)
 * - 'core': Core routes for standalone mode (core.users.*)
 */
const getRoutes = (context) => {
  if (context === 'admin') {
    return {
      // Data routes
      paginate: 'admin.users.paginate',
      stats: 'admin.users.stats',
      store: 'admin.users.store',
      update: 'admin.users.update',
      destroy: 'admin.users.destroy',
      forceDelete: 'admin.users.force-delete',
      restore: 'admin.users.restore',
      toggleStatus: 'admin.users.toggle-status',
      updateRoles: 'admin.users.update-roles',
      
      // Device management routes
      devicesToggle: 'admin.users.devices.toggle',
      devicesReset: 'admin.users.devices.reset',
      devices: 'admin.users.devices',
      
      // Profile route
      profile: 'admin.users.show',
    };
  }
  
  if (context === 'core') {
    return {
      // Data routes for standalone/core mode
      paginate: 'core.users.paginate',
      stats: 'core.users.stats',
      store: 'core.users.store',
      update: 'core.users.update',
      destroy: 'core.users.destroy',
      forceDelete: 'core.users.forceDelete',
      restore: 'core.users.restore',
      toggleStatus: 'core.users.toggleStatus',
      updateRoles: 'core.users.updateRole',
      
      // Device management routes
      devicesToggle: 'core.devices.admin.toggle',
      devicesReset: 'core.devices.admin.reset',
      devices: 'core.devices.admin.index',
      
      // Profile route
      profile: 'core.profile',
    };
  }
  
  // Default: tenant context for SaaS mode
  return {
    // Data routes
    paginate: 'users.paginate',
    stats: 'users.stats',
    store: 'users.store',
    update: 'users.update',
    destroy: 'users.destroy',
    forceDelete: 'users.forceDelete',
    restore: 'users.restore',
    toggleStatus: 'users.toggleStatus',
    updateRoles: 'users.updateRole',
    
    // Device management routes
    devicesToggle: 'devices.admin.toggle',
    devicesReset: 'devices.admin.reset',
    devices: 'devices.admin.index',
    
    // Profile route
    profile: 'profile',
  };
};

const UsersList = ({ 
  title, 
  roles, 
  departments, 
  designations,
  context = 'tenant' // 'tenant' or 'admin'
}) => {
  // Get routes for the current context
  const routes = useMemo(() => getRoutes(context), [context]);
  const themeRadius = useThemeRadius();
  const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
  
  // Manual responsive state management (HRMAC pattern)
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 768);
      setIsLargeScreen(window.innerWidth >= 1025);
      setIsMediumScreen(window.innerWidth >= 641 && window.innerWidth <= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // State for users data with server-side pagination
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Modal states
  const [openModalType, setOpenModalType] = useState(null);
  
  // Deactivated users sidebar state
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [deactivatedLoading, setDeactivatedLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deactivatedSearch, setDeactivatedSearch] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    department: 'all'
  });
  
  // Show/Hide filters panel
  const [showFilters, setShowFilters] = useState(false);
  
  // View mode (table or grid)
  const [viewMode, setViewMode] = useState('table');
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: users.length
  });

  // Device management loading state
  const [deviceActions, setDeviceActions] = useState({});

  // Stats
  const [stats, setStats] = useState({
    overview: {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      deleted_users: 0,
      total_roles: 0,
      total_departments: 0
    },
    distribution: {
      by_role: [],
      by_department: [],
      by_status: []
    },
    activity: {
      recent_registrations: {
        new_users_30_days: 0,
        new_users_90_days: 0,
        new_users_year: 0,
        recently_active: 0
      },
      user_growth_rate: 0,
      current_month_registrations: 0
    },
    security: {
      access_metrics: {
        users_with_roles: 0,
        users_without_roles: 0,
        admin_users: 0,
        regular_users: 0
      },
      role_distribution: []
    },
    health: {
      status_ratio: {
        active_percentage: 0,
        inactive_percentage: 0,
        deleted_percentage: 0
      },
      system_metrics: {
        user_activation_rate: 0,
        role_coverage: 0,
        department_coverage: 0
      }
    },
    quick_metrics: {
      total_users: 0,
      active_ratio: 0,
      role_diversity: 0,
      department_diversity: 0,
      recent_activity: 0,
      system_health_score: 0
    }
  });

  // Calculate paginated users
  const paginatedUsers = useMemo(() => {
    return {
      data: users,
      total: totalRows,
      current_page: pagination.currentPage,
      per_page: pagination.perPage,
      last_page: lastPage
    };
  }, [users, totalRows, pagination.currentPage, pagination.perPage, lastPage]);

  // Fetch user stats separately
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const { data } = await axios.get(route(routes.stats));
      if (data.stats) {
        // Transform flat API response to nested structure expected by UI
        const apiStats = data.stats;
        const totalUsers = apiStats.total_users || 0;
        const activeUsers = apiStats.active_users || 0;
        const inactiveUsers = apiStats.inactive_users || 0;
        
        setStats({
          overview: {
            total_users: totalUsers,
            active_users: activeUsers,
            inactive_users: inactiveUsers,
            deleted_users: apiStats.deleted_users || 0,
            total_roles: apiStats.total_roles || 0,
            total_departments: apiStats.total_departments || 0
          },
          distribution: {
            by_role: apiStats.by_role || [],
            by_department: apiStats.by_department || [],
            by_status: apiStats.by_status || []
          },
          activity: {
            recent_registrations: {
              new_users_30_days: apiStats.recent_users_30_days || 0,
              new_users_90_days: apiStats.recent_users_90_days || 0,
              new_users_year: apiStats.recent_users_year || 0,
              recently_active: apiStats.recent_users_30_days || 0
            },
            user_growth_rate: apiStats.user_growth_rate || 0,
            current_month_registrations: apiStats.recent_users_30_days || 0
          },
          security: {
            access_metrics: {
              users_with_roles: apiStats.users_with_roles || 0,
              users_without_roles: apiStats.users_without_roles || 0,
              admin_users: apiStats.admin_users || 0,
              regular_users: totalUsers - (apiStats.admin_users || 0)
            },
            role_distribution: apiStats.role_distribution || []
          },
          health: {
            status_ratio: {
              active_percentage: apiStats.active_percentage || (totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0),
              inactive_percentage: totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0,
              deleted_percentage: apiStats.deleted_percentage || 0
            },
            system_metrics: {
              user_activation_rate: apiStats.active_percentage || 0,
              role_coverage: apiStats.roles_coverage || 0,
              department_coverage: apiStats.department_coverage || 0
            }
          },
          quick_metrics: {
            total_users: totalUsers,
            active_ratio: apiStats.active_percentage || 0,
            role_diversity: apiStats.total_roles || 0,
            department_diversity: apiStats.total_departments || 0,
            recent_activity: apiStats.recent_users_30_days || 0,
            system_health_score: Math.round(((apiStats.active_percentage || 0) + (apiStats.roles_coverage || 0)) / 2)
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [routes.stats]);

  // Fetch users data with server-side pagination
  const fetchUsers = useCallback(async (isInitialLoad = false) => {
    // Only show full page loading on initial load
    if (isInitialLoad) {
      setLoading(true);
    }
    setTableLoading(true);
    
    try {
      const response = await axios.get(route(routes.paginate), {
        params: {
          page: pagination.currentPage,
          perPage: pagination.perPage,
          search: filters.search || undefined,
          role: filters.role !== 'all' ? filters.role : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          department: filters.department !== 'all' ? filters.department : undefined
        },
      });

      if (response.status === 200) {
        const { users } = response.data;
        
        if (users.data && Array.isArray(users.data)) {
          setUsers(users.data);
          
          if (users.meta) {
            setTotalRows(users.meta.total || 0);
            setLastPage(users.meta.last_page || 1);
          } else {
            setTotalRows(users.total || users.data.length);
            setLastPage(users.last_page || 1);
          }
        } else if (Array.isArray(users)) {
          setUsers(users);
          setTotalRows(users.length);
          setLastPage(1);
        } else {
          console.error('Unexpected users data format:', users);
          setUsers([]);
          setTotalRows(0);
          setLastPage(1);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error('Failed to load users data');
      setUsers([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.perPage, routes.paginate]);

  // Track initial load
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Effect to fetch data when filters or pagination changes
  useEffect(() => {
    fetchUsers(!initialLoadDone);
    if (!initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [fetchUsers]);

  // Effect to fetch stats initially and then periodically
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  // Handle pagination changes
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowsPerPageChange = (rowsPerPage) => {
    setPagination(prev => ({ ...prev, currentPage: 1, perPage: rowsPerPage }));
  };

  // Modal handlers
  const openModal = useCallback((modalType, user = null) => {
    setOpenModalType(modalType);
    setSelectedUser(user);
  }, []);

  const closeModal = useCallback(() => {
    setOpenModalType(null);
    setSelectedUser(null);
  }, []);

  // Stable setUsers callback
  const handleUsersUpdate = useCallback((updatedUsers) => {
    setUsers(updatedUsers);
  }, []);

  // Optimized update for a single user
  const updateUserOptimized = useCallback((updatedUser) => {
    setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? { ...user, ...updatedUser } : user));
  }, []);

  // Optimized delete for a single user
  const deleteUserOptimized = useCallback((userId) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    fetchStats();
  }, [fetchStats]);

  // Deactivate user - soft delete the user (instant update, no skeleton)
  const deactivateUser = useCallback(async (userId) => {
    // Get the user data before deactivation
    const userToDeactivate = users.find(u => u.id === userId);
    
    if (!userToDeactivate) return;
    
    // Optimistically update UI instantly - add deleted_at and sort by name
    const deactivatedUser = { ...userToDeactivate, deleted_at: new Date().toISOString() };
    
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    setTotalRows(prev => Math.max(0, prev - 1)); // Update pagination total instantly
    setDeactivatedUsers(prev => {
      const updated = [...prev, deactivatedUser];
      // Sort alphabetically by name for instant visibility
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.delete(route(routes.destroy, { id: userId, user: userId }));
        
        if (response.status === 200) {
          // Silently update stats in background
          fetchStats();
          resolve([response.data.message || 'User deactivated successfully']);
        } else {
          // Revert optimistic update
          setUsers(prevUsers => [...prevUsers, userToDeactivate]);
          setTotalRows(prev => prev + 1); // Restore pagination total
          setDeactivatedUsers(prev => prev.filter(u => u.id !== userId));
          reject(['Failed to deactivate user']);
        }
      } catch (error) {
        // Revert optimistic update
        setUsers(prevUsers => [...prevUsers, userToDeactivate]);
        setTotalRows(prev => prev + 1); // Restore pagination total
        setDeactivatedUsers(prev => prev.filter(u => u.id !== userId));
        
        console.error('Error deactivating user:', error);
        
        if (error.response?.status === 403) {
          reject([error.response.data.error || 'You do not have permission to deactivate this user']);
        } else {
          reject([error.response?.data?.error || error.response?.data?.message || 'Failed to deactivate user. Please try again.']);
        }
      }
    });
    
    showToast.promise(promise, {
      loading: 'Deactivating user...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  }, [fetchStats, routes.destroy, users]);

  // Restore/Reactivate user - restore soft-deleted user (instant update, no skeleton)
  const restoreUser = useCallback(async (userId) => {
    // Get the user data before restoration
    const userToRestore = deactivatedUsers.find(u => u.id === userId);
    
    if (!userToRestore) return;
    
    // Optimistically update UI instantly - clear deleted_at
    const restoredUser = { ...userToRestore, deleted_at: null };
    
    // Remove from deactivated immediately (no loading state for instant feel)
    setDeactivatedUsers(prev => prev.filter(u => u.id !== userId));
    
    // Update pagination total instantly
    setTotalRows(prev => prev + 1);
    
    // Add to active users - will be filtered/searched automatically by useMemo
    setUsers(prevUsers => {
      const updated = [...prevUsers, restoredUser];
      // Sort alphabetically by name so restored user appears in right position
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route(routes.restore, { id: userId, user: userId }));
        
        if (response.status === 200) {
          // Silently update stats in background
          fetchStats();
          resolve([response.data.message || 'User restored successfully']);
        } else {
          // Revert optimistic update
          setDeactivatedUsers(prev => [...prev, userToRestore].sort((a, b) => a.name.localeCompare(b.name)));
          setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
          setTotalRows(prev => Math.max(0, prev - 1)); // Restore pagination total
          reject(['Failed to restore user']);
        }
      } catch (error) {
        // Revert optimistic update
        setDeactivatedUsers(prev => [...prev, userToRestore].sort((a, b) => a.name.localeCompare(b.name)));
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        setTotalRows(prev => Math.max(0, prev - 1)); // Restore pagination total
        
        console.error('Error restoring user:', error);
        
        if (error.response?.status === 403) {
          reject([error.response.data.error || 'You do not have permission to restore this user']);
        } else {
          reject([error.response?.data?.error || error.response?.data?.message || 'Failed to restore user. Please try again.']);
        }
      }
    });
    
    showToast.promise(promise, {
      loading: 'Restoring user...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  }, [fetchStats, routes.restore, deactivatedUsers]);

  // Legacy compatibility - toggleUserStatusOptimized now redirects to deactivateUser
  // This is kept for backward compatibility with UsersTable component
  const toggleUserStatusOptimized = useCallback(async (userId, newStatus) => {
    // If deactivating (newStatus = false), use soft delete
    if (!newStatus) {
      return deactivateUser(userId);
    }
    // If activating, this shouldn't happen as user should already be active
    // Users are restored via the deactivated sidebar, not through this function
    console.warn('Attempted to activate user through toggleUserStatusOptimized - this should use restoreUser instead');
  }, [deactivateUser]);

  // Optimized roles update
  const updateUserRolesOptimized = useCallback((userId, newRoles) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, roles: newRoles } : user
    ));
    fetchStats();
  }, [fetchStats]);

  // Device Management Functions
  const toggleSingleDeviceLogin = useCallback(async (userId, enabled) => {
    setDeviceActions(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await axios.post(route(routes.devicesToggle, { userId }));

      if (response.data.success) {
        setUsers(prevUsers => prevUsers.map(user => 
          user.id === userId ? { 
            ...user, 
            single_device_login_enabled: response.data.single_device_login_enabled
          } : user
        ));
        
        showToast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error toggling single device login:', error);
      showToast.error(error.response?.data?.message || 'Failed to toggle single device login');
    } finally {
      setDeviceActions(prev => ({ ...prev, [userId]: false }));
    }
  }, [routes.devicesToggle]);

  const resetUserDevice = useCallback(async (userId) => {
    setDeviceActions(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await axios.post(route(routes.devicesReset, { userId }), {
        reason: 'Admin reset via user management'
      });

      if (response.data.success) {
        setUsers(prevUsers => prevUsers.map(user => 
          user.id === userId ? { 
            ...user, 
            active_device: null
          } : user
        ));
        
        showToast.success(response.data.message || 'User devices have been reset');
      }
    } catch (error) {
      console.error('Error resetting user devices:', error);
      showToast.error('Failed to reset user devices');
    } finally {
      setDeviceActions(prev => ({ ...prev, [userId]: false }));
    }
  }, [routes.devicesReset]);

  const showUserDevices = useCallback(async (userId) => {
    try {
      const response = await axios.get(route(routes.devices, { userId }));
      
      if (response.data.success) {
        const devices = response.data.devices;
        if (devices.length === 0) {
          showToast.info('User has no registered devices');
        } else {
          const activeDevices = devices.filter(d => d.is_active).length;
          showToast.info(
            `User has ${devices.length} device(s): ${activeDevices} active, ${devices.length - activeDevices} inactive`
          );
        }
      }
    } catch (error) {
      console.error('Error fetching user devices:', error);
      showToast.error('Failed to fetch device information');
    }
  }, [routes.devices]);

  // Fetch deactivated users for sidebar
  const fetchDeactivatedUsers = useCallback(async () => {
    setDeactivatedLoading(true);
    try {
      const response = await axios.get(route(routes.paginate), {
        params: {
          perPage: 100,
          status: 'inactive'
        },
      });

      if (response.status === 200) {
        const { users } = response.data;
        if (users.data && Array.isArray(users.data)) {
          setDeactivatedUsers(users.data);
        } else if (Array.isArray(users)) {
          setDeactivatedUsers(users);
        } else {
          setDeactivatedUsers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching deactivated users:', error);
      setDeactivatedUsers([]);
    } finally {
      setDeactivatedLoading(false);
    }
  }, [routes.paginate]);

  // Load deactivated users on component mount and when relevant data changes
  useEffect(() => {
    fetchDeactivatedUsers();
  }, [fetchDeactivatedUsers]);

  // Filter deactivated users by search
  const filteredDeactivatedUsers = useMemo(() => {
    if (!deactivatedSearch.trim()) return deactivatedUsers;
    const search = deactivatedSearch.toLowerCase();
    return deactivatedUsers.filter(user => 
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  }, [deactivatedUsers, deactivatedSearch]);

  // Filter out soft-deleted users from main table (only show active users)
  const activeUsersForTable = useMemo(() => {
    if (!paginatedUsers.data) return [];
    return paginatedUsers.data.filter(user => !user.deleted_at);
  }, [paginatedUsers.data]);

  // Permanent delete user function
  const permanentDeleteUser = useCallback(async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    setDeletingUserId(userId);
    
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.delete(route(routes.destroy, { id: userId, user: userId }), {
          data: { force: true }
        });
        
        if (response.status === 200) {
          // Remove from deactivated users list
          setDeactivatedUsers(prev => prev.filter(u => u.id !== userId));
          fetchStats();
          resolve([response.data.message || 'User permanently deleted']);
        } else {
          reject(['Failed to delete user']);
        }
      } catch (error) {
        console.error('Error permanently deleting user:', error);
        
        if (error.response?.status === 403) {
          reject([error.response.data.error || 'You do not have permission to delete this user']);
        } else if (error.response?.status === 404) {
          reject(['User not found']);
        } else {
          reject([error.response?.data?.error || error.response?.data?.message || 'Failed to delete user']);
        }
      } finally {
        setDeletingUserId(null);
      }
    });
    
    showToast.promise(promise, {
      loading: 'Permanently deleting user...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  }, [routes.destroy, fetchStats]);

  // Device detection utility functions
  const getDeviceIcon = (userAgent, className = "w-4 h-4") => {
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
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

  // User Card component for grid view
  const UserCard = ({ user, index }) => (
    <Card 
      className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-200 h-full min-h-[320px]"
      style={{
        background: `linear-gradient(135deg, 
          color-mix(in srgb, var(--theme-content1) 90%, transparent) 20%, 
          color-mix(in srgb, var(--theme-content2) 80%, transparent) 80%)`,
        borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
        borderRadius: `var(--borderRadius, 12px)`,
      }}
    >
      <CardBody className="p-3 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-start gap-2 mb-3 pb-2 border-b border-white/10">
          <User
            avatarProps={{ 
              radius: "md", 
              src: user?.profile_image_url || user?.profile_image,
              size: "sm",
              fallback: <UserIcon className="w-4 h-4" />,
              style: {
                borderColor: `var(--theme-primary)`,
                borderWidth: '2px',
              }
            }}
            name={
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm line-clamp-1">
                  {user.name}
                </span>
                <span className="text-default-500 text-xs line-clamp-1">
                  ID: {user.id}
                </span>
              </div>
            }
            classNames={{
              wrapper: "flex-1 min-w-0",
              name: "text-sm font-semibold",
              description: "text-xs text-default-500",
            }}
          />
          
          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Tooltip content="Edit User" size="sm">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-default-400 hover:text-primary min-w-6 w-6 h-6"
                onPress={() => openModal('edit', user)}
              >
                <PencilIcon className="w-3 h-3" />
              </Button>
            </Tooltip>
            
            {/* Device Management Menu */}
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  radius={themeRadius}
                  isDisabled={deviceActions[user.id]}
                  className="min-w-6 w-6 h-6"
                  style={{
                    background: `color-mix(in srgb, var(--theme-content2) 30%, transparent)`,
                  }}
                >
                  <EllipsisVerticalIcon className="w-3 h-3" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Device management actions"
                variant="bordered"
                className="min-w-[180px]"
                style={{
                  background: `color-mix(in srgb, var(--theme-content1) 95%, transparent)`,
                  backdropFilter: 'blur(16px)',
                  borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                  borderRadius: `var(--borderRadius, 12px)`,
                }}
              >
                <DropdownItem
                  key="toggle-device-lock"
                  startContent={
                    user.single_device_login ? 
                    <LockOpenIcon className="w-3 h-3" /> : 
                    <LockClosedIcon className="w-3 h-3" />
                  }
                  onPress={() => toggleSingleDeviceLogin(user.id, !user.single_device_login)}
                  isDisabled={deviceActions[user.id]}
                  className="text-xs"
                >
                  {user.single_device_login ? 'Disable Lock' : 'Enable Lock'}
                </DropdownItem>
                
                {user.single_device_login && user.active_device && (
                  <DropdownItem
                    key="reset-device"
                    startContent={<ArrowPathIcon className="w-3 h-3" />}
                    onPress={() => resetUserDevice(user.id)}
                    isDisabled={deviceActions[user.id]}
                    className="text-xs"
                  >
                    Reset Device
                  </DropdownItem>
                )}
                
                <DropdownItem
                  key="view-devices"
                  startContent={<DevicePhoneMobileIcon className="w-3 h-3" />}
                  onPress={() => safeNavigate(routes.devices, { userId: user.id })}
                  className="text-xs"
                >
                  Device History
                </DropdownItem>

                <DropdownItem
                  key="view-profile"
                  startContent={<UserIcon className="w-3 h-3" />}
                  onPress={() => safeNavigate(routes.profile, { user: user.id })}
                  className="text-xs"
                >
                  View Profile
                </DropdownItem>

                {/* Deactivate User */}
                {user.id !== auth?.user?.id && (
                  <DropdownItem
                    key="deactivate"
                    startContent={<XCircleIcon className="w-3 h-3" />}
                    onPress={() => {
                      if (window.confirm(`Are you sure you want to deactivate ${user.name}? They will be moved to the Deactivated Users section.`)) {
                        deactivateUser(user.id);
                      }
                    }}
                    className="text-xs text-danger"
                    color="danger"
                  >
                    Deactivate User
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <EnvelopeIcon className="w-3 h-3 text-default-400 shrink-0" />
            <span className="text-default-600 line-clamp-1 flex-1">{user.email}</span>
          </div>
          
          {user.phone && (
            <div className="flex items-center gap-2 text-xs">
              <PhoneIcon className="w-3 h-3 text-default-400 shrink-0" />
              <span className="text-default-600 line-clamp-1">{user.phone}</span>
            </div>
          )}
          
          {(user.department || user.department_id) && (
            <div className="flex items-center gap-2 text-xs">
              <BuildingOfficeIcon className="w-3 h-3 text-default-400 shrink-0" />
              <span className="text-default-600 line-clamp-1">
                {typeof user.department === 'string' ? user.department : 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* Device Status Section */}
        <div className="mb-3 p-2 rounded-lg" style={{ background: `color-mix(in srgb, var(--theme-content2) 40%, transparent)` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-default-700">Device Status</span>
            {user.single_device_login && user.active_device && (
              <Tooltip 
                content={
                  <div className="p-2 max-w-xs">
                    <div className="flex items-center gap-2 mb-1">
                      {getDeviceIcon(user.active_device.user_agent, "w-4 h-4")}
                      <span className="font-medium text-xs">
                        {user.active_device.device_name || 'Unknown Device'}
                      </span>
                    </div>
                    <div className="text-xs text-default-500">
                      {getDeviceType(user.active_device.user_agent)} • 
                      {user.active_device.is_active ? ' Active' : ' Inactive'}
                    </div>
                  </div>
                }
                size="sm"
              >
                <div className="cursor-help">
                  {getDeviceIcon(user.active_device.user_agent, "w-4 h-4")}
                </div>
              </Tooltip>
            )}
          </div>
          
          <Chip
            size="sm"
            variant="flat"
            color={
              !user.single_device_login ? "default" :
              user.active_device ? "warning" : "success"
            }
            startContent={
              !user.single_device_login ? (
                <ShieldCheckIcon className="w-3 h-3" />
              ) : user.active_device ? (
                <LockClosedIcon className="w-3 h-3" />
              ) : (
                <LockOpenIcon className="w-3 h-3" />
              )
            }
            className="text-xs"
          >
            {!user.single_device_login ? 'Disabled' :
             user.active_device ? 'Locked' : 'Free'}
          </Chip>
        </div>

        {/* Roles */}
        <div className="mt-auto space-y-2">
          
          <div>
            <span className="text-xs font-medium text-default-700 mb-1 block">Roles</span>
            <div className="flex flex-wrap gap-1">
              {user.roles && user.roles.length > 0 ? (
                user.roles.slice(0, 3).map((role, roleIndex) => {
                  const roleName = typeof role === 'object' && role !== null ? role.name : role;
                  return (
                    <Chip
                      key={roleIndex}
                      size="sm"
                      variant="flat"
                      color="secondary"
                      className="text-xs h-5"
                    >
                      {roleName}
                    </Chip>
                  );
                })
              ) : (
                <Chip
                  size="sm"
                  variant="bordered"
                  color="default"
                  className="text-xs h-5"
                >
                  No Roles
                </Chip>
              )}
              {user.roles && user.roles.length > 3 && (
                <Chip
                  size="sm"
                  variant="bordered"
                  color="primary"
                  className="text-xs h-5"
                >
                  +{user.roles.length - 3}
                </Chip>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // Statistics cards
  const statsCards = useMemo(() => [
    {
      title: 'Total Users',
      value: stats?.overview?.total_users || 0,
      icon: <UsersIcon className="w-5 h-5" />,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      description: 'All users'
    },
    {
      title: 'Active Users',
      value: stats?.overview?.active_users || 0,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: 'text-green-400',
      iconBg: 'bg-green-500/20',
      description: `${stats?.health?.status_ratio?.active_percentage || 0}% Active`
    },
    {
      title: 'Inactive Users',
      value: stats?.overview?.inactive_users || 0,
      icon: <XCircleIcon className="w-5 h-5" />,
      color: 'text-red-400',
      iconBg: 'bg-red-500/20',
      description: `${stats?.health?.status_ratio?.inactive_percentage || 0}% Inactive`
    },
    {
      title: 'Total Roles',
      value: stats?.overview?.total_roles || 0,
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      color: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
      description: 'Role diversity'
    },
    {
      title: 'Role Coverage',
      value: `${stats?.health?.system_metrics?.role_coverage || 0}%`,
      icon: <TrophyIcon className="w-5 h-5" />,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      description: 'Users with roles'
    },
    {
      title: 'Recent Activity',
      value: stats?.activity?.recent_registrations?.recently_active || 0,
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      description: 'Active last 7 days'
    },
    {
      title: 'System Health',
      value: `${stats?.quick_metrics?.system_health_score || 0}%`,
      icon: <SignalIcon className="w-5 h-5" />,
      color: 'text-pink-400',
      iconBg: 'bg-pink-500/20',
      description: 'Overall health'
    },
    // Only show Tenants card for admin context (Departments belongs in Employee list, not User list)
    ...(context === 'admin' ? [{
      title: 'Tenants',
      value: stats?.overview?.total_departments || 0,
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      color: 'text-indigo-400',
      iconBg: 'bg-indigo-500/20',
      description: 'Platform tenants'
    }] : [])
  ], [stats, context]);

  // Page title based on context
  const pageTitle = context === 'admin' ? 'Platform Administrators' : 'Users Management';
  const pageDescription = context === 'admin' 
    ? 'Manage platform administrator accounts and access' 
    : 'Manage user accounts, roles and permissions';

  return (
    <>
      <Head title={title || pageTitle} />
      
      {/* Add User Modal */}
      {openModalType === 'add' && (
        <AddEditUserForm
          user={null}
          roles={roles}
          open={openModalType === 'add'}
          setUsers={handleUsersUpdate}
          closeModal={closeModal}
          editMode={false}
          context={context}
        />
      )}
      
      {/* Edit User Modal */}
      {openModalType === 'edit' && selectedUser && (
        <AddEditUserForm
          user={selectedUser}
          roles={roles}
          open={openModalType === 'edit'}
          setUsers={handleUsersUpdate}
          closeModal={closeModal}
          editMode={true}
          context={context}
        />
      )}

      {/* Invite User Modal (Tenant and Core context only) */}
      {openModalType === 'invite' && (context === 'tenant' || context === 'core') && (
        <InviteUserForm
          roles={roles}
          open={openModalType === 'invite'}
          closeModal={closeModal}
          onInviteSent={() => {
            fetchUsers();
          }}
          context={context}
        />
      )}

    {/* Main Layout */}
      <StandardPageLayout
        title={pageTitle}
        subtitle={pageDescription}
        icon={UsersIcon}
        isLoading={loading && !initialLoadDone}
        ariaLabel={pageTitle}
        actions={
          <>
            <Button
              size={isMobile ? "sm" : "md"}
              color="primary"
              startContent={<UserPlusIcon className="w-4 h-4" />}
              onPress={() => openModal('add')}
              radius={themeRadius}
              style={{ fontFamily: `var(--fontFamily, "Inter")` }}
              className="min-w-0"
            >
              {isMobile ? "Add" : context === 'admin' ? "Add Admin" : "Add User"}
            </Button>

            {context === 'tenant' && (
              <Button
                size={isMobile ? "sm" : "md"}
                variant="bordered"
                startContent={<EnvelopeIcon className="w-4 h-4" />}
                onPress={() => openModal('invite')}
                radius={themeRadius}
                style={{
                  background: `color-mix(in srgb, var(--theme-secondary) 10%, transparent)` ,
                  border: `1px solid color-mix(in srgb, var(--theme-secondary) 30%, transparent)` ,
                  color: 'var(--theme-secondary)',
                  fontFamily: `var(--fontFamily, "Inter")`,
                }}
                className="min-w-0"
              >
                {isMobile ? "Invite" : "Invite User"}
              </Button>
            )}

            <Button
              size={isMobile ? "sm" : "md"}
              variant="bordered"
              startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
              radius={themeRadius}
              style={{
                background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)` ,
                border: `1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)` ,
                color: 'var(--theme-primary)',
                fontFamily: `var(--fontFamily, "Inter")`,
              }}
              className="min-w-0"
            >
              {isMobile ? "Export" : "Export Users"}
            </Button>
          </>
        }
        stats={
          <StatsCards
            stats={statsCards}
            className="mb-0"
            isLoading={statsLoading}
          />
        }
        filters={
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              size={isMobile ? "sm" : "md"}
              placeholder="Search users..."
              value={filters.search}
              onValueChange={(value) => handleFilterChange('search', value)}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
              isClearable
              onClear={() => handleFilterChange('search', '')}
              radius={themeRadius}
              classNames={{ inputWrapper: "bg-default-100" }}
              className="flex-1"
            />

            <Select
              size={isMobile ? "sm" : "md"}
              placeholder="All Roles"
              selectedKeys={filters.role !== 'all' ? [filters.role] : []}
              onSelectionChange={(keys) => handleFilterChange('role', Array.from(keys)[0] || 'all')}
              radius={themeRadius}
              classNames={{ trigger: "bg-default-100" }}
              className="w-full md:w-48"
            >
              {roles?.map((role) => (
                <SelectItem key={role.name || role} textValue={role.name || role}>
                  {role.name || role}
                </SelectItem>
              ))}
            </Select>

            <Select
              size={isMobile ? "sm" : "md"}
              placeholder="All Status"
              selectedKeys={filters.status !== 'all' ? [filters.status] : []}
              onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
              radius={themeRadius}
              classNames={{ trigger: "bg-default-100" }}
              className="w-full md:w-40"
            >
              <SelectItem key="active" textValue="Active">Active</SelectItem>
              <SelectItem key="inactive" textValue="Inactive">Inactive</SelectItem>
            </Select>

            {context === 'tenant' && departments && departments.length > 0 && (
              <Select
                size={isMobile ? "sm" : "md"}
                placeholder="All Departments"
                selectedKeys={filters.department !== 'all' ? [filters.department] : []}
                onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0] || 'all')}
                radius={themeRadius}
                classNames={{ trigger: "bg-default-100" }}
                className="w-full md:w-48"
              >
                {departments?.map((dept) => (
                  <SelectItem key={String(dept.id)} textValue={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </Select>
            )}

            <ButtonGroup size={isMobile ? "sm" : "md"} radius={themeRadius}>
              <Button
                isIconOnly
                variant={viewMode === 'table' ? 'solid' : 'bordered'}
                color={viewMode === 'table' ? 'primary' : 'default'}
                onPress={() => setViewMode('table')}
              >
                <TableCellsIcon className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                variant={viewMode === 'grid' ? 'solid' : 'bordered'}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                onPress={() => setViewMode('grid')}
              >
                <Squares2X2Icon className="w-4 h-4" />
              </Button>
            </ButtonGroup>
          </div>
        }
        pagination={
          viewMode === 'grid' && activeUsersForTable && activeUsersForTable.length > 0 ? (
            <div className="flex justify-center border-t pt-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
              <Pagination
                total={Math.ceil(paginatedUsers.total / pagination.perPage)}
                initialPage={pagination.currentPage}
                page={pagination.currentPage}
                onChange={handlePageChange}
                size={isMobile ? "sm" : "md"}
                variant="bordered"
                showControls
                radius={themeRadius}
                style={{
                  fontFamily: `var(--fontFamily, "Inter")`,
                }}
              />
            </div>
          ) : null
        }
      >
        {/* Flex container for table and deactivated users panel */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
          {/* Main table content */}
          <div className={`${deactivatedUsers.length > 0 && !isMobile ? 'flex-1' : 'w-full'} min-w-0 overflow-hidden`}>
          {tableLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 bg-content2 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-6 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : viewMode === 'table' ? (
            <UsersTable 
              allUsers={activeUsersForTable}
              roles={roles}
              setUsers={handleUsersUpdate}
              isMobile={isMobile}
              isTablet={isTablet}
              pagination={pagination}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              totalUsers={totalRows}
              loading={loading}
              onEdit={(user) => openModal('edit', user)}
              updateUserOptimized={updateUserOptimized}
              deleteUserOptimized={deleteUserOptimized}
              toggleUserStatusOptimized={toggleUserStatusOptimized}
              deactivateUser={deactivateUser}
              updateUserRolesOptimized={updateUserRolesOptimized}
              toggleSingleDeviceLogin={toggleSingleDeviceLogin}
              resetUserDevice={resetUserDevice}
              deviceActions={deviceActions}
              context={context}
            />
          ) : (
            <div>
              {activeUsersForTable && activeUsersForTable.length > 0 ? (
                <div className={`grid gap-4 ${
                  isMobile 
                    ? 'grid-cols-1' 
                    : isTablet 
                      ? 'grid-cols-2' 
                      : 'grid-cols-3 xl:grid-cols-4'
                }`}>
                  {activeUsersForTable.map((user, index) => (
                    <UserCard key={user.id} user={user} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
                  <p className="text-default-500 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button
                    color="primary"
                    startContent={<UserPlusIcon className="w-4 h-4" />}
                    onPress={() => openModal('add')}
                  >
                    {context === 'admin' ? 'Add First Admin' : 'Add First User'}
                  </Button>
                </div>
              )}
            </div>
          )}
          </div>
          
          {/* Deactivated Users Side Panel */}
          <DeactivatedUsersSidePanel
            deactivatedUsers={deactivatedUsers}
            deactivatedLoading={deactivatedLoading}
            deactivatedSearch={deactivatedSearch}
            setDeactivatedSearch={setDeactivatedSearch}
            filteredDeactivatedUsers={filteredDeactivatedUsers}
            restoreUser={restoreUser}
            permanentDeleteUser={permanentDeleteUser}
            deletingUserId={deletingUserId}
            themeRadius={themeRadius}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>
      </StandardPageLayout>
    </>
  );
};

// Deactivated Users Side Panel Component
const DeactivatedUsersSidePanel = ({
  deactivatedUsers,
  deactivatedLoading,
  deactivatedSearch,
  setDeactivatedSearch,
  filteredDeactivatedUsers,
  restoreUser,
  permanentDeleteUser,
  deletingUserId,
  themeRadius,
  isMobile,
  isTablet,
}) => {
  if (deactivatedUsers.length === 0) return null;
  
  return (
    <Card 
        className="shrink-0 border border-divider overflow-hidden"
        style={{
          width: isMobile ? '100%' : isTablet ? '280px' : '320px',
          minWidth: isMobile ? '100%' : isTablet ? '280px' : '320px',
          maxHeight: isMobile ? '400px' : 'calc(100vh - 120px)',
          background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
          borderRadius: `var(--borderRadius, 12px)`,
          fontFamily: `var(--fontFamily, "Inter")`,
        }}
      >
        {/* Header */}
        <div 
          className="p-4 border-b border-divider"
          style={{
            background: `color-mix(in srgb, var(--theme-danger) 8%, var(--theme-content1))`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: `color-mix(in srgb, var(--theme-danger) 15%, transparent)`,
              }}
            >
              <XCircleIcon className="w-5 h-5" style={{ color: 'var(--theme-danger)' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold">Deactivated Users</h3>
              <p className="text-xs text-default-500">
                {deactivatedUsers.length} inactive user{deactivatedUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Search */}
          <Input
            size="sm"
            placeholder="Search deactivated users..."
            value={deactivatedSearch}
            onValueChange={setDeactivatedSearch}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
            radius={themeRadius}
            classNames={{
              inputWrapper: "bg-default-100"
            }}
          />
        </div>
        
        {/* Content */}
        <div className="p-3 overflow-y-auto" style={{ maxHeight: isMobile ? '300px' : 'calc(100vh - 240px)' }}>
          {deactivatedLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-content2">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-2 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDeactivatedUsers.length === 0 ? (
            <div className="text-center py-6">
              {deactivatedUsers.length === 0 ? (
                <>
                  <CheckCircleIcon className="w-12 h-12 mx-auto text-success mb-2" />
                  <p className="text-sm font-medium">No Deactivated Users</p>
                  <p className="text-xs text-default-500">All users are active</p>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                  <p className="text-sm font-medium">No Results</p>
                  <p className="text-xs text-default-500">Try a different search</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDeactivatedUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="p-2.5 rounded-lg border border-divider hover:border-danger/30 transition-colors"
                  style={{
                    background: `color-mix(in srgb, var(--theme-danger) 3%, var(--theme-content1))`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <User
                      name={user.name}
                      description={user.email}
                      avatarProps={{
                        src: user.profile_photo_url || user.avatar,
                        size: "sm",
                        showFallback: true,
                        name: user.name?.charAt(0) || 'U',
                      }}
                      classNames={{
                        base: "flex-1 min-w-0 justify-start",
                        wrapper: "flex-1 min-w-0",
                        name: "font-medium text-sm text-foreground truncate block",
                        description: "text-default-500 text-xs truncate block"
                      }}
                    />
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Tooltip content="Restore User" size="sm">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="success"
                          onPress={() => restoreUser(user.id)}
                          className="min-w-7 w-7 h-7"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete Permanently" color="danger" size="sm">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => {
                            if (window.confirm(`Are you sure you want to PERMANENTLY delete ${user.name}? This action cannot be undone.`)) {
                              permanentDeleteUser(user.id);
                            }
                          }}
                          isLoading={deletingUserId === user.id}
                          className="min-w-7 w-7 h-7"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </Card>
  );
};

UsersList.layout = (page) => <App>{page}</App>;
export default UsersList;
