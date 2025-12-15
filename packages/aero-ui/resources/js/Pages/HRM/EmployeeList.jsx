import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Head, usePage, router } from "@inertiajs/react";
import { motion } from 'framer-motion';
import { 
  Button, 
  Chip, 
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  User,
  Divider,
  Pagination,
  Input,
  Select,
  SelectItem,
  Spinner
} from "@heroui/react";

import { 
  UserPlusIcon, 
  UsersIcon, 
  BuildingOfficeIcon, 
  BriefcaseIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserIcon,
  ClockIcon,
  Squares2X2Icon,
  TableCellsIcon,
  AdjustmentsHorizontalIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  CheckCircleIcon,
  TrophyIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

import App from "@/Layouts/App.jsx";

import StatsCards from "@/Components/StatsCards.jsx";
import EmployeeTable from "@/Tables/HRM/EmployeeTable.jsx";
import ProfileAvatar from "@/Components/ProfileAvatar.jsx";

import axios from 'axios';
import { showToast } from '@/utils/toastUtils';


const EmployeesList = ({ title, departments, designations, attendanceTypes }) => {

  // Custom media query logic - matching AttendanceEmployee
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
  
  // State for employee data with server-side pagination
  const [employees, setEmployees] = useState([]);
  const [allManagers, setAllManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    designation: 'all',
    attendanceType: 'all'
  });
  
  // View mode (table or grid)
  const [viewMode, setViewMode] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0
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

  // Stats - Updated to match comprehensive backend stats structure
  const [stats, setStats] = useState({
    overview: {
      total_employees: 0,
      active_employees: 0,
      inactive_employees: 0,
      total_departments: 0,
      total_designations: 0,
      total_attendance_types: 0
    },
    distribution: {
      by_department: [],
      by_designation: [],
      by_attendance_type: []
    },
    hiring_trends: {
      recent_hires: {
        last_30_days: 0,
        last_90_days: 0,
        last_year: 0
      },
      monthly_growth_rate: 0,
      current_month_hires: 0
    },
    workforce_health: {
      status_ratio: {
        active_percentage: 0,
        inactive_percentage: 0,
        retention_rate: 0
      },
      retention_rate: 0,
      turnover_rate: 0
    },
    quick_metrics: {
      headcount: 0,
      active_ratio: 0,
      department_diversity: 0,
      role_diversity: 0,
      recent_activity: 0
    }
  });

  // Fetch employees with pagination and filters
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(route('employees.paginate'), {
        params: {
          page: pagination.currentPage,
          perPage: pagination.perPage,
          search: filters.search,
          department: filters.department,
          designation: filters.designation,
          attendanceType: filters.attendanceType
        }
      });
      
      setEmployees(data.employees.data);
      setTotalRows(data.employees.total);
      setLastPage(data.employees.last_page);
      setPagination(prev => ({
        ...prev,
        total: data.employees.total
      }));
      
      // Update allManagers for Report To dropdown
      if (data.allManagers) {
        setAllManagers(data.allManagers);
      }
      
      // Update stats if included in response
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast.error('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, filters]);

  // Fetch employee stats separately
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get(route('employees.stats'));
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [fetchEmployees, fetchStats]);

  // Handle filter changes
  const handleSearchChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on search
  }, []);

  const handleDepartmentFilterChange = useCallback((value) => {
    setFilters(prev => ({ 
      ...prev, 
      department: value,
      designation: value !== 'all' ? 'all' : prev.designation // Reset designation when department changes
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleDesignationFilterChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, designation: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleAttendanceTypeFilterChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, attendanceType: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Handle pagination changes
  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleRowsPerPageChange = useCallback((perPage) => {
    setPagination(prev => ({ ...prev, perPage: perPage, currentPage: 1 }));
  }, []);

  // Optimistic updates
  const updateEmployeeOptimized = useCallback((id, updatedFields) => {
    setEmployees(prev => 
      prev.map(employee => 
        employee.id === id ? { ...employee, ...updatedFields } : employee
      )
    );
  }, []);

  const deleteEmployeeOptimized = useCallback((id) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id));
    setTotalRows(prev => prev - 1);
    setPagination(prev => ({
      ...prev,
      total: prev.total - 1
    }));
    fetchStats(); // Refresh stats after deletion
  }, [fetchStats]);



  // Get filtered designations based on selected department
  const filteredDesignations = useMemo(() => {
    if (filters.department === 'all') return designations;
    return designations.filter(d => d.department_id === parseInt(filters.department));
  }, [designations, filters.department]);

  // Prepare comprehensive stats data for StatsCards component
  const statsData = useMemo(() => [
    {
      title: "Total Employees",
      value: stats.overview?.total_employees || 0,
      icon: <UsersIcon />,
      color: "text-blue-400",
      iconBg: "bg-blue-500/20",
      description: "Total Headcount"
    },
    {
      title: "Active Employees", 
      value: stats.overview?.active_employees || 0,
      icon: <CheckCircleIcon />,
      color: "text-green-400",
      iconBg: "bg-green-500/20", 
      description: `${stats.workforce_health?.status_ratio?.active_percentage || 0}% Active`
    },
    {
      title: "Departments",
      value: stats.overview?.total_departments || 0,
      icon: <BuildingOfficeIcon />,
      color: "text-purple-400", 
      iconBg: "bg-purple-500/20",
      description: "Department Diversity"
    },
    {
      title: "Designations",
      value: stats.overview?.total_designations || 0,
      icon: <BriefcaseIcon />,
      color: "text-orange-400",
      iconBg: "bg-orange-500/20",
      description: "Role Diversity"
    },
    {
      title: "Retention Rate",
      value: `${stats.workforce_health?.retention_rate || 0}%`,
      icon: <TrophyIcon />,
      color: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
      description: "Employee Retention"
    },
    {
      title: "Recent Hires",
      value: stats.hiring_trends?.recent_hires?.last_30_days || 0,
      icon: <UserPlusIcon />,
      color: "text-cyan-400",
      iconBg: "bg-cyan-500/20",
      description: "Last 30 Days"
    },
    {
      title: "Growth Rate",
      value: `${stats.hiring_trends?.monthly_growth_rate || 0}%`,
      icon: <ChartBarIcon />,
      color: "text-pink-400",
      iconBg: "bg-pink-500/20",
      description: "Monthly Growth"
    },
    {
      title: "Attendance Types",
      value: stats.overview?.total_attendance_types || 0,
      icon: <ClockIcon />,
      color: "text-indigo-400",
      iconBg: "bg-indigo-500/20",
      description: "Available Types"
    }
  ], [stats]);

  // Grid card component for employee display
  const EmployeeCard = ({ user, index }) => {
    const department = departments?.find(d => d.id === user.department_id);
    const designation = designations?.find(d => d.id === user.designation_id);
    const attendanceType = attendanceTypes?.find(a => a.id === user.attendance_type_id);

    return (
      <Card 
        className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer h-full"
        onPress={() => router.visit(route('profile', { user: user.id }))}
      >
        <CardBody className="p-4 flex flex-col h-full">
          {/* Card Header with Employee Info */}
          <div className="flex items-start gap-3 mb-3 pb-3 border-b border-white/10">
            <div className="shrink-0">
              <ProfileAvatar
                src={user?.profile_image_url || user?.profile_image}
                name={user?.name}
                size="md"
                fallback={<UserIcon className="w-4 h-4" />}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground text-left text-sm">{user?.name}</span>
              <span className="text-default-500 text-left text-xs">ID: {user?.employee_id || 'N/A'}</span>
            </div>
            <div className="flex-1 min-w-0 flex justify-end">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-default-400 hover:text-foreground"
                onPress={(e) => {
                  e.stopPropagation();
                  router.visit(route('profile', { user: user.id }));
                }}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Contact Info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <EnvelopeIcon className="w-4 h-4 text-default-400 shrink-0" />
                <span className="text-default-600 text-xs truncate">{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="w-4 h-4 text-default-400 shrink-0" />
                  <span className="text-default-600 text-xs">{user?.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Card Footer with Tags */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
            {/* Department */}
            {department && (
              <Chip
                size="sm"
                variant="flat"
                color="primary"
                className="text-xs"
                startContent={<BuildingOfficeIcon className="w-3 h-3" />}
              >
                {department.name}
              </Chip>
            )}
            
            {/* Designation */}
            {designation && (
              <Chip
                size="sm"
                variant="flat"
                color="secondary"
                className="text-xs"
                startContent={<BriefcaseIcon className="w-3 h-3" />}
              >
                {designation.title}
              </Chip>
            )}
            
            {/* Attendance Type */}
            {attendanceType && (
              <Chip
                size="sm"
                variant="bordered"
                className="text-xs"
                startContent={<ClockIcon className="w-3 h-3" />}
              >
                {attendanceType.name}
              </Chip>
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <>
      <Head title={title || "Employee Directory"} />
      <div 
        className="flex flex-col w-full h-full p-4"
        role="main"
        aria-label="Employee Directory Management"
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
                              Employee Directory
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
                              Manage employee information and organizational structure
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            as={Link}
                            href={route('users')}
                            className="text-white font-medium"
                            style={{
                              background: `linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 80%, var(--theme-secondary)))`,
                              borderRadius: getThemeRadius(),
                            }}
                            startContent={<UserPlusIcon className="w-4 h-4" />}
                          >
                            {isMobile ? "Go to Users" : "Add from User List"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="p-6">
                  {/* Statistics Cards */}
                  <StatsCards stats={statsData} className="mb-6" />
                  
                 

                {/* Analytics Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Department Distribution */}
                  <div 
                    className="p-4"
                    style={{
                      background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                      border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                      borderRadius: getThemeRadius(),
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <h3 
                      className="text-lg font-semibold mb-4"
                      style={{ color: 'var(--theme-foreground)' }}
                    >
                      Department Distribution
                    </h3>
                    <div className="space-y-3">
                      {stats.distribution?.by_department?.slice(0, 5).map((dept, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span 
                            className="text-sm opacity-80"
                            style={{ color: 'var(--theme-foreground)' }}
                          >
                            {dept.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-20 h-2 rounded-full overflow-hidden"
                              style={{ background: 'color-mix(in srgb, var(--theme-content3) 40%, transparent)' }}
                            >
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${dept.percentage}%`,
                                  background: `linear-gradient(90deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 80%, var(--theme-secondary)))`
                                }}
                              />
                            </div>
                            <span 
                              className="text-xs w-8 opacity-70"
                              style={{ color: 'var(--theme-foreground)' }}
                            >
                              {dept.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hiring Trends */}
                  <div 
                    className="p-4"
                    style={{
                      background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                      border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                      borderRadius: getThemeRadius(),
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <h3 
                      className="text-lg font-semibold mb-4"
                      style={{ color: 'var(--theme-foreground)' }}
                    >
                      Hiring Trends
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-sm opacity-80"
                          style={{ color: 'var(--theme-foreground)' }}
                        >
                          Last 30 Days
                        </span>
                        <span 
                          className="text-sm font-medium"
                          style={{ color: 'var(--theme-foreground)' }}
                        >
                          {stats.hiring_trends?.recent_hires?.last_30_days || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-sm opacity-80"
                          style={{ color: 'var(--theme-foreground)' }}
                        >
                          Last 90 Days
                        </span>
                        <span 
                          className="text-sm font-medium"
                          style={{ color: 'var(--theme-foreground)' }}
                        >
                          {stats.hiring_trends?.recent_hires?.last_90_days || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-600">This Year</span>
                        <span className="text-sm font-medium text-foreground">
                          {stats.hiring_trends?.recent_hires?.last_year || 0}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-default-600">Monthly Growth</span>
                          <span className={`text-sm font-medium ${(stats.hiring_trends?.monthly_growth_rate || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.hiring_trends?.monthly_growth_rate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workforce Health */}
                  <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Workforce Health
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-600">Retention Rate</span>
                        <span className="text-sm font-medium text-green-400">
                          {stats.workforce_health?.retention_rate || 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-600">Turnover Rate</span>
                        <span className="text-sm font-medium text-orange-400">
                          {stats.workforce_health?.turnover_rate || 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-600">Active Employees</span>
                        <span className="text-sm font-medium text-blue-400">
                          {stats.workforce_health?.status_ratio?.active_percentage || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Type Distribution */}
                  <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Attendance Types
                    </h3>
                    <div className="space-y-3">
                      {stats.distribution?.by_attendance_type?.map((type, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-default-600">{type.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-linear-to-r from-green-500 to-emerald-500 rounded-full"
                                style={{ width: `${type.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-default-500 w-8">{type.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                 {/* Filters Section */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                      <div className="flex-1">
                        <Input
                          label="Search Employees"
                          placeholder="Search by name, email, or employee ID..."
                          value={filters.search}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                          variant="bordered"
                          size="sm"
                          radius={getThemeRadius()}
                          classNames={{
                            input: "text-sm",
                          }}
                          style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                          }}
                          aria-label="Search employees"
                        />
                      </div>
                      
                      <div className="flex gap-2 items-end">
                        {/* View Toggle */}
                        <ButtonGroup 
                          variant="bordered"
                          style={{
                            background: 'color-mix(in srgb, var(--theme-content2) 30%, transparent)',
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                          }}
                        >
                          <Button
                            isIconOnly={isMobile}
                            color={viewMode === 'table' ? 'primary' : 'default'}
                            onPress={() => setViewMode('table')}
                            style={{
                              background: viewMode === 'table' 
                                ? `var(--theme-primary)` 
                                : 'transparent',
                              color: viewMode === 'table' 
                                ? 'white' 
                                : 'var(--theme-foreground)',
                            }}
                          >
                            <TableCellsIcon className="w-4 h-4" />
                            {!isMobile && <span className="ml-1">Table</span>}
                          </Button>
                          <Button
                            isIconOnly={isMobile}
                            color={viewMode === 'grid' ? 'primary' : 'default'}
                            onPress={() => setViewMode('grid')}
                            style={{
                              background: viewMode === 'grid' 
                                ? `var(--theme-primary)` 
                                : 'transparent',
                              color: viewMode === 'grid' 
                                ? 'white' 
                                : 'var(--theme-foreground)',
                            }}
                          >
                            <Squares2X2Icon className="w-4 h-4" />
                            {!isMobile && <span className="ml-1">Grid</span>}
                          </Button>
                        </ButtonGroup>
                        
                        <Button
                          isIconOnly
                          variant="bordered"
                          onPress={() => setShowFilters(!showFilters)}
                          style={{
                            background: showFilters 
                              ? 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' 
                              : 'color-mix(in srgb, var(--theme-content2) 30%, transparent)',
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            color: showFilters 
                              ? 'var(--theme-primary)' 
                              : 'var(--theme-foreground)',
                            borderRadius: getThemeRadius(),
                          }}
                        >
                          <FunnelIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Filters Section */}
                    {showFilters && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4"
                      >
                        <div 
                          className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                          style={{
                            background: 'color-mix(in srgb, var(--theme-content2) 50%, transparent)',
                            border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
                            borderRadius: getThemeRadius(),
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          {/* Department Filter */}
                          <Select
                            label="Department"
                            placeholder="All Departments"
                            selectedKeys={filters.department !== 'all' ? [filters.department] : []}
                            onSelectionChange={(keys) => {
                              const value = Array.from(keys)[0];
                              handleDepartmentFilterChange(value || 'all');
                            }}
                            variant="bordered"
                            size="sm"
                            radius={getThemeRadius()}
                            startContent={<BuildingOfficeIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                              trigger: "bg-white/10 backdrop-blur-md border-white/20",
                            }}
                          >
                            {departments?.map((dept) => (
                              <SelectItem key={String(dept.id)} textValue={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </Select>

                          {/* Designation Filter */}
                          <Select
                            label="Designation"
                            placeholder="All Designations"
                            selectedKeys={filters.designation !== 'all' ? [filters.designation] : []}
                            onSelectionChange={(keys) => {
                              const value = Array.from(keys)[0];
                              handleDesignationFilterChange(value || 'all');
                            }}
                            variant="bordered"
                            size="sm"
                            radius={getThemeRadius()}
                            isDisabled={filters.department === 'all'}
                            startContent={<BriefcaseIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                              trigger: "bg-white/10 backdrop-blur-md border-white/20",
                            }}
                          >
                            {filteredDesignations?.map((desig) => (
                              <SelectItem key={String(desig.id)} textValue={desig.title}>
                                {desig.title}
                              </SelectItem>
                            ))}
                          </Select>

                          {/* Attendance Type Filter */}
                          <Select
                            label="Attendance Type"
                            placeholder="All Attendance Types"
                            selectedKeys={filters.attendanceType !== 'all' ? [filters.attendanceType] : []}
                            onSelectionChange={(keys) => {
                              const value = Array.from(keys)[0];
                              handleAttendanceTypeFilterChange(value || 'all');
                            }}
                            variant="bordered"
                            size="sm"
                            radius={getThemeRadius()}
                            startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                              trigger: "bg-white/10 backdrop-blur-md border-white/20",
                            }}
                          >
                            {attendanceTypes?.map((type) => (
                              <SelectItem key={String(type.id)} textValue={type.name}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </Select>

                          {/* Clear Filters Button */}
                          <div className="flex items-end">
                            <Button
                              variant="flat"
                              size="sm"
                              className="w-full"
                              onPress={() => {
                                setFilters({
                                  search: '',
                                  department: 'all',
                                  designation: 'all',
                                  attendanceType: 'all'
                                });
                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                              }}
                              isDisabled={
                                filters.search === '' && 
                                filters.department === 'all' && 
                                filters.designation === 'all' && 
                                filters.attendanceType === 'all'
                              }
                              style={{
                                background: 'color-mix(in srgb, var(--theme-danger) 20%, transparent)',
                                color: 'var(--theme-danger)',
                                borderRadius: getThemeRadius(),
                              }}
                            >
                              Clear Filters
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                {/* Employee Table Section */}
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
                    className="border-b pb-2"
                    style={{
                      borderColor: `var(--theme-divider, #E4E4E7)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg flex items-center justify-center"
                        style={{
                          background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                          borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                        }}
                      >
                        <UsersIcon 
                          className="w-6 h-6" 
                          style={{ color: 'var(--theme-primary)' }}
                        />
                      </div>
                      <h1 
                        className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground"
                        style={{
                          fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                      >
                        Employee Directory
                      </h1>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="max-h-[84vh] overflow-y-auto">
                      {loading ? (
                        <div className="text-center py-8">
                          <Spinner size="lg" color="primary" />
                          <p className="mt-4 text-default-500">
                            Loading employees data...
                          </p>
                        </div>
                      ) : viewMode === 'table' ? (
                        <EmployeeTable 
                      allUsers={employees} 
                      allManagers={allManagers}
                      departments={departments}
                      designations={designations}
                      attendanceTypes={attendanceTypes}
                      setUsers={setEmployees}
                      isMobile={isMobile}
                      isTablet={isTablet}
                      pagination={pagination}
                      onPageChange={handlePageChange}
                      onRowsPerPageChange={handleRowsPerPageChange}
                      totalUsers={totalRows}
                      loading={loading}
                      updateEmployeeOptimized={updateEmployeeOptimized}
                      deleteEmployeeOptimized={deleteEmployeeOptimized}
                    />
                  ) : (
                    <div className="p-4">
                      {employees.length > 0 ? (
                        <div className={`grid gap-4 ${
                          isMobile 
                            ? 'grid-cols-1' 
                            : isTablet 
                              ? 'grid-cols-2' 
                              : 'grid-cols-3 xl:grid-cols-4'
                        }`}>
                          {employees.map((user, index) => (
                            <EmployeeCard key={user.id} user={user} index={index} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UsersIcon className="w-12 h-12 mx-auto text-default-300 mb-2" />
                          <p className="text-base text-default-500">
                            No employees found
                          </p>
                          <p className="text-sm text-default-500">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      )}
                      
                      {/* Pagination for Grid View */}
                      {employees.length > 0 && (
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
                                  onChange={handlePageChange}
                                  size={isMobile ? "sm" : "md"}
                                  variant="bordered"
                                  showControls
                                  style={{
                                    '--pagination-item-bg': 'color-mix(in srgb, var(--theme-content2) 50%, transparent)',
                                    '--pagination-item-border': 'color-mix(in srgb, var(--theme-content3) 50%, transparent)',
                                  }}
                                />
                              </div>
                      )}
                    </div>
                  )}
                    </div>
                  </CardBody>
                </Card>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

EmployeesList.layout = (page) => <App>{page}</App>;
export default EmployeesList;
