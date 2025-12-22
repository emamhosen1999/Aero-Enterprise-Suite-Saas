import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, usePage, router } from "@inertiajs/react";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Button,
    Chip,
    Card,
    CardBody,
    CardHeader,
    Select,
    SelectItem,
    Input,
    Checkbox,
    Divider,
    Tabs,
    Tab,
    Spinner,
    Tooltip,
    Progress,
    Spacer,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Switch,
    Accordion,
    AccordionItem,
    Badge,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@heroui/react";
import {
    CubeIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FolderIcon,
    DocumentIcon,
    ShieldCheckIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    Cog6ToothIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    EllipsisVerticalIcon,
    FunnelIcon,
    AdjustmentsHorizontalIcon,
    KeyIcon,
    Square3Stack3DIcon,
    RectangleGroupIcon,
    CommandLineIcon,
    GlobeAltIcon,
    Squares2X2Icon
} from "@heroicons/react/24/outline";
import StatsCards from '@/Components/Common/StatsCards';
import App from '@/Layouts/App';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

// Component type icons mapping
const componentTypeIcons = {
    page: <DocumentIcon className="w-4 h-4" />,
    section: <RectangleGroupIcon className="w-4 h-4" />,
    widget: <Squares2X2Icon className="w-4 h-4" />,
    action: <CommandLineIcon className="w-4 h-4" />,
    api: <GlobeAltIcon className="w-4 h-4" />
};

// Component type colors
const componentTypeColors = {
    page: 'primary',
    section: 'secondary',
    widget: 'success',
    action: 'warning',
    api: 'danger'
};

// Category colors mapping
const categoryColors = {
    platform_core: 'danger', // Platform admin modules
    core_system: 'primary',
    self_service: 'secondary',
    human_resources: 'success',
    project_management: 'warning',
    document_management: 'default',
    customer_relations: 'primary',
    supply_chain: 'secondary',
    retail_sales: 'success',
    financial_management: 'warning',
    system_administration: 'danger'
};

// Permission action display names and descriptions
const actionDisplayMap = {
    view: { label: 'View', description: 'Can view/read data' },
    create: { label: 'Create', description: 'Can create new records' },
    update: { label: 'Edit', description: 'Can modify existing records' },
    delete: { label: 'Delete', description: 'Can remove records' },
    import: { label: 'Import', description: 'Can import data from files' },
    export: { label: 'Export', description: 'Can export data to files' },
    approve: { label: 'Approve', description: 'Can approve requests' },
    assign: { label: 'Assign', description: 'Can assign to users' },
    manage: { label: 'Manage', description: 'Full management access' },
    operate: { label: 'Operate', description: 'Can operate/execute' },
    punch: { label: 'Punch', description: 'Can punch attendance' },
    change: { label: 'Change', description: 'Can change settings' },
    impersonate: { label: 'Impersonate', description: 'Can act as another user' },
    analytics: { label: 'Analytics', description: 'Can view analytics' },
    settings: { label: 'Settings', description: 'Can configure settings' },
    log: { label: 'Log', description: 'Can view logs' },
    schedule: { label: 'Schedule', description: 'Can manage schedules' },
    restore: { label: 'Restore', description: 'Can restore data' },
    own: { label: 'Own', description: 'Access to own records only' }
};

/**
 * Format entity key to display name
 * Converts "accounts-payable" to "Accounts Payable", "daily-works" to "Daily Works"
 */
