import React, { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip
} from '@heroui/react';
import { 
    ExclamationTriangleIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

import ProfileAvatar from './ProfileAvatar';

const DeleteEmployeeModal = ({ 
    open, 
    onClose, 
    employee, 
    onConfirm,
    loading = false 
}) => {

    
    if (!employee) return null;

    const hasActiveData = employee.active_projects_count > 0 || 
                         employee.pending_leaves_count > 0 || 
                         employee.active_trainings_count > 0;

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            size="2xl"
            classNames={{
                backdrop: "bg-black/50 backdrop-blur-sm",
                base: "border border-white/20 bg-white/90 backdrop-blur-md",
                header: "border-b border-danger/30 bg-gradient-to-r from-danger-50/50 to-danger-100/30",
                body: "py-0",
                footer: "border-t border-white/10 bg-white/5"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex items-center gap-4 pb-4">
                    <div className="flex items-center gap-4 text-danger">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-danger/20 to-danger/10 flex items-center justify-center border border-danger/30">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold">Delete Employee</h2>
                    </div>
                </ModalHeader>

                <ModalBody>
                    {/* Employee Information */}
                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 mb-6 transition-all duration-300">
                        <div className="flex items-center gap-6 mb-6">
                            <ProfileAvatar
                                src={employee.profile_image_url || employee.profile_image}
                                name={employee.name}
                                size="lg"
                                className="ring-2 ring-white/20 shadow-lg"
                            />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-1">{employee.name}</h3>
                                <p className="text-sm text-default-500">{employee.email}</p>
                                {employee.employee_id && (
                                    <span className="inline-block mt-1 px-3 py-1 text-xs rounded-lg bg-white/10 border border-white/10">
                                        ID: {employee.employee_id}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <BuildingOfficeIcon className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-default-500 font-medium">Department</span>
                                </div>
                                <p className="text-sm font-medium">{employee.department_name || 'Not assigned'}</p>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <BriefcaseIcon className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs text-default-500 font-medium">Designation</span>
                                </div>
                                <p className="text-sm font-medium">{employee.designation_name || 'Not assigned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Warning Section */}
                    <div className="mb-6 p-4 rounded-2xl bg-danger-50/50 backdrop-blur-2xl border border-danger/30">
                        <div className="flex items-center gap-3 text-danger">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            <p className="text-sm font-medium">
                                This action will permanently delete the employee record and cannot be undone.
                            </p>
                        </div>
                    </div>

                    {/* Active Data Warning */}
                    {hasActiveData && (
                        <div className="p-6 rounded-2xl bg-warning-50/50 backdrop-blur-2xl border border-warning/30 mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                                    <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
                                </div>
                                <h4 className="text-sm font-semibold text-warning">Employee Has Active Data</h4>
                            </div>
                            
                            <p className="text-sm text-default-500 mb-4">
                                This employee has the following active records that will also be affected:
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                                {employee.active_projects_count > 0 && (
                                    <Chip 
                                        size="sm" 
                                        variant="flat"
                                        color="warning"
                                        className="bg-warning/20 text-warning border border-warning/30"
                                    >
                                        {employee.active_projects_count} Active Projects
                                    </Chip>
                                )}
                                {employee.pending_leaves_count > 0 && (
                                    <Chip 
                                        size="sm" 
                                        variant="flat"
                                        color="warning"
                                        className="bg-warning/20 text-warning border border-warning/30"
                                    >
                                        {employee.pending_leaves_count} Pending Leaves
                                    </Chip>
                                )}
                                {employee.active_trainings_count > 0 && (
                                    <Chip 
                                        size="sm" 
                                        variant="flat"
                                        color="warning"
                                        className="bg-warning/20 text-warning border border-warning/30"
                                    >
                                        {employee.active_trainings_count} Active Trainings
                                    </Chip>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Confirmation Text */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-4">
                        <p className="text-sm mb-2 font-medium">
                            Are you sure you want to delete <span className="text-danger font-semibold">
                                {employee.name}
                            </span>?
                        </p>
                        <p className="text-xs text-default-500">
                            Type the employee's name below to confirm this permanent deletion:
                        </p>
                    </div>
                </ModalBody>

                <ModalFooter className="flex justify-between px-6 py-6 bg-white/5">
                    <Button 
                        variant="light" 
                        onPress={onClose}
                        isDisabled={loading}
                        className="hover:bg-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        color="danger"
                        variant="solid"
                        onPress={onConfirm}
                        isLoading={loading}
                        startContent={!loading && <TrashIcon className="w-4 h-4" />}
                        className="bg-gradient-to-r from-danger to-danger-600 hover:from-danger-600 hover:to-danger-700 shadow-lg"
                    >
                        {loading ? 'Deleting...' : 'Delete Employee'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeleteEmployeeModal;
