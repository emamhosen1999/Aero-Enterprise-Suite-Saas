import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head, usePage, router } from "@inertiajs/react";
import { motion } from 'framer-motion';
import { 
  Button,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Input,
  Divider,
  Tabs,
  Tab,
  Spinner,
  Tooltip,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch
} from "@heroui/react";
import { useTheme } from '@/Context/ThemeContext.jsx';
import useMediaQuery from '@/Hooks/useMediaQuery';
import { 
  UserGroupIcon, 
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon 
} from "@heroicons/react/24/outline";
import StatsCards from '@/Components/Common/StatsCards';
import RolesTable from '@/Tables/RolesTable.jsx';
import UserRolesTable from '@/Tables/UserRolesTable.jsx';
import App from '@/Layouts/App';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

// Utility functions
const normalizeArray = (arr) => Array.isArray(arr) ? [...arr] : [];

// Data validation and recovery - simplified (no more permissions)
const validateAndRecoverData = (dataObject) => {
    const recovered = {
        roles: normalizeArray(dataObject.roles),
        errors: []
    };

    // Validate data integrity
    if (recovered.roles.length === 0) {
        recovered.errors.push('No roles data available');
    }

    return recovered;
};

// Debounce utility function
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Loading states enum
const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

const RoleManagement = (props) => {
    // Enhanced data validation and recovery
    const validatedData = useMemo(() => validateAndRecoverData(props), [props]);
    
    // Defensive normalization for all incoming props using validated data
    const initialRoles = validatedData.roles;
    const canManageSuperAdmin = !!props.can_manage_super_admin;
    const title = props.title;
    const errorInfo = props.error || null;
    const dataValidationErrors = validatedData.errors;
    const initialUsers = props.users || [];
    const isPlatformContext = props.is_platform_context || false;

    // Local users state for real-time updates
    const [users, setUsers] = useState(initialUsers);

    // Helper to get correct API base URL based on context
    // Platform context (admin subdomain) uses /roles directly (domain-based routing)
    // Tenant context uses /api/roles (web guard)
    const getRolesApiBase = () => isPlatformContext ? '/roles' : '/api/roles';

    // Refs for performance optimization
    const lastUpdateRef = useRef(Date.now());
    
    // Theme and responsive hooks
    const { themeSettings } = useTheme();
    const isDark = themeSettings?.mode === 'dark';
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(max-width: 768px)');
    
    // Helper function to get theme-aware radius for HeroUI components
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
    // Main tab management
    const [activeTab, setActiveTab] = useState(0);
    
    // State management - roles only (permissions removed, now handled via Module Access)
    const [roles, setRoles] = useState(initialRoles);
    
    // Enhanced loading states
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStates, setLoadingStates] = useState({
        roles: LOADING_STATES.IDLE,
        users: LOADING_STATES.IDLE
    });
    
    // Dialog states
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    
    // Search and filter states with debouncing
    const [roleSearchQuery, setRoleSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [roleStatusFilter, setRoleStatusFilter] = useState('all');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const debouncedRoleSearch = useDebounce(roleSearchQuery, 300);
    const debouncedUserSearch = useDebounce(userSearchQuery, 300);
    
    // Pagination states for each table
    const [rolePage, setRolePage] = useState(0);
    const [userPage, setUserPage] = useState(0);
    const [roleRowsPerPage, setRoleRowsPerPage] = useState(10);
    const [userRowsPerPage, setUserRowsPerPage] = useState(10);
    
    // Error handling
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Form states with validation
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        hierarchy_level: 10,
        is_active: true,
        guard_name: 'web' // Will be auto-set based on context
    });
    const [formErrors, setFormErrors] = useState({});
    
    // Bulk operations state - for user role assignment
    const [selectedRoles, setSelectedRoles] = useState(new Set());

    // Memoized statistics
    const stats = useMemo(() => ({
        totalRoles: Array.isArray(roles) ? roles.length : 0,
        totalUsers: Array.isArray(users) ? users.length : 0
    }), [roles, users]);

    // Count of users that can have roles assigned (excluding Super Administrators)
    const assignableUsersCount = useMemo(() => {
        const protectedRoles = ['Super Administrator'];
        return users.filter(user => 
            !user.roles?.some(role => protectedRoles.includes(role.name))
        ).length;
    }, [users]);

    // Prepare stats data for StatsCards component
    const statsData = useMemo(() => [
        {
            title: "Total Roles",
            value: stats.totalRoles,
            icon: <UserGroupIcon />,
            color: "text-blue-500",
            iconBg: "bg-blue-500/20",
            description: "System roles"
        },
        {
            title: "Total Users", 
            value: stats.totalUsers,
            icon: <UsersIcon />,
            color: "text-green-500",
            iconBg: "bg-green-500/20",
            description: "All users"
        },
        {
            title: "Assignable Users",
            value: assignableUsersCount,
            icon: <Cog6ToothIcon />,
            color: "text-purple-500",
            iconBg: "bg-purple-500/20", 
            description: "Users for role assignment"
        }
    ], [stats, assignableUsersCount]);

    // Memoized filtered data for tables
    const filteredRoles = useMemo(() => {
        return roles.filter(role => {
            const matchesSearch = debouncedRoleSearch === '' || 
                role.name.toLowerCase().includes(debouncedRoleSearch.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(debouncedRoleSearch.toLowerCase()));
            
            const matchesStatus = roleStatusFilter === 'all' ||
                (roleStatusFilter === 'active' && role.is_active !== false) ||
                (roleStatusFilter === 'inactive' && role.is_active === false);
            
            return matchesSearch && matchesStatus;
        });
    }, [roles, debouncedRoleSearch, roleStatusFilter]);

    const filteredUsers = useMemo(() => {
        // Protected Super Administrator role names - these users should not appear in role assignment
        const protectedRoles = ['Super Administrator', 'platform_super_administrator', 'tenant_super_administrator'];
        
        return users.filter(user => {
            // CRITICAL: Exclude Super Administrator users - they don't need role assignment
            const isSuperAdmin = user.roles?.some(role => protectedRoles.includes(role.name)) || false;
            if (isSuperAdmin) return false;
            
            const matchesSearch = debouncedUserSearch === '' ||
                user.name?.toLowerCase().includes(debouncedUserSearch.toLowerCase()) ||
                user.email?.toLowerCase().includes(debouncedUserSearch.toLowerCase());
            
            const matchesRole = userRoleFilter === 'all' ||
                (user.roles && user.roles.some(role => role.name === userRoleFilter));
            
            return matchesSearch && matchesRole;
        });
    }, [users, debouncedUserSearch, userRoleFilter]);

    

    // Pagination helpers
    const paginatedRoles = useMemo(() => {
        const startIndex = rolePage * roleRowsPerPage;
        return filteredRoles.slice(startIndex, startIndex + roleRowsPerPage);
    }, [filteredRoles, rolePage, roleRowsPerPage]);

    const paginatedUsers = useMemo(() => {
        const startIndex = userPage * userRowsPerPage;
        return filteredUsers.slice(startIndex, startIndex + userRowsPerPage);
    }, [filteredUsers, userPage, userRowsPerPage]);

    // Get unique roles for user filter
    const roleNames = useMemo(() => {
        return roles.map(role => role.name).sort();
    }, [roles]);

    // Check if user can manage role (edit/delete)
    // Protected Super Administrator roles cannot be managed
    const canManageRole = (role) => {
        const protectedRoles = ['Super Administrator', 'platform_super_administrator', 'tenant_super_administrator'];
        
        // Protected roles cannot be edited or deleted
        if (protectedRoles.includes(role.name)) {
            return false;
        }
        
        return true; // Can manage all other roles if has access to role management
    };

    // Search handlers
    const handleRoleSearchChange = useCallback((value) => {
        setRoleSearchQuery(value);
        setRolePage(0);
    }, []);

    const handleUserSearchChange = useCallback((value) => {
        setUserSearchQuery(value);
        setUserPage(0);
    }, []);

    // Filter handlers
    const handleRoleStatusFilterChange = useCallback((value) => {
        setRoleStatusFilter(value);
        setRolePage(0);
    }, []);

    const handleUserRoleFilterChange = useCallback((value) => {
        setUserRoleFilter(value);
        setUserPage(0);
    }, []);

    // Modal handlers
    const openRoleModal = useCallback((role = null) => {
        setEditingRole(role);
        setRoleForm({
            name: role?.name || '',
            description: role?.description || '',
            hierarchy_level: role?.hierarchy_level || 10,
            is_active: role?.is_active ?? true
        });
        setRoleDialogOpen(true);
        setFormErrors({});
        setErrorMessage('');
    }, []);

    const closeRoleModal = useCallback(() => {
        setRoleDialogOpen(false);
        setEditingRole(null);
        setFormErrors({});
        setErrorMessage('');
        setRoleForm({
            name: '',
            description: '',
            hierarchy_level: 10,
            is_active: true
        });
    }, []);

    // Check if user has a protected Super Administrator role
    const isProtectedUser = useCallback((user) => {
        const protectedRoles = ['Super Administrator', 'platform_super_administrator', 'tenant_super_administrator'];
        return user.roles?.some(role => protectedRoles.includes(role.name)) || false;
    }, []);

    const openUserRoleModal = useCallback((user) => {
        // CRITICAL: Super Administrator users' roles cannot be changed
        if (isProtectedUser(user)) {
            showToast.error('Super Administrator users\' roles cannot be modified. This is a protected user.');
            return;
        }
        
        setSelectedUser(user);
        setUserRoleDialogOpen(true);
        const userRoles = user.roles ? new Set(user.roles.map(role => role.id)) : new Set();
        setSelectedRoles(userRoles);
    }, [isProtectedUser]);

    const closeUserRoleModal = useCallback(() => {
        setUserRoleDialogOpen(false);
        setSelectedUser(null);
        setSelectedRoles(new Set());
    }, []);

    // Handle role change from UserRolesTable inline dropdown
    const handleUserRoleChangeFromTable = useCallback((userId, newRoleNames) => {
        // Update local users state with new roles
        setUsers(prevUsers => prevUsers.map(user => {
            if (user.id === userId) {
                // Find the full role objects from the roles list
                const newRoles = roles.filter(role => newRoleNames.includes(role.name));
                return { ...user, roles: newRoles };
            }
            return user;
        }));
    }, [roles]);

    // Delete confirmation handlers
    const confirmDeleteRole = useCallback((role) => {
        setRoleToDelete(role);
        setConfirmDeleteOpen(true);
    }, []);

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;

        setIsLoading(true);
        
        try {
            await axios.delete(`${getRolesApiBase()}/${roleToDelete.id}`);
            
            // Remove the deleted role from local state
            setRoles(prev => {
                const newRoles = prev.filter(r => r.id !== roleToDelete.id);
                
                // Adjust page if current page becomes empty after deletion
                const totalPages = Math.ceil(newRoles.length / roleRowsPerPage);
                if (rolePage >= totalPages && totalPages > 0) {
                    setRolePage(totalPages - 1);
                }
                
                return newRoles;
            });
            
            showToast.success('Role deleted successfully');
            setSuccessMessage('Role deleted successfully');
            setConfirmDeleteOpen(false);
            setRoleToDelete(null);
            lastUpdateRef.current = Date.now();
        } catch (error) {
            console.error('Error deleting role:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to delete role';
            showToast.error(errorMsg);
            setErrorMessage(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };
        

    // Enhanced role form submission
    const handleRoleSubmit = async () => {
        setFormErrors({});
        setErrorMessage('');

        const errors = {};
        if (!roleForm.name.trim()) {
            errors.name = 'Role name is required';
        }
        if (roleForm.name.length > 255) {
            errors.name = 'Role name must be less than 255 characters';
        }
        if (roleForm.description && roleForm.description.length > 500) {
            errors.description = 'Description must be less than 500 characters';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsLoading(true);
        setLoadingStates(prev => ({ ...prev, roles: LOADING_STATES.LOADING }));

        try {
            const url = editingRole ? `${getRolesApiBase()}/${editingRole.id}` : getRolesApiBase();
            const method = editingRole ? 'put' : 'post';

            const response = await axios[method](url, roleForm);

            if (response.status === 200 || response.status === 201) {
                if (editingRole) {
                    setRoles(prev => prev.map(r => r.id === editingRole.id ? response.data.role : r));
                    showToast.success('Role updated successfully');
                    setSuccessMessage('Role updated successfully');
                } else {
                    setRoles(prev => [...prev, response.data.role]);
                    showToast.success('Role created successfully');
                    setSuccessMessage('Role created successfully');
                }
                
                closeRoleModal();
                setLoadingStates(prev => ({ ...prev, roles: LOADING_STATES.SUCCESS }));
                
                setTimeout(() => {
                    setLoadingStates(prev => ({ ...prev, roles: LOADING_STATES.IDLE }));
                    setSuccessMessage('');
                }, 3000);
                
                lastUpdateRef.current = Date.now();
            }
        } catch (error) {
            console.error('Error saving role:', error);
            
            setLoadingStates(prev => ({ ...prev, roles: LOADING_STATES.ERROR }));
            
            if (error.response?.status === 422 && error.response.data.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to save role';
                showToast.error(errorMsg);
                setErrorMessage(errorMsg);
            }
            
            setTimeout(() => {
                setLoadingStates(prev => ({ ...prev, roles: LOADING_STATES.IDLE }));
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    };

 

    // Enhanced user-role assignment
    const handleUserRoleSave = async () => {
        if (!selectedUser) return;

        setIsLoading(true);
        
        try {
            const response = await axios.post(`/api/users/${selectedUser.id}/roles`, {
                roles: Array.from(selectedRoles)
            });

            if (response.status === 200) {
                showToast.success('User roles updated successfully');
                closeUserRoleModal();
                // Optionally refresh user data here
                lastUpdateRef.current = Date.now();
            }
        } catch (error) {
            console.error('Error updating user roles:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update user roles';
            showToast.error(errorMsg);
            setErrorMessage(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Focus search on '/' key (like GitHub)
            if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                const target = event.target;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                    event.preventDefault();
                    const searchInput = document.querySelector('input[placeholder*="Search"]');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
            }
            
            // Escape to clear filters
            if (event.key === 'Escape' && (roleSearchQuery || userSearchQuery)) {
                setRoleSearchQuery('');
                setUserSearchQuery('');
                setRoleStatusFilter('all');
                setUserRoleFilter('all');
            }
            
            // Ctrl/Cmd + K to focus search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Search"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [roleSearchQuery, userSearchQuery, roleStatusFilter, userRoleFilter]);

    // Render all modals
    const renderModals = () => (
        <>
            {/* Enhanced Role Modal */}
            <Modal 
                isOpen={roleDialogOpen} 
                onClose={!isLoading ? closeRoleModal : undefined}
                size="lg"
                classNames={{
                    base: "border border-divider bg-content1 shadow-lg",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <UserGroupIcon className="w-6 h-6" />
                        {editingRole ? 'Edit Role' : 'Create New Role'}
                        {loadingStates.roles === LOADING_STATES.LOADING && (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                    </ModalHeader>
                    <ModalBody>
                {loadingStates.roles === LOADING_STATES.ERROR && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                        <p className="text-danger text-sm">
                            Failed to save role. Please check the form and try again.
                        </p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                    <div className="col-span-1">
                        <Input
                            label="Role Name"
                            placeholder="Enter role name"
                            value={roleForm.name}
                            onValueChange={(value) => setRoleForm(prev => ({ ...prev, name: value }))}
                            isInvalid={!!formErrors.name}
                            errorMessage={formErrors.name}
                            description="Unique identifier for the role"
                            isRequired
                            isDisabled={isLoading}
                            variant="bordered"
                            radius={getThemeRadius()}
                            classNames={{
                                inputWrapper: "bg-default-100/50 dark:bg-default-50/10 border-default-200/20 hover:border-default-300/30 focus-within:!border-primary/50",
                                input: "text-foreground placeholder:text-default-400",
                                label: "text-default-500",
                                description: "text-default-400",
                                errorMessage: "text-danger"
                            }}
                        />
                    </div>
                    <div className="col-span-2">
                        <Textarea
                            label="Description"
                            placeholder="Optional description of role responsibilities"
                            value={roleForm.description}
                            onValueChange={(value) => setRoleForm(prev => ({ ...prev, description: value }))}
                            isDisabled={isLoading}
                            variant="bordered"
                            minRows={2}
                            radius={getThemeRadius()}
                            classNames={{
                                inputWrapper: "bg-default-100/50 dark:bg-default-50/10 border-default-200/20 hover:border-default-300/30 focus-within:!border-primary/50",
                                input: "text-foreground placeholder:text-default-400",
                                label: "text-default-500"
                            }}
                        />
                    </div>
                </div>
                    </ModalBody>
                    <ModalFooter className="flex gap-3">
                        <Button 
                            variant="light" 
                            onPress={closeRoleModal} 
                            isDisabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleRoleSubmit}
                            isLoading={isLoading}
                        >
                            {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

       

            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={confirmDeleteOpen} 
                onClose={() => setConfirmDeleteOpen(false)}
                size="md"
                classNames={{
                    base: "border border-divider bg-content1 shadow-lg",
                    header: "border-b border-divider",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
                        Confirm Delete
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-foreground/90">
                            Are you sure you want to delete {roleToDelete ? `the role "${roleToDelete.name}"` : 'this item'}? This action cannot be undone.
                        </p>
                    </ModalBody>
                    <ModalFooter className="flex gap-3">
                        <Button 
                            variant="light" 
                            onPress={() => setConfirmDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleDeleteRole}
                            isLoading={isLoading}
                        >
                            Delete Role
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );

    return (
        <>
            <Head title={title} />
            
            {/* Data validation error alerts - shown as a card instead of MUI Alert */}
            {dataValidationErrors.length > 0 && (
                <div className="mb-4 p-4">
                    <Card className="bg-warning/10 border border-warning/30" radius={getThemeRadius()}>
                        <CardBody className="flex flex-row items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-warning mb-2">
                                    Data Integrity Issues Detected
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-default-600">
                                    {dataValidationErrors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                                <p className="text-sm text-default-500 italic mt-2">
                                    This may indicate a cache or database synchronization issue on the server.
                                </p>
                            </div>
                            <Button
                                color="warning"
                                size="sm"
                                variant="flat"
                                onPress={() => {
                                    router.reload({ only: ['roles', 'users'] });
                                }}
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                            >
                                Refresh Data
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Main Container - Themed like EmployeeList */}
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Role Management"
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
                                    <div className={`${!isMobile && !isTablet ? 'p-6' : isMobile ? 'p-3' : 'p-4'} w-full`}>
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${!isMobile && !isTablet ? 'p-3' : isMobile ? 'p-2' : 'p-2.5'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <ShieldCheckIcon 
                                                            className={`
                                                                ${!isMobile && !isTablet ? 'w-8 h-8' : isMobile ? 'w-5 h-5' : 'w-6 h-6'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${!isMobile && !isTablet ? 'text-2xl' : isMobile ? 'text-lg' : 'text-xl'}
                                                                font-bold text-foreground
                                                                ${isMobile || isTablet ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Role Management
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${!isMobile && !isTablet ? 'text-sm' : 'text-xs'} 
                                                                text-default-500
                                                                ${isMobile || isTablet ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            Manage roles and assign them to users
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        className="font-medium"
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-success) 15%, transparent)`,
                                                            color: `var(--theme-success)`,
                                                            borderRadius: getThemeRadius(),
                                                            border: `1px solid color-mix(in srgb, var(--theme-success) 30%, transparent)`,
                                                        }}
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                    >
                                                        {isMobile ? "Export" : "Export Data"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Statistics Cards */}
                                    <StatsCards stats={statsData} />

                                    {/* Tabbed Interface using HeroUI Tabs */}
                                    {/* NOTE: Permissions Management removed. Role access is now managed
                                        through Module Access (Role-Module Access table) in ModuleManagement page. */}
                                    <div className="w-full mt-6">
                                        <Tabs 
                                            selectedKey={activeTab.toString()} 
                                            onSelectionChange={(key) => setActiveTab(parseInt(key))}
                                            aria-label="Role management tabs"
                                            variant="underlined"
                                            classNames={{
                                                tabList: "gap-6 w-full relative rounded-none p-0 border-b",
                                                cursor: "w-full",
                                                tab: "max-w-fit px-0 h-12 text-default-500",
                                                tabContent: ""
                                            }}
                                            style={{
                                                '--tabs-cursor-bg': 'var(--theme-primary)',
                                            }}
                                        >
                                            <Tab 
                                                key="0"
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <UserGroupIcon className="w-5 h-5" />
                                                        <span className={isMobile ? 'sr-only' : ''}>Roles Management</span>
                                                    </div>
                                                }
                                            />
                                            <Tab 
                                                key="1"
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <UsersIcon className="w-5 h-5" />
                                                        <span className={isMobile ? 'sr-only' : ''}>User-Role Assignment</span>
                                                    </div>
                                                }
                                            />
                                        </Tabs>

                                        {/* Tab Content - Roles Management */}
                                        {activeTab === 0 && (
                                            <div className="mt-4">
                                                <Card 
                                                    className="mb-4"
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-content1) 85%, transparent)`,
                                                        border: `1px solid color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CardBody className="p-4">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mb-4">
                                                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                                                <UserGroupIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                                                Roles Management
                                                            </div>
                                                            <Button
                                                                onPress={() => openRoleModal()}
                                                                startContent={<PlusIcon className="w-4 h-4" />}
                                                                className="text-white font-medium"
                                                                style={{
                                                                    background: `linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 80%, var(--theme-secondary)))`,
                                                                    borderRadius: getThemeRadius(),
                                                                }}
                                                            >
                                                                Add Role
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="flex flex-col sm:flex-row gap-4">
                                                            <Input
                                                                aria-label="Search roles"
                                                                placeholder="Search by role name..."
                                                                value={roleSearchQuery}
                                                                onValueChange={handleRoleSearchChange}
                                                                className="flex-1 min-w-0"
                                                                radius={getThemeRadius()}
                                                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                                variant="bordered"
                                                                classNames={{
                                                                    inputWrapper: "bg-white/10 backdrop-blur-md border-white/20",
                                                                    base: "flex-1"
                                                                }}
                                                            />
                                                            <Select
                                                                aria-label="Filter by status"
                                                                placeholder="All Status"
                                                                variant="bordered"
                                                                selectedKeys={[roleStatusFilter]}
                                                                onSelectionChange={(keys) => handleRoleStatusFilterChange(Array.from(keys)[0])}
                                                                className="w-full sm:w-[140px] sm:flex-shrink-0"
                                                                radius={getThemeRadius()}
                                                                classNames={{
                                                                    trigger: "bg-white/10 backdrop-blur-md border-white/20",
                                                                }}
                                                            >
                                                                <SelectItem key="all" value="all">All Status</SelectItem>
                                                                <SelectItem key="active" value="active">Active</SelectItem>
                                                                <SelectItem key="inactive" value="inactive">Inactive</SelectItem>
                                                            </Select>
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                <RolesTable 
                                                    roles={paginatedRoles}
                                                    onEdit={openRoleModal}
                                                    onDelete={confirmDeleteRole}
                                                    canManageRole={canManageRole}
                                                    isMobile={isMobile}
                                                    isTablet={isTablet}
                                                    pagination={{
                                                        currentPage: rolePage + 1,
                                                        perPage: roleRowsPerPage,
                                                        total: filteredRoles.length
                                                    }}
                                                    onPageChange={(page) => setRolePage(page - 1)}
                                                    loading={loadingStates.roles === LOADING_STATES.LOADING}
                                                />
                                            </div>
                                        )}

                                   
                                        {/* Tab Content - User-Role Assignment */}
                                        {activeTab === 1 && (
                                            <div className="mt-4">
                                                <Card
                                                    className="mb-4"
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-content1) 85%, transparent)`,
                                                        border: `1px solid color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <CardBody className="p-4">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mb-4">
                                                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                                                <UsersIcon className="w-5 h-5" style={{ color: 'var(--theme-warning)' }} />
                                                                User-Role Assignment
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-4">
                                                            <Input
                                                                aria-label="Search users"
                                                                placeholder="Search by user name or email..."
                                                                value={userSearchQuery}
                                                                onValueChange={handleUserSearchChange}
                                                                className="flex-1 min-w-0"
                                                                radius={getThemeRadius()}
                                                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                                variant="bordered"
                                                                classNames={{
                                                                    inputWrapper: "bg-white/10 backdrop-blur-md border-white/20",
                                                                    base: "flex-1"
                                                                }}
                                                            />
                                                            <Select
                                                                aria-label="Filter by role"
                                                                placeholder="All Roles"
                                                                variant="bordered"
                                                                selectedKeys={[userRoleFilter]}
                                                                onSelectionChange={(keys) => handleUserRoleFilterChange(Array.from(keys)[0])}
                                                                className="w-full sm:w-[160px] sm:flex-shrink-0"
                                                                radius={getThemeRadius()}
                                                                classNames={{
                                                                    trigger: "bg-white/10 backdrop-blur-md border-white/20",
                                                                }}
                                                            >
                                                                <SelectItem key="all" value="all">All Roles</SelectItem>
                                                                {roleNames.map(roleName => (
                                                                    <SelectItem key={roleName} value={roleName}>
                                                                        {roleName}
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                <UserRolesTable
                                                    users={paginatedUsers}
                                                    roles={roles}
                                                    onRowClick={openUserRoleModal}
                                                    onRoleChange={handleUserRoleChangeFromTable}
                                                    context={isPlatformContext ? 'admin' : 'tenant'}
                                                    isMobile={isMobile}
                                                    isTablet={isTablet}
                                                    pagination={{
                                                        currentPage: userPage + 1,
                                                        perPage: userRowsPerPage,
                                                        total: filteredUsers.length
                                                    }}
                                                    onPageChange={(page) => setUserPage(page - 1)}
                                                    loading={isLoading}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Enhanced Modals */}
            {renderModals()}
        </>
    );
};
RoleManagement.layout = (page) => <App>{page}</App>;
export default RoleManagement;