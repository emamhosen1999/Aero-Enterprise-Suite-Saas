import {
    Box,
    CircularProgress,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    TextField,
    Typography
} from "@mui/material";
import React, {useEffect, useState} from "react";
import ClearIcon from '@mui/icons-material/Clear';
import { Modal, ModalContent } from "@heroui/react";
import {PhotoCamera} from "@mui/icons-material";

import ProfileAvatar from '@/Components/ProfileAvatar';

import LoadingButton from "@mui/lab/LoadingButton";
import { showToast } from "@/utils/toastUtils";
import {TextField, SelectItem, Select} from "@mui/material";
import PasswordIcon from "@mui/icons-material/Password";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";

const AddUserForm = ({user, allUsers, departments, designations,setUser, open, closeModal }) => {

    const [showPassword, setShowPassword] = useState(false);
    const [initialUserData, setInitialUserData] = useState({
        id: user?.id,
        name: user?.name || '',
        user_name: user?.user_name || '',
        gender: user?.gender || '',
        birthday: user?.birthday || '',
        date_of_joining: user?.date_of_joining || '',
        address: user?.address || '',
        employee_id: user?.employee_id || '',
        phone: user?.phone || '',
        email: user?.email || '',
        department: user?.department || '',
        designation: user?.designation || '',
        report_to: user?.report_to || '',
        password: '',
        confirmPassword: ''
    });


    const [changedUserData, setChangedUserData] = useState({
        id: user?.id,
    });

    const [dataChanged, setDataChanged] = useState(false);


    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [hover, setHover] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [allDesignations, setAllDesignations] = useState(designations);
    const [allReportTo, setAllReportTo] = useState(allUsers);



    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        // Create a FormData object to handle both text and file data
        const formData = new FormData();

        // Append the user data to FormData
        Object.keys(initialUserData).forEach(key => {
            formData.append(key, initialUserData[key]);
        });

        // Check if a new image has been selected and add it to FormData
        if (selectedImageFile) {
            const fileType = selectedImageFile.type;
            if (['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
                formData.append('profile_image', selectedImageFile);
            } else {
                showToast.error('Invalid file type. Only JPEG and PNG are allowed.');
                setProcessing(false);
                return;
            }
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('addUser'), formData);

                if (response.status === 200) {
                    setUser(response.data.user);
                    closeModal();
                    resolve([response.data.messages?.length > 0
                        ? response.data.messages.join(' ')
                        : 'User added successfully']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setErrors(error.response.data.errors || {});
                    reject([error.response.data.error || 'Validation failed. Please check your input.']);
                } else if (error.request) {
                    reject(['No response from server. Check your connection.']);
                } else {
                    reject([error.response?.data?.message || 'Failed to add user']);
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Adding user...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
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
        setInitialUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }


            return updatedData;
        });

        setChangedUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }


            return updatedData;
        });


    };

    useEffect(() => {

        // Special case handling
        if (user?.department !== initialUserData.department) {
            // Reset designation and report_to if department changes
            initialUserData.designation = null;
            initialUserData.report_to = null;
        }

        // Update designations based on the current department or the initial department
        setAllDesignations(
            designations.filter((designation) =>
                designation.department_id === (changedUserData.department || initialUserData.department)
            )
        );

        setAllReportTo(
            allUsers.filter((user) =>
                user.department === (changedUserData.department || initialUserData.department)
            )
        );

        // Function to filter out unchanged data from changedUserData
        const updatedChangedUserData = { ...changedUserData };
        for (const key in updatedChangedUserData) {
            // Skip comparison for 'id' or if the value matches the original data
            if (user && key !== 'id' && updatedChangedUserData[key] === user[key]) {
                delete updatedChangedUserData[key]; // Remove unchanged data
            }
        }

        // Determine if there are any changes excluding 'id'
        const hasChanges = Object.keys(updatedChangedUserData).length > 1;

        setDataChanged(hasChanges);

    }, [initialUserData, changedUserData]);
    return (
        <Modal
            isOpen={open}
            onClose={closeModal}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "border border-divider bg-content1 shadow-lg",
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
            <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                <Typography>Profile Information</Typography>
                <IconButton
                    variant="outlined"
                    color="primary"
                    onClick={closeModal}
                    sx={{position: 'absolute', top: 8, right: 16}}
                >
                    <ClearIcon/>
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} display="flex" alignItems="center" justifyContent="center">
                            <Box
                                position="relative"
                                display="inline-block"
                                onMouseEnter={() => setHover(true)}
                                onMouseLeave={() => setHover(false)}
                            >
                                <ProfileAvatar
                                    name={changedUserData.name || initialUserData.name}
                                    src={selectedImage || user?.profile_image_url || user?.profile_image}
                                    size="lg"
                                    className="w-[100px] h-[100px] text-xl"
                                    showBorder
                                />
                                {hover && (
                                    <>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                bgcolor: 'rgba(0, 0, 0, 0.5)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <IconButton
                                                color="primary"
                                                component="span"
                                            >
                                                <PhotoCamera/>
                                            </IconButton>
                                        </Box>
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
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            top: 0,
                                            left: 0,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                        }}
                                    />
                                </label>
                            </Box>

                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                type={'text'}
                                label="Name"
                                variant={'bordered'}
                                isInvalid={Boolean(errors.name)}
                                errorMessage={errors.name}
                                fullWidth
                                value={changedUserData.name || initialUserData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Username"
                                fullWidth
                                value={changedUserData.user_name || initialUserData.user_name || ''}
                                onChange={(e) => handleChange('user_name', e.target.value)}
                                type={'text'}
                                variant={'bordered'}
                                isInvalid={Boolean(errors.user_name)}
                                errorMessage={errors.user_name}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Email Adress"
                                fullWidth
                                value={changedUserData.email || initialUserData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                type={'email'}
                                variant={'bordered'}
                                isInvalid={Boolean(errors.email)}
                                errorMessage={errors.email}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Phone Number"
                                fullWidth
                                value={changedUserData.phone || initialUserData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                type={'tel'}
                                variant={'bordered'}
                                isInvalid={Boolean(errors.phone)}
                                errorMessage={errors.phone}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                variant={'bordered'}
                                errorMessage={errors.password}
                                isInvalid={Boolean(errors.password)}
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={changedUserData.password || initialUserData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                fullWidth
                                endContent={
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                }
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Confirm Password"
                                type={"password"}
                                variant={'bordered'}
                                errorMessage={errors.confirmPassword}
                                isInvalid={Boolean(errors.confirmPassword)}
                                value={changedUserData.confirmPassword || initialUserData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Select
                                variant={'bordered'}
                                fullWidth
                                label="Gender"
                                placeholder="Select Gender"
                                value={changedUserData.gender || initialUserData.gender || 'na'}
                                onChange={(e) => {
                                    handleChange('gender', e.target ? e.target.value : e); // Check if it's an event object or a value
                                }}
                                errorMessage={Boolean(errors.gender)}
                                popoverProps={{
                                    classNames: {
                                        content: "bg-transparent backdrop-blur-lg border-inherit",
                                    },
                                }}
                            >
                                <SelectItem value="na" disabled>
                                    Select Gender
                                </SelectItem>
                                <SelectItem value={'Male'}>Male</SelectItem>
                                <SelectItem value={'Female'}>Female</SelectItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Birth Date"
                                type="date"
                                fullWidth
                                variant="bordered"
                                value={changedUserData.birthday || initialUserData.birthday || ''}
                                onChange={(e) => handleChange('birthday', e.target.value)}
                                isInvalid={Boolean(errors.birthday)}
                                errorMessage={errors.birthday}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Joining Date"
                                type="date"
                                variant="bordered"
                                fullWidth
                                value={changedUserData.date_of_joining || initialUserData.date_of_joining || ''}
                                onChange={(e) => handleChange('date_of_joining', e.target.value)}
                                isInvalid={Boolean(errors.date_of_joining)}
                                errorMessage={errors.date_of_joining}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Input
                                label="Address"
                                fullWidth
                                type={'text'}
                                variant="bordered"
                                value={changedUserData.address || initialUserData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                isInvalid={Boolean(errors.address)}
                                errorMessage={errors.address}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Employee ID"
                                type={'text'}
                                variant="bordered"
                                fullWidth
                                value={changedUserData.employee_id || initialUserData.employee_id || ''}
                                onChange={(e) => handleChange('employee_id', e.target.value)}
                                isInvalid={Boolean(errors.employee_id)}
                                errorMessage={errors.employee_id}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Select
                                variant="bordered"
                                fullWidth
                                label="Department"
                                placeholder="Select Department"
                                value={changedUserData.department || initialUserData.department || 'na'}
                                onChange={(e) => {
                                    handleChange('department', e.target ? e.target.value : e); // Check if it's an event object or a value
                                }}
                                errorMessage={Boolean(errors.department)}
                                popoverProps={{
                                    classNames: {
                                        content: "bg-transparent backdrop-blur-lg",
                                    },
                                }}
                            >
                                <SelectItem value="na" disabled>
                                    Select Department
                                </SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Select
                                variant="bordered"
                                fullWidth
                                label="Designation"
                                placeholder="Select Designation"
                                value={changedUserData.designation || initialUserData.designation || 'na'}
                                onChange={(e) => {
                                    handleChange('designation', e.target ? e.target.value : e); // Check if it's an event object or a value
                                }}
                                errorMessage={Boolean(errors.designation) ? 'This field is required' : ''}
                                disabled={!user?.department}
                                popoverProps={{
                                    classNames: {
                                        content: "bg-transparent backdrop-blur-lg",
                                    },
                                }}
                            >
                                <SelectItem value="na" disabled>
                                    Select Designation
                                </SelectItem>
                                {allDesignations.map((desig) => (
                                    <SelectItem key={desig.id} value={desig.id}>
                                        {desig.title}
                                    </SelectItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Select
                                variant="bordered"
                                fullWidth
                                label="Reports To"
                                placeholder="Select Reports To"
                                value={changedUserData.report_to || initialUserData.report_to}
                                onChange={(e) => {
                                    handleChange('report_to', e.target ? e.target.value : e); // Check if it's an event object or a value
                                }}
                                errorMessage={Boolean(errors.report_to) ? 'This field is required' : ''}
                                disabled={user?.report_to === 'na'}
                                popoverProps={{
                                    classNames: {
                                        content: "bg-transparent backdrop-blur-lg",
                                    },
                                }}
                            >
                                <SelectItem value="na" disabled>
                                    --
                                </SelectItem>
                                {allReportTo.map((pers) => (
                                    <SelectItem key={pers.id} value={pers.id}>
                                        {pers.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                    }}
                >
                    <LoadingButton
                        disabled={!dataChanged}
                        sx={{
                            borderRadius: '50px',
                            padding: '6px 16px',
                        }}
                        variant="outlined"
                        color="primary"
                        type="submit"
                        loading={processing}
                    >
                        Submit
                    </LoadingButton>
                </DialogActions>
            </form>
            </ModalContent>
        </Modal>


    )
        ;
};

export default AddUserForm;
