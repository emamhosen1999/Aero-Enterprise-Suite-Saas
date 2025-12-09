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
    Switch,
    Chip,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { X, Camera, Eye, EyeOff, Lock } from 'lucide-react';
import { useForm } from 'laravel-precognition-react';
import { showToast } from "@/utils/toastUtils";
import { UserIcon } from "@heroicons/react/24/solid";
import ProfileAvatar from '@/Components/ProfileAvatar';

/**
 * Helper to get routes based on context
 */
const getRoutes = (context) => {
    const isAdmin = context === 'admin';
    return {
        store: isAdmin ? 'admin.users.store' : 'users.store',
        update: isAdmin ? 'admin.users.update' : 'users.update',
    };
};

const AddEditUserForm = ({user, roles, setUsers, open, closeModal, editMode = false, context = 'tenant' }) => {
    
    // Get routes for the current context
    const routes = getRoutes(context);
    
    const [showPassword, setShowPassword] = useState(false);
    const [hover, setHover] = useState(false);
    const [selectedImage, setSelectedImage] = useState(user?.profile_image_url || user?.profile_image || null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [themeRadius, setThemeRadius] = useState('lg');

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
    // Set theme radius on mount (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    // Initialize Precognition form with proper method and URL
    const form = useForm(
        editMode ? 'put' : 'post',
        editMode && user?.id ? route(routes.update, { user: user.id }) : route(routes.store),
        {
            id: user?.id || '',
            name: user?.name || '',
            user_name: user?.user_name || '',
            phone: user?.phone || '',
            email: user?.email || '',
            password: '',
            password_confirmation: '',
            roles: user?.roles?.map(r => typeof r === 'object' ? r.name : r) || [],
            profile_image: null,
        }
    );

    // Initialize selected image if user has profile image
    useEffect(() => {
        if (user?.profile_image_url || user?.profile_image) {
            setSelectedImage(user.profile_image_url || user.profile_image);
        }
    }, [user]);

    const handleSubmit = async () => {
        // Validate file type if image is selected
        if (selectedImageFile) {
            const fileType = selectedImageFile.type;
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
                showToast.error('Invalid file type. Only JPEG and PNG are allowed.', {
                    icon: '🔴'
                });
                return;
            }
            form.setData('profile_image', selectedImageFile);
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                // Submit the form using Precognition with transform to handle boolean conversion
                await form.submit({
                    preserveScroll: true,
                    transform: (data) => {
                        // Only include single_device_login_enabled for tenant context
                        const transformedData = { ...data };
                     
                        return transformedData;
                    },
                    onSuccess: (response) => {
                        if (setUsers) {
                            if (editMode) {
                                // Update the user in the list
                                setUsers(prevUsers => 
                                    prevUsers.map(u => 
                                        u.id === response.data.user.id ? response.data.user : u
                                    )
                                );
                            } else {
                                // Add new user to the list
                                setUsers(prevUsers => [...prevUsers, response.data.user]);
                            }
                        }
                        closeModal();
                        resolve([response.data.message || `User ${editMode ? 'updated' : 'created'} successfully`]);
                    },
                    onError: (errors) => {
                        // Laravel Precognition automatically sets form.errors
                        // Extract error messages for toast display
                        const errorMessages = Object.values(errors).flat();
                        if (errorMessages.length > 0) {
                            reject(errorMessages.join(', '));
                        } else {
                            reject(`Failed to ${editMode ? 'update' : 'create'} user. Please check the form for errors.`);
                        }
                    },
                });
            } catch (error) {
                console.error('Form submission error:', error);
                
                if (error.response) {
                    if (error.response.status === 422) {
                        // Validation errors
                        const errors = error.response.data.errors || {};
                        const errorMessages = Object.values(errors).flat();
                        reject(errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation failed. Please check the form.');
                    } else if (error.response.status === 500) {
                        reject(error.response.data.message || 'Server error occurred. Please try again later.');
                    } else {
                        reject(`HTTP Error ${error.response.status}: ${error.response.data.message || 'An unexpected error occurred.'}`);
                    }
                } else if (error.request) {
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    reject('An error occurred while setting up the request.');
                }
            }
        });

        showToast.promise(
            promise,
            {
                pending: `${editMode ? 'Updating' : 'Creating'} user...`,
                success: {
                    render({ data }) {
                        return data.join(', ');
                    }
                },
                error: {
                    render({ data }) {
                        return data;
                    }
                }
            }
        );
    };



    // Handle file change for profile image preview and submission
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const objectURL = URL.createObjectURL(file);
            setSelectedImage(objectURL);
            setSelectedImageFile(file); // Set the file for the form submission
        }
    };

    const handleChange = (key, value) => {
        form.setData(key, value);
        
        // Trigger validation on blur for real-time feedback
        if (form.touched(key)) {
            form.validate(key);
        }
    };

    // Toggle password visibility
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Check if form is valid and ready to submit
    const isFormValid = () => {
        if (editMode) {
            // For edit mode, check if form has changes
            return form.isDirty && !form.processing;
        } else {
            // For new user, check required fields
            const hasRequiredFields = 
                form.data.name?.trim() && 
                form.data.user_name?.trim() && 
                form.data.email?.trim() && 
                form.data.password?.trim() && 
                form.data.password_confirmation?.trim();
            
            const passwordsMatch = form.data.password === form.data.password_confirmation;
            
            return hasRequiredFields && passwordsMatch && !form.processing;
        }
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="3xl"
            radius={themeRadius}
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md max-h-[95vh] my-2",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider flex-shrink-0",
                body: "overflow-y-auto max-h-[calc(95vh-160px)]",
                footer: "border-t border-divider flex-shrink-0",
                closeButton: "hover:bg-white/5 active:bg-white/10"
            }}
            style={{
                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                transform: `scale(var(--scale, 1))`,
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--theme-primary)' }} />
                                <div>
                                    <span className="text-lg font-semibold" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {editMode ? 'Edit User' : 'Add New User'}
                                    </span>
                                    <p className="text-sm text-default-500 mt-0.5" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {editMode ? 'Update user information' : 'Create a new user account'}
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="py-4 px-4 sm:py-6 sm:px-6 overflow-y-auto" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Profile Image Upload */}
                                <div className="flex justify-center mb-6">
                                    <div 
                                        className="relative group cursor-pointer"
                                        onMouseEnter={() => setHover(true)}
                                        onMouseLeave={() => setHover(false)}
                                    >
                                        <ProfileAvatar
                                            src={selectedImage}
                                            name={form.data.name}
                                            size="xl"
                                            className="w-32 h-32 text-2xl transition-all duration-300"
                                            style={{
                                                border: `4px solid var(--theme-divider, #E4E4E7)`,
                                                filter: hover ? 'brightness(70%)' : 'brightness(100%)',
                                            }}
                                        />
                                        <label
                                            htmlFor="icon-button-file"
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-opacity duration-300"
                                            style={{
                                                opacity: hover ? 1 : 0,
                                            }}
                                        >
                                            <input
                                                accept="image/*"
                                                id="icon-button-file"
                                                type="file"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                            <Camera className="w-8 h-8 text-white" />
                                        </label>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        placeholder="Enter full name"
                                        value={form.data.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        onBlur={() => form.validate('name')}
                                        isInvalid={form.invalid('name')}
                                        errorMessage={form.errors.name}
                                        isRequired
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Username"
                                        placeholder="Enter username"
                                        value={form.data.user_name}
                                        onChange={(e) => handleChange('user_name', e.target.value)}
                                        onBlur={() => form.validate('user_name')}
                                        isInvalid={form.invalid('user_name')}
                                        errorMessage={form.errors.user_name}
                                        isRequired
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={form.data.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        onBlur={() => form.validate('email')}
                                        isInvalid={form.invalid('email')}
                                        errorMessage={form.errors.email}
                                        isRequired
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />

                                    <Input
                                        label="Phone"
                                        placeholder="Enter phone number"
                                        value={form.data.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        onBlur={() => form.validate('phone')}
                                        isInvalid={form.invalid('phone')}
                                        errorMessage={form.errors.phone}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            input: "text-small",
                                            inputWrapper: "min-h-unit-10"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    />
                                </div>

                                {/* Roles Selection */}
                                <div className="col-span-full">
                                    <Select
                                        label="Roles"
                                        placeholder="Select user roles"
                                        selectionMode="multiple"
                                        selectedKeys={new Set(form.data.roles)}
                                        onSelectionChange={(keys) => {
                                            const selectedRoles = Array.from(keys);
                                            handleChange('roles', selectedRoles);
                                        }}
                                        onClose={() => form.validate('roles')}
                                        isInvalid={form.invalid('roles')}
                                        errorMessage={form.errors.roles}
                                        variant="bordered"
                                        size="sm"
                                        radius={themeRadius}
                                        classNames={{
                                            trigger: "min-h-unit-10",
                                            value: "text-small"
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                        renderValue={(items) => {
                                            return (
                                                <div className="flex flex-wrap gap-1">
                                                    {items.map((item) => (
                                                        <Chip key={item.key} size="sm" color="secondary" variant="flat">
                                                            {item.textValue}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                    >
                                        {roles?.map((role) => {
                                            const roleName = typeof role === 'object' ? role.name : role;
                                            return (
                                                <SelectItem key={roleName} value={roleName}>
                                                    {roleName}
                                                </SelectItem>
                                            );
                                        })}
                                    </Select>
                                </div>

                              

                                {/* Password fields (only for new users) */}
                                {!editMode && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={form.data.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            onBlur={() => form.validate('password')}
                                            isInvalid={form.invalid('password')}
                                            errorMessage={form.errors.password}
                                            isRequired={!editMode}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            endContent={
                                                <button
                                                    className="focus:outline-none"
                                                    type="button"
                                                    onClick={handleTogglePasswordVisibility}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-4 h-4 text-default-400" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 text-default-400" />
                                                    )}
                                                </button>
                                            }
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />

                                        <Input
                                            label="Confirm Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Confirm password"
                                            value={form.data.password_confirmation}
                                            onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                            onBlur={() => form.validate('password_confirmation')}
                                            isInvalid={form.invalid('password_confirmation') || (form.data.password !== form.data.password_confirmation && form.data.password_confirmation)}
                                            errorMessage={form.errors.password_confirmation || (form.data.password !== form.data.password_confirmation && form.data.password_confirmation ? 'Passwords do not match' : '')}
                                            isRequired={!editMode}
                                            variant="bordered"
                                            size="sm"
                                            radius={themeRadius}
                                            endContent={
                                                <button
                                                    className="focus:outline-none"
                                                    type="button"
                                                    onClick={handleTogglePasswordVisibility}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-4 h-4 text-default-400" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 text-default-400" />
                                                    )}
                                                </button>
                                            }
                                            classNames={{
                                                input: "text-small",
                                                inputWrapper: "min-h-unit-10"
                                            }}
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        />
                                    </div>
                                )}
                            </form>
                        </ModalBody>
                        
                        <ModalFooter className="flex justify-between px-4 sm:px-6 py-3 sm:py-4" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <Button 
                                variant="light" 
                                onPress={closeModal}
                                isDisabled={form.processing}
                                radius={themeRadius}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Cancel
                            </Button>
                            
                            <Button
                                variant="solid"
                                color="primary"
                                onPress={handleSubmit}
                                isLoading={form.processing}
                                isDisabled={!isFormValid()}
                                radius={themeRadius}
                                style={{
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                {editMode ? 'Update User' : 'Add User'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default AddEditUserForm;
