import React, {useState} from 'react';
import {Head, router, useForm} from '@inertiajs/react';
import {AnimatePresence, motion} from 'framer-motion';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Input,
    Progress,
    Select,
    SelectItem,
    Textarea,
} from '@heroui/react';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BanknotesIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentIcon,
    HomeIcon,
    IdentificationIcon,
    PhoneIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import {showToast} from '@/utils/toastUtils';

export default function EmployeeOnboardingWizard({ 
    title, 
    employee,
    departments, 
    designations, 
    attendanceTypes,
    managers 
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);

    const steps = [
        { 
            id: 'personal', 
            name: 'Personal Information', 
            icon: UserIcon,
            description: 'Basic personal details'
        },
        { 
            id: 'job', 
            name: 'Job Details', 
            icon: BriefcaseIcon,
            description: 'Position and employment information'
        },
        { 
            id: 'documents', 
            name: 'Documents', 
            icon: DocumentIcon,
            description: 'Required documentation'
        },
        { 
            id: 'bank', 
            name: 'Bank Details', 
            icon: BanknotesIcon,
            description: 'Banking information for payroll'
        },
        { 
            id: 'review', 
            name: 'Review & Submit', 
            icon: CheckCircleIcon,
            description: 'Verify all information'
        },
    ];

    // Form state for each step
    const personalForm = useForm({
        name: employee?.name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        birthday: employee?.birthday || '',
        gender: employee?.gender || '',
        address: employee?.address || '',
        city: employee?.city || '',
        state: employee?.state || '',
        zip_code: employee?.zip_code || '',
        country: employee?.country || 'United States',
        emergency_contact_name: employee?.emergency_contact_primary_name || '',
        emergency_contact_phone: employee?.emergency_contact_primary_phone || '',
        emergency_contact_relationship: employee?.emergency_contact_primary_relationship || '',
    });

    const jobForm = useForm({
        employee_id: employee?.employee_id || '',
        department_id: employee?.department_id || '',
        designation_id: employee?.designation_id || '',
        attendance_type_id: employee?.attendance_type_id || '',
        hire_date: employee?.hire_date || '',
        reports_to: employee?.reporting_manager_id || '',
        work_location: employee?.work_location || '',
        employment_type: employee?.employment_type || 'full-time',
        probation_period: employee?.probation_period || '3',
    });

    const documentForm = useForm({
        resume: null,
        id_proof: null,
        address_proof: null,
        education_certificates: null,
        experience_letters: null,
        passport_no: employee?.passport_no || '',
        passport_exp_date: employee?.passport_exp_date || '',
        nid: employee?.nid || '',
    });

    const bankForm = useForm({
        bank_name: employee?.bank_name || '',
        bank_account_no: employee?.bank_account_no || '',
        bank_account_name: employee?.bank_account_name || '',
        bank_branch: employee?.bank_branch || '',
        bank_routing_no: employee?.bank_routing_no || '',
        bank_swift_code: employee?.bank_swift_code || '',
        tax_id: employee?.tax_id || '',
        pan_no: employee?.pan_no || '',
    });

    const progress = ((currentStep + 1) / steps.length) * 100;

    const handleNext = async () => {
        const stepId = steps[currentStep].id;
        let form;
        let route_name;

        switch(stepId) {
            case 'personal':
                form = personalForm;
                route_name = 'hr.onboarding.save-personal';
                break;
            case 'job':
                form = jobForm;
                route_name = 'hr.onboarding.save-job';
                break;
            case 'documents':
                form = documentForm;
                route_name = 'hr.onboarding.save-documents';
                break;
            case 'bank':
                form = bankForm;
                route_name = 'hr.onboarding.save-bank';
                break;
            case 'review':
                handleSubmit();
                return;
            default:
                return;
        }

        form.post(route(route_name, employee.id), {
            preserveScroll: true,
            onSuccess: () => {
                setCompletedSteps([...completedSteps, currentStep]);
                if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                }
                showToast.success(`${steps[currentStep].name} saved successfully!`);
            },
            onError: (errors) => {
                showToast.error('Please fix the errors and try again.');
                console.error(errors);
            }
        });
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepClick = (index) => {
        if (completedSteps.includes(index - 1) || index <= currentStep) {
            setCurrentStep(index);
        }
    };

    const handleSubmit = () => {
        router.post(route('hr.onboarding.complete', employee.id), {}, {
            onSuccess: () => {
                showToast.success('Onboarding completed successfully!');
                router.visit(route('hr.onboarding.index'));
            },
            onError: () => {
                showToast.error('Failed to complete onboarding. Please try again.');
            }
        });
    };

    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
    };

    const renderStepContent = () => {
        const stepId = steps[currentStep].id;

        switch(stepId) {
            case 'personal':
                return (
                    <motion.div
                        key="personal"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                value={personalForm.data.name}
                                onChange={(e) => personalForm.setData('name', e.target.value)}
                                isRequired
                                errorMessage={personalForm.errors.name}
                                isInvalid={!!personalForm.errors.name}
                                startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="john.doe@company.com"
                                value={personalForm.data.email}
                                onChange={(e) => personalForm.setData('email', e.target.value)}
                                isRequired
                                errorMessage={personalForm.errors.email}
                                isInvalid={!!personalForm.errors.email}
                            />
                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={personalForm.data.phone}
                                onChange={(e) => personalForm.setData('phone', e.target.value)}
                                isRequired
                                errorMessage={personalForm.errors.phone}
                                isInvalid={!!personalForm.errors.phone}
                                startContent={<PhoneIcon className="w-4 h-4 text-default-400" />}
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={personalForm.data.birthday}
                                onChange={(e) => personalForm.setData('birthday', e.target.value)}
                                isRequired
                                errorMessage={personalForm.errors.birthday}
                                isInvalid={!!personalForm.errors.birthday}
                            />
                            <Select
                                label="Gender"
                                placeholder="Select gender"
                                selectedKeys={personalForm.data.gender ? [personalForm.data.gender] : []}
                                onChange={(e) => personalForm.setData('gender', e.target.value)}
                                isRequired
                            >
                                <SelectItem key="male" value="male">Male</SelectItem>
                                <SelectItem key="female" value="female">Female</SelectItem>
                                <SelectItem key="other" value="other">Other</SelectItem>
                            </Select>
                            <Input
                                label="City"
                                placeholder="New York"
                                value={personalForm.data.city}
                                onChange={(e) => personalForm.setData('city', e.target.value)}
                            />
                        </div>

                        <Textarea
                            label="Address"
                            placeholder="123 Main Street, Apt 4B"
                            value={personalForm.data.address}
                            onChange={(e) => personalForm.setData('address', e.target.value)}
                            minRows={2}
                            startContent={<HomeIcon className="w-4 h-4 text-default-400" />}
                        />

                        <Divider />

                        <h3 className="text-lg font-semibold">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Contact Name"
                                placeholder="Jane Doe"
                                value={personalForm.data.emergency_contact_name}
                                onChange={(e) => personalForm.setData('emergency_contact_name', e.target.value)}
                                isRequired
                            />
                            <Input
                                label="Contact Phone"
                                placeholder="+1 (555) 987-6543"
                                value={personalForm.data.emergency_contact_phone}
                                onChange={(e) => personalForm.setData('emergency_contact_phone', e.target.value)}
                                isRequired
                            />
                            <Input
                                label="Relationship"
                                placeholder="Spouse"
                                value={personalForm.data.emergency_contact_relationship}
                                onChange={(e) => personalForm.setData('emergency_contact_relationship', e.target.value)}
                                isRequired
                            />
                        </div>
                    </motion.div>
                );

            case 'job':
                return (
                    <motion.div
                        key="job"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Employee ID"
                                placeholder="EMP001"
                                value={jobForm.data.employee_id}
                                onChange={(e) => jobForm.setData('employee_id', e.target.value)}
                                isRequired
                                errorMessage={jobForm.errors.employee_id}
                                isInvalid={!!jobForm.errors.employee_id}
                                startContent={<IdentificationIcon className="w-4 h-4 text-default-400" />}
                            />
                            <Input
                                label="Hire Date"
                                type="date"
                                value={jobForm.data.hire_date}
                                onChange={(e) => jobForm.setData('hire_date', e.target.value)}
                                isRequired
                                errorMessage={jobForm.errors.hire_date}
                                isInvalid={!!jobForm.errors.hire_date}
                            />
                            <Select
                                label="Department"
                                placeholder="Select department"
                                selectedKeys={jobForm.data.department_id ? [String(jobForm.data.department_id)] : []}
                                onChange={(e) => jobForm.setData('department_id', e.target.value)}
                                isRequired
                                startContent={<BuildingOfficeIcon className="w-4 h-4 text-default-400" />}
                            >
                                {departments?.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Designation"
                                placeholder="Select designation"
                                selectedKeys={jobForm.data.designation_id ? [String(jobForm.data.designation_id)] : []}
                                onChange={(e) => jobForm.setData('designation_id', e.target.value)}
                                isRequired
                            >
                                {designations?.map((desig) => (
                                    <SelectItem key={desig.id} value={desig.id}>
                                        {desig.title}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Attendance Type"
                                placeholder="Select attendance type"
                                selectedKeys={jobForm.data.attendance_type_id ? [String(jobForm.data.attendance_type_id)] : []}
                                onChange={(e) => jobForm.setData('attendance_type_id', e.target.value)}
                            >
                                {attendanceTypes?.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Reports To"
                                placeholder="Select manager"
                                selectedKeys={jobForm.data.reports_to ? [String(jobForm.data.reports_to)] : []}
                                onChange={(e) => jobForm.setData('reports_to', e.target.value)}
                            >
                                {managers?.map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                        {manager.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Employment Type"
                                placeholder="Select type"
                                selectedKeys={[jobForm.data.employment_type]}
                                onChange={(e) => jobForm.setData('employment_type', e.target.value)}
                                isRequired
                            >
                                <SelectItem key="full-time" value="full-time">Full Time</SelectItem>
                                <SelectItem key="part-time" value="part-time">Part Time</SelectItem>
                                <SelectItem key="contract" value="contract">Contract</SelectItem>
                                <SelectItem key="intern" value="intern">Intern</SelectItem>
                            </Select>
                            <Input
                                label="Work Location"
                                placeholder="New York Office"
                                value={jobForm.data.work_location}
                                onChange={(e) => jobForm.setData('work_location', e.target.value)}
                            />
                            <Input
                                label="Probation Period (months)"
                                type="number"
                                placeholder="3"
                                value={jobForm.data.probation_period}
                                onChange={(e) => jobForm.setData('probation_period', e.target.value)}
                                startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                            />
                        </div>
                    </motion.div>
                );

            case 'documents':
                return (
                    <motion.div
                        key="documents"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-warning-700 dark:text-warning-300">
                                <strong>Note:</strong> Please upload clear scans or photos of your documents. Accepted formats: PDF, JPG, PNG (Max 5MB per file)
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Resume/CV *</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => documentForm.setData('resume', e.target.files[0])}
                                    className="w-full px-3 py-2 border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {documentForm.errors.resume && (
                                    <p className="text-danger text-sm mt-1">{documentForm.errors.resume}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">ID Proof *</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => documentForm.setData('id_proof', e.target.files[0])}
                                    className="w-full px-3 py-2 border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {documentForm.errors.id_proof && (
                                    <p className="text-danger text-sm mt-1">{documentForm.errors.id_proof}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Address Proof *</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => documentForm.setData('address_proof', e.target.files[0])}
                                    className="w-full px-3 py-2 border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {documentForm.errors.address_proof && (
                                    <p className="text-danger text-sm mt-1">{documentForm.errors.address_proof}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Education Certificates</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    onChange={(e) => documentForm.setData('education_certificates', Array.from(e.target.files))}
                                    className="w-full px-3 py-2 border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Experience Letters</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    onChange={(e) => documentForm.setData('experience_letters', Array.from(e.target.files))}
                                    className="w-full px-3 py-2 border border-default-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <Divider />

                        <h3 className="text-lg font-semibold">Identity Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Passport Number"
                                placeholder="A12345678"
                                value={documentForm.data.passport_no}
                                onChange={(e) => documentForm.setData('passport_no', e.target.value)}
                            />
                            <Input
                                label="Passport Expiry Date"
                                type="date"
                                value={documentForm.data.passport_exp_date}
                                onChange={(e) => documentForm.setData('passport_exp_date', e.target.value)}
                            />
                            <Input
                                label="National ID / SSN"
                                placeholder="123-45-6789"
                                value={documentForm.data.nid}
                                onChange={(e) => documentForm.setData('nid', e.target.value)}
                            />
                        </div>
                    </motion.div>
                );

            case 'bank':
                return (
                    <motion.div
                        key="bank"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div className="bg-info/10 border border-info/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-info-700 dark:text-info-300">
                                <strong>Privacy Notice:</strong> Your banking information is securely encrypted and will only be used for payroll processing.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Bank Name"
                                placeholder="Chase Bank"
                                value={bankForm.data.bank_name}
                                onChange={(e) => bankForm.setData('bank_name', e.target.value)}
                                isRequired
                                errorMessage={bankForm.errors.bank_name}
                                isInvalid={!!bankForm.errors.bank_name}
                                startContent={<BanknotesIcon className="w-4 h-4 text-default-400" />}
                            />
                            <Input
                                label="Account Number"
                                placeholder="1234567890"
                                value={bankForm.data.bank_account_no}
                                onChange={(e) => bankForm.setData('bank_account_no', e.target.value)}
                                isRequired
                                errorMessage={bankForm.errors.bank_account_no}
                                isInvalid={!!bankForm.errors.bank_account_no}
                            />
                            <Input
                                label="Account Holder Name"
                                placeholder="John Doe"
                                value={bankForm.data.bank_account_name}
                                onChange={(e) => bankForm.setData('bank_account_name', e.target.value)}
                                isRequired
                                errorMessage={bankForm.errors.bank_account_name}
                                isInvalid={!!bankForm.errors.bank_account_name}
                            />
                            <Input
                                label="Branch"
                                placeholder="Main Branch, New York"
                                value={bankForm.data.bank_branch}
                                onChange={(e) => bankForm.setData('bank_branch', e.target.value)}
                            />
                            <Input
                                label="Routing Number"
                                placeholder="021000021"
                                value={bankForm.data.bank_routing_no}
                                onChange={(e) => bankForm.setData('bank_routing_no', e.target.value)}
                            />
                            <Input
                                label="SWIFT Code"
                                placeholder="CHASUS33"
                                value={bankForm.data.bank_swift_code}
                                onChange={(e) => bankForm.setData('bank_swift_code', e.target.value)}
                            />
                        </div>

                        <Divider />

                        <h3 className="text-lg font-semibold">Tax Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Tax ID / EIN"
                                placeholder="12-3456789"
                                value={bankForm.data.tax_id}
                                onChange={(e) => bankForm.setData('tax_id', e.target.value)}
                            />
                            <Input
                                label="PAN Number"
                                placeholder="ABCDE1234F"
                                value={bankForm.data.pan_no}
                                onChange={(e) => bankForm.setData('pan_no', e.target.value)}
                            />
                        </div>
                    </motion.div>
                );

            case 'review':
                return (
                    <motion.div
                        key="review"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div className="text-center mb-6">
                            <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Review Your Information</h2>
                            <p className="text-default-500">
                                Please review all the information before submitting. You can go back and edit any section if needed.
                            </p>
                        </div>

                        {/* Personal Info Summary */}
                        <Card>
                            <CardHeader className="flex justify-between">
                                <h3 className="text-lg font-semibold">Personal Information</h3>
                                <Button 
                                    size="sm" 
                                    variant="light" 
                                    color="primary"
                                    onPress={() => setCurrentStep(0)}
                                >
                                    Edit
                                </Button>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-default-500">Name:</span> <strong>{personalForm.data.name}</strong></div>
                                    <div><span className="text-default-500">Email:</span> <strong>{personalForm.data.email}</strong></div>
                                    <div><span className="text-default-500">Phone:</span> <strong>{personalForm.data.phone}</strong></div>
                                    <div><span className="text-default-500">Birthday:</span> <strong>{personalForm.data.birthday}</strong></div>
                                    <div className="col-span-2"><span className="text-default-500">Address:</span> <strong>{personalForm.data.address}</strong></div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Job Details Summary */}
                        <Card>
                            <CardHeader className="flex justify-between">
                                <h3 className="text-lg font-semibold">Job Details</h3>
                                <Button 
                                    size="sm" 
                                    variant="light" 
                                    color="primary"
                                    onPress={() => setCurrentStep(1)}
                                >
                                    Edit
                                </Button>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-default-500">Employee ID:</span> <strong>{jobForm.data.employee_id}</strong></div>
                                    <div><span className="text-default-500">Hire Date:</span> <strong>{jobForm.data.hire_date}</strong></div>
                                    <div><span className="text-default-500">Employment Type:</span> <strong className="capitalize">{jobForm.data.employment_type.replace('-', ' ')}</strong></div>
                                    <div><span className="text-default-500">Work Location:</span> <strong>{jobForm.data.work_location}</strong></div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Bank Details Summary */}
                        <Card>
                            <CardHeader className="flex justify-between">
                                <h3 className="text-lg font-semibold">Bank Details</h3>
                                <Button 
                                    size="sm" 
                                    variant="light" 
                                    color="primary"
                                    onPress={() => setCurrentStep(3)}
                                >
                                    Edit
                                </Button>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-default-500">Bank:</span> <strong>{bankForm.data.bank_name}</strong></div>
                                    <div><span className="text-default-500">Account:</span> <strong>****{bankForm.data.bank_account_no.slice(-4)}</strong></div>
                                    <div><span className="text-default-500">Account Name:</span> <strong>{bankForm.data.bank_account_name}</strong></div>
                                    <div><span className="text-default-500">Branch:</span> <strong>{bankForm.data.bank_branch}</strong></div>
                                </div>
                            </CardBody>
                        </Card>

                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                            <p className="text-sm text-success-700 dark:text-success-300">
                                By submitting this form, you confirm that all the information provided is accurate and complete to the best of your knowledge.
                            </p>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <App>
            <Head title={title} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-default-900 mb-2">
                        Employee Onboarding
                    </h1>
                    <p className="text-default-500">
                        Complete the following steps to set up your employee profile
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <Progress 
                        value={progress} 
                        color="primary"
                        size="sm"
                        className="mb-4"
                    />
                    <div className="flex justify-between">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = index === currentStep;
                            const isCompleted = completedSteps.includes(index);
                            
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => handleStepClick(index)}
                                    className={`flex flex-col items-center gap-2 transition-all ${
                                        isActive 
                                            ? 'text-primary' 
                                            : isCompleted 
                                            ? 'text-success cursor-pointer hover:text-success/80' 
                                            : 'text-default-400 cursor-not-allowed'
                                    }`}
                                    disabled={!isCompleted && index > currentStep}
                                >
                                    <div className={`p-3 rounded-full ${
                                        isActive 
                                            ? 'bg-primary/10 ring-2 ring-primary' 
                                            : isCompleted 
                                            ? 'bg-success/10' 
                                            : 'bg-default-100'
                                    }`}>
                                        <StepIcon className="w-5 h-5" />
                                    </div>
                                    <div className="hidden sm:block text-center">
                                        <p className="text-xs font-medium">{step.name}</p>
                                        <p className="text-[10px] text-default-400">{step.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Card */}
                <Card className="shadow-lg">
                    <CardBody className="p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            {renderStepContent()}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-default-200">
                            <Button
                                variant="bordered"
                                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                onPress={handlePrevious}
                                isDisabled={currentStep === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                color="primary"
                                endContent={currentStep === steps.length - 1 ? <CheckCircleIcon className="w-4 h-4" /> : <ArrowRightIcon className="w-4 h-4" />}
                                onPress={handleNext}
                                isLoading={personalForm.processing || jobForm.processing || documentForm.processing || bankForm.processing}
                            >
                                {currentStep === steps.length - 1 ? 'Submit Onboarding' : 'Next Step'}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </App>
    );
}
