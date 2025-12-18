import React, { useState, useEffect } from 'react';
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
    Chip,
    Progress,
} from '@heroui/react';
import {
    UserGroupIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    MapPinIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

export default function BulkOnboardModal({
    open,
    onClose,
    users = [],
    departments = [],
    designations = [],
    managers = [],
    onSuccess,
}) {
    const [formData, setFormData] = useState({
        department_id: '',
        designation_id: '',
        date_of_joining: '',
        employment_type: 'full_time',
        basic_salary: '',
        manager_id: '',
        work_location: '',
        probation_end_date: '',
    });
    const [filteredDesignations, setFilteredDesignations] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [themeRadius, setThemeRadius] = useState('md');

    // Get theme radius
    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) setThemeRadius('none');
        else if (radiusValue <= 4) setThemeRadius('sm');
        else if (radiusValue <= 8) setThemeRadius('md');
        else if (radiusValue <= 12) setThemeRadius('lg');
        else setThemeRadius('xl');
    }, []);

    // Filter designations by department
    useEffect(() => {
        if (formData.department_id) {
            const filtered = designations.filter(
                (d) => String(d.department_id) === String(formData.department_id)
            );
            setFilteredDesignations(filtered);
            // Reset designation if not in filtered list
            if (formData.designation_id && !filtered.find((d) => String(d.id) === String(formData.designation_id))) {
                setFormData((prev) => ({ ...prev, designation_id: '' }));
            }
        } else {
            setFilteredDesignations([]);
        }
    }, [formData.department_id, designations]);

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setFormData({
                department_id: '',
                designation_id: '',
                date_of_joining: '',
                employment_type: 'full_time',
                basic_salary: '',
                manager_id: '',
                work_location: '',
                probation_end_date: '',
            });
            setErrors({});
            setResults(null);
            setShowResults(false);
        }
    }, [open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.department_id) newErrors.department_id = 'Department is required';
        if (!formData.designation_id) newErrors.designation_id = 'Designation is required';
        if (!formData.date_of_joining) newErrors.date_of_joining = 'Date of joining is required';
        if (!formData.employment_type) newErrors.employment_type = 'Employment type is required';
        if (!formData.basic_salary) newErrors.basic_salary = 'Basic salary is required';
        if (!formData.work_location) newErrors.work_location = 'Work location is required';

        // Validate probation end date is after joining date
        if (formData.probation_end_date && formData.date_of_joining) {
            const joining = new Date(formData.date_of_joining);
            const probation = new Date(formData.probation_end_date);
            if (probation <= joining) {
                newErrors.probation_end_date = 'Probation end date must be after date of joining';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const promise = new Promise(async (resolve, reject) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    user_ids: users.map((u) => u.id),
                    ...formData,
                    basic_salary: parseFloat(formData.basic_salary),
                };

                const response = await axios.post(route('hrm.employees.onboard-bulk'), payload);

                if (response.status === 200) {
                    setResults(response.data);
                    setShowResults(true);
                    resolve([response.data.summary ? 
                        `Successfully onboarded ${response.data.summary.succeeded} of ${response.data.summary.total} users` : 
                        'Bulk onboarding completed']);
                    
                    // Call success callback after short delay to show results
                    setTimeout(() => {
                        if (onSuccess) onSuccess();
                    }, 2000);
                }
            } catch (error) {
                console.error('Bulk onboarding error:', error);
                const errorMessage = error.response?.data?.message || 'Failed to onboard users';
                reject([errorMessage]);
            } finally {
                setIsSubmitting(false);
            }
        });

        showToast.promise(promise, {
            loading: `Onboarding ${users.length} users...`,
            success: (data) => data.join(', '),
            error: (data) => (Array.isArray(data) ? data.join(', ') : data),
        });
    };

    const handleClose = () => {
        if (results) {
            // If results are shown, close and refresh
            onClose();
        } else {
            // Just close
            onClose();
        }
    };

    return (
        <Modal
            isOpen={open}
            onOpenChange={handleClose}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                base: 'bg-content1',
                header: 'border-b border-divider',
                body: 'py-6',
                footer: 'border-t border-divider',
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-6 h-6 text-primary" />
                        <h2 className="text-lg font-semibold">Bulk Onboard Employees</h2>
                    </div>
                    <p className="text-sm text-default-500 font-normal">
                        Onboard {users.length} user{users.length !== 1 ? 's' : ''} as employees
                    </p>
                </ModalHeader>

                <ModalBody>
                    {!results ? (
                        <>
                            {/* Selected Users Preview */}
                            <div className="mb-6 p-4 bg-default-100 rounded-lg">
                                <p className="text-sm font-medium mb-3">Selected Users ({users.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {users.slice(0, 10).map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-2 bg-content1 px-3 py-2 rounded-lg"
                                        >
                                            <Avatar
                                                src={user.avatar}
                                                name={user.name}
                                                size="sm"
                                                className="flex-shrink-0"
                                            />
                                            <span className="text-sm truncate max-w-[150px]">{user.name}</span>
                                        </div>
                                    ))}
                                    {users.length > 10 && (
                                        <Chip color="default" size="sm">
                                            +{users.length - 10} more
                                        </Chip>
                                    )}
                                </div>
                            </div>

                            {/* Employment Details Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Department */}
                                <Select
                                    label="Department"
                                    placeholder="Select department"
                                    selectedKeys={formData.department_id ? [String(formData.department_id)] : []}
                                    onSelectionChange={(keys) =>
                                        handleChange('department_id', Array.from(keys)[0] || '')
                                    }
                                    isInvalid={!!errors.department_id}
                                    errorMessage={errors.department_id}
                                    isRequired
                                    radius={themeRadius}
                                    startContent={<BriefcaseIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{ trigger: 'bg-default-100' }}
                                >
                                    {departments?.map((dept) => (
                                        <SelectItem key={String(dept.id)}>{dept.name}</SelectItem>
                                    ))}
                                </Select>

                                {/* Designation */}
                                <Select
                                    label="Designation"
                                    placeholder="Select designation"
                                    selectedKeys={formData.designation_id ? [String(formData.designation_id)] : []}
                                    onSelectionChange={(keys) =>
                                        handleChange('designation_id', Array.from(keys)[0] || '')
                                    }
                                    isInvalid={!!errors.designation_id}
                                    errorMessage={errors.designation_id}
                                    isRequired
                                    isDisabled={!formData.department_id}
                                    radius={themeRadius}
                                    classNames={{ trigger: 'bg-default-100' }}
                                >
                                    {filteredDesignations?.map((desig) => (
                                        <SelectItem key={String(desig.id)}>{desig.name}</SelectItem>
                                    ))}
                                </Select>

                                {/* Date of Joining */}
                                <Input
                                    type="date"
                                    label="Date of Joining"
                                    placeholder="Select date"
                                    value={formData.date_of_joining}
                                    onValueChange={(value) => handleChange('date_of_joining', value)}
                                    isInvalid={!!errors.date_of_joining}
                                    errorMessage={errors.date_of_joining}
                                    isRequired
                                    radius={themeRadius}
                                    startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{ inputWrapper: 'bg-default-100' }}
                                />

                                {/* Employment Type */}
                                <Select
                                    label="Employment Type"
                                    placeholder="Select type"
                                    selectedKeys={formData.employment_type ? [formData.employment_type] : []}
                                    onSelectionChange={(keys) =>
                                        handleChange('employment_type', Array.from(keys)[0] || '')
                                    }
                                    isInvalid={!!errors.employment_type}
                                    errorMessage={errors.employment_type}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{ trigger: 'bg-default-100' }}
                                >
                                    <SelectItem key="full_time">Full Time</SelectItem>
                                    <SelectItem key="part_time">Part Time</SelectItem>
                                    <SelectItem key="contract">Contract</SelectItem>
                                    <SelectItem key="intern">Intern</SelectItem>
                                </Select>

                                {/* Basic Salary */}
                                <Input
                                    type="number"
                                    label="Basic Salary"
                                    placeholder="Enter amount"
                                    value={formData.basic_salary}
                                    onValueChange={(value) => handleChange('basic_salary', value)}
                                    isInvalid={!!errors.basic_salary}
                                    errorMessage={errors.basic_salary}
                                    isRequired
                                    radius={themeRadius}
                                    startContent={<CurrencyDollarIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{ inputWrapper: 'bg-default-100' }}
                                />

                                {/* Manager */}
                                <Select
                                    label="Manager"
                                    placeholder="Select manager (optional)"
                                    selectedKeys={formData.manager_id ? [String(formData.manager_id)] : []}
                                    onSelectionChange={(keys) =>
                                        handleChange('manager_id', Array.from(keys)[0] || '')
                                    }
                                    radius={themeRadius}
                                    classNames={{ trigger: 'bg-default-100' }}
                                >
                                    {managers?.map((manager) => (
                                        <SelectItem key={String(manager.id)}>{manager.name}</SelectItem>
                                    ))}
                                </Select>

                                {/* Work Location */}
                                <Input
                                    label="Work Location"
                                    placeholder="Enter work location"
                                    value={formData.work_location}
                                    onValueChange={(value) => handleChange('work_location', value)}
                                    isInvalid={!!errors.work_location}
                                    errorMessage={errors.work_location}
                                    isRequired
                                    radius={themeRadius}
                                    startContent={<MapPinIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{ inputWrapper: 'bg-default-100' }}
                                />

                                {/* Probation End Date */}
                                <Input
                                    type="date"
                                    label="Probation End Date"
                                    placeholder="Select date (optional)"
                                    value={formData.probation_end_date}
                                    onValueChange={(value) => handleChange('probation_end_date', value)}
                                    isInvalid={!!errors.probation_end_date}
                                    errorMessage={errors.probation_end_date}
                                    radius={themeRadius}
                                    startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                                    classNames={{ inputWrapper: 'bg-default-100' }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Results Display */}
                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="p-4 bg-default-100 rounded-lg">
                                    <h3 className="text-sm font-semibold mb-3">Onboarding Summary</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">{results.summary?.total || 0}</p>
                                            <p className="text-xs text-default-500">Total</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-success">
                                                {results.summary?.succeeded || 0}
                                            </p>
                                            <p className="text-xs text-default-500">Succeeded</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-danger">
                                                {results.summary?.failed || 0}
                                            </p>
                                            <p className="text-xs text-default-500">Failed</p>
                                        </div>
                                    </div>
                                    <Progress
                                        value={(results.summary?.succeeded / results.summary?.total) * 100}
                                        color="success"
                                        className="mt-3"
                                    />
                                </div>

                                {/* Detailed Results */}
                                <div>
                                    <button
                                        onClick={() => setShowResults(!showResults)}
                                        className="flex items-center justify-between w-full p-3 bg-default-100 rounded-lg hover:bg-default-200 transition"
                                    >
                                        <span className="text-sm font-medium">View Detailed Results</span>
                                        {showResults ? (
                                            <ChevronUpIcon className="w-4 h-4" />
                                        ) : (
                                            <ChevronDownIcon className="w-4 h-4" />
                                        )}
                                    </button>

                                    {showResults && (
                                        <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">
                                            {/* Success */}
                                            {results.success?.map((item, index) => (
                                                <div
                                                    key={`success-${index}`}
                                                    className="flex items-start gap-2 p-3 bg-success-50 dark:bg-success-100/10 rounded-lg"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">
                                                            {users.find((u) => u.id === item.user_id)?.name || `User ${item.user_id}`}
                                                        </p>
                                                        <p className="text-xs text-default-500">
                                                            {item.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Failed */}
                                            {results.failed?.map((item, index) => (
                                                <div
                                                    key={`failed-${index}`}
                                                    className="flex items-start gap-2 p-3 bg-danger-50 dark:bg-danger-100/10 rounded-lg"
                                                >
                                                    <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">
                                                            {users.find((u) => u.id === item.user_id)?.name || `User ${item.user_id}`}
                                                        </p>
                                                        <p className="text-xs text-danger-600 dark:text-danger-400">
                                                            {item.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button variant="flat" onPress={handleClose} radius={themeRadius}>
                        {results ? 'Close' : 'Cancel'}
                    </Button>
                    {!results && (
                        <Button
                            color="primary"
                            onPress={handleSubmit}
                            isLoading={isSubmitting}
                            radius={themeRadius}
                        >
                            Onboard {users.length} User{users.length !== 1 ? 's' : ''}
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
