import React, {useState} from 'react';
import axios from 'axios';
import {Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner} from '@heroui/react';
import {GraduationCap, Plus, X} from 'lucide-react';
import {showToast} from '@/utils/toastUtils';

const EducationInformationDialog = ({ user, open, closeModal, setUser }) => {
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

    const [updatedUser, setUpdatedUser] = useState({
        id: user.id
    });
    const [dataChanged, setDataChanged] = useState(false);
    const [educationList, setEducationList] = useState(user.educations && user.educations.length > 0 ? user.educations : [{ institution: "", subject: "", degree: "", starting_date: "", complete_date: "", grade: "" }]);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleEducationChange = (index, field, value) => {
        const updatedList = [...educationList];
        updatedList[index] = { ...updatedList[index], [field]: value };
        setEducationList(updatedList);

        const changedEducations = updatedList.filter((entry, i) => {
            const originalEntry = user.educations[i] || {};
            const hasChanged = (
                !originalEntry.id ||
                entry.institution !== originalEntry.institution ||
                entry.subject !== originalEntry.subject ||
                entry.degree !== originalEntry.degree ||
                entry.starting_date !== originalEntry.starting_date ||
                entry.complete_date !== originalEntry.complete_date ||
                entry.grade !== originalEntry.grade
            );

            // If reverted to the original value, remove it from the list of changes
            const hasReverted = (
                originalEntry.id &&
                entry.institution === originalEntry.institution &&
                entry.subject === originalEntry.subject &&
                entry.degree === originalEntry.degree &&
                entry.starting_date === originalEntry.starting_date &&
                entry.complete_date === originalEntry.complete_date &&
                entry.grade === originalEntry.grade
            );

            return hasChanged && !hasReverted;
        });

        setUpdatedUser(prevUser => ({
            ...prevUser,
            educations: [...changedEducations],
        }));

        const hasChanges = changedEducations.length > 0;
        setDataChanged(hasChanges);
    };



    const handleEducationRemove = async (index) => {
        const removedEducation = educationList[index];
        const updatedList = educationList.filter((_, i) => i !== index);
        setEducationList(updatedList.length > 0 ? updatedList : [{ institution: "", subject: "", degree: "", starting_date: "", complete_date: "", grade: "" }]);

        if (removedEducation.id) {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    const response = await axios.delete('/education/delete', {
                        data: { id: removedEducation.id, user_id: user.id }
                    });

                    if (response.status === 200) {
                        // Update the user state with the returned educations from the server
                        setUpdatedUser(prevUser => ({
                            ...prevUser,
                            educations: response.data.educations,
                        }));

                        setUser(prevUser => ({
                            ...prevUser,
                            educations: response.data.educations,
                        }));

                        // Resolve with the message returned from the server
                        resolve([response.data.message || 'Education record deleted successfully.']);
                    }
                } catch (error) {
                    if (error.response?.status === 422) {
                        setErrors(error.response.data.errors);
                    }
                    // Reject with a generic error message
                    reject([error.response?.data?.error || error.response?.data?.message || 'Failed to delete education record.']);
                }
            });

            showToast.promise(promise, {
                loading: 'Deleting education record...',
                success: (data) => data[0],
                error: (data) => Array.isArray(data) ? data[0] : data,
            });
        }
    };



    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/education/update', {
                    educations: educationList.map(entry => ({ ...entry, user_id: user.id }))
                });

                if (response.status === 200) {
                    // Update the user state with the returned educations from the server
                    setUser(prevUser => ({
                        ...prevUser,
                        educations: response.data.educations,
                    }));
                    closeModal();
                    resolve(response.data.messages || ['Education records updated successfully.']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setErrors(error.response.data.errors);
                }
                reject([error.response?.data?.error || error.response?.data?.message || 'Failed to update education records.']);
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating education records...',
            success: (data) => Array.isArray(data) ? data.join(', ') : data,
            error: (data) => Array.isArray(data) ? data[0] : data,
        });
    };



    const handleAddMore = async () => {
        setEducationList([...educationList, { institution: "", subject: "", degree: "", starting_date: "", complete_date: "", grade: "" }]);
    };

    return (
        <Modal
            isOpen={open}
            onOpenChange={processing ? undefined : closeModal}
            size="3xl"
            radius={getThemeRadius()}
            scrollBehavior="inside"
            classNames={{
                base: "bg-content1",
                backdrop: "bg-black/50 backdrop-blur-sm",
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                    borderBottom: '1px solid var(--theme-divider)'
                }}>
                    <div className="p-2 rounded-lg" style={{
                        background: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                        borderRadius: `var(--borderRadius, 8px)`,
                    }}>
                        <GraduationCap size={20} style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <span className="text-lg font-semibold" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        Education Information
                    </span>
                </ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="space-y-4">
                        {educationList.map((education, index) => (
                            <div key={index}>
                                <Card className="shadow-lg">
                                    <div className="p-4 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                                Education #{index + 1}
                                            </h4>
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                onPress={() => handleEducationRemove(index)}
                                                className="text-red-500 hover:text-red-700"
                                                size="sm"
                                                radius={getThemeRadius()}
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Input
                                                    label="Institution"
                                                    value={education.institution || ''}
                                                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.institution`])}
                                                    errorMessage={errors[`educations.${index}.institution`] ? errors[`educations.${index}.institution`][0] : ''}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    classNames={{
                                                        input: "text-small",
                                                        inputWrapper: "min-h-unit-10"
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Degree"
                                                    value={education.degree || ''}
                                                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.degree`])}
                                                    errorMessage={errors[`educations.${index}.degree`] ? errors[`educations.${index}.degree`][0] : ''}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    classNames={{
                                                        input: "text-small",
                                                        inputWrapper: "min-h-unit-10"
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Subject"
                                                    value={education.subject || ''}
                                                    onChange={(e) => handleEducationChange(index, 'subject', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.subject`])}
                                                    errorMessage={errors[`educations.${index}.subject`] ? errors[`educations.${index}.subject`][0] : ''}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    classNames={{
                                                        input: "text-small",
                                                        inputWrapper: "min-h-unit-10"
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Started in"
                                                    type="month"
                                                    value={education.starting_date || ''}
                                                    onChange={(e) => handleEducationChange(index, 'starting_date', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.starting_date`])}
                                                    errorMessage={errors[`educations.${index}.starting_date`] ? errors[`educations.${index}.starting_date`][0] : ''}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    classNames={{
                                                        input: "text-small",
                                                        inputWrapper: "min-h-unit-10"
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Completed in"
                                                    type="month"
                                                    value={education.complete_date || ''}
                                                    onChange={(e) => handleEducationChange(index, 'complete_date', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.complete_date`])}
                                                    errorMessage={errors[`educations.${index}.complete_date`] ? errors[`educations.${index}.complete_date`][0] : ''}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    classNames={{
                                                        input: "text-small",
                                                        inputWrapper: "min-h-unit-10"
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Grade"
                                                    value={education.grade || ''}
                                                    onChange={(e) => handleEducationChange(index, 'grade', e.target.value)}
                                                    isInvalid={Boolean(errors[`educations.${index}.grade`])}
                                                    errorMessage={errors[`educations.${index}.grade`] ? errors[`educations.${index}.grade`][0] : ''}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    classNames={{
                                                        input: "text-small",
                                                        inputWrapper: "min-h-unit-10"
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                        <div className="mt-4">
                            <Button 
                                size="sm" 
                                color="danger" 
                                variant="bordered"
                                onPress={handleAddMore}
                                startContent={<Plus size={16} />}
                                radius={getThemeRadius()}
                            >
                                Add More
                            </Button>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter style={{
                    borderTop: '1px solid var(--theme-divider)',
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <Button
                        onPress={closeModal}
                        isDisabled={processing}
                        variant="light"
                        radius={getThemeRadius()}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        isDisabled={!dataChanged}
                        variant="bordered"
                        color="primary"
                        type="submit"
                        isLoading={processing}
                        radius={getThemeRadius()}
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        Submit
                    </Button>
                </ModalFooter>
            </form>
            </ModalContent>
        </Modal>
    );
};

export default EducationInformationDialog;
