import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head} from '@inertiajs/react';
import {motion} from 'framer-motion';
import {
    Button,
    Card,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
    Tooltip,
    useDisclosure
} from "@heroui/react";

import {
    BuildingOfficeIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    GlobeAltIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon
} from "@heroicons/react/24/outline";

import App from "@/Layouts/App.jsx";
import StandardPageLayout from "@/Layouts/StandardPageLayout.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import {useThemeRadius} from '@/Hooks/useThemeRadius.js';
import axios from 'axios';
import {showToast} from '@/utils/toastUtils';
import { useHRMAC } from '@/Hooks/useHRMAC';

const HolidaysManagement = ({ title, holidays: initialHolidays, stats }) => {
  const themeRadius = useThemeRadius();
  
  // Manual responsive state management (HRMAC pattern)
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // TODO: Update with proper HRMAC module hierarchy path once defined
  const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
  const canCreateHoliday = canCreate('hrm.holidays') || isSuperAdmin();
  const canEditHoliday = canUpdate('hrm.holidays') || isSuperAdmin();
  const canDeleteHoliday = canDelete('hrm.holidays') || isSuperAdmin();
  
  const [holidays, setHolidays] = useState(initialHolidays);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const {isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose} = useDisclosure();
  const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose} = useDisclosure();
  const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();
  
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    from_date: '',
    to_date: '',
    description: '',
    type: 'public',
    is_recurring: false
  });
  const [loading, setLoading] = useState(false);

  // Compute dynamic stats from current holidays state
  const dynamicStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const totalHolidays = holidays.length;
    // Upcoming = all holidays with date > today (not limited to 90 days)
    const upcomingHolidays = holidays.filter(h => new Date(h.date) > now).length;
    const thisMonthHolidays = holidays.filter(h => {
      const d = new Date(h.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;
    const thisYearHolidays = holidays.filter(h => new Date(h.date).getFullYear() === currentYear).length;
    
    return {
      total_holidays: totalHolidays,
      upcoming_holidays: upcomingHolidays,
      this_month_holidays: thisMonthHolidays,
      this_year_holidays: thisYearHolidays
    };
  }, [holidays]);

  // Enhanced statistics - use dynamic stats computed from current holidays state
  const enhancedStats = useMemo(() => [
    {
      title: "Total Holidays",
      value: dynamicStats.total_holidays,
      icon: <GlobeAltIcon />,
      color: "text-blue-400",
      iconBg: "bg-blue-500/20",
      description: "All company holidays",
      trend: `${dynamicStats.this_year_holidays} this year`
    },
    {
      title: "Upcoming",
      value: dynamicStats.upcoming_holidays,
      icon: <ClockIcon />,
      color: "text-green-400",
      iconBg: "bg-green-500/20",
      description: "Next holidays",
      trend: "Next 90 days"
    },
    {
      title: "This Month",
      value: dynamicStats.this_month_holidays,
      icon: <CalendarDaysIcon />,
      color: "text-purple-400",
      iconBg: "bg-purple-500/20",
      description: "Current month",
      trend: "Ongoing & upcoming"
    },
    {
      title: "Working Days",
      value: 365 - dynamicStats.total_holidays,
      icon: <BuildingOfficeIcon />,
      color: "text-orange-400",
      iconBg: "bg-orange-500/20",
      description: "Business days",
      trend: `${Math.round(((365 - dynamicStats.total_holidays) / 365) * 100)}% of year`
    }
  ], [dynamicStats]);

  // Filtered holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter(holiday => {
      const matchesSearch = holiday.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = selectedYear === 'all' || 
        new Date(holiday.date).getFullYear().toString() === selectedYear;
      
      return matchesSearch && matchesYear;
    });
  }, [holidays, searchTerm, selectedYear]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = [...new Set(holidays.map(h => new Date(h.date).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [holidays]);

  // Holiday categories
  const holidayCategories = [
    { key: 'public', label: 'Public Holiday', color: 'primary' },
    { key: 'religious', label: 'Religious Holiday', color: 'secondary' },
    { key: 'national', label: 'National Holiday', color: 'success' },
    { key: 'company', label: 'Company Holiday', color: 'warning' },
    { key: 'optional', label: 'Optional Holiday', color: 'default' }
  ];

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build submission data matching backend expectations
      const submitData = {
        title: formData.title,
        description: formData.description,
        fromDate: formData.from_date,
        toDate: formData.to_date,
        type: formData.type,
        is_recurring: formData.is_recurring,
        is_active: true
      };
      
      // Add ID for update operations
      if (selectedHoliday) {
        submitData.id = selectedHoliday.id;
      }
      
      // Both create and update use the same endpoint (POST holidays-add)
      const response = await axios.post(route('hrm.holidays-add'), submitData);
      
      if (response.status === 200 && response.data.holidays) {
        // Update holidays list with response data
        setHolidays(response.data.holidays);
        showToast.success(response.data.message || (selectedHoliday ? 'Holiday updated successfully!' : 'Holiday created successfully!'));
        handleModalClose();
      }
    } catch (error) {
      if (error.response?.status === 422) {
        showToast.error('Please check the form for validation errors.');
      } else {
        showToast.error(error.response?.data?.message || 'Failed to save holiday. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedHoliday) return;
    
    setLoading(true);
    try {
      const response = await axios.delete(route('hrm.holidays-delete'), {
        data: { id: selectedHoliday.id }
      });
      
      if (response.status === 200 && response.data.holidays) {
        setHolidays(response.data.holidays);
      } else {
        setHolidays(prev => prev.filter(h => h.id !== selectedHoliday.id));
      }
      
      showToast.success(response.data?.message || 'Holiday deleted successfully!');
      onDeleteClose();
      setSelectedHoliday(null);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete holiday. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleModalClose = () => {
    onAddClose();
    onEditClose();
    setSelectedHoliday(null);
    setFormData({
      title: '',
      from_date: '',
      to_date: '',
      description: '',
      type: 'public',
      is_recurring: false
    });
  };

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    // Format dates for input fields (YYYY-MM-DD format)
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    };
    setFormData({
      title: holiday.title,
      from_date: formatDate(holiday.date),
      to_date: formatDate(holiday.end_date),
      description: holiday.description || '',
      type: holiday.type || 'public',
      is_recurring: holiday.is_recurring || false
    });
    onEditOpen();
  };

  const handleDeleteClick = (holiday) => {
    setSelectedHoliday(holiday);
    onDeleteOpen();
  };

  // Table columns
  const columns = [
    { name: "Holiday", uid: "title" },
    { name: "Date", uid: "dates" },
    { name: "Duration", uid: "duration" },
    { name: "Type", uid: "type" },
    { name: "Status", uid: "status" },
    { name: "Actions", uid: "actions" }
  ];

  // Render table cell
  const renderCell = useCallback((holiday, columnKey) => {
    const cellValue = holiday[columnKey];
    // Use 'date' and 'end_date' from Holiday model (not from_date/to_date)
    // Fall back to 'date' if 'end_date' is null/empty
    const fromDate = new Date(holiday.date);
    const toDate = holiday.end_date ? new Date(holiday.end_date) : fromDate;
    const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    const isUpcoming = fromDate > new Date();
    const isOngoing = fromDate <= new Date() && toDate >= new Date();

    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{holiday.title}</p>
            {holiday.description && (
              <p className="text-bold text-tiny capitalize text-default-400">
                {holiday.description}
              </p>
            )}
          </div>
        );
      case "dates":
        return (
          <div className="flex flex-col">
            <span className="text-small">
              {fromDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: fromDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              })}
            </span>
            {holiday.end_date && holiday.date !== holiday.end_date && (
              <span className="text-tiny text-default-400">
                to {toDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </div>
        );
      case "duration":
        return (
          <Chip size="sm" variant="flat">
            {duration} {duration === 1 ? 'day' : 'days'}
          </Chip>
        );
      case "type":
        const category = holidayCategories.find(cat => cat.key === holiday.type) || holidayCategories[0];
        return (
          <Chip size="sm" color={category.color} variant="flat">
            {category.label}
          </Chip>
        );
      case "status":
        return (
          <Chip
            size="sm"
            color={isOngoing ? "success" : isUpcoming ? "warning" : "default"}
            variant="flat"
            startContent={
              isOngoing ? <CheckCircleIcon className="w-3 h-3" /> :
              isUpcoming ? <ClockIcon className="w-3 h-3" /> :
              <ExclamationTriangleIcon className="w-3 h-3" />
            }
          >
            {isOngoing ? "Ongoing" : isUpcoming ? "Upcoming" : "Past"}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit holiday">
              <span 
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                onClick={() => handleEdit(holiday)}
              >
                <PencilIcon className="w-4 h-4" />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete holiday">
              <span 
                className="text-lg text-danger cursor-pointer active:opacity-50"
                onClick={() => handleDeleteClick(holiday)}
              >
                <TrashIcon className="w-4 h-4" />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  // Action buttons
  const actionButtons = [
    <Button
      key="add"
      color="primary"
      variant="shadow"
      size={isMobile ? 'sm' : 'md'}
      startContent={<PlusIcon className="w-4 h-4" />}
      onPress={onAddOpen}
      className="font-medium"
      style={{ fontFamily: `var(--fontFamily, "Inter")` }}
    >
      {isMobile ? "Add" : "Add Holiday"}
    </Button>
  ];

  return (
    <>
      <Head title={title} />

      {/* Add/Edit Holiday Modal */}
      <Modal 
        isOpen={isAddOpen || isEditOpen} 
        onClose={handleModalClose}
        size="2xl"
        backdrop="blur"
        classNames={{
          backdrop: "bg-linear-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
          base: "border-[#292f46] bg-linear-to-br from-white/10 to-white/5 backdrop-blur-md",
          header: "border-b border-[#292f46]",
          footer: "border-t border-[#292f46]",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {selectedHoliday ? 'Edit Holiday' : 'Add New Holiday'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Holiday Title"
                placeholder="Enter holiday name"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                isRequired
                radius={themeRadius}
              />
              
              <Select
                label="Holiday Type"
                selectedKeys={[formData.type]}
                onSelectionChange={(keys) => setFormData(prev => ({...prev, type: Array.from(keys)[0]}))}
                radius={themeRadius}
              >
                {holidayCategories.map(category => (
                  <SelectItem key={category.key} value={category.key}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">From Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  value={formData.from_date}
                  onChange={(e) => setFormData(prev => ({...prev, from_date: e.target.value}))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-default-200 bg-default-100 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">To Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  value={formData.to_date}
                  onChange={(e) => setFormData(prev => ({...prev, to_date: e.target.value}))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-default-200 bg-default-100 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <Textarea
              label="Description (Optional)"
              placeholder="Enter holiday description or additional notes"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              rows={3}
              radius={themeRadius}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleModalClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmit}
              isLoading={loading}
            >
              {selectedHoliday ? 'Update Holiday' : 'Add Holiday'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteOpen} 
        onClose={onDeleteClose}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirm Delete
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete the holiday "{selectedHoliday?.title}"?</p>
            <p className="text-small text-danger">This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={handleDelete}
              isLoading={loading}
            >
              Delete Holiday
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <StandardPageLayout
        ariaLabel="Holidays Management"
        title="Company Holidays"
        subtitle="Manage company-wide holidays and special occasions"
        icon={GlobeAltIcon}
        actions={<div className="flex items-center gap-2">{actionButtons}</div>}
        stats={<StatsCards stats={enhancedStats} />}
        filters={
          <div className="space-y-4">
            {/* Search and Year Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by holiday name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  variant="bordered"
                  size={isMobile ? 'sm' : 'md'}
                  radius={themeRadius}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                />
              </div>

              <div className="flex gap-2 items-end">
                <Select
                  label="Year"
                  selectedKeys={[selectedYear]}
                  onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
                  className="w-32"
                  variant="bordered"
                  size={isMobile ? 'sm' : 'md'}
                  radius={themeRadius}
                  classNames={{
                    trigger: "bg-default-100"
                  }}
                >
                  <SelectItem key="all" value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year.toString()} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </Select>
                
                <Button
                  isIconOnly={isMobile}
                  variant="bordered"
                  onPress={() => setShowFilters(!showFilters)}
                  color={showFilters ? 'primary' : 'default'}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <FunnelIcon className="w-4 h-4" />
                  {!isMobile && <span className="ml-1">Filters</span>}
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || selectedYear !== new Date().getFullYear().toString()) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap gap-2"
              >
                {searchTerm && (
                  <Chip
                    variant="flat"
                    color="primary"
                    size="sm"
                    onClose={() => setSearchTerm('')}
                  >
                    Search: {searchTerm}
                  </Chip>
                )}
                {selectedYear !== new Date().getFullYear().toString() && (
                  <Chip
                    variant="flat"
                    color="secondary"
                    size="sm"
                    onClose={() => setSelectedYear(new Date().getFullYear().toString())}
                  >
                    Year: {selectedYear === 'all' ? 'All Years' : selectedYear}
                  </Chip>
                )}
              </motion.div>
            )}
          </div>
        }
      >
        {/* Holidays Table */}
        <Table
          isStriped
          removeWrapper
          aria-label="Holidays table"
          classNames={{
            th: "bg-default-100 text-default-600 border-b border-divider",
            td: "border-b border-divider/50",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.uid} 
                align={column.uid === "actions" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={filteredHolidays}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StandardPageLayout>
    </>
  );
};

HolidaysManagement.layout = (page) => <App>{page}</App>;
export default HolidaysManagement;
