import {
    Button,
    Spinner,
    Select,
    SelectItem,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    Chip
} from "@heroui/react";
import React, { useEffect, useState, useMemo } from "react";
import { EnvelopeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from "@/utils/toastUtils";

/**
 * InviteUserForm - Modal form for sending team member invitations
 * 
 * Allows inviting users via email with role, department, and designation pre-assignment.
 * The invited user will receive an email to complete their registration.
 */
const InviteUserForm = ({ 
    roles = [], 
    open, 
    closeModal,
    onInviteSent
}) => {
    const [loading, setLoading] = useState(false);
    const [themeRadius, setThemeRadius] = useState('lg');
    
    // Form state
    const [formData, setFormData] = useState({
        email: '',
        role: '',
        message: ''
    });
    
    // Form errors
    const [errors, setErrors] = useState({});

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

    // Set theme radius on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    // Handle input changes
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData.role) {
            newErrors.role = 'Please select a role for the invited user';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            email: '',
            role: '',
            message: ''
        });
        setErrors({});
    };

    // Handle close
    const handleClose = () => {
        resetForm();
        closeModal();
    };

    // Submit invitation
    const handleSubmit = async (e) => {
        e?.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await axios.post(route('users.invite'), formData);
            
            if (response.status === 200 || response.status === 201) {
                showToast.success('Invitation sent successfully!');
                resetForm();
                onInviteSent?.();
                closeModal();
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                showToast.error(error.response.data.message);
            } else {
                showToast.error('Failed to send invitation. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Check if form is valid for submission
    const isFormValid = useMemo(() => {
        return formData.email && formData.role;
    }, [formData.email, formData.role]);

    return (
        <Modal 
            isOpen={open} 
            onClose={handleClose}
            size="lg"
            backdrop="blur"
            radius={themeRadius}
            scrollBehavior="inside"
            classNames={{
                base: "border-[1px] border-divider bg-content1",
                header: "border-b-[1px] border-divider",
                footer: "border-t-[1px] border-divider",
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div 
                            className="p-2 rounded-lg"
                            style={{
                                background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                            }}
                        >
                            <EnvelopeIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Invite Team Member
                            </h3>
                            <p className="text-sm text-default-500">
                                Send an invitation to join your organization
                            </p>
                        </div>
                    </div>
                </ModalHeader>
                
                <ModalBody className="gap-4 py-4">
                    {/* Email Input */}
                    <Input
                        label="Email Address"
                        placeholder="colleague@example.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        variant="bordered"
                        radius={themeRadius}
                        isRequired
                        isInvalid={!!errors.email}
                        errorMessage={errors.email}
                        startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
                        classNames={{
                            input: "text-sm",
                        }}
                    />
                    
                    {/* Role Select */}
                    <Select
                        label="Role"
                        placeholder="Select a role"
                        selectedKeys={formData.role ? [formData.role] : []}
                        onChange={(e) => handleChange('role', e.target.value)}
                        variant="bordered"
                        radius={themeRadius}
                        isRequired
                        isInvalid={!!errors.role}
                        errorMessage={errors.role}
                        startContent={<UserGroupIcon className="w-4 h-4 text-default-400" />}
                        classNames={{
                            trigger: "text-sm",
                        }}
                    >
                        {roles.map((role) => (
                            <SelectItem 
                                key={role.name} 
                                value={role.name}
                                textValue={role.name}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium capitalize">
                                        {role.name.replace(/-/g, ' ')}
                                    </span>
                                    {role.description && (
                                        <span className="text-xs text-default-400">
                                            {role.description}
                                        </span>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </Select>
                    
                    {/* Personal Message (Optional) */}
                    <Textarea
                        label="Personal Message (Optional)"
                        placeholder="Add a personal note to the invitation email..."
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        variant="bordered"
                        radius={themeRadius}
                        minRows={3}
                        maxRows={5}
                        classNames={{
                            input: "text-sm",
                        }}
                    />
                    
                    {/* Info Box */}
                    <div 
                        className="p-3 rounded-lg text-sm"
                        style={{
                            background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                            borderWidth: '1px',
                            borderRadius: `var(--borderRadius, 8px)`,
                        }}
                    >
                        <p className="text-default-600">
                            <strong>Note:</strong> The invited user will receive an email with a link to complete their registration. 
                            After registration, you can onboard them as an employee from the Users list to assign department, designation, and other job details.
                            The invitation will expire in 7 days.
                        </p>
                    </div>
                </ModalBody>
                
                <ModalFooter>
                    <Button 
                        variant="flat" 
                        onPress={handleClose}
                        isDisabled={loading}
                        radius={themeRadius}
                    >
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleSubmit}
                        isLoading={loading}
                        isDisabled={!isFormValid || loading}
                        startContent={!loading ? <EnvelopeIcon className="w-4 h-4" /> : null}
                        radius={themeRadius}
                    >
                        Send Invitation
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default InviteUserForm;
