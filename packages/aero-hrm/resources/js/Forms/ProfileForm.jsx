import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Spinner
} from "@heroui/react";
import React, {useEffect, useState} from "react";
import {Camera, X} from 'lucide-react';
import {showToast} from "@/utils/toastUtils";
import ProfileAvatar from '@/Components/ProfileAvatar';

const ProfileForm = ({user, allUsers, departments, designations,setUser, open, closeModal }) => {

    const [initialUserData, setInitialUserData] = useState({
        id: user.id,
        name: user.name || '',
        gender: user.gender || '',
        birthday: user.birthday || '',
        date_of_joining: user.date_of_joining || '',
        address: user.address || '',
        employee_id: user.employee_id || '',
        phone: user.phone || '',
        email: user.email || '',
        department: user.department_id || user.department || '',
        designation: user.designation_id || user.designation || '',
        report_to: user.report_to_id || user.report_to || '',
    });


    const [changedUserData, setChangedUserData] = useState({
        id: user.id,
    });

    const [dataChanged, setDataChanged] = useState(false);


    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [hover, setHover] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [allDesignations, setAllDesignations] = useState(designations);
    const [allReportTo, setAllReportTo] = useState(allUsers);


    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const fileType = file.type;
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
                showToast.error('Invalid file type. Only JPEG and PNG are allowed.', {
                    icon: '🔴',
                    style: {
                        background: 'var(--theme-content1, #FFFFFF)',
                        border: '1px solid var(--theme-danger, #F31260)',
                        color: 'var(--theme-foreground, #11181C)',
                        borderRadius: 'var(--borderRadius, 12px)',
                        fontFamily: 'var(--fontFamily, "Inter")'
                    }
                });
                return;
            }

            // Create an object URL for preview
            const objectURL = URL.createObjectURL(file);
            setSelectedImage(objectURL);

            const promise = new Promise(async (resolve, reject) => {
                try {
                    const formData = new FormData();
                    formData.append('id', user.id);
                    formData.append('profile_image', file);
                    formData.append('ruleSet', 'profile_image');

                    const response = await axios.post(route('profile.update'), formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        }
                    });

                    if (response.data.user) {
                        setUser(response.data.user);
                        setSelectedImage(null); // Clear preview after successful upload
                        resolve(response.data.messages || ['Profile image updated successfully']);
                    } else {
                        reject('Failed to update profile image');
                    }
                } catch (error) {
                    setSelectedImage(null); // Clear preview on error
                    
                    if (error.response?.status === 422) {
                        const errors = error.response.data.errors;
                        const errorMessages = Object.values(errors).flat();
                        reject(errorMessages.join('. '));
                    } else if (error.response?.data?.error) {
                        reject(error.response.data.error);
                    } else {
                        reject(error.message || 'Failed to update profile image');
                    }
                }
            });

            showToast.promise(
                promise,
                {
                    pending: {
                        render() {
                            return (
                                <div className="flex items-center gap-2">
                                    <Spinner size="sm" />
                                    <span>Uploading image...</span>
                                </div>
                            );
                        },
                        icon: false,
                        style: {
                            background: 'var(--theme-content1, #FFFFFF)',
                            border: '1px solid var(--theme-divider, #E4E4E7)',
                            color: 'var(--theme-foreground, #11181C)',
                            borderRadius: 'var(--borderRadius, 12px)',
                            fontFamily: 'var(--fontFamily, "Inter")'
                        }
                    },
                    success: {
                        render({ data }) {
                            return Array.isArray(data) ? data.join('. ') : data;
                        },
                        icon: '✅',
                        style: {
                            background: 'var(--theme-content1, #FFFFFF)',
                            border: '1px solid var(--theme-success, #17C964)',
                            color: 'var(--theme-foreground, #11181C)',
                            borderRadius: 'var(--borderRadius, 12px)',
                            fontFamily: 'var(--fontFamily, "Inter")'
                        }
                    },
                    error: {
                        render({ data }) {
                            return data || 'Failed to update profile image';
                        },
                        icon: '❌',
                        style: {
                            background: 'var(--theme-content1, #FFFFFF)',
                            border: '1px solid var(--theme-danger, #F31260)',
                            color: 'var(--theme-foreground, #11181C)',
                            borderRadius: 'var(--borderRadius, 12px)',
                            fontFamily: 'var(--fontFamily, "Inter")'
                        }
                    }
                }
            );
        }
    };

    const handleChange = (key, value) => {
        setInitialUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            // Reset designation and report_to when department changes
            if (key === 'department' && value !== prevUser.department) {
                updatedData.designation = '';
                updatedData.report_to = '';
            }

            return updatedData;
        });

        setChangedUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            // Reset designation and report_to when department changes
            if (key === 'department' && value !== initialUserData.department) {
                updatedData.designation = '';
                updatedData.report_to = '';
            }

            return updatedData;
        });
    };

    useEffect(() => {
        // Update designations based on the current department
        const currentDept = changedUserData.department || initialUserData.department;
        const currentDesignation = changedUserData.designation || initialUserData.designation;
        
        // Convert to number for comparison if it exists
        const deptId = currentDept ? parseInt(currentDept) : null;
        const designationId = currentDesignation ? parseInt(currentDesignation) : null;
        
        setAllDesignations(
            designations.filter((designation) => {
                const designationDeptId = parseInt(designation.department_id);
                return deptId && designationDeptId === deptId;
            })
        );

        // Get current designation's hierarchy level
        const currentDesignationObj = designations.find(d => parseInt(d.id) === designationId);
        const currentHierarchyLevel = currentDesignationObj ? parseInt(currentDesignationObj.hierarchy_level) : 999;

        // Filter report_to list: only users from same department with higher hierarchy (lower number = higher rank)
        const filteredReportTo = allUsers.filter((u) => {
            // Check both department and department_id fields
            const userDept = parseInt(u.department_id || u.department);
            const userDesignationId = parseInt(u.designation_id || u.designation);
            
            // Find user's designation to check hierarchy
            const userDesignationObj = designations.find(d => parseInt(d.id) === userDesignationId);
            const userHierarchyLevel = userDesignationObj ? parseInt(userDesignationObj.hierarchy_level) : 999;
            
            // Include if: same department AND higher hierarchy level (lower number) OR is current report_to
            return (userDept === deptId && userHierarchyLevel < currentHierarchyLevel && userHierarchyLevel > 0) ||
                u.id === initialUserData.report_to ||
                u.id === changedUserData.report_to;
        });
        setAllReportTo(filteredReportTo);

        // Function to filter out unchanged data from changedUserData
        const updatedChangedUserData = { ...changedUserData };
        for (const key in updatedChangedUserData) {
            // Skip comparison for 'id' or if the value matches the original data
            if (key !== 'id' && updatedChangedUserData[key] === user[key]) {
                delete updatedChangedUserData[key]; // Remove unchanged data
            }
        }

        // Determine if there are any changes excluding 'id'
        const hasChanges = Object.keys(updatedChangedUserData).length > 1;

        setDataChanged(hasChanges);

    }, [initialUserData, changedUserData]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        try {
            const response = await axios.post(route('profile.update'), {
                ruleSet: 'profile',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                showToast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Profile information updated successfully', {
                    icon: '🟢',
                    style: {
                   
                        background: 'var(--theme-content1, #FFFFFF)',
                        border: '1px solid var(--theme-success, #17C964)',
                        color: 'var(--theme-foreground, #11181C)',
                        borderRadius: 'var(--borderRadius, 12px)',
                        fontFamily: 'var(--fontFamily, "Inter")'
                    }
                });
                closeModal();
            }
        } catch (error) {
            setProcessing(false);

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 422) {
                    // Handle validation errors
                    setErrors(error.response.data.errors || {});
                    showToast.error(error.response.data.error || 'Failed to update profile information.', {
                        icon: '🔴',
                        style: {
                        
                            background: 'var(--theme-content1, #FFFFFF)',
                            border: '1px solid var(--theme-danger, #F31260)',
                            color: 'var(--theme-foreground, #11181C)',
                            borderRadius: 'var(--borderRadius, 12px)',
                            fontFamily: 'var(--fontFamily, "Inter")'
                        }
                    });
                } else {
                    // Handle other HTTP errors
                    showToast.error('An unexpected error occurred. Please try again later.', {
                        icon: '🔴',
                        style: {
                 
                            background: 'var(--theme-content1, #FFFFFF)',
                            border: '1px solid var(--theme-danger, #F31260)',
                            color: 'var(--theme-foreground, #11181C)',
                            borderRadius: 'var(--borderRadius, 12px)',
                            fontFamily: 'var(--fontFamily, "Inter")'
                        }
                    });
                }
                console.error(error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                showToast.error('No response received from the server. Please check your internet connection.', {
                    icon: '🔴',
                    style: {
                  
                        background: 'var(--theme-content1, #FFFFFF)',
                        border: '1px solid var(--theme-danger, #F31260)',
                        color: 'var(--theme-foreground, #11181C)',
                        borderRadius: 'var(--borderRadius, 12px)',
                        fontFamily: 'var(--fontFamily, "Inter")'
                    }
                });
                console.error(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                showToast.error('An error occurred while setting up the request.', {
                    icon: '🔴',
                    style: {
                   
                        background: 'var(--theme-content1, #FFFFFF)',
                        border: '1px solid var(--theme-danger, #F31260)',
                        color: 'var(--theme-foreground, #11181C)',
                        borderRadius: 'var(--borderRadius, 12px)',
                        fontFamily: 'var(--fontFamily, "Inter")'
                    }
                });
                console.error('Error', error.message);
            }
        } finally {
            setProcessing(false);
        }
    };


    return (
        <Modal 
            isOpen={open} 
            onOpenChange={closeModal}
            size="5xl"
            scrollBehavior="inside"
            backdrop="blur"
            hideCloseButton={true}
            classNames={{
                backdrop: "bg-black/30",
                base: "max-h-[90vh]",
                body: "p-0",
                header: "p-0",
                footer: "p-0"
            }}
        >
            <ModalContent
                style={{
                    background: `linear-gradient(135deg, 
                        var(--theme-content1, #FAFAFA) 20%, 
                        var(--theme-content2, #F4F4F5) 10%, 
                        var(--theme-content3, #F1F3F4) 20%)`,
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    transform: `scale(var(--scale, 1))`,
                }}
            >
                <ModalHeader className="p-0">
                    <div 
                        className="flex items-center justify-between p-6 border-b w-full"
                        style={{
                            borderColor: 'var(--theme-divider, #E4E4E7)',
                            color: 'var(--theme-foreground, #11181C)'
                        }}
                    >
                        <h3 
                            className="text-lg font-semibold"
                            style={{ 
                                color: 'var(--theme-foreground, #11181C)',
                                fontFamily: 'var(--fontFamily, "Inter")'
                            }}
                        >
                            Profile Information
                        </h3>
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={closeModal}
                            style={{
                                color: 'var(--theme-foreground-600, #71717A)',
                                borderRadius: 'var(--borderRadius, 12px)'
                            }}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </ModalHeader>
                
                <ModalBody className="p-0">
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-full flex items-center justify-center">
                                    <div
                                        className="relative inline-block"
                                        onMouseEnter={() => setHover(true)}
                                        onMouseLeave={() => setHover(false)}
                                    >
                                        <ProfileAvatar
                                            src={selectedImage || user.profile_image}
                                            name={changedUserData.name || initialUserData.name}
                                            size="lg"
                                            className="w-24 h-24"
                                        />
                                                {hover && (
                                                    <>
                                                        <div
                                                            className="absolute top-0 left-0 w-full h-full rounded-full flex justify-center items-center cursor-pointer"
                                                            style={{
                                                                background: 'color-mix(in srgb, var(--theme-default, #71717A) 50%, transparent)',
                                                                borderRadius: 'var(--borderRadius, 12px)',
                                                            }}
                                                        >
                                                            <Button
                                                                isIconOnly
                                                                variant="light"
                                                                className="text-white"
                                                            >
                                                                <Camera size={20} />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                        <input
                                            accept="image/*"
                                            style={{display: 'none'}}
                                            id="upload-button"
                                            type="file"
                                            onChange={handleImageChange}
                                        />
                                        <label htmlFor="upload-button">
                                            <div
                                                className="absolute w-full h-full top-0 left-0 rounded-full cursor-pointer"
                                            />
                                        </label>
                                    </div>

                                </div>
                                <div>
                                    <Input
                                        label="Name"
                                        value={changedUserData.name || initialUserData.name || ''}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        isInvalid={Boolean(errors.name)}
                                        errorMessage={errors.name}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    />
                                </div>
                                <div>
                                    <Select
                                        label="Gender"
                                        selectedKeys={changedUserData.gender || initialUserData.gender ? [changedUserData.gender || initialUserData.gender] : []}
                                        onSelectionChange={(keys) => handleChange('gender', Array.from(keys)[0])}
                                        isInvalid={Boolean(errors.gender)}
                                        errorMessage={errors.gender}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    >
                                        <SelectItem key="Male" value="Male">Male</SelectItem>
                                        <SelectItem key="Female" value="Female">Female</SelectItem>
                                    </Select>
                                </div>
                                <div>
                                    <Input
                                        label="Birth Date"
                                        type="date"
                                        value={changedUserData.birthday || initialUserData.birthday || ''}
                                        onChange={(e) => handleChange('birthday', e.target.value)}
                                        isInvalid={Boolean(errors.birthday)}
                                        errorMessage={errors.birthday}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Joining Date"
                                        type="date"
                                        value={changedUserData.date_of_joining || initialUserData.date_of_joining || ''}
                                        onChange={(e) => handleChange('date_of_joining', e.target.value)}
                                        isInvalid={Boolean(errors.date_of_joining)}
                                        errorMessage={errors.date_of_joining}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    />
                                </div>

                                <div className="col-span-full">
                                    <Input
                                        label="Address"
                                        value={changedUserData.address || initialUserData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        isInvalid={Boolean(errors.address)}
                                        errorMessage={errors.address}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Employee ID"
                                        value={changedUserData.employee_id || initialUserData.employee_id || ''}
                                        onChange={(e) => handleChange('employee_id', e.target.value)}
                                        isInvalid={Boolean(errors.employee_id)}
                                        errorMessage={errors.employee_id}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Phone Number"
                                        value={changedUserData.phone || initialUserData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        isInvalid={Boolean(errors.phone)}
                                        errorMessage={errors.phone}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="Email Address"
                                        value={changedUserData.email || initialUserData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        isInvalid={Boolean(errors.email)}
                                        errorMessage={errors.email}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    />
                                </div>
                                <div>
                                    <Select
                                        label="Department"
                                        selectedKeys={changedUserData.department || initialUserData.department ? [String(changedUserData.department || initialUserData.department)] : []}
                                        onSelectionChange={(keys) => handleChange('department', Array.from(keys)[0])}
                                        isInvalid={Boolean(errors.department)}
                                        errorMessage={errors.department}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    >
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Select
                                        label="Designation"
                                        selectedKeys={changedUserData.designation || initialUserData.designation ? [String(changedUserData.designation || initialUserData.designation)] : []}
                                        onSelectionChange={(keys) => handleChange('designation', Array.from(keys)[0])}
                                        isInvalid={Boolean(errors.designation)}
                                        errorMessage={errors.designation}
                                        isDisabled={!(changedUserData.department || initialUserData.department)}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    >
                                        {allDesignations.map((desig) => (
                                            <SelectItem key={desig.id} value={desig.id}>
                                                {desig.title}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Select
                                        label="Reports To"
                                        selectedKeys={changedUserData.report_to || initialUserData.report_to ? [String(changedUserData.report_to || initialUserData.report_to)] : []}
                                        onSelectionChange={(keys) => handleChange('report_to', Array.from(keys)[0])}
                                        isInvalid={Boolean(errors.report_to)}
                                        errorMessage={errors.report_to}
                                        isDisabled={user.report_to === 'na'}
                                        variant="bordered"
                                        style={{
                                            borderRadius: 'var(--borderRadius, 12px)',
                                            fontFamily: 'var(--fontFamily, "Inter")'
                                        }}
                                    >
                                        <SelectItem key="na" value="na">--</SelectItem>
                                        {allReportTo.map((pers) => (
                                            <SelectItem key={pers.id} value={pers.id}>
                                                {pers.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </div>
                        
                        <ModalFooter className="p-0">
                            <div 
                                className="flex items-center justify-center p-6 border-t w-full"
                                style={{
                                    borderColor: 'var(--theme-divider, #E4E4E7)'
                                }}
                            >
                                <Button
                                    isDisabled={!dataChanged}
                                    className="rounded-full px-6"
                                    variant="bordered"
                                    color="primary"
                                    type="submit"
                                    isLoading={processing}
                                    style={{
                                        borderColor: 'var(--theme-primary, #006FEE)',
                                        color: 'var(--theme-primary, #006FEE)',
                                        borderRadius: 'var(--borderRadius, 12px)',
                                        fontFamily: 'var(--fontFamily, "Inter")'
                                    }}
                                >
                                    Submit
                                </Button>
                            </div>
                        </ModalFooter>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ProfileForm;
