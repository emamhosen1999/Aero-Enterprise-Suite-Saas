import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Avatar,
  Chip
} from '@heroui/react';
import {
  UserIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const OnboardEmployeeModal = ({
  open,
  onClose,
  user,
  departments = [],
  designations = [],
  managers = [],
  onSuccess
}) => {
  // Theme radius helper
  const getThemeRadius = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
  };

  const themeRadius = getThemeRadius();

  // Form state
  const [formData, setFormData] = useState({
    user_id: user?.id || '',
    department_id: '',
    designation_id: '',
    date_of_joining: '',
    employment_type: 'full_time',
    basic_salary: '',
    manager_id: '',
    work_location: '',
    probation_end_date: ''
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update user_id when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
    }
  }, [user]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        user_id: user?.id || '',
        department_id: '',
        designation_id: '',
        date_of_joining: '',
        employment_type: 'full_time',
        basic_salary: '',
        manager_id: '',
        work_location: '',
        probation_end_date: ''
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, user]);

  // Filter designations based on selected department
  const filteredDesignations = useMemo(() => {
    if (!formData.department_id) return designations;
    return designations.filter(
      d => String(d.department_id) === String(formData.department_id)
    );
  }, [formData.department_id, designations]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Reset designation when department changes
    if (field === 'department_id' && formData.designation_id) {
      const designationStillValid = designations.some(
        d => String(d.id) === String(formData.designation_id) && 
             String(d.department_id) === String(value)
      );
      if (!designationStillValid) {
        setFormData(prev => ({ ...prev, designation_id: '' }));
      }
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.department_id) {
      newErrors.department_id = 'Department is required';
    }
    if (!formData.designation_id) {
      newErrors.designation_id = 'Designation is required';
    }
    if (!formData.date_of_joining) {
      newErrors.date_of_joining = 'Date of joining is required';
    }
    if (!formData.employment_type) {
      newErrors.employment_type = 'Employment type is required';
    }
    if (!formData.basic_salary) {
      newErrors.basic_salary = 'Basic salary is required';
    } else if (isNaN(formData.basic_salary) || Number(formData.basic_salary) < 0) {
      newErrors.basic_salary = 'Please enter a valid salary amount';
    }
    if (!formData.work_location) {
      newErrors.work_location = 'Work location is required';
    }

    // Date validation: probation_end_date must be after date_of_joining
    if (formData.probation_end_date && formData.date_of_joining) {
      const joiningDate = new Date(formData.date_of_joining);
      const probationDate = new Date(formData.probation_end_date);
      if (probationDate <= joiningDate) {
        newErrors.probation_end_date = 'Probation end date must be after joining date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('hrm.employees.onboard'), formData);
        
        if (response.status === 200 || response.status === 201) {
          resolve([response.data.message || 'Employee onboarded successfully!']);
          
          // Call success callback
          if (onSuccess) {
            onSuccess(response.data.employee);
          }
          
          // Close modal
          onClose();
        } else {
          reject(['An unexpected error occurred']);
        }
      } catch (error) {
        console.error('Onboarding error:', error);
        
        if (error.response?.data?.errors) {
          // Laravel validation errors
          const validationErrors = error.response.data.errors;
          setErrors(validationErrors);
          reject(Object.values(validationErrors).flat());
        } else if (error.response?.data?.message) {
          reject([error.response.data.message]);
        } else {
          reject(['Failed to onboard employee. Please try again.']);
        }
      } finally {
        setIsSubmitting(false);
      }
    });

    showToast.promise(promise, {
      loading: 'Onboarding employee...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  // Employment type options
  const employmentTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' }
  ];

  return (
    <Modal
      isOpen={open}
      onOpenChange={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider"
      }}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">Onboard as Employee</h2>
              <p className="text-sm font-normal text-default-500">
                Fill in the employment details to onboard this user as an employee
              </p>
            </ModalHeader>

            <ModalBody>
              {/* User Info Display */}
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-default-100 mb-4">
                  <Avatar
                    src={user.profile_picture}
                    name={user.name}
                    size="md"
                    radius={themeRadius}
                    classNames={{
                      base: "bg-gradient-to-br from-primary-400 to-primary-600",
                      icon: "text-white"
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-default-500">{user.email}</p>
                  </div>
                  {user.roles && user.roles.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role, index) => (
                        <Chip key={index} size="sm" variant="flat" color="primary">
                          {role.name || role}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <Select
                  label="Department"
                  placeholder="Select department"
                  selectedKeys={formData.department_id ? [String(formData.department_id)] : []}
                  onSelectionChange={(keys) => handleChange('department_id', Array.from(keys)[0])}
                  isRequired
                  isInvalid={!!errors.department_id}
                  errorMessage={errors.department_id}
                  radius={themeRadius}
                  startContent={<BriefcaseIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    trigger: "bg-default-100"
                  }}
                >
                  {departments.map((dept) => (
                    <SelectItem key={String(dept.id)} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </Select>

                {/* Designation */}
                <Select
                  label="Designation"
                  placeholder="Select designation"
                  selectedKeys={formData.designation_id ? [String(formData.designation_id)] : []}
                  onSelectionChange={(keys) => handleChange('designation_id', Array.from(keys)[0])}
                  isRequired
                  isInvalid={!!errors.designation_id}
                  errorMessage={errors.designation_id}
                  radius={themeRadius}
                  startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    trigger: "bg-default-100"
                  }}
                  isDisabled={!formData.department_id}
                >
                  {filteredDesignations.map((desig) => (
                    <SelectItem key={String(desig.id)} value={String(desig.id)}>
                      {desig.name}
                    </SelectItem>
                  ))}
                </Select>

                {/* Date of Joining */}
                <Input
                  type="date"
                  label="Date of Joining"
                  placeholder="Select joining date"
                  value={formData.date_of_joining}
                  onValueChange={(value) => handleChange('date_of_joining', value)}
                  isRequired
                  isInvalid={!!errors.date_of_joining}
                  errorMessage={errors.date_of_joining}
                  radius={themeRadius}
                  startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                />

                {/* Employment Type */}
                <Select
                  label="Employment Type"
                  placeholder="Select employment type"
                  selectedKeys={formData.employment_type ? [formData.employment_type] : []}
                  onSelectionChange={(keys) => handleChange('employment_type', Array.from(keys)[0])}
                  isRequired
                  isInvalid={!!errors.employment_type}
                  errorMessage={errors.employment_type}
                  radius={themeRadius}
                  startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    trigger: "bg-default-100"
                  }}
                >
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </Select>

                {/* Basic Salary */}
                <Input
                  type="number"
                  label="Basic Salary"
                  placeholder="Enter basic salary"
                  value={formData.basic_salary}
                  onValueChange={(value) => handleChange('basic_salary', value)}
                  isRequired
                  isInvalid={!!errors.basic_salary}
                  errorMessage={errors.basic_salary}
                  radius={themeRadius}
                  startContent={<CurrencyDollarIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                />

                {/* Manager */}
                <Select
                  label="Manager"
                  placeholder="Select manager (optional)"
                  selectedKeys={formData.manager_id ? [String(formData.manager_id)] : []}
                  onSelectionChange={(keys) => handleChange('manager_id', Array.from(keys)[0])}
                  radius={themeRadius}
                  startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    trigger: "bg-default-100"
                  }}
                >
                  {managers.map((manager) => (
                    <SelectItem key={String(manager.id)} value={String(manager.id)}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </Select>

                {/* Work Location */}
                <Input
                  type="text"
                  label="Work Location"
                  placeholder="Enter work location"
                  value={formData.work_location}
                  onValueChange={(value) => handleChange('work_location', value)}
                  isRequired
                  isInvalid={!!errors.work_location}
                  errorMessage={errors.work_location}
                  radius={themeRadius}
                  startContent={<MapPinIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                  className="md:col-span-2"
                />

                {/* Probation End Date */}
                <Input
                  type="date"
                  label="Probation End Date (Optional)"
                  placeholder="Select probation end date"
                  value={formData.probation_end_date}
                  onValueChange={(value) => handleChange('probation_end_date', value)}
                  isInvalid={!!errors.probation_end_date}
                  errorMessage={errors.probation_end_date}
                  radius={themeRadius}
                  startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                  className="md:col-span-2"
                />
              </div>

              {/* Info message */}
              <div className="mt-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  <strong>Note:</strong> After onboarding, the employee will receive a welcome email with instructions to complete their profile and onboarding tasks.
                </p>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="flat"
                onPress={onModalClose}
                isDisabled={isSubmitting}
                radius={themeRadius}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                radius={themeRadius}
              >
                {isSubmitting ? 'Onboarding...' : 'Onboard Employee'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default OnboardEmployeeModal;
