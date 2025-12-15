import React, {useCallback, useMemo, useState} from 'react';
import {Head} from '@inertiajs/react';
import {motion} from 'framer-motion';
import {
    Button,
    Card,
    Chip,
    DateInput,
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
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import axios from 'axios';
import {showToast} from '@/utils/toastUtils';

const HolidaysManagement = ({ title, holidays: initialHolidays, stats }) => {
  const [isMobile] = useState(window.innerWidth < 640);
  const [isTablet] = useState(window.innerWidth < 768);
  
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

  // Enhanced statistics
  const enhancedStats = useMemo(() => [
    {
      title: "Total Holidays",
      value: stats.total_holidays,
      icon: <GlobeAltIcon />,
      color: "text-blue-400",
      iconBg: "bg-blue-500/20",
      description: "All company holidays",
      trend: `${stats.this_year_holidays} this year`
    },
    {
      title: "Upcoming",
      value: stats.upcoming_holidays,
      icon: <ClockIcon />,
      color: "text-green-400",
      iconBg: "bg-green-500/20",
      description: "Next holidays",
      trend: "Next 90 days"
    },
    {
      title: "This Month",
      value: stats.this_month_holidays,
      icon: <CalendarDaysIcon />,
      color: "text-purple-400",
      iconBg: "bg-purple-500/20",
      description: "Current month",
      trend: "Ongoing & upcoming"
    },
    {
      title: "Working Days",
      value: 365 - stats.total_holidays,
      icon: <BuildingOfficeIcon />,
      color: "text-orange-400",
      iconBg: "bg-orange-500/20",
      description: "Business days",
      trend: `${Math.round(((365 - stats.total_holidays) / 365) * 100)}% of year`
    }
  ], [stats]);

  // Filtered holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter(holiday => {
      const matchesSearch = holiday.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = selectedYear === 'all' || 
        new Date(holiday.from_date).getFullYear().toString() === selectedYear;
      
      return matchesSearch && matchesYear;
    });
  }, [holidays, searchTerm, selectedYear]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = [...new Set(holidays.map(h => new Date(h.from_date).getFullYear()))];
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
      const response = selectedHoliday 
        ? await axios.put(route('holiday.update', selectedHoliday.id), formData)
        : await axios.post(route('holiday.store'), formData);
      
      if (response.data.success) {
        // Update holidays list
        if (selectedHoliday) {
          setHolidays(prev => prev.map(h => 
            h.id === selectedHoliday.id ? response.data.holiday : h
          ));
        } else {
          setHolidays(prev => [...prev, response.data.holiday]);
        }
        
        showToast.success(selectedHoliday ? 'Holiday updated successfully!' : 'Holiday created successfully!');
        handleModalClose();
      }
    } catch (error) {
      showToast.error('Failed to save holiday. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedHoliday) return;
    
    setLoading(true);
    try {
      await axios.delete(route('holiday.destroy', selectedHoliday.id));
      setHolidays(prev => prev.filter(h => h.id !== selectedHoliday.id));
      showToast.success('Holiday deleted successfully!');
      onDeleteClose();
      setSelectedHoliday(null);
    } catch (error) {
      showToast.error('Failed to delete holiday. Please try again.');
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
    setFormData({
      title: holiday.title,
      from_date: holiday.from_date,
      to_date: holiday.to_date,
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
    const fromDate = new Date(holiday.from_date);
    const toDate = new Date(holiday.to_date);
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
            {holiday.from_date !== holiday.to_date && (
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

  return (
    <>
      <Head title={title} />

      <div className="flex justify-center p-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="shadow-lg">
            <PageHeader
              title="Company Holidays"
              subtitle="Manage company-wide holidays and special occasions"
              icon={<GlobeAltIcon className="w-8 h-8" />}
              variant="default"
              actionButtons={[
                {
                  label: isMobile ? "Add" : "Add Holiday",
                  icon: <PlusIcon className="w-4 h-4" />,
                  onClick: onAddOpen,
                  className: "bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) text-white font-medium hover:opacity-90"
                }
              ]}
            >
              <div className="p-4 sm:p-6">
                {/* Statistics Cards */}
                <StatsCards stats={enhancedStats} className="mb-6" />

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      label="Search Holidays"
                      placeholder="Search by holiday name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    <Select
                      label="Year"
                      selectedKeys={[selectedYear]}
                      onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
                      className="w-32"
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
                      className={showFilters ? 'bg-purple-500/20' : 'bg-white/5'}
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
                    className="mb-4 flex flex-wrap gap-2"
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

                {/* Holidays Table */}
                <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-foreground">
                      Company Holidays
                      <span className="text-sm text-default-500 ml-2">
                        ({filteredHolidays.length} {filteredHolidays.length === 1 ? 'holiday' : 'holidays'})
                      </span>
                    </h3>
                  </div>
                  
                  <Table
                    isStriped
                    removeWrapper
                    aria-label="Holidays table"
                    classNames={{
                      th: "bg-white/5 text-default-600 border-b border-white/10",
                      td: "border-b border-white/5",
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
                </div>
              </div>
            </PageHeader>
          </Card>
        </motion.div>
      </div>

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
              />
              
              <Select
                label="Holiday Type"
                selectedKeys={[formData.type]}
                onSelectionChange={(keys) => setFormData(prev => ({...prev, type: Array.from(keys)[0]}))}
              >
                {holidayCategories.map(category => (
                  <SelectItem key={category.key} value={category.key}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>
              
              <DateInput
                label="From Date"
                value={formData.from_date}
                onChange={(date) => setFormData(prev => ({...prev, from_date: date}))}
                isRequired
              />
              
              <DateInput
                label="To Date"
                value={formData.to_date}
                onChange={(date) => setFormData(prev => ({...prev, to_date: date}))}
                isRequired
              />
            </div>
            
            <Textarea
              label="Description (Optional)"
              placeholder="Enter holiday description or additional notes"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              rows={3}
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
    </>
  );
};

HolidaysManagement.layout = (page) => <App>{page}</App>;
export default HolidaysManagement;