const formatEntityDisplayName = (entityKey) => {
    return entityKey
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Format permission name to a readable display name
 * Converts "employees.view" to "View Employees"
 */
const formatPermissionDisplayName = (permissionName) => {
    const parts = permissionName.split('.');
    if (parts.length >= 2) {
        const entity = formatEntityDisplayName(parts[0]);
        const action = parts[1];
        
        // Handle "own" permissions like "attendance.own.view"
        if (parts.length >= 3 && action === 'own') {
            const actualAction = parts[2];
            const actionInfo = actionDisplayMap[actualAction] || { label: actualAction.charAt(0).toUpperCase() + actualAction.slice(1) };
            return `${actionInfo.label} Own ${entity}`;
        }
        
        const actionInfo = actionDisplayMap[action] || { label: action.charAt(0).toUpperCase() + action.slice(1) };
        return `${actionInfo.label} ${entity}`;
    }
    return permissionName;
};

/**
 * Get the description for a permission action
 */
const getPermissionDescription = (permissionName) => {
    const parts = permissionName.split('.');
    if (parts.length >= 2) {
        const action = parts.length >= 3 && parts[1] === 'own' ? parts[2] : parts[1];
        return actionDisplayMap[action]?.description || `Permission for ${permissionName}`;
    }
    return `Permission for ${permissionName}`;
};

/**
 * Group permissions by their entity prefix
 * Returns an object with entity keys and arrays of permissions
 */
const groupPermissionsByEntity = (permissions) => {
    const grouped = {};
    
    permissions.forEach(permission => {
        const parts = permission.name.split('.');
        const entityKey = parts[0];
        
        if (!grouped[entityKey]) {
            grouped[entityKey] = {
                name: formatEntityDisplayName(entityKey),
                permissions: []
            };
        }
        
        grouped[entityKey].permissions.push({
            ...permission,
            displayName: formatPermissionDisplayName(permission.name),
            description: getPermissionDescription(permission.name)
        });
    });
    
    // Sort entities alphabetically
    const sortedKeys = Object.keys(grouped).sort();
    const sortedGrouped = {};
    sortedKeys.forEach(key => {
        sortedGrouped[key] = grouped[key];
    });
    
    return sortedGrouped;
};

// Debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

const ModuleManagement = (props) => {
    const {
        modules: initialModules = [],
        roles: initialRoles = [],
        permissions: allPermissions = [],
        statistics: initialStats = {},
        accessScopes = { all: 'Full Access', own: 'Own Only', team: 'Team', department: 'Department' },
        categories = {},
        componentTypes = {},
        title = 'Module Permission Registry',
        readonly = false, // Modules are read-only from landlord
        is_platform_context = false, // True when accessed from platform admin
        can_manage_structure = false, // True when user can manage module structure (platform super admin only)
    } = props;

    // Context awareness
    const isPlatformContext = is_platform_context;
    const canManageStructure = can_manage_structure;

    // Helper to get correct API base URL based on context
    // Platform context (admin subdomain) uses /modules directly (domain-based routing)
    // Tenant context uses /admin/modules (web guard)
    const getModulesApiBase = () => isPlatformContext ? '/modules' : '/admin/modules';

    // Route helper for context-aware routes
    const getRoute = (routeName, params = null) => {
        if (isPlatformContext) {
            // Platform admin routes have 'admin.modules.' prefix
            const platformRoute = routeName.replace('modules.', 'admin.modules.');
            return params ? route(platformRoute, params) : route(platformRoute);
        }
        // Tenant routes use 'modules.' prefix
        return params ? route(routeName, params) : route(routeName);
    };

    // State management
    const [modules, setModules] = useState(initialModules);
    const [statistics, setStatistics] = useState(initialStats);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedModules, setExpandedModules] = useState(new Set());
    const [expandedSubModules, setExpandedSubModules] = useState(new Set());

    // Role Access Management State
    const [roles, setRoles] = useState(initialRoles);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [roleAccess, setRoleAccess] = useState({
        modules: [],
        sub_modules: [],
        components: [],
        actions: []
    });
    const [roleAccessLoading, setRoleAccessLoading] = useState(false);
    const [roleAccessSaving, setRoleAccessSaving] = useState(false);
    const [showRoleAccessPanel, setShowRoleAccessPanel] = useState(true);

    // Modal states
    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [subModuleModalOpen, setSubModuleModalOpen] = useState(false);
    const [componentModalOpen, setComponentModalOpen] = useState(false);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Edit states
    const [editingModule, setEditingModule] = useState(null);
    const [editingSubModule, setEditingSubModule] = useState(null);
    const [editingComponent, setEditingComponent] = useState(null);
    const [parentModuleId, setParentModuleId] = useState(null);
    const [parentSubModuleId, setParentSubModuleId] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [permissionTarget, setPermissionTarget] = useState(null);

    // Form states
    const [moduleForm, setModuleForm] = useState({
        code: '',
        name: '',
        description: '',
        icon: '',
        category: 'core_system',
        route_prefix: '',
        is_active: true,
        priority: 100
    });

    const [subModuleForm, setSubModuleForm] = useState({
        code: '',
        name: '',
        description: '',
        icon: '',
        route: '',
        is_active: true,
        priority: 100
    });

    const [componentForm, setComponentForm] = useState({
        code: '',
        name: '',
        description: '',
        type: 'page',
        route: '',
        is_active: true
    });

    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Filter modules
    const filteredModules = useMemo(() => {
        return modules.filter(module => {
            const matchesSearch = !debouncedSearch ||
                module.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                module.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                module.description?.toLowerCase().includes(debouncedSearch.toLowerCase());

            const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && module.is_active) ||
                (statusFilter === 'inactive' && !module.is_active);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [modules, debouncedSearch, categoryFilter, statusFilter]);

    // Stats cards data
    const statsData = useMemo(() => [
        {
            title: 'Total Modules',
            value: statistics.total_modules || 0,
            icon: <CubeIcon className="w-6 h-6" />,
            color: 'primary',
            description: 'Top-level modules'
        },
        {
            title: 'Sub-Modules',
            value: statistics.total_sub_modules || 0,
            icon: <FolderIcon className="w-6 h-6" />,
            color: 'secondary',
            description: 'Functional areas'
        },
        {
            title: 'Components',
            value: statistics.total_components || 0,
            icon: <DocumentIcon className="w-6 h-6" />,
            color: 'success',
            description: 'UI components'
        },
        {
            title: 'Permission Rules',
            value: statistics.total_permission_requirements || 0,
            icon: <ShieldCheckIcon className="w-6 h-6" />,
            color: 'warning',
            description: 'Access requirements'
        }
    ], [statistics]);

    // Toggle module expansion
    const toggleModuleExpand = (moduleId) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    // Toggle sub-module expansion
    const toggleSubModuleExpand = (subModuleId) => {
        setExpandedSubModules(prev => {
            const next = new Set(prev);
            if (next.has(subModuleId)) {
                next.delete(subModuleId);
            } else {
                next.add(subModuleId);
            }
            return next;
        });
    };

    // Refresh data
    const refreshData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(getRoute('modules.api.index'));
            setModules(response.data.modules || []);
            setStatistics(response.data.statistics || {});
            showToast.success('Data refreshed successfully');
        } catch (error) {
            showToast.error('Failed to refresh data');
            console.error('Refresh error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // =========================================================================
    // Role Access Management Functions
    // =========================================================================

    // Load role access when role is selected
    const loadRoleAccess = async (roleId) => {
        if (!roleId) {
            setRoleAccess({ modules: [], sub_modules: [], components: [], actions: [] });
            return;
        }

        setRoleAccessLoading(true);
        try {
            const response = await axios.get(`${getModulesApiBase()}/role-access/${roleId}`);
            setRoleAccess(response.data.access || { modules: [], sub_modules: [], components: [], actions: [] });
        } catch (error) {
            console.error('Failed to load role access:', error);
            showToast.error('Failed to load role access');
            setRoleAccess({ modules: [], sub_modules: [], components: [], actions: [] });
        } finally {
            setRoleAccessLoading(false);
        }
    };

    // Handle role selection change
    const handleRoleChange = (keys) => {
        const roleId = Array.from(keys)[0];
        setSelectedRoleId(roleId ? parseInt(roleId) : null);
        if (roleId) {
            loadRoleAccess(parseInt(roleId));
        } else {
            setRoleAccess({ modules: [], sub_modules: [], components: [], actions: [] });
        }
    };

    // Check if an item is checked (considering inheritance)
    const isModuleChecked = (moduleId) => roleAccess.modules.includes(moduleId);
    const isSubModuleChecked = (subModuleId, moduleId) => {
        // Checked if parent module is checked OR explicitly checked
        return roleAccess.modules.includes(moduleId) || roleAccess.sub_modules.includes(subModuleId);
    };
    const isComponentChecked = (componentId, subModuleId, moduleId) => {
        // Checked if any ancestor is checked OR explicitly checked
        return roleAccess.modules.includes(moduleId) || 
               roleAccess.sub_modules.includes(subModuleId) || 
               roleAccess.components.includes(componentId);
    };
    const isActionChecked = (actionId, componentId, subModuleId, moduleId) => {
        return roleAccess.modules.includes(moduleId) || 
               roleAccess.sub_modules.includes(subModuleId) || 
               roleAccess.components.includes(componentId) ||
               roleAccess.actions.some(a => a.id === actionId || a === actionId);
    };

    // Check if an item is indeterminate (some children checked, not all)
    const isModuleIndeterminate = (module) => {
        if (roleAccess.modules.includes(module.id)) return false;
        // Check if any sub-module, component, or action is checked
        const hasAnyChecked = module.sub_modules?.some(sm => 
            roleAccess.sub_modules.includes(sm.id) ||
            sm.components?.some(c => 
                roleAccess.components.includes(c.id) ||
                c.actions?.some(a => roleAccess.actions.some(ra => ra.id === a.id || ra === a.id))
            )
        );
        return hasAnyChecked;
    };

    // Toggle module access (and all children)
    const toggleModuleAccess = (moduleId, checked) => {
        setRoleAccess(prev => {
            const newAccess = { ...prev };
            if (checked) {
                // Add module (grants access to all children via inheritance)
                if (!newAccess.modules.includes(moduleId)) {
                    newAccess.modules = [...newAccess.modules, moduleId];
                }
                // Remove any explicit sub-module/component/action entries for this module (now inherited)
                const module = modules.find(m => m.id === moduleId);
                if (module) {
                    const subModuleIds = module.sub_modules?.map(sm => sm.id) || [];
                    const componentIds = module.sub_modules?.flatMap(sm => sm.components?.map(c => c.id) || []) || [];
                    const actionIds = module.sub_modules?.flatMap(sm => 
                        sm.components?.flatMap(c => c.actions?.map(a => a.id) || []) || []
                    ) || [];
                    
                    newAccess.sub_modules = newAccess.sub_modules.filter(id => !subModuleIds.includes(id));
                    newAccess.components = newAccess.components.filter(id => !componentIds.includes(id));
                    newAccess.actions = newAccess.actions.filter(a => !actionIds.includes(a.id || a));
                }
            } else {
                // Remove module
                newAccess.modules = newAccess.modules.filter(id => id !== moduleId);
            }
            return newAccess;
        });
    };

    // Toggle sub-module access
    const toggleSubModuleAccess = (subModuleId, moduleId, checked) => {
        setRoleAccess(prev => {
            const newAccess = { ...prev };
            
            // If parent module is checked, we can't directly toggle sub-module
            // Instead, we need to uncheck parent and check all other siblings
            if (prev.modules.includes(moduleId)) {
                if (!checked) {
                    // Uncheck parent module
                    newAccess.modules = newAccess.modules.filter(id => id !== moduleId);
                    // Check all sibling sub-modules except this one
                    const module = modules.find(m => m.id === moduleId);
                    if (module) {
                        const siblingIds = module.sub_modules?.filter(sm => sm.id !== subModuleId).map(sm => sm.id) || [];
                        newAccess.sub_modules = [...new Set([...newAccess.sub_modules, ...siblingIds])];
                    }
                }
                return newAccess;
            }
            
            if (checked) {
                if (!newAccess.sub_modules.includes(subModuleId)) {
                    newAccess.sub_modules = [...newAccess.sub_modules, subModuleId];
                }
                // Remove child entries (now inherited)
                const module = modules.find(m => m.id === moduleId);
                const subModule = module?.sub_modules?.find(sm => sm.id === subModuleId);
                if (subModule) {
                    const componentIds = subModule.components?.map(c => c.id) || [];
                    const actionIds = subModule.components?.flatMap(c => c.actions?.map(a => a.id) || []) || [];
                    newAccess.components = newAccess.components.filter(id => !componentIds.includes(id));
                    newAccess.actions = newAccess.actions.filter(a => !actionIds.includes(a.id || a));
                }
            } else {
                newAccess.sub_modules = newAccess.sub_modules.filter(id => id !== subModuleId);
            }
            return newAccess;
        });
    };

    // Toggle component access
    const toggleComponentAccess = (componentId, subModuleId, moduleId, checked) => {
        setRoleAccess(prev => {
            const newAccess = { ...prev };
            
            // If parent is checked, handle inheritance
            if (prev.modules.includes(moduleId) || prev.sub_modules.includes(subModuleId)) {
                if (!checked) {
                    // Need to uncheck parent and check siblings
                    if (prev.sub_modules.includes(subModuleId)) {
                        newAccess.sub_modules = newAccess.sub_modules.filter(id => id !== subModuleId);
                        const module = modules.find(m => m.id === moduleId);
                        const subModule = module?.sub_modules?.find(sm => sm.id === subModuleId);
                        const siblingIds = subModule?.components?.filter(c => c.id !== componentId).map(c => c.id) || [];
                        newAccess.components = [...new Set([...newAccess.components, ...siblingIds])];
                    }
                }
                return newAccess;
            }
            
            if (checked) {
                if (!newAccess.components.includes(componentId)) {
                    newAccess.components = [...newAccess.components, componentId];
                }
            } else {
                newAccess.components = newAccess.components.filter(id => id !== componentId);
            }
            return newAccess;
        });
    };

    // Toggle action access
    const toggleActionAccess = (actionId, componentId, subModuleId, moduleId, checked, scope = 'all') => {
        setRoleAccess(prev => {
            const newAccess = { ...prev };
            
            // If any parent is checked, can't directly toggle - handled by UI disabling
            if (prev.modules.includes(moduleId) || 
                prev.sub_modules.includes(subModuleId) || 
                prev.components.includes(componentId)) {
                return newAccess;
            }
            
            if (checked) {
                const existingIndex = newAccess.actions.findIndex(a => a.id === actionId || a === actionId);
                if (existingIndex === -1) {
                    newAccess.actions = [...newAccess.actions, { id: actionId, scope }];
                }
            } else {
                newAccess.actions = newAccess.actions.filter(a => (a.id || a) !== actionId);
            }
            return newAccess;
        });
    };

    // Save role access
    const saveRoleAccess = async () => {
        if (!selectedRoleId) {
            showToast.error('Please select a role first');
            return;
        }

        const selectedRole = roles.find(r => r.id === selectedRoleId);
        if (selectedRole?.is_protected) {
            showToast.error('Cannot modify access for protected roles');
            return;
        }

        setRoleAccessSaving(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(`${getModulesApiBase()}/role-access/${selectedRoleId}/sync`, roleAccess);
                if (response.data.access) {
                    setRoleAccess(response.data.access);
                }
                resolve([response.data.message || 'Role access updated successfully']);
            } catch (error) {
                console.error('Failed to save role access:', error);
                reject(error.response?.data?.error || 'Failed to save role access');
            } finally {
                setRoleAccessSaving(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving role access...',
            success: (data) => data.join(', '),
            error: (err) => err
        });
    };

    // =========================================================================
    // End Role Access Management Functions
    // =========================================================================

    // Open module modal for create/edit
    const openModuleModal = (module = null) => {
        if (module) {
            setEditingModule(module);
            setModuleForm({
                code: module.code,
                name: module.name,
                description: module.description || '',
                icon: module.icon || '',
                category: module.category || 'core_system',
                route_prefix: module.route_prefix || '',
                is_active: module.is_active,
                priority: module.priority || 100
            });
        } else {
            setEditingModule(null);
            setModuleForm({
                code: '',
                name: '',
                description: '',
                icon: '',
                category: 'core_system',
                route_prefix: '',
                is_active: true,
                priority: 100
            });
        }
        setModuleModalOpen(true);
    };

    // Open sub-module modal
    const openSubModuleModal = (moduleId, subModule = null) => {
        setParentModuleId(moduleId);
        if (subModule) {
            setEditingSubModule(subModule);
            setSubModuleForm({
                code: subModule.code,
                name: subModule.name,
                description: subModule.description || '',
                icon: subModule.icon || '',
                route: subModule.route || '',
                is_active: subModule.is_active,
                priority: subModule.priority || 100
            });
        } else {
            setEditingSubModule(null);
            setSubModuleForm({
                code: '',
                name: '',
                description: '',
                icon: '',
                route: '',
                is_active: true,
                priority: 100
            });
        }
        setSubModuleModalOpen(true);
    };

    // Open component modal
    const openComponentModal = (subModuleId, component = null) => {
        setParentSubModuleId(subModuleId);
        if (component) {
            setEditingComponent(component);
            setComponentForm({
                code: component.code,
                name: component.name,
                description: component.description || '',
                type: component.type || 'page',
                route: component.route || '',
                is_active: component.is_active
            });
        } else {
            setEditingComponent(null);
            setComponentForm({
                code: '',
                name: '',
                description: '',
                type: 'page',
                route: '',
                is_active: true
            });
        }
        setComponentModalOpen(true);
    };

    // Open permission modal
    const openPermissionModal = (target) => {
        setPermissionTarget(target);
        // Get current permissions for this target - handle both snake_case and camelCase
        const requirements = target.permission_requirements || target.permissionRequirements || [];
        // Ensure permission IDs are numbers for consistent comparison
        const currentPermissions = requirements.map(pr => Number(pr.permission_id));

        setSelectedPermissions(currentPermissions);
        setPermissionModalOpen(true);
    };

    // Save module
    const saveModule = async () => {
        if (!canManageStructure) {
            showToast.error('Module structure can only be managed from platform admin');
            return;
        }
        setIsLoading(true);
        try {
            if (editingModule) {
                await axios.put(getRoute('modules.update', editingModule.id), moduleForm);
                showToast.success('Module updated successfully');
            } else {
                await axios.post(getRoute('modules.store'), moduleForm);
                showToast.success('Module created successfully');
            }
            setModuleModalOpen(false);
            refreshData();
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to save module');
        } finally {
            setIsLoading(false);
        }
    };

    // Save sub-module
    const saveSubModule = async () => {
        if (!canManageStructure) {
            showToast.error('Module structure can only be managed from platform admin');
            return;
        }
        setIsLoading(true);
        try {
            if (editingSubModule) {
                await axios.put(getRoute('modules.sub-modules.update', editingSubModule.id), subModuleForm);
                showToast.success('Sub-module updated successfully');
            } else {
                await axios.post(getRoute('modules.sub-modules.store', parentModuleId), subModuleForm);
                showToast.success('Sub-module created successfully');
            }
            setSubModuleModalOpen(false);
            refreshData();
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to save sub-module');
        } finally {
            setIsLoading(false);
        }
    };

    // Save component
    const saveComponent = async () => {
        if (!canManageStructure) {
            showToast.error('Module structure can only be managed from platform admin');
            return;
        }
        setIsLoading(true);
        try {
            if (editingComponent) {
                await axios.put(getRoute('modules.components.update', editingComponent.id), componentForm);
                showToast.success('Component updated successfully');
            } else {
                await axios.post(getRoute('modules.components.store', parentSubModuleId), componentForm);
                showToast.success('Component created successfully');
            }
            setComponentModalOpen(false);
            refreshData();
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to save component');
        } finally {
            setIsLoading(false);
        }
    };

    // Save permissions (tenant context only - permission requirements are per-tenant)
    const savePermissions = async () => {
        if (isPlatformContext) {
            showToast.error('Permission requirements are managed per-tenant. Switch to a tenant context.');
            return;
        }
        setIsLoading(true);
        try {
            let endpoint;
            if (permissionTarget.type === 'module') {
                endpoint = getRoute('modules.sync-permissions', permissionTarget.id);
            } else if (permissionTarget.type === 'sub_module') {
                endpoint = getRoute('modules.sub-modules.sync-permissions', permissionTarget.id);
            } else {
                endpoint = getRoute('modules.components.sync-permissions', permissionTarget.id);
            }

            // Convert selected permission IDs to the expected format
            // The backend expects: { permissions: [{ permission: 'name', type: 'required', group: null }] }
            const permissionsPayload = selectedPermissions.map(permissionId => {
                const permission = allPermissions.find(p => p.id === permissionId);
                return {
                    permission: permission?.name || '',
                    type: 'required', // Default to 'required' type
                    group: null
                };
            }).filter(p => p.permission); // Filter out any without valid permission names

        
            
            const response = await axios.post(endpoint, { permissions: permissionsPayload });
      
            
            showToast.success('Permissions updated successfully');
            setPermissionModalOpen(false);
            refreshData();
        } catch (error) {
            console.error('Error saving permissions:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.errors 
                ? Object.values(error.response.data.errors).flat().join(', ')
                : error.response?.data?.message || 'Failed to save permissions';
            showToast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Delete item (platform admin only for structure)
    const confirmDelete = (item, type) => {
        if (!canManageStructure) {
            showToast.error('Module structure can only be managed from platform admin');
            return;
        }
        setItemToDelete({ ...item, type });
        setDeleteConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        if (!canManageStructure) {
            showToast.error('Module structure can only be managed from platform admin');
            return;
        }

        setIsLoading(true);
        try {
            let endpoint;
            if (itemToDelete.type === 'module') {
                endpoint = getRoute('modules.destroy', itemToDelete.id);
            } else if (itemToDelete.type === 'sub_module') {
                endpoint = getRoute('modules.sub-modules.destroy', itemToDelete.id);
            } else {
                endpoint = getRoute('modules.components.destroy', itemToDelete.id);
            }

            await axios.delete(endpoint);
            showToast.success(`${itemToDelete.type.replace('_', ' ')} deleted successfully`);
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
            refreshData();
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to delete');
        } finally {
            setIsLoading(false);
        }
    };

    // Render module tree item
    const renderModuleItem = (module) => {
        const isExpanded = expandedModules.has(module.id);
        const subModules = module.sub_modules || [];
        const permissionCount = module.permission_requirements?.length || 0;
        const isProtectedRole = selectedRoleId && roles.find(r => r.id === selectedRoleId)?.is_protected;

        return (
            <Card key={module.id} className="mb-3">
                <CardBody className="p-0">
                    {/* Module Header */}
                    <div
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-default-100 transition-colors ${!module.is_active ? 'opacity-60' : ''}`}
                        onClick={() => toggleModuleExpand(module.id)}
                    >
                        <div className="flex items-center gap-3 flex-1">
                            {/* Role Access Checkbox */}
                            {selectedRoleId && (
                                <Checkbox
                                    isSelected={isModuleChecked(module.id) || isProtectedRole}
                                    isIndeterminate={!isModuleChecked(module.id) && isModuleIndeterminate(module)}
                                    isDisabled={isProtectedRole}
                                    onValueChange={(checked) => toggleModuleAccess(module.id, checked)}
                                    onClick={(e) => e.stopPropagation()}
                                    color="primary"
                                    size="lg"
                                />
                            )}
                            
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleModuleExpand(module.id);
                                }}
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4" />
                                )}
                            </Button>

                            <CubeIcon className="w-6 h-6 text-primary" />

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{module.name}</span>
                                    <Chip size="sm" variant="flat" color={categoryColors[module.category] || 'default'}>
                                        {module.code}
                                    </Chip>
                                    {!module.is_active && (
                                        <Chip size="sm" variant="flat" color="danger">Inactive</Chip>
                                    )}
                                </div>
                                <p className="text-sm text-default-500 mt-1">{module.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge content={subModules.length} color="primary" size="sm">
                                <Chip size="sm" variant="bordered">Sub-modules</Chip>
                            </Badge>
                            <Badge content={permissionCount} color="warning" size="sm">
                                <Chip size="sm" variant="bordered">Permissions</Chip>
                            </Badge>

                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly size="sm" variant="light" onClick={(e) => e.stopPropagation()}>
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                    {/* Permission management - available in both contexts */}
                                    <DropdownItem
                                        key="permissions"
                                        startContent={<KeyIcon className="w-4 h-4" />}
                                        onClick={() => openPermissionModal({ ...module, type: 'module' })}
                                    >
                                        {isPlatformContext ? 'View Required Permissions' : 'Manage Permissions'}
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>

                    {/* Sub-modules */}
                    <AnimatePresence>
                        {isExpanded && subModules.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-default-200"
                            >
                                <div className="pl-8 py-2">
                                    {subModules.map(subModule => renderSubModuleItem(subModule, module.id))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardBody>
            </Card>
        );
    };

    // Render sub-module item
    const renderSubModuleItem = (subModule, moduleId) => {
        const isExpanded = expandedSubModules.has(subModule.id);
        const components = subModule.components || [];
        const permissionCount = subModule.permission_requirements?.length || 0;
        const isProtectedRole = selectedRoleId && roles.find(r => r.id === selectedRoleId)?.is_protected;
        const parentModuleChecked = roleAccess.modules.includes(moduleId);

        return (
            <div key={subModule.id} className="mb-2">
                <div
                    className={`flex items-center justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 cursor-pointer transition-colors ${!subModule.is_active ? 'opacity-60' : ''}`}
                    onClick={() => toggleSubModuleExpand(subModule.id)}
                >
                    <div className="flex items-center gap-3 flex-1">
                        {/* Role Access Checkbox */}
                        {selectedRoleId && (
                            <Checkbox
                                isSelected={isSubModuleChecked(subModule.id, moduleId) || isProtectedRole}
                                isDisabled={isProtectedRole || parentModuleChecked}
                                onValueChange={(checked) => toggleSubModuleAccess(subModule.id, moduleId, checked)}
                                onClick={(e) => e.stopPropagation()}
                                color="secondary"
                                size="md"
                            />
                        )}
                        
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSubModuleExpand(subModule.id);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4" />
                            )}
                        </Button>

                        <FolderIcon className="w-5 h-5 text-secondary" />

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{subModule.name}</span>
                                <Chip size="sm" variant="flat" color="secondary">{subModule.code}</Chip>
                                {!subModule.is_active && (
                                    <Chip size="sm" variant="flat" color="danger">Inactive</Chip>
                                )}
                            </div>
                            {subModule.description && (
                                <p className="text-xs text-default-400 mt-0.5">{subModule.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge content={components.length} color="success" size="sm">
                            <Chip size="sm" variant="bordered">Components</Chip>
                        </Badge>

                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light" onClick={(e) => e.stopPropagation()}>
                                    <EllipsisVerticalIcon className="w-4 h-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                {/* Permission management - available in both contexts */}
                                <DropdownItem
                                    key="permissions"
                                    startContent={<KeyIcon className="w-4 h-4" />}
                                    onClick={() => openPermissionModal({ ...subModule, type: 'sub_module' })}
                                >
                                    {isPlatformContext ? 'View Required Permissions' : 'Manage Permissions'}
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

                {/* Components */}
                <AnimatePresence>
                    {isExpanded && components.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-10 mt-2"
                        >
                            {components.map(component => renderComponentItem(component, subModule.id, moduleId))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Render component item
    const renderComponentItem = (component, subModuleId, moduleId) => {
        const permissionCount = component.permission_requirements?.length || 0;
        const actions = component.actions || [];
        const isProtectedRole = selectedRoleId && roles.find(r => r.id === selectedRoleId)?.is_protected;
        const parentChecked = roleAccess.modules.includes(moduleId) || roleAccess.sub_modules.includes(subModuleId);

        return (
            <div
                key={component.id}
                className="mb-2"
            >
                <div
                    className={`flex items-center justify-between p-2 rounded-md bg-default-100 hover:bg-default-200 transition-colors ${!component.is_active ? 'opacity-60' : ''}`}
                >
                    <div className="flex items-center gap-3 flex-1">
                        {/* Role Access Checkbox */}
                        {selectedRoleId && (
                            <Checkbox
                                isSelected={isComponentChecked(component.id, subModuleId, moduleId) || isProtectedRole}
                                isDisabled={isProtectedRole || parentChecked}
                                onValueChange={(checked) => toggleComponentAccess(component.id, subModuleId, moduleId, checked)}
                                color="success"
                                size="sm"
                            />
                        )}
                        
                        <Tooltip content={component.type}>
                            <span className={`text-${componentTypeColors[component.type]}`}>
                                {componentTypeIcons[component.type]}
                            </span>
                        </Tooltip>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{component.name}</span>
                                <Chip size="sm" variant="flat" color={componentTypeColors[component.type]}>
                                    {component.type}
                                </Chip>
                                {component.route && (
                                    <Chip size="sm" variant="bordered" color="default">
                                        {component.route}
                                    </Chip>
                                )}
                                {actions.length > 0 && (
                                    <Chip size="sm" variant="flat" color="secondary">
                                        {actions.length} actions
                                    </Chip>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {permissionCount > 0 && (
                            <Chip size="sm" variant="flat" color="warning">{permissionCount} perms</Chip>
                        )}

                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="w-4 h-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                {/* Permission management - available in both contexts */}
                                <DropdownItem
                                    key="permissions"
                                    startContent={<KeyIcon className="w-4 h-4" />}
                                    onClick={() => openPermissionModal({ ...component, type: 'component' })}
                                >
                                    {isPlatformContext ? 'View Required Permissions' : 'Manage Permissions'}
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

                {/* Actions list */}
                {actions.length > 0 && (
                    <div className="ml-8 mt-1 space-y-1">
                        {actions.map((action, idx) => {
                            const actionParentChecked = roleAccess.modules.includes(moduleId) || 
                                                        roleAccess.sub_modules.includes(subModuleId) || 
                                                        roleAccess.components.includes(component.id);
                            return (
                                <div
                                    key={action.code || idx}
                                    className="flex items-center justify-between p-1.5 pl-3 rounded bg-default-50 hover:bg-default-100 transition-colors text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        {/* Role Access Checkbox for Action */}
                                        {selectedRoleId && (
                                            <Checkbox
                                                isSelected={isActionChecked(action.id, component.id, subModuleId, moduleId) || isProtectedRole}
                                                isDisabled={isProtectedRole || actionParentChecked}
                                                onValueChange={(checked) => toggleActionAccess(action.id, component.id, subModuleId, moduleId, checked)}
                                                color="warning"
                                                size="sm"
                                            />
                                        )}
                                        <CommandLineIcon className="w-3 h-3 text-default-400" />
                                        <span className="text-default-700">{action.name}</span>
                                        <Chip size="sm" variant="dot" color="secondary" className="text-xs">
                                            {action.code}
                                        </Chip>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {action.default_required_permissions?.length > 0 && (
                                            <Tooltip 
                                                content={
                                                    <div className="text-xs">
                                                        <div className="font-semibold mb-1">Required Permissions:</div>
                                                        {action.default_required_permissions.map((p, i) => (
                                                            <div key={i}>• {p}</div>
                                                        ))}
                                                    </div>
                                                }
                                            >
                                                <Chip size="sm" variant="flat" color="warning" className="text-xs">
                                                    {action.default_required_permissions.length} perms
                                                </Chip>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // Helper to get theme radius
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

    // Responsive screen checks
    const [isMobile, setIsMobile] = React.useState(false);
    const [isTablet, setIsTablet] = React.useState(false);
    const [isLargeScreen, setIsLargeScreen] = React.useState(false);
    
    React.useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
            setIsLargeScreen(window.innerWidth >= 1025);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <>
            <Head title={title} />

            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Module Permission Registry"
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
                                    <div className={`${isLargeScreen ? 'p-6' : isTablet ? 'p-4' : isMobile ? 'p-3' : 'p-4'} w-full`}>
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${isLargeScreen ? 'p-3' : isMobile ? 'p-2' : 'p-2.5'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <Square3Stack3DIcon 
                                                            className={`
                                                                ${isLargeScreen ? 'w-8 h-8' : isMobile ? 'w-5 h-5' : 'w-6 h-6'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${isLargeScreen ? 'text-2xl' : isMobile ? 'text-lg' : 'text-xl'}
                                                                font-bold text-foreground
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            {isPlatformContext ? 'Platform Module Management' : 'Module Permission Management'}
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                                                text-default-500
                                                                ${isMobile ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            {isPlatformContext 
                                                                ? 'Manage module structure, sub-modules, and components' 
                                                                : 'Manage module permissions and access control hierarchy'}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        className="font-medium"
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-default) 15%, transparent)`,
                                                            color: `var(--theme-foreground)`,
                                                            borderRadius: getThemeRadius(),
                                                            border: `1px solid color-mix(in srgb, var(--theme-default) 30%, transparent)`,
                                                        }}
                                                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                                                        onPress={refreshData}
                                                        isLoading={isLoading}
                                                    >
                                                        Refresh
                                                    </Button>
                                                    {canManageStructure && (
                                                        <Button
                                                            className="text-white font-medium"
                                                            style={{
                                                                background: `linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 80%, var(--theme-secondary)))`,
                                                                borderRadius: getThemeRadius(),
                                                            }}
                                                            startContent={<PlusIcon className="w-4 h-4" />}
                                                            onPress={() => openModuleModal()}
                                                        >
                                                            {isMobile ? "Add" : "Add Module"}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* Stats Cards */}
                                    <StatsCards stats={[
                                        {
                                            title: 'Total Modules',
                                            value: statistics.total_modules || 0,
                                            icon: <CubeIcon className="w-6 h-6" />,
                                            color: 'text-blue-500',
                                            iconBg: 'bg-blue-500/20',
                                            description: 'Top-level modules'
                                        },
                                        {
                                            title: 'Sub-Modules',
                                            value: statistics.total_sub_modules || 0,
                                            icon: <FolderIcon className="w-6 h-6" />,
                                            color: 'text-purple-500',
                                            iconBg: 'bg-purple-500/20',
                                            description: 'Functional areas'
                                        },
                                        {
                                            title: 'Components',
                                            value: statistics.total_components || 0,
                                            icon: <DocumentIcon className="w-6 h-6" />,
                                            color: 'text-green-500',
                                            iconBg: 'bg-green-500/20',
                                            description: 'UI components'
                                        },
                                        {
                                            title: 'Permission Rules',
                                            value: statistics.total_permission_requirements || 0,
                                            icon: <ShieldCheckIcon className="w-6 h-6" />,
                                            color: 'text-orange-500',
                                            iconBg: 'bg-orange-500/20',
                                            description: 'Access requirements'
                                        }
                                    ]} className="mb-6" />

                                    {/* Filters */}
                                    <div 
                                        className="mb-6 p-4"
                                        style={{
                                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                                            borderRadius: getThemeRadius(),
                                            backdropFilter: 'blur(16px)',
                                        }}
                                    >
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Input
                                                placeholder="Search modules..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                className="flex-1"
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    inputWrapper: "bg-white/50 dark:bg-default-50/10 backdrop-blur-md border-default-200/30",
                                                    input: "text-foreground placeholder:text-default-400",
                                                }}
                                            />
                                            <Select
                                                label="Category"
                                                selectedKeys={[categoryFilter]}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                                className="w-full sm:w-48"
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    trigger: "bg-white/50 dark:bg-default-50/10 backdrop-blur-md border-default-200/30",
                                                    value: "text-foreground",
                                                }}
                                            >
                                                <SelectItem key="all" value="all">All Categories</SelectItem>
                                                {Object.entries(categories).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </Select>
                                            <Select
                                                label="Status"
                                                selectedKeys={[statusFilter]}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full sm:w-36"
                                                variant="bordered"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    trigger: "bg-white/50 dark:bg-default-50/10 backdrop-blur-md border-default-200/30",
                                                    value: "text-foreground",
                                                }}
                                            >
                                                <SelectItem key="all" value="all">All</SelectItem>
                                                <SelectItem key="active" value="active">Active</SelectItem>
                                                <SelectItem key="inactive" value="inactive">Inactive</SelectItem>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Combined Role Access & Module Hierarchy Card */}
                                    <Card 
                                        className="transition-all duration-200"
                                        style={{
                                            border: `var(--borderWidth, 2px) solid transparent`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                            background: `linear-gradient(135deg, 
                                                var(--theme-content1, #FAFAFA) 20%, 
                                                var(--theme-content2, #F4F4F5) 10%, 
                                                var(--theme-content3, #F1F3F4) 20%)`,
                                        }}
                                    >
                                        <CardHeader 
                                            className="flex justify-between items-center border-b pb-2"
                                            style={{
                                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="p-2 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    }}
                                                >
                                                    <CubeIcon 
                                                        className="w-6 h-6" 
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h3 
                                                        className="text-lg font-semibold text-foreground"
                                                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                                    >
                                                        Module Access Management
                                                    </h3>
                                                    <p className="text-xs text-default-500">
                                                        {filteredModules.length} modules available
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Select
                                                    label="Select Role"
                                                    placeholder="Choose a role"
                                                    selectedKeys={selectedRoleId ? [String(selectedRoleId)] : []}
                                                    onSelectionChange={handleRoleChange}
                                                    className="w-56"
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    isLoading={roleAccessLoading}
                                                    classNames={{
                                                        trigger: "bg-white/50 dark:bg-default-50/10 backdrop-blur-md border-default-200/30",
                                                        value: "text-foreground",
                                                    }}
                                                >
                                                    {roles.map(role => (
                                                        <SelectItem 
                                                            key={String(role.id)} 
                                                            value={String(role.id)}
                                                            description={role.is_protected ? 'Full access (protected)' : null}
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                                {selectedRoleId && !roles.find(r => r.id === selectedRoleId)?.is_protected && (
                                                    <Button
                                                        color="primary"
                                                        variant="solid"
                                                        size="sm"
                                                        onPress={saveRoleAccess}
                                                        isLoading={roleAccessSaving}
                                                        style={{
                                                            background: `linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 80%, var(--theme-secondary)))`,
                                                            borderRadius: getThemeRadius(),
                                                        }}
                                                    >
                                                        Save Access
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardBody>
                                            {/* Show tip for non-protected roles with selection */}
                                            {selectedRoleId && !roles.find(r => r.id === selectedRoleId)?.is_protected && (
                                                <div className="mb-4 text-sm text-default-500 flex items-center gap-2">
                                                    <Chip size="sm" color="primary" variant="flat">Tip</Chip>
                                                    <span>Check a parent item (module/sub-module) to grant access to all its children.</span>
                                                </div>
                                            )}
                                            
                                            {/* Show protected role message */}
                                            {selectedRoleId && roles.find(r => r.id === selectedRoleId)?.is_protected ? (
                                                <div className="text-center py-8 text-success">
                                                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-4" />
                                                    <p className="font-semibold">This role has full system access</p>
                                                    <p className="text-sm mt-2 text-default-500">Protected roles automatically have access to all modules</p>
                                                </div>
                                            ) : isLoading ? (
                                                <div className="flex justify-center items-center py-12">
                                                    <Spinner size="lg" />
                                                </div>
                                            ) : filteredModules.length === 0 ? (
                                                <div className="text-center py-12 text-default-500">
                                                    <CubeIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <p>No modules found</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {filteredModules.map(module => renderModuleItem(module))}
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Module Modal */}
            <Modal isOpen={moduleModalOpen} onClose={() => setModuleModalOpen(false)} size="2xl">
                <ModalContent>
                    <ModalHeader>
                        {editingModule ? 'Edit Module' : 'Create New Module'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Code"
                                placeholder="MODULE_CODE"
                                value={moduleForm.code}
                                onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value.toUpperCase() })}
                                isRequired
                            />
                            <Input
                                label="Name"
                                placeholder="Module Name"
                                value={moduleForm.name}
                                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                                isRequired
                            />
                            <Input
                                label="Icon"
                                placeholder="Icon class name"
                                value={moduleForm.icon}
                                onChange={(e) => setModuleForm({ ...moduleForm, icon: e.target.value })}
                                className="col-span-2"
                            />
                            <Input
                                label="Route Prefix"
                                placeholder="/module-route"
                                value={moduleForm.route_prefix}
                                onChange={(e) => setModuleForm({ ...moduleForm, route_prefix: e.target.value })}
                            />
                            <Select
                                label="Category"
                                selectedKeys={[moduleForm.category]}
                                onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })}
                            >
                                {Object.entries(categories).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </Select>
                            <Input
                                label="Priority"
                                type="number"
                                value={moduleForm.priority}
                                onChange={(e) => setModuleForm({ ...moduleForm, priority: parseInt(e.target.value) })}
                            />
                            <div className="flex items-center">
                                <Switch
                                    isSelected={moduleForm.is_active}
                                    onValueChange={(val) => setModuleForm({ ...moduleForm, is_active: val })}
                                >
                                    Active
                                </Switch>
                            </div>
                            <Input
                                label="Description"
                                placeholder="Module description"
                                value={moduleForm.description}
                                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                className="col-span-2"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onClick={() => setModuleModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onClick={saveModule} isLoading={isLoading}>
                            {editingModule ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Sub-Module Modal */}
            <Modal isOpen={subModuleModalOpen} onClose={() => setSubModuleModalOpen(false)} size="xl">
                <ModalContent>
                    <ModalHeader>
                        {editingSubModule ? 'Edit Sub-Module' : 'Create New Sub-Module'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Code"
                                placeholder="SUBMODULE_CODE"
                                value={subModuleForm.code}
                                onChange={(e) => setSubModuleForm({ ...subModuleForm, code: e.target.value.toUpperCase() })}
                                isRequired
                            />
                            <Input
                                label="Name"
                                placeholder="Sub-Module Name"
                                value={subModuleForm.name}
                                onChange={(e) => setSubModuleForm({ ...subModuleForm, name: e.target.value })}
                                isRequired
                            />
                            <Input
                                label="Icon"
                                placeholder="Icon class name"
                                value={subModuleForm.icon}
                                onChange={(e) => setSubModuleForm({ ...subModuleForm, icon: e.target.value })}
                            />
                            <Input
                                label="Route"
                                placeholder="Named route"
                                value={subModuleForm.route}
                                onChange={(e) => setSubModuleForm({ ...subModuleForm, route: e.target.value })}
                            />
                            <Input
                                label="Priority"
                                type="number"
                                value={subModuleForm.priority}
                                onChange={(e) => setSubModuleForm({ ...subModuleForm, priority: parseInt(e.target.value) })}
                            />
                            <div className="flex items-center">
                                <Switch
                                    isSelected={subModuleForm.is_active}
                                    onValueChange={(val) => setSubModuleForm({ ...subModuleForm, is_active: val })}
                                >
                                    Active
                                </Switch>
                            </div>
                            <Input
                                label="Description"
                                placeholder="Sub-module description"
                                value={subModuleForm.description}
                                onChange={(e) => setSubModuleForm({ ...subModuleForm, description: e.target.value })}
                                className="col-span-2"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onClick={() => setSubModuleModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onClick={saveSubModule} isLoading={isLoading}>
                            {editingSubModule ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Component Modal */}
            <Modal isOpen={componentModalOpen} onClose={() => setComponentModalOpen(false)} size="xl">
                <ModalContent>
                    <ModalHeader>
                        {editingComponent ? 'Edit Component' : 'Create New Component'}
                    </ModalHeader>
                    <ModalBody>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Code"
                                placeholder="COMPONENT_CODE"
                                value={componentForm.code}
                                onChange={(e) => setComponentForm({ ...componentForm, code: e.target.value.toUpperCase() })}
                                isRequired
                            />
                            <Input
                                label="Name"
                                placeholder="Component Name"
                                value={componentForm.name}
                                onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                                isRequired
                            />
                            <Select
                                label="Type"
                                selectedKeys={[componentForm.type]}
                                onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                            >
                                {Object.entries(componentTypes).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </Select>
                            <Input
                                label="Route"
                                placeholder="Named route"
                                value={componentForm.route}
                                onChange={(e) => setComponentForm({ ...componentForm, route: e.target.value })}
                            />
                            <div className="flex items-center col-span-2">
                                <Switch
                                    isSelected={componentForm.is_active}
                                    onValueChange={(val) => setComponentForm({ ...componentForm, is_active: val })}
                                >
                                    Active
                                </Switch>
                            </div>
                            <Input
                                label="Description"
                                placeholder="Component description"
                                value={componentForm.description}
                                onChange={(e) => setComponentForm({ ...componentForm, description: e.target.value })}
                                className="col-span-2"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onClick={() => setComponentModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onClick={saveComponent} isLoading={isLoading}>
                            {editingComponent ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Permission Modal */}
            <Modal isOpen={permissionModalOpen} onClose={() => setPermissionModalOpen(false)} size="4xl" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                            <KeyIcon className="w-5 h-5 text-primary" />
                            Manage Permissions - {permissionTarget?.name}
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-500 mb-4">
                            Select the permissions required to access this {permissionTarget?.type?.replace('_', '-')}.
                        </p>
                        
                        {/* Search and quick actions */}
                        <div className="flex items-center justify-between mb-4 gap-4">
                            <Input
                                placeholder="Search permissions..."
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                size="sm"
                                className="max-w-xs"
                                id="permission-search"
                                onValueChange={(value) => {
                                    // Store search value in a data attribute for filtering
                                    document.getElementById('permission-search')?.setAttribute('data-search', value.toLowerCase());
                                    // Trigger re-render by dispatching custom event
                                    document.dispatchEvent(new CustomEvent('permission-search-change'));
                                }}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => setSelectedPermissions(allPermissions.map(p => p.id))}
                                >
                                    Select All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => setSelectedPermissions([])}
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>

                        {/* Grouped permissions */}
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {Object.entries(groupPermissionsByEntity(allPermissions)).map(([entityKey, entityData]) => {
                                const entityPermissionIds = entityData.permissions.map(p => p.id);
                                const selectedInEntity = entityPermissionIds.filter(id => selectedPermissions.includes(id)).length;
                                const allSelected = selectedInEntity === entityPermissionIds.length;
                                const someSelected = selectedInEntity > 0 && selectedInEntity < entityPermissionIds.length;
                                
                                return (
                                    <Card key={entityKey} className="bg-default-50 dark:bg-default-100/10">
                                        <CardHeader className="py-2 px-4">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        isSelected={allSelected}
                                                        isIndeterminate={someSelected}
                                                        onValueChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedPermissions(prev => [...new Set([...prev, ...entityPermissionIds])]);
                                                            } else {
                                                                setSelectedPermissions(prev => prev.filter(id => !entityPermissionIds.includes(id)));
                                                            }
                                                        }}
                                                        size="sm"
                                                    />
                                                    <span className="font-semibold text-foreground">{entityData.name}</span>
                                                </div>
                                                <Chip size="sm" variant="flat" color={allSelected ? "success" : someSelected ? "warning" : "default"}>
                                                    {selectedInEntity}/{entityPermissionIds.length}
                                                </Chip>
                                            </div>
                                        </CardHeader>
                                        <CardBody className="pt-0 pb-3 px-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {entityData.permissions.map(permission => (
                                                    <div
                                                        key={permission.id}
                                                        className={`flex items-start gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                                                            selectedPermissions.includes(permission.id)
                                                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                                                                : 'bg-default-100/50 dark:bg-default-50/10 border-transparent hover:border-default-300'
                                                        }`}
                                                        onClick={() => {
                                                            if (selectedPermissions.includes(permission.id)) {
                                                                setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                                                            } else {
                                                                setSelectedPermissions([...selectedPermissions, permission.id]);
                                                            }
                                                        }}
                                                    >
                                                        <Checkbox
                                                            isSelected={selectedPermissions.includes(permission.id)}
                                                            onValueChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedPermissions([...selectedPermissions, permission.id]);
                                                                } else {
                                                                    setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                                                                }
                                                            }}
                                                            size="sm"
                                                            className="mt-0.5"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {permission.displayName}
                                                            </p>
                                                            <p className="text-xs text-default-400 truncate">
                                                                {permission.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onClick={() => setPermissionModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onClick={savePermissions} isLoading={isLoading}>
                            Save Permissions ({selectedPermissions.length})
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <ModalContent>
                    <ModalHeader className="text-danger">Confirm Delete</ModalHeader>
                    <ModalBody>
                        <p>
                            Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
                        </p>
                        {itemToDelete?.type === 'module' && (
                            <p className="text-sm text-warning mt-2">
                                This will also delete all sub-modules and components within this module.
                            </p>
                        )}
                        {itemToDelete?.type === 'sub_module' && (
                            <p className="text-sm text-warning mt-2">
                                This will also delete all components within this sub-module.
                            </p>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button color="danger" onClick={executeDelete} isLoading={isLoading}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};
ModuleManagement.layout = (page) => <App>{page}</App>;
export default ModuleManagement;
