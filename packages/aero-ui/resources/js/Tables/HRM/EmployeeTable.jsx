import React, {useCallback, useMemo, useRef, useState} from "react";
import {Link} from '@inertiajs/react';
import {showToast} from "@/utils/toastUtils";

import axios from 'axios';

import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    DropdownTrigger,
    Pagination,
    Select,
    SelectItem,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    User
} from "@heroui/react";
import {
    BriefcaseIcon,
    BuildingOfficeIcon,
    ClockIcon,
    EllipsisVerticalIcon,
    EnvelopeIcon,
    HashtagIcon,
    MapIcon,
    MapPinIcon,
    PencilIcon,
    PhoneIcon,
    QrCodeIcon,
    TrashIcon,
    UserIcon,
    WifiIcon,
} from "@heroicons/react/24/outline";
import DeleteEmployeeModal from '@/Components/DeleteEmployeeModal';
import ProfilePictureModal from '@/Components/ProfilePictureModal';
import ProfileAvatar, {getProfileAvatarTokens} from '@/Components/ProfileAvatar';

const EmployeeTable = ({ 
  allUsers, 
  allManagers = [],
  departments, 
  designations, 
  attendanceTypes, 
  setUsers, 
  isMobile, 
  isTablet,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  totalUsers = 0,
  loading = false,
  updateEmployeeOptimized,
  deleteEmployeeOptimized
}) => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceConfig, setAttendanceConfig] = useState({});
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Profile picture modal state
  const [profilePictureModal, setProfilePictureModal] = useState({
    isOpen: false,
    employee: null
  });

  // Helper function to convert theme borderRadius to HeroUI radius values
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

  // Helper to extract base slug (removes _2, _3, etc. suffixes)
  const getBaseSlug = (slug) => {
    if (!slug) return '';
    return slug.replace(/_\d+$/, '');
  };

  // Check if an attendance type has valid configuration data
  const hasValidConfig = (type) => {
    const config = type?.config;
    if (!config) return false;
    
    const baseSlug = getBaseSlug(type.slug);
    
    switch (baseSlug) {
      case 'geo_polygon':
        // Has polygon points or polygons array with points
        return (config.polygon && config.polygon.length >= 3) ||
               (config.polygons && config.polygons.some(p => p.points?.length >= 3));
      case 'wifi_ip':
        // Has IP addresses configured
        return (config.allowed_ips && config.allowed_ips.length > 0) ||
               (config.allowed_ranges && config.allowed_ranges.length > 0) ||
               (config.ip_locations && config.ip_locations.some(l => 
                 (l.allowed_ips?.length > 0) || (l.allowed_ranges?.length > 0)
               ));
      case 'route_waypoint':
        // Has waypoints configured
        return (config.waypoints && config.waypoints.length >= 2) ||
               (config.routes && config.routes.some(r => r.waypoints?.length >= 2));
      case 'qr_code':
        // Has QR codes configured
        return (config.code) ||
               (config.qr_codes && config.qr_codes.length > 0);
      default:
        return false;
    }
  };

  // Category configuration for grouping
  const categoryConfig = {
    'geo_polygon': {
      title: 'Geo Polygon',
      icon: MapPinIcon,
      color: 'warning',
    },
    'wifi_ip': {
      title: 'WiFi/IP',
      icon: WifiIcon,
      color: 'secondary',
    },
    'route_waypoint': {
      title: 'Route Waypoint',
      icon: MapIcon,
      color: 'primary',
    },
    'qr_code': {
      title: 'QR Code',
      icon: QrCodeIcon,
      color: 'success',
    },
  };

  // Group attendance types by category, only including those with valid config
  const groupedAttendanceTypes = useMemo(() => {
    if (!attendanceTypes) return [];

    const grouped = {};
    
    attendanceTypes.forEach(type => {
      if (!type.is_active) return; // Skip inactive types
      if (!hasValidConfig(type)) return; // Skip types without config
      
      const baseSlug = getBaseSlug(type.slug);
      if (!categoryConfig[baseSlug]) return;
      
      if (!grouped[baseSlug]) {
        grouped[baseSlug] = {
          ...categoryConfig[baseSlug],
          slug: baseSlug,
          types: []
        };
      }
      grouped[baseSlug].types.push(type);
    });

    // Convert to array and filter out empty categories
    return Object.values(grouped).filter(cat => cat.types.length > 0);
  }, [attendanceTypes]);

  const handleDepartmentChange = async (userId, departmentId) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('user.updateDepartment', { id: userId }), {
          department: departmentId
        });

        if (response.status === 200) {
          const departmentObj = departments.find(d => d.id === parseInt(departmentId)) || null;
          updateEmployeeOptimized?.(userId, {
            department_id: departmentId,
            department_name: departmentObj?.name || null,
            designation_id: null,
            designation_name: null
          });
          
          resolve('Department updated successfully');
        }
      } catch (error) {
        console.error('Error updating department:', error);
        reject('Failed to update department');
      }
    });

    showToast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Updating department...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🟢',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🔴',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
    });
  };

  const handleDesignationChange = async (userId, designationId) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('user.updateDesignation', { id: userId }), {
          designation_id: designationId
        });

        if (response.status === 200) {
          const designationObj = designations.find(d => d.id === parseInt(designationId)) || null;
          updateEmployeeOptimized?.(userId, {
            designation_id: designationId,
            designation_name: designationObj?.title || null
          });
          
          resolve("Designation updated successfully");
        }
      } catch (err) {
        console.error('Error updating designation:', err);
        reject("Failed to update designation");
      }
    });

    showToast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Updating designation...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🟢',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🔴',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
    });
  };

  // Handle attendance type change
  const handleAttendanceTypeChange = async (userId, attendanceTypeId) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('user.updateAttendanceType', { id: userId }), {
          attendance_type_id: attendanceTypeId
        });
        
        if (response.status === 200) {
          // Get the attendance type object
          const attendanceTypeObj = attendanceTypes.find(t => t.id === parseInt(attendanceTypeId)) || null;
          
          // Update optimistically
          if (updateEmployeeOptimized) {
            updateEmployeeOptimized(userId, { 
              attendance_type_id: attendanceTypeId,
              attendance_type_name: attendanceTypeObj?.name || null
            });
          }
          
          resolve('Attendance type updated successfully');
        }
      } catch (error) {
        console.error('Error updating attendance type:', error);
        reject('Failed to update attendance type');
      }
    });

    showToast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Updating attendance type...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🟢',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🔴',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
    });
  };

  // Delete employee - Enhanced with confirmation modal
  const handleDeleteClick = (user) => {
    setEmployeeToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    setDeleteLoading(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.delete(route('user.delete', { id: employeeToDelete.id }));
        
        if (response.status === 200) {
          // Update optimistically
          if (deleteEmployeeOptimized) {
            deleteEmployeeOptimized(employeeToDelete.id);
          }
          
          // Close modal and reset state
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
          
          resolve('Employee deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        
        // Handle specific error responses
        let errorMessage = 'Failed to delete employee';
        if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to delete this employee';
        } else if (error.response?.status === 404) {
          errorMessage = 'Employee not found or already deleted';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        reject(errorMessage);
      } finally {
        setDeleteLoading(false);
      }
    });

    showToast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Deleting employee...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '✅',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '❌',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: 'var(--theme-content1)',
          border: '1px solid var(--theme-divider)',
          color: 'var(--theme-primary)',
        },
      },
    });
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  // Profile picture modal handlers
  const handleProfilePictureClick = (employee) => {
    setProfilePictureModal({
      isOpen: true,
      employee: employee
    });
  };

  const handleProfilePictureClose = () => {
    setProfilePictureModal({
      isOpen: false,
      employee: null
    });
  };

  const handleImageUpdate = (employeeId, newImageUrl) => {
    // Update the employee's profile image in the local state
    if (updateEmployeeOptimized) {
      updateEmployeeOptimized(employeeId, {
        profile_image_url: newImageUrl
      });
    }
  };

  // Debounce ref for report_to updates
  const reportToDebounceRef = useRef({});

  // Debounced update for report_to field
  const debouncedUpdateReportTo = useCallback((userId, reportToId) => {
    // Clear existing timeout for this user
    if (reportToDebounceRef.current[userId]) {
      clearTimeout(reportToDebounceRef.current[userId]);
    }

    // Set new timeout
    reportToDebounceRef.current[userId] = setTimeout(async () => {
      const promise = axios.post(route('users.updateReportTo', { id: userId }), {
        report_to: reportToId || null,
      });
      
      showToast.promise(promise, {
        loading: 'Updating manager assignment...',
        success: (response) => {
          // Update local state on success
          if (updateEmployeeOptimized) {
            updateEmployeeOptimized(userId, {
              report_to: reportToId || null,
              reports_to: response.data.user?.reports_to || null
            });
          }
          return response.data?.message || 'Manager assigned successfully!';
        },
        error: (err) => err.response?.data?.error || 'Failed to update manager'
      });
    }, 500);
  }, [updateEmployeeOptimized]);

  // Get eligible managers for a user
  // Corporate Reporting Structure Rules:
  // 1. Regular employees: Can ONLY report to higher-level employees in their SAME department
  // 2. Department Heads (highest level in their dept): Can ALSO report to executives from OTHER departments
  //    who have a higher level (e.g., CEO, COO in Executive department)
  // 3. Always include current manager (regardless of level or department) for display purposes
  // 4. Exclude self - can't report to yourself
  const getEligibleManagers = useCallback((user, currentManagerId = null) => {
    if (!allManagers || allManagers.length === 0) return [];
    
    const userDepartmentId = user?.department_id;
    const userHierarchyLevel = user?.designation_hierarchy_level ?? 999;
    
    // Check if user is the highest level in their department (Department Head)
    const sameDeptEmployees = allManagers.filter(m => 
      String(m.department_id) === String(userDepartmentId) && m.id !== user.id
    );
    const isDepartmentHead = !sameDeptEmployees.some(m => 
      (m.designation_hierarchy_level ?? 999) < userHierarchyLevel
    );
    
    return allManagers.filter(potentialManager => {
      // Can't report to yourself
      if (potentialManager.id === user.id) return false;
      
      // Always include current manager (regardless of hierarchy or department)
      if (currentManagerId && potentialManager.id === currentManagerId) {
        return true;
      }
      
      const managerDepartmentId = potentialManager.department_id;
      const managerHierarchyLevel = potentialManager.designation_hierarchy_level ?? 999;
      const isSameDepartment = String(managerDepartmentId) === String(userDepartmentId);
      
      // Must have higher hierarchy (lower number = higher position)
      if (managerHierarchyLevel >= userHierarchyLevel) return false;
      
      // If same department, allow (regular reporting within department)
      if (isSameDepartment) return true;
      
      // If user is Department Head, allow cross-department reporting to higher executives
      if (isDepartmentHead) {
        // Allow reporting to executives from other departments who are higher level
        return true;
      }
      
      // Regular employees can't report cross-department
      return false;
    });
  }, [allManagers]);

  const columns = useMemo(() => {
    const baseColumns = [
      { name: "#", uid: "sl", width: 60 },
      { name: "EMPLOYEE", uid: "employee", width: "auto", minWidth: 200 },
      { name: "DEPARTMENT", uid: "department", width: 180 },
      { name: "DESIGNATION", uid: "designation", width: 180 },
      { name: "REPORT TO", uid: "report_to", width: 200 },
      { name: "ACTIONS", uid: "actions", width: 80 }
    ];

    // Add or remove columns based on screen size
    if (!isMobile) {
      baseColumns.splice(2, 0, { name: "CONTACT", uid: "contact", width: 220 });
    }
    
    if (!isMobile && !isTablet) {
      baseColumns.splice(baseColumns.length - 2, 0, { name: "ATTENDANCE TYPE", uid: "attendance_type", width: 180 });
    }

    // On mobile, remove report_to column
    if (isMobile) {
      const reportToIndex = baseColumns.findIndex(col => col.uid === "report_to");
      if (reportToIndex > -1) {
        baseColumns.splice(reportToIndex, 1);
      }
    }
    
    return baseColumns;
  }, [isMobile, isTablet]);

  // Render cell content based on column type
  const renderCell = (user, columnKey, index) => {
    const cellValue = user[columnKey];
    
    // Calculate serial number based on pagination
    const startIndex = pagination?.currentPage && pagination?.perPage 
      ? Number((pagination.currentPage - 1) * pagination.perPage) 
      : 0;
    // Since index might be undefined, ensure it has a numeric value
    const safeIndex = typeof index === 'number' ? index : 0;
    const serialNumber = startIndex + safeIndex + 1;
      
    switch (columnKey) {
      case "sl":
        return (
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <span className="text-sm font-semibold text-foreground">
                {serialNumber}
              </span>
            </div>
          </div>
        );

      case "employee":
        return (
          <div className="min-w-max">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                src={user?.profile_image_url || user?.profile_image}
                name={user?.name}
                size={isMobile ? "sm" : "md"}
                onClick={() => handleProfilePictureClick(user)}
              />
              <div className="flex flex-col">
                <p className="font-semibold text-foreground text-left whitespace-nowrap">
                  {user?.name}
                </p>
                {!isMobile && (
                  <p className="text-default-500 text-left text-xs whitespace-nowrap">
                    ID: {user?.employee_id || 'N/A'}
                  </p>
                )}
              </div>
            </div>
            {isMobile && (
              <div className="flex flex-col gap-1 text-xs text-default-500 ml-10 mt-2">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <HashtagIcon className="w-3 h-3" />
                  {user?.employee_id || 'N/A'}
                </div>
                <div className="flex items-center gap-1">
                  <EnvelopeIcon className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <PhoneIcon className="w-3 h-3" />
                    {user?.phone}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "contact":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <EnvelopeIcon className="w-4 h-4 text-default-400" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="w-4 h-4 text-default-400" />
                <span className="text-foreground">{user?.phone}</span>
              </div>
            )}
          </div>
        );
        case "department":
          return (
            <div className="flex flex-col gap-2 min-w-[150px]">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="bordered"
                    size="sm"
                    className="justify-between backdrop-blur-md border-white/20 min-w-[150px] bg-white/10 hover:bg-white/15 transition-all duration-300"
                    startContent={<BuildingOfficeIcon className="w-4 h-4" />}
                    endContent={<EllipsisVerticalIcon className="w-4 h-4 rotate-90" />}
                  >
                    <span>
                      {user.department_name || "Select Department"}
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Department options">
                  {departments?.map((dept) => (
                    <DropdownItem
                      key={dept.id.toString()}
                      onPress={() => handleDepartmentChange(user.id, dept.id)}
                    >
                      {dept.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          );

        case "designation":
          const departmentId = user.department_id;
          const filteredDesignations = designations?.filter(d => d.department_id === parseInt(departmentId)) || [];

          return (
            <div className="flex flex-col gap-2 min-w-[150px]">
              <Dropdown isDisabled={!departmentId}>
                <DropdownTrigger>
                  <Button 
                    variant="bordered"
                    size="sm"
                    className={`justify-between backdrop-blur-md border-white/20 min-w-[150px] transition-all duration-300 ${
                      !departmentId
                        ? 'bg-gray-500/20 border-gray-400/40 opacity-50'
                        : 'bg-white/10 hover:bg-white/15'
                    }`}
                    isDisabled={!departmentId}
                    startContent={<BriefcaseIcon className="w-4 h-4" />}
                    endContent={departmentId && <EllipsisVerticalIcon className="w-4 h-4 rotate-90" />}
                  >
                    <span>
                      {!departmentId ? 'Select Department First' :
                       (user.designation_name || "Select Designation")}
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Designation options">
                  {filteredDesignations.map((desig) => (
                    <DropdownItem
                      key={desig.id.toString()}
                      onPress={() => handleDesignationChange(user.id, desig.id)}
                    >
                      {desig.title}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          );

      case "report_to":
        // Get the current manager from reports_to (from backend) - this is always accurate
        const currentReportsTo = user.reports_to;
        const hasCurrentManager = !!currentReportsTo;
        const currentManagerId = user.report_to;
        
        // Get eligible managers (higher hierarchy level, same dept or dept heads)
        // Pass currentManagerId to always include current manager in list
        const eligibleManagers = getEligibleManagers(user, currentManagerId);
        
        // Build the final list of managers for the Select dropdown
        const selectItems = [];
        
        // Add eligible managers (sorted by hierarchy level)
        eligibleManagers
          .sort((a, b) => (a.designation_hierarchy_level ?? 999) - (b.designation_hierarchy_level ?? 999))
          .forEach(manager => {
            selectItems.push({
              id: manager.id,
              name: manager.name,
              profile_image_url: manager.profile_image_url,
              designation_name: manager.designation_name || '',
              description: manager.designation_name || '',
              isCurrent: currentManagerId && manager.id === currentManagerId,
            });
          });
        
        // If current manager exists but wasn't in eligibleManagers, add them
        if (hasCurrentManager && !selectItems.some(m => m.id === currentReportsTo.id)) {
          selectItems.unshift({
            id: currentReportsTo.id,
            name: currentReportsTo.name,
            profile_image_url: currentReportsTo.profile_image_url,
            designation_name: currentReportsTo.designation_name || '',
            description: currentReportsTo.designation_name || 'Current manager',
            isCurrent: true,
          });
        }
        
        // Determine if selected manager is in the list
        const selectedManagerId = currentManagerId;
        const selectedManagerInList = selectedManagerId && selectItems.some(m => m.id === selectedManagerId);
        

        
        return (
          <div className="flex flex-col gap-2 min-w-[180px]">
            <Select
              size="sm"
              variant="bordered"
              placeholder="Select manager"
              isDisabled={selectItems.length === 0}
              selectedKeys={selectedManagerInList ? [String(selectedManagerId)] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];
                const newReportToId = selectedKey ? parseInt(selectedKey, 10) : null;
                if (newReportToId !== user.report_to) {
                  debouncedUpdateReportTo(user.id, newReportToId);
                }
              }}
              classNames={{
                trigger: "min-h-unit-10 h-unit-10 backdrop-blur-md border-white/20 bg-white/10 hover:bg-white/15",
                value: "text-small",
              }}

              renderValue={(items) => {
                if (items.length === 0 || !hasCurrentManager) {
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Select manager</span>
                    </div>
                  );
                }
                return items.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <ProfileAvatar
                      src={currentReportsTo.profile_image_url}
                      size="sm"
                      className="w-6 h-6 flex-shrink-0"
                      name={currentReportsTo.name}
                      showBorder
                    />
                    <span className="text-sm font-medium truncate">{currentReportsTo.name}</span>
                  </div>
                ));
              }}
            >
              {selectItems.length === 0 ? (
                <SelectItem key="no-managers" isDisabled textValue="No eligible managers">
                  <span className="text-default-400">No eligible managers in department</span>
                </SelectItem>
              ) : (
                selectItems.map((manager) => (
                  <SelectItem key={String(manager.id)} textValue={manager.name}>
                    <User
                      name={manager.name}
                      description={manager.description}
                      avatarProps={{
                        src: manager.profile_image_url,
                        size: "sm",
                        name: manager.name,
                        ...getProfileAvatarTokens({
                          name: manager.name,
                          size: 'sm',
                        }),
                      }}
                    />
                  </SelectItem>
                ))
              )}
            </Select>
          </div>
        );

      case "attendance_type":
        const hasConfiguredTypes = groupedAttendanceTypes.length > 0;
        
        return (
          <div className="flex flex-col gap-2 min-w-[180px]">
            <Dropdown isDisabled={!hasConfiguredTypes}>
              <DropdownTrigger>
                <Button 
                  variant="bordered"
                  size="sm"
                  className={`justify-between backdrop-blur-md border-white/20 min-w-[180px] transition-all duration-300 ${
                    !hasConfiguredTypes
                      ? 'bg-gray-500/20 border-gray-400/40 opacity-50'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                  startContent={<ClockIcon className="w-4 h-4" />}
                  endContent={hasConfiguredTypes && <EllipsisVerticalIcon className="w-4 h-4 rotate-90" />}
                >
                  <span className="truncate">
                    {!hasConfiguredTypes 
                      ? 'No Types Configured' 
                      : (user.attendance_type_name || "Select Type")}
                  </span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Attendance Type options"
                className="min-w-[200px]"
              >
                {groupedAttendanceTypes.map((category, categoryIndex) => {
                  const CategoryIcon = category.icon;
                  return (
                    <DropdownSection 
                      key={category.slug}
                      title={category.title}
                      showDivider={categoryIndex < groupedAttendanceTypes.length - 1}
                      classNames={{
                        heading: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-default-500 px-2 py-1"
                      }}
                    >
                      {category.types.map((type) => (
                        <DropdownItem
                          key={type.id.toString()}
                          onPress={() => handleAttendanceTypeChange(user.id, type.id)}
                          startContent={
                            <span className="text-base">{type.icon || '📍'}</span>
                          }
                          description={type.description?.substring(0, 30) || null}
                        >
                          {type.name}
                        </DropdownItem>
                      ))}
                    </DropdownSection>
                  );
                })}
              </DropdownMenu>
            </Dropdown>
          </div>
        );

      case "actions":
        return (
          <div className="relative flex justify-center items-center">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  isIconOnly 
                  variant="light" 
                  className="text-default-400 hover:text-foreground transition-all duration-300"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Employee Actions">
                <DropdownItem 
                  key="edit" 
                  startContent={<PencilIcon className="w-4 h-4" />}
                  href={route('profile', { user: user.id })}
                  as={Link}
                  
                >
                  Edit Profile
                </DropdownItem>
                
                <DropdownItem 
                  key="delete" 
                  className="text-danger"
                  color="danger"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={() => handleDeleteClick(user)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  };

  // Render pagination information and controls
  const renderPagination = () => {
    if (!pagination || loading) return null;
    
    return (
      <div 
        className="flex flex-col sm:flex-row items-center justify-between px-4 py-2"
        style={{
          borderTop: `1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)`,
          background: `color-mix(in srgb, var(--theme-content2) 30%, transparent)`,
          backdropFilter: 'blur(16px)',
        }}
      >
        <span 
          className="text-xs mb-3 sm:mb-0 opacity-70"
          style={{ color: 'var(--theme-foreground)' }}
        >
          Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {
            Math.min(pagination.currentPage * pagination.perPage, pagination.total)
          } of {pagination.total} employees
        </span>
        
        <Pagination
          total={Math.ceil(pagination.total / pagination.perPage)}
          initialPage={pagination.currentPage}
          page={pagination.currentPage}
          onChange={onPageChange}
          size={isMobile ? "sm" : "md"}
          variant="bordered"
          showControls
          style={{
            '--pagination-item-bg': 'color-mix(in srgb, var(--theme-content2) 50%, transparent)',
            '--pagination-item-border': 'color-mix(in srgb, var(--theme-content3) 50%, transparent)',
          }}
        />
      </div>
    );
  };

  return (
    <div 
      className="w-full overflow-hidden flex flex-col relative" 
      style={{ 
        maxHeight: 'calc(100vh - 200px)',
        background: `color-mix(in srgb, var(--theme-content1) 85%, transparent)`,
        backdropFilter: 'blur(16px)',
        border: `1px solid color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
        borderRadius: getThemeRadius(),
      }}
    >
      {/* Global loading overlay */}
      {loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{
            background: 'color-mix(in srgb, var(--theme-content1) 20%, transparent)',
            backdropFilter: 'blur(8px)',
            borderRadius: getThemeRadius(),
          }}
        >
          <div 
            className="flex flex-col items-center gap-4 p-6"
            style={{
              background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
              border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
              borderRadius: getThemeRadius(),
              backdropFilter: 'blur(16px)',
            }}
          >
            <Spinner size="lg" color="primary" />
            <span 
              className="text-sm"
              style={{ color: 'var(--theme-foreground)' }}
            >
              Loading employees...
            </span>
          </div>
        </div>
      )}
      
      <div className="overflow-auto grow">
        <Table
          aria-label="Employees table"
          removeWrapper
          classNames={{
            base: "bg-transparent min-w-[800px]", // Set minimum width to prevent squishing on small screens
            th: "backdrop-blur-md font-medium text-xs sticky top-0 z-10 whitespace-nowrap",
            td: "py-3 whitespace-nowrap",
            table: "border-collapse table-auto",
            thead: "",
            tr: "hover:opacity-80 transition-all duration-200"
          }}
          style={{
            '--table-header-bg': 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
            '--table-row-hover': 'color-mix(in srgb, var(--theme-content2) 30%, transparent)',
            '--table-border': 'color-mix(in srgb, var(--theme-content3) 30%, transparent)',
          }}
          isHeaderSticky
          isCompact={isMobile}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.uid} 
                align={column.uid === "actions" ? "center" : column.uid === "sl" ? "center" : "start"}
                width={column.width}
                minWidth={column.minWidth}
                className={`backdrop-blur-md ${column.uid === "employee" ? "whitespace-nowrap" : ""}`}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-content2) 60%, transparent)',
                  color: 'var(--theme-foreground)',
                  borderBottom: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                }}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody 
            items={allUsers || []} 
            emptyContent={
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserIcon 
                  className="w-12 h-12 mb-4 opacity-40"
                  style={{ color: 'var(--theme-foreground)' }}
                />
                <h6 
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--theme-foreground)' }}
                >
                  No employees found
                </h6>
                <p 
                  className="text-sm opacity-70"
                  style={{ color: 'var(--theme-foreground)' }}
                >
                  Try adjusting your search or filter criteria
                </p>
              </div>
            }
            loadingContent={<Spinner />}
            isLoading={loading}
          >
            {(item, index) => {
              // Find the index of this item in the allUsers array to ensure accurate serial numbers
              const itemIndex = allUsers ? allUsers.findIndex(user => user.id === item.id) : index;
              
              return (
                <TableRow 
                  key={item.id}
                  className="transition-all duration-200"
                  style={{
                    color: 'var(--theme-foreground)',
                    borderBottom: `1px solid color-mix(in srgb, var(--theme-content3) 30%, transparent)`,
                  }}
                >
                  {(columnKey) => (
                    <TableCell className="transition-all duration-300">
                      <div className="transition-all duration-200">
                        {renderCell(item, columnKey, itemIndex)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
      {/* Pagination is moved outside the scrollable area to make it sticky */}
      {renderPagination()}
      
      {/* Delete Employee Confirmation Modal */}
      <DeleteEmployeeModal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        employee={employeeToDelete}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
      
      {/* Profile Picture Update Modal */}
      <ProfilePictureModal
        isOpen={profilePictureModal.isOpen}
        onClose={handleProfilePictureClose}
        employee={profilePictureModal.employee}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
};

export default EmployeeTable;
                
