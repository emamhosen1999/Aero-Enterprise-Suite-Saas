import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from "@inertiajs/react";
import { motion } from 'framer-motion';
import { 
  Button,
  Chip,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
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
  Skeleton,
  Badge,
  Tooltip,
  Switch
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
import UsersTable from '@/Tables/UsersTable.jsx';
import AddEditUserForm from "@/Forms/AddEditUserForm.jsx";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

const UsersList = ({ title, roles, departments, designations }) => {
  // Custom media query logic - matching AttendanceAdmin
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [themeRadius, setThemeRadius] = useState('lg');

  // Theme utility function
  const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
  };

  // Set theme radius on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setThemeRadius(getThemeRadius());
    }
  }, []);
  
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Modal states
  const [openModalType, setOpenModalType] = useState(null);
  
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

  // Stats - Updated to match comprehensive backend stats structure
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
      const { data } = await axios.get(route('users.stats'));
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, []);

  // Fetch users data with server-side pagination
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(route('users.paginate'), {
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
        
        // Handle paginated data with UserCollection structure
        if (users.data && Array.isArray(users.data)) {
          setUsers(users.data);
          
          // Check if meta object exists (UserCollection format)
          if (users.meta) {
            setTotalRows(users.meta.total || 0);
            setLastPage(users.meta.last_page || 1);
          } else {
            // Fallback to old format
            setTotalRows(users.total || users.data.length);
            setLastPage(users.last_page || 1);
          }
        } else if (Array.isArray(users)) {
          // Handle direct array response
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
    }
  }, [filters, pagination.currentPage, pagination.perPage]);

  // Effect to fetch data when filters or pagination changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Effect to fetch stats initially and then periodically
  useEffect(() => {
    fetchStats();
    // Optionally set up a refresh interval for stats
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
  };
  
  // Handle pagination changes
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    // Scroll to top when changing pages
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

  // Optimized update for a single user (edit, role, status)
  const updateUserOptimized = useCallback((updatedUser) => {
    setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? { ...user, ...updatedUser } : user));
  }, []);

  // Optimized delete for a single user
  const deleteUserOptimized = useCallback((userId) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    // Update stats after delete
    fetchStats();
  }, [fetchStats]);

  // Optimized status toggle
  const toggleUserStatusOptimized = useCallback((userId, newStatus) => {
    setUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, active: newStatus } : user));
    // Update stats after status change
    fetchStats();
  }, [fetchStats]);

  // Optimized roles update
  const updateUserRolesOptimized = useCallback((userId, newRoles) => {
    // Update the user with new roles without triggering a full reload
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, roles: newRoles } : user
    ));
    // Update stats after role change
    fetchStats();
  }, [fetchStats]);

  // Device Management Functions (Updated for New Secure Device System)
  const toggleSingleDeviceLogin = useCallback(async (userId, enabled) => {
    setDeviceActions(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await axios.post(route('admin.users.devices.toggle', { userId }));

      if (response.data.success) {
        // Update user in state with new toggle status
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
  }, []);

  const resetUserDevice = useCallback(async (userId) => {
    setDeviceActions(prev => ({ ...prev, [userId]: true }));
    
    try {
      // NEW: Use admin.users.devices.reset route
      const response = await axios.post(route('admin.users.devices.reset', { userId }), {
        reason: 'Admin reset via user management'
      });

      if (response.data.success) {
        // Update user in state - clear active device
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
  }, []);

  const showUserDevices = useCallback(async (userId) => {
    try {
      // NEW: Use admin.users.devices route
      const response = await axios.get(route('admin.users.devices', { userId }));
      
      if (response.data.success) {
        const devices = response.data.devices;
        // Display device information in toast
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
  }, []);

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

  // Compact User Card component for grid view - Redesigned for no scrolling
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
        {/* Header Section - User Info */}
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
                  onPress={() => router.visit(route('admin.users.devices', { userId: user.id }))}
                  className="text-xs"
                >
                  Device History
                </DropdownItem>

                <DropdownItem
                  key="view-profile"
                  startContent={<UserIcon className="w-3 h-3" />}
                  onPress={() => router.visit(route('profile', { user: user.id }))}
                  className="text-xs"
                >
                  View Profile
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        
        {/* Contact Information - Compact Layout */}
        <div className="space-y-2 mb-3">
          {/* Email */}
          <div className="flex items-center gap-2 text-xs">
            <EnvelopeIcon className="w-3 h-3 text-default-400 shrink-0" />
            <span className="text-default-600 line-clamp-1 flex-1">{user.email}</span>
          </div>
          
          {/* Phone */}
          {user.phone && (
            <div className="flex items-center gap-2 text-xs">
              <PhoneIcon className="w-3 h-3 text-default-400 shrink-0" />
              <span className="text-default-600 line-clamp-1">{user.phone}</span>
            </div>
          )}
          
          {/* Department */}
          {(user.department || user.department_id) && (
            <div className="flex items-center gap-2 text-xs">
              <BuildingOfficeIcon className="w-3 h-3 text-default-400 shrink-0" />
              <span className="text-default-600 line-clamp-1">
                {typeof user.department === 'string' 
                  ? user.department
                  : 'N/A'}
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

        {/* Status and Roles - Compact */}
        <div className="mt-auto space-y-2">
          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-default-700">Status</span>
            <div className="flex items-center gap-2">
              <Switch
                size="sm"
                isSelected={user.active}
                onValueChange={(checked) => toggleUserStatusOptimized(user.id, checked)}
                color={user.active ? "success" : "danger"}
                classNames={{
                  wrapper: "group-data-[selected=true]:bg-success",
                  thumb: "group-data-[selected=true]:ml-4",
                }}
              />
              <span className={`text-xs font-medium ${user.active ? 'text-success' : 'text-danger'}`}>
                {user.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          {/* Roles */}
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
    {
      title: 'Departments',
      value: stats?.overview?.total_departments || 0,
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      color: 'text-indigo-400',
      iconBg: 'bg-indigo-500/20',
      description: 'Department diversity'
    }
  ], [stats]);

  // Action buttons for page header
  const actionButtons = useMemo(() => {
    const buttons = [];
    
    // Check if user has permission to add users
    // In a real implementation, you would check permissions here
    const canCreateUser = true;
    
    if (canCreateUser) {
      buttons.push({
        label: isMobile ? "Add" : "Add User",
        icon: <UserPlusIcon className="w-4 h-4" />,
        onPress: () => openModal('add'),
        className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
      });
    }

    buttons.push({
      label: isMobile ? "" : "Export",
      isIconOnly: isMobile,
      icon: <ChartBarIcon className="w-4 h-4" />,
      variant: "bordered",
      className: "border-[rgba(var(--theme-primary-rgb),0.3)] bg-[rgba(var(--theme-primary-rgb),0.05)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]"
    });
    
    return buttons;
  }, [isMobile, openModal]);

  return (
    <>
      <Head title={title || "Users Management"} />
      
      {/* Add User Modal */}
      {openModalType === 'add' && (
        <AddEditUserForm
          user={null}
          allUsers={users}
          departments={departments}
          designations={designations}
          roles={roles}
          open={openModalType === 'add'}
          setUsers={handleUsersUpdate}
          closeModal={closeModal}
          editMode={false}
        />
      )}
      
      {/* Edit User Modal */}
      {openModalType === 'edit' && selectedUser && (
        <AddEditUserForm
          user={selectedUser}
          allUsers={users}
          departments={departments}
          designations={designations}
          roles={roles}
          open={openModalType === 'edit'}
          setUsers={handleUsersUpdate}
          closeModal={closeModal}
          editMode={true}
        />
      )}

      <div 
        className="flex flex-col w-full h-full p-4"
        role="main"
        aria-label="Users Management"
      >
        <div className="space-y-4">
          <div className="w-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card 
                className="transition-all duration-200"
                style={{
                  border: `var(--borderWidth, 2px) solid transparent`,
                  borderRadius: `var(--borderRadius, 12px)`,
                  fontFamily: `var(--fontFamily, "Inter")`,
                  transform: `scale(var(--scale, 1))`,
                  background: `linear-gradient(135deg, 
                    var(--theme-content1, #FAFAFA) 20%, 
                    var(--theme-content2, #F4F4F5) 10%, 
                    var(--theme-content3, #F1F3F4) 20%)`,
                }}
              >
                <CardHeader 
                  className="border-b p-0"
                  style={{
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    background: `linear-gradient(135deg, 
                      color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                      color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                  }}
                >
                  <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                    <div className="flex flex-col space-y-4">
                      {/* Main Header Content */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Title Section */}
                        {loading ? (
                          <div className="flex items-center gap-3 lg:gap-4">
                            <Skeleton className="w-12 h-12 rounded-xl" />
                            <div className="min-w-0 flex-1">
                              <Skeleton className="w-64 h-6 rounded mb-2" />
                              <Skeleton className="w-48 h-4 rounded" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 lg:gap-4">
                            <div 
                              className={`
                                ${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'} 
                                rounded-xl flex items-center justify-center
                              `}
                              style={{
                                background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                borderWidth: `var(--borderWidth, 2px)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                              }}
                            >
                              <UsersIcon 
                                className={`
                                  ${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                                `}
                                style={{ color: 'var(--theme-primary)' }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 
                                className={`
                                  ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'}
                                  font-bold text-foreground
                                  ${!isLargeScreen ? 'truncate' : ''}
                                `}
                                style={{
                                  fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                              >
                                Users Management
                              </h4>
                              <p 
                                className={`
                                  ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                  text-default-500
                                  ${!isLargeScreen ? 'truncate' : ''}
                                `}
                                style={{
                                  fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                              >
                                Manage user accounts, roles and permissions
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {loading ? (
                          <div className="flex flex-wrap gap-2 lg:gap-3">
                            <Skeleton className="w-24 h-8 rounded" />
                            <Skeleton className="w-20 h-8 rounded" />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 lg:gap-3">
                            <Button
                              size={isMobile ? "sm" : "md"}
                              color="primary"
                              startContent={<UserPlusIcon className="w-4 h-4" />}
                              onPress={() => openModal('add')}
                              radius={themeRadius}
                              style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                              }}
                              className="min-w-0"
                            >
                              {isMobile ? "Add" : "Add User"}
                            </Button>
                            <Button
                              size={isMobile ? "sm" : "md"}
                              variant="bordered"
                              startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                              radius={themeRadius}
                              style={{
                                background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                                border: `1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)`,
                                color: 'var(--theme-primary)',
                                fontFamily: `var(--fontFamily, "Inter")`,
                              }}
                              className="min-w-0"
                            >
                              {isMobile ? "Export" : "Export Users"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="p-6">
                  {/* Statistics Cards */}
                  <StatsCards
                    stats={statsCards}
                    className="mb-6"
                    isLoading={loading}
                  />

                  {/* Comprehensive Analytics Dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {loading ? (
                      // Analytics Loading Skeleton
                      <>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Card 
                            key={index}
                            className="transition-all duration-200"
                            style={{
                              background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                              borderColor: `color-mix(in srgb, var(--theme-default) 10%, transparent)`,
                              borderRadius: `var(--borderRadius, 12px)`,
                            }}
                          >
                            <CardBody className="p-4">
                              <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="w-9 h-9 rounded-lg" />
                                <div className="flex-1">
                                  <Skeleton className="w-24 h-4 rounded mb-1" />
                                  <Skeleton className="w-32 h-3 rounded" />
                                </div>
                              </div>
                              <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <div key={i} className="flex items-center justify-between">
                                    <Skeleton className="w-20 h-3 rounded" />
                                    <Skeleton className="w-12 h-3 rounded" />
                                  </div>
                                ))}
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </>
                    ) : (
                      <>
                        {/* Role Distribution */}
                        <Card 
                          className="transition-all duration-200"
                          style={{
                            background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <CardBody className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="p-2 rounded-lg"
                                style={{
                                  background: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                                  borderRadius: `var(--borderRadius, 8px)`,
                                }}
                              >
                                <ChartPieIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                              </div>
                              <div>
                                <h6 
                                  className="font-semibold text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Role Distribution
                                </h6>
                                <p 
                                  className="text-small text-default-500"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  User roles breakdown
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {stats?.distribution?.by_role?.length > 0 ? (
                                stats.distribution.by_role.slice(0, 4).map((role, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          background: `color-mix(in srgb, var(--theme-primary) ${80 - (index * 15)}%, var(--theme-secondary) ${20 + (index * 15)}%)`,
                                        }}
                                      />
                                      <span 
                                        className="text-sm text-foreground truncate"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        {role.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span 
                                        className="text-sm font-medium text-foreground"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        {role.count}
                                      </span>
                                      <span 
                                        className="text-xs text-default-500 ml-1"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        ({role.percentage}%)
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4">
                                  <p 
                                    className="text-sm text-default-400"
                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                  >
                                    No role data available
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>

                        {/* User Status Distribution */}
                        <Card 
                          className="transition-all duration-200"
                          style={{
                            background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-secondary) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <CardBody className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="p-2 rounded-lg"
                                style={{
                                  background: `color-mix(in srgb, var(--theme-secondary) 20%, transparent)`,
                                  borderRadius: `var(--borderRadius, 8px)`,
                                }}
                              >
                                <UsersIcon className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                              </div>
                              <div>
                                <h6 
                                  className="font-semibold text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  User Status
                                </h6>
                                <p 
                                  className="text-small text-default-500"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Active vs inactive users
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {stats?.distribution?.by_status?.length > 0 ? (
                                stats.distribution.by_status.map((status, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          background: status.name === 'Active' ? 'var(--theme-success)' :
                                                     status.name === 'Inactive' ? 'var(--theme-danger)' :
                                                     'var(--theme-default)'
                                        }}
                                      />
                                      <span 
                                        className="text-sm text-foreground"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        {status.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span 
                                        className="text-sm font-medium text-foreground"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        {status.count}
                                      </span>
                                      <span 
                                        className="text-xs text-default-500 ml-1"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        ({status.percentage}%)
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4">
                                  <p 
                                    className="text-sm text-default-400"
                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                  >
                                    No status data available
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>

                        {/* Department Distribution */}
                        <Card 
                          className="transition-all duration-200"
                          style={{
                            background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-warning) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <CardBody className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="p-2 rounded-lg"
                                style={{
                                  background: `color-mix(in srgb, var(--theme-warning) 20%, transparent)`,
                                  borderRadius: `var(--borderRadius, 8px)`,
                                }}
                              >
                                <BuildingOfficeIcon className="w-5 h-5" style={{ color: 'var(--theme-warning)' }} />
                              </div>
                              <div>
                                <h6 
                                  className="font-semibold text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Departments
                                </h6>
                                <p 
                                  className="text-small text-default-500"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Users by department
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {stats?.distribution?.by_department?.length > 0 ? (
                                stats.distribution.by_department.slice(0, 4).map((dept, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          background: `color-mix(in srgb, var(--theme-warning) ${80 - (index * 15)}%, var(--theme-primary) ${20 + (index * 15)}%)`,
                                        }}
                                      />
                                      <span 
                                        className="text-sm text-foreground truncate"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        {dept.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span 
                                        className="text-sm font-medium text-foreground"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        {dept.count}
                                      </span>
                                      <span 
                                        className="text-xs text-default-500 ml-1"
                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                      >
                                        ({dept.percentage}%)
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4">
                                  <p 
                                    className="text-sm text-default-400"
                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                  >
                                    No department data available
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>

                        {/* Recent Activity */}
                        <Card 
                          className="transition-all duration-200"
                          style={{
                            background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-success) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <CardBody className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="p-2 rounded-lg"
                                style={{
                                  background: `color-mix(in srgb, var(--theme-success) 20%, transparent)`,
                                  borderRadius: `var(--borderRadius, 8px)`,
                                }}
                              >
                                <ChartBarIcon className="w-5 h-5" style={{ color: 'var(--theme-success)' }} />
                              </div>
                              <div>
                                <h6 
                                  className="font-semibold text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  User Growth
                                </h6>
                                <p 
                                  className="text-small text-default-500"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Registration trends
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  New (30 days)
                                </span>
                                <span 
                                  className="text-sm font-medium text-success"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.activity?.recent_registrations?.new_users_30_days || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  New (90 days)
                                </span>
                                <span 
                                  className="text-sm font-medium text-primary"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.activity?.recent_registrations?.new_users_90_days || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Recently Active
                                </span>
                                <span 
                                  className="text-sm font-medium text-secondary"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.activity?.recent_registrations?.recently_active || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Growth Rate
                                </span>
                                <Chip
                                  size="sm"
                                  color={
                                    (stats?.activity?.user_growth_rate || 0) > 0 ? "success" :
                                    (stats?.activity?.user_growth_rate || 0) < 0 ? "danger" : "default"
                                  }
                                  variant="flat"
                                  radius={themeRadius}
                                >
                                  <span style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                                    {stats?.activity?.user_growth_rate || 0}%
                                  </span>
                                </Chip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>

                        {/* Security & Access Control */}
                        <Card 
                          className="transition-all duration-200"
                          style={{
                            background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-danger) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <CardBody className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="p-2 rounded-lg"
                                style={{
                                  background: `color-mix(in srgb, var(--theme-danger) 20%, transparent)`,
                                  borderRadius: `var(--borderRadius, 8px)`,
                                }}
                              >
                                <ShieldCheckIcon className="w-5 h-5" style={{ color: 'var(--theme-danger)' }} />
                              </div>
                              <div>
                                <h6 
                                  className="font-semibold text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Access Control
                                </h6>
                                <p 
                                  className="text-small text-default-500"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Role assignments
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  With Roles
                                </span>
                                <span 
                                  className="text-sm font-medium text-success"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.security?.access_metrics?.users_with_roles || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Without Roles
                                </span>
                                <span 
                                  className="text-sm font-medium text-danger"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.security?.access_metrics?.users_without_roles || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Admin Users
                                </span>
                                <span 
                                  className="text-sm font-medium text-warning"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.security?.access_metrics?.admin_users || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Role Coverage
                                </span>
                                <Chip
                                  size="sm"
                                  color={
                                    (stats?.health?.system_metrics?.role_coverage || 0) > 80 ? "success" :
                                    (stats?.health?.system_metrics?.role_coverage || 0) > 60 ? "warning" : "danger"
                                  }
                                  variant="flat"
                                  radius={themeRadius}
                                >
                                  <span style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                                    {stats?.health?.system_metrics?.role_coverage || 0}%
                                  </span>
                                </Chip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>

                        {/* System Health Overview */}
                        <Card 
                          className="transition-all duration-200"
                          style={{
                            background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-default) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                          }}
                        >
                          <CardBody className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="p-2 rounded-lg"
                                style={{
                                  background: `color-mix(in srgb, var(--theme-default) 20%, transparent)`,
                                  borderRadius: `var(--borderRadius, 8px)`,
                                }}
                              >
                                <SignalIcon className="w-5 h-5" style={{ color: 'var(--theme-default)' }} />
                              </div>
                              <div>
                                <h6 
                                  className="font-semibold text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  System Health
                                </h6>
                                <p 
                                  className="text-small text-default-500"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Overall metrics
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Health Score
                                </span>
                                <Chip
                                  size="sm"
                                  color={
                                    (stats?.quick_metrics?.system_health_score || 0) > 80 ? "success" :
                                    (stats?.quick_metrics?.system_health_score || 0) > 60 ? "warning" : "danger"
                                  }
                                  variant="flat"
                                  radius={themeRadius}
                                >
                                  <span style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                                    {stats?.quick_metrics?.system_health_score || 0}%
                                  </span>
                                </Chip>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Activation Rate
                                </span>
                                <span 
                                  className="text-sm font-medium text-success"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.health?.system_metrics?.user_activation_rate || 0}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Total Roles
                                </span>
                                <span 
                                  className="text-sm font-medium text-primary"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.overview?.total_roles || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  Total Departments
                                </span>
                                <span 
                                  className="text-sm font-medium text-warning"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {stats?.overview?.total_departments || 0}
                                </span>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Filters Section with Loading Skeleton */}
                  <div className="mb-6">
                    {loading ? (
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        <div className="w-full sm:w-auto sm:min-w-[200px]">
                          <div className="space-y-2">
                            <Skeleton className="w-24 h-4 rounded" />
                            <Skeleton className="w-full h-10 rounded-lg" />
                          </div>
                        </div>
                        <div className="w-full sm:w-auto sm:min-w-[200px]">
                          <div className="space-y-2">
                            <Skeleton className="w-20 h-4 rounded" />
                            <Skeleton className="w-full h-10 rounded-lg" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                        {/* Search */}
                        <div className="flex-1">
                          <Input
                            label="Search Users"
                            placeholder="Search by name, email or phone..."
                            value={filters.search}
                            onValueChange={(value) => handleFilterChange('search', value)}
                            variant="bordered"
                            size={isMobile ? "sm" : "md"}
                            radius={themeRadius}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                              inputWrapper: "border-default-200 hover:border-default-300",
                            }}
                            style={{
                              fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                          />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 lg:gap-3">
                          <Select
                            label="Status"
                            selectedKeys={filters.status ? [filters.status] : []}
                            onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0])}
                            variant="bordered"
                            size={isMobile ? "sm" : "md"}
                            radius={themeRadius}
                            className="w-32"
                            style={{
                              fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                          >
                            <SelectItem key="all">All Status</SelectItem>
                            <SelectItem key="active">Active</SelectItem>
                            <SelectItem key="inactive">Inactive</SelectItem>
                          </Select>

                          <Select
                            label="Role"
                            selectedKeys={filters.role ? [filters.role] : []}
                            onSelectionChange={(keys) => handleFilterChange('role', Array.from(keys)[0])}
                            variant="bordered"
                            size={isMobile ? "sm" : "md"}
                            radius={themeRadius}
                            className="w-32"
                            style={{
                              fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                          >
                            <SelectItem key="all">All Roles</SelectItem>
                            {roles?.map((role, index) => {
                              const roleName = typeof role === 'object' && role !== null ? role.name : role;
                              const roleKey = typeof roleName === 'string' ? roleName.toLowerCase() : String(roleName || `role-${index}`).toLowerCase();
                              return (
                                <SelectItem key={roleKey}>{roleName || 'Unknown Role'}</SelectItem>
                              );
                            })}
                          </Select>

                          {/* View Toggle */}
                          <ButtonGroup variant="bordered" radius={themeRadius}>
                            <Button
                              isIconOnly
                              color={viewMode === 'table' ? 'primary' : 'default'}
                              onPress={() => setViewMode('table')}
                              size={isMobile ? "sm" : "md"}
                            >
                              <TableCellsIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              color={viewMode === 'grid' ? 'primary' : 'default'}
                              onPress={() => setViewMode('grid')}
                              size={isMobile ? "sm" : "md"}
                            >
                              <Squares2X2Icon className="w-4 h-4" />
                            </Button>
                          </ButtonGroup>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Users Content Section */}
                  <div className="overflow-hidden">
                      {loading ? (
                        <div className="flex justify-center items-center py-12">
                          <Spinner size="lg" />
                        </div>
                      ) : viewMode === 'table' ? (
                        <UsersTable 
                          allUsers={paginatedUsers.data}
                          roles={roles}
                          setUsers={handleUsersUpdate}
                          isMobile={isMobile}
                          isTablet={isTablet}
                          pagination={pagination}
                          onPageChange={handlePageChange}
                          onRowsPerPageChange={handleRowsPerPageChange}
                          totalUsers={paginatedUsers.total}
                          loading={loading}
                          onEdit={(user) => openModal('edit', user)}
                          updateUserOptimized={updateUserOptimized}
                          deleteUserOptimized={deleteUserOptimized}
                          toggleUserStatusOptimized={toggleUserStatusOptimized}
                          updateUserRolesOptimized={updateUserRolesOptimized}
                          // Device management props
                          toggleSingleDeviceLogin={toggleSingleDeviceLogin}
                          resetUserDevice={resetUserDevice}
                          deviceActions={deviceActions}
                        />
                      ) : (
                        <div>
                          {paginatedUsers.data && paginatedUsers.data.length > 0 ? (
                            <div className={`grid gap-4 ${
                              isMobile 
                                ? 'grid-cols-1' 
                                : isTablet 
                                  ? 'grid-cols-2' 
                                  : 'grid-cols-3 xl:grid-cols-4'
                            }`}>
                              {paginatedUsers.data.map((user, index) => (
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
                                Add First User
                              </Button>
                            </div>
                          )}
                          
                          {/* Pagination for Grid View */}
                          {paginatedUsers.data && paginatedUsers.data.length > 0 && (
                            <div className="flex justify-center mt-6 border-t pt-4" style={{ borderColor: 'var(--theme-divider, #E4E4E7)' }}>
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
                          )}
                        </div>
                      )}
                    </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

UsersList.layout = (page) => <App>{page}</App>;
export default UsersList;
