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
import { hasRoute, safeRoute, safeNavigate } from '@/utils/routeUtils';
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
  UserGroupIcon,
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
import InviteUserForm from "@/Forms/InviteUserForm.jsx";
import PendingInvitationsPanel from "@/Components/PendingInvitationsPanel.jsx";
import ExportUsersModal from "@/Components/ExportUsersModal.jsx";
import LockAccountModal from "@/Components/LockAccountModal.jsx";
import OnboardEmployeeModal from "@/Components/HRM/OnboardEmployeeModal.jsx";
import BulkOnboardModal from "@/Components/HRM/BulkOnboardModal.jsx";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * Route helper that returns the appropriate route based on context
 */
const getRoutes = (context) => {
  const isAdmin = context === 'admin';
  
  return {
    // Data routes - consistent naming
    paginate: 'users.paginate',
    stats: 'users.stats',
    store: 'users.store',
    update: 'users.update',
    destroy: 'users.destroy',
    toggleStatus: 'users.toggleStatus',
    updateRoles: 'users.updateRole',
    invite: 'users.invite',
    export: 'users.export',
    restore: 'users.restore',
    lock: 'users.lock',
    unlock: 'users.unlock',
    forcePasswordReset: 'users.forcePasswordReset',
    resendVerification: 'users.resendVerification',
    // Device routes
    devices: 'devices.admin.list',
    devicesToggle: 'devices.admin.toggle',
    devicesReset: 'devices.admin.reset',
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
  
  // Custom media query logic
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
  const [userToOnboard, setUserToOnboard] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkOnboardModal, setShowBulkOnboardModal] = useState(false);
  
  // Check if HRM module is installed
  const { modules } = usePage().props;
  const hrmModuleInstalled = modules?.hrm || false;
  
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
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    deleted_users: 0,
    verified_users: 0,
    unverified_users: 0,
    locked_accounts: 0,
    users_with_roles: 0,
    users_without_roles: 0,
    recent_users_30_days: 0,
    active_percentage: 0,
    verified_percentage: 0,
    roles_coverage: 0,
    total_roles: 0,
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
      const { data } = await axios.get(route(routes.stats));
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [routes.stats]);

  // Fetch users data with server-side pagination
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
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
    }
  }, [filters, pagination.currentPage, pagination.perPage, routes.paginate]);

  // Effect to fetch data when filters or pagination changes
  useEffect(() => {
    fetchUsers();
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

  // Optimized status toggle
  const toggleUserStatusOptimized = useCallback((userId, newStatus) => {
    setUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, active: newStatus } : user));
    fetchStats();
  }, [fetchStats]);

  // Handle onboard employee
  const handleOnboardEmployee = useCallback((user) => {
    setUserToOnboard(user);
    setOpenModalType('onboard');
  }, []);

  // Handle successful onboarding
  const handleOnboardingSuccess = useCallback((employee) => {
    // Refresh users list to update the employee_id field
    fetchUsers();
    // Close modal
    setUserToOnboard(null);
    setOpenModalType(null);
  }, [fetchUsers]);

  // Optimized roles update
  const updateUserRolesOptimized = useCallback((userId, newRoles) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, roles: newRoles } : user
    ));
    fetchStats();
  }, [fetchStats]);



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
                  key="view-devices"
                  startContent={<DevicePhoneMobileIcon className="w-3 h-3" />}
                  onPress={() => safeNavigate(routes.devices, { userId: user.id })}
                  className="text-xs"
                >
                  Device History
                </DropdownItem>

               
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

        {/* Status and Roles */}
        <div className="mt-auto space-y-2">
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
      value: stats?.total_users || 0,
      icon: <UsersIcon className="w-5 h-5" />,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      description: 'All registered users'
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: 'text-green-400',
      iconBg: 'bg-green-500/20',
      description: `${stats?.active_percentage || 0}% of total`
    },
    {
      title: 'Inactive Users',
      value: stats?.inactive_users || 0,
      icon: <XCircleIcon className="w-5 h-5" />,
      color: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      description: 'Deactivated accounts'
    },
    {
      title: 'Email Verified',
      value: stats?.verified_users || 0,
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      description: `${stats?.verified_percentage || 0}% verified`
    },
    {
      title: 'Unverified',
      value: stats?.unverified_users || 0,
      icon: <ExclamationTriangleIcon className="w-5 h-5" />,
      color: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      description: 'Pending verification'
    },
    {
      title: 'Locked Accounts',
      value: stats?.locked_accounts || 0,
      icon: <LockClosedIcon className="w-5 h-5" />,
      color: 'text-red-400',
      iconBg: 'bg-red-500/20',
      description: 'Security locked'
    },
    {
      title: 'With Roles',
      value: stats?.users_with_roles || 0,
      icon: <TrophyIcon className="w-5 h-5" />,
      color: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
      description: `${stats?.roles_coverage || 0}% coverage`
    },
    {
      title: 'New Users (30d)',
      value: stats?.recent_users_30_days || 0,
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      description: 'Last 30 days'
    }
  ], [stats]);

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

      {/* Invite User Modal (Tenant context only) */}
      {openModalType === 'invite' && context === 'tenant' && (
        <InviteUserForm
          roles={roles}
          open={openModalType === 'invite'}
          closeModal={closeModal}
          onInviteSent={() => {
            fetchUsers();
          }}
        />
      )}

      {/* Export Users Modal */}
      {openModalType === 'export' && (
        <ExportUsersModal
          open={openModalType === 'export'}
          onClose={closeModal}
          roles={roles}
          departments={departments}
          themeRadius={themeRadius}
        />
      )}

      {/* Lock Account Modal */}
      {openModalType === 'lock' && selectedUser && (
        <LockAccountModal
          open={openModalType === 'lock'}
          onClose={closeModal}
          user={selectedUser}
          onSuccess={(updatedUser) => {
            handleUsersUpdate(updatedUser);
            fetchUsers();
          }}
          themeRadius={themeRadius}
        />
      )}

      {/* Onboard Employee Modal */}
      {openModalType === 'onboard' && userToOnboard && hrmModuleInstalled && (
        <OnboardEmployeeModal
          open={openModalType === 'onboard'}
          onClose={() => {
            setOpenModalType(null);
            setUserToOnboard(null);
          }}
          user={userToOnboard}
          departments={departments || []}
          designations={designations || []}
          managers={users.filter(u => u.employee_id) || []}
          onSuccess={handleOnboardingSuccess}
        />
      )}

      {/* Bulk Onboard Modal */}
      {showBulkOnboardModal && hrmModuleInstalled && (
        <BulkOnboardModal
          open={showBulkOnboardModal}
          onClose={() => {
            setShowBulkOnboardModal(false);
            setSelectedUsers([]);
          }}
          users={selectedUsers}
          departments={departments || []}
          designations={designations || []}
          managers={users.filter(u => u.employee_id) || []}
          onSuccess={() => {
            fetchUsers();
            setShowBulkOnboardModal(false);
            setSelectedUsers([]);
          }}
        />
      )}

      <div 
        className="flex flex-col w-full h-full p-4"
        role="main"
        aria-label={pageTitle}
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
                                {pageTitle}
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
                                {pageDescription}
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
                              {isMobile ? "Add" : context === 'admin' ? "Add Admin" : "Add User"}
                            </Button>
                            
                            {/* Invite button only for tenant context */}
                            {context === 'tenant' && (
                              <Button
                                size={isMobile ? "sm" : "md"}
                                variant="bordered"
                                startContent={<EnvelopeIcon className="w-4 h-4" />}
                                onPress={() => openModal('invite')}
                                radius={themeRadius}
                                style={{
                                  background: `color-mix(in srgb, var(--theme-secondary) 10%, transparent)`,
                                  border: `1px solid color-mix(in srgb, var(--theme-secondary) 30%, transparent)`,
                                  color: 'var(--theme-secondary)',
                                  fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                                className="min-w-0"
                              >
                                {isMobile ? "Invite" : "Invite User"}
                              </Button>
                            )}

                            {/* Bulk Onboard button - HRM module only */}
                            {hrmModuleInstalled && selectedUsers.length > 0 && (
                              <Button
                                size={isMobile ? "sm" : "md"}
                                color="success"
                                startContent={<UserGroupIcon className="w-4 h-4" />}
                                onPress={() => setShowBulkOnboardModal(true)}
                                radius={themeRadius}
                                style={{
                                  fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                                className="min-w-0"
                              >
                                {isMobile ? "Onboard" : `Onboard Selected (${selectedUsers.length})`}
                              </Button>
                            )}
                            
                            <Button
                              size={isMobile ? "sm" : "md"}
                              variant="bordered"
                              startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                              onPress={() => openModal('export')}
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

                      {/* Filter Bar */}
                      <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <Input
                          size={isMobile ? "sm" : "md"}
                          placeholder="Search users..."
                          value={filters.search}
                          onValueChange={(value) => handleFilterChange('search', value)}
                          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                          isClearable
                          onClear={() => handleFilterChange('search', '')}
                          radius={themeRadius}
                          classNames={{
                            inputWrapper: "bg-default-100",
                          }}
                          className="flex-1"
                        />
                        
                        {/* Role Filter */}
                        <Select
                          size={isMobile ? "sm" : "md"}
                          placeholder="All Roles"
                          selectedKeys={filters.role !== 'all' ? [filters.role] : []}
                          onSelectionChange={(keys) => handleFilterChange('role', Array.from(keys)[0] || 'all')}
                          radius={themeRadius}
                          classNames={{
                            trigger: "bg-default-100",
                          }}
                          className="w-full md:w-48"
                        >
                          {roles?.map((role) => (
                            <SelectItem key={role.name || role}>
                              {role.name || role}
                            </SelectItem>
                          ))}
                        </Select>
                        
                        {/* Status Filter */}
                        <Select
                          size={isMobile ? "sm" : "md"}
                          placeholder="All Status"
                          selectedKeys={filters.status !== 'all' ? [filters.status] : []}
                          onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || 'all')}
                          radius={themeRadius}
                          classNames={{
                            trigger: "bg-default-100",
                          }}
                          className="w-full md:w-40"
                        >
                          <SelectItem key="active">Active</SelectItem>
                          <SelectItem key="inactive">Inactive</SelectItem>
                        </Select>
                        
                        {/* Department Filter (Tenant only) */}
                        {context === 'tenant' && departments && departments.length > 0 && (
                          <Select
                            size={isMobile ? "sm" : "md"}
                            placeholder="All Departments"
                            selectedKeys={filters.department !== 'all' ? [filters.department] : []}
                            onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0] || 'all')}
                            radius={themeRadius}
                            classNames={{
                              trigger: "bg-default-100",
                            }}
                            className="w-full md:w-48"
                          >
                            {departments?.map((dept) => (
                              <SelectItem key={String(dept.id)}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                        
                        {/* View Toggle */}
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

                  {/* Pending Invitations Panel (Tenant context only) */}
                  {context === 'tenant' && (
                    <PendingInvitationsPanel
                      className="mb-6"
                      onInvitationAction={() => {
                        fetchUsers();
                        fetchStats();
                      }}
                    />
                  )}

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
                        onEdit={(user, action) => {
                          if (action === 'lock') {
                            // Open lock modal
                            openModal('lock', user);
                          } else {
                            // Regular edit
                            openModal('edit', user);
                          }
                        }}
                        updateUserOptimized={updateUserOptimized}
                        deleteUserOptimized={deleteUserOptimized}
                        toggleUserStatusOptimized={toggleUserStatusOptimized}
                        updateUserRolesOptimized={updateUserRolesOptimized}
                     
                    
                        deviceActions={deviceActions}
                        context={context}
                        onOnboardEmployee={handleOnboardEmployee}
                        hrmModuleInstalled={hrmModuleInstalled}
                        selectedUsers={selectedUsers}
                        onSelectionChange={setSelectedUsers}
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
                              {context === 'admin' ? 'Add First Admin' : 'Add First User'}
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
