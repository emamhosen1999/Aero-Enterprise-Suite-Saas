import React, { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
    Chip,
    Divider,
    Card,
    CardBody,
} from "@heroui/react";
import {
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { getThemeRadius } from '@/Hooks/useThemeRadius';

/**
 * ObjectionWarningModal - Blocking modal that requires confirmation 
 * when updating RFI submission date while active objections exist.
 */
const ObjectionWarningModal = ({
    isOpen,
    onClose,
    onConfirm,
    dailyWork,
    newSubmissionDate,
    activeObjectionsCount,
    activeObjections = [],
    isLoading = false,
}) => {
    const [reason, setReason] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);

    const handleConfirm = () => {
        if (!reason.trim()) {
            return;
        }
        onConfirm(reason);
    };

    const handleClose = () => {
        setReason('');
        setAcknowledged(false);
        onClose();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Don't render if dailyWork is missing
    if (!dailyWork) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            placement="center"
            isDismissable={false}
            hideCloseButton={true}
        >
            <ModalContent>
                {(onCloseModal) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 bg-warning-50 dark:bg-warning-900/20">
                            <div className="flex items-center gap-2 text-warning-700 dark:text-warning-400">
                                <ShieldExclamationIcon className="w-6 h-6" />
                                <span className="font-bold">⚠️ Active Objections Warning</span>
                            </div>
                        </ModalHeader>

                        <ModalBody className="py-6">
                            {/* Warning Message */}
                            <div className="bg-warning-100 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-warning-800 dark:text-warning-300 mb-2">
                                            This RFI has {activeObjectionsCount} active objection{activeObjectionsCount !== 1 ? 's' : ''}
                                        </p>
                                        <p className="text-sm text-warning-700 dark:text-warning-400">
                                            Changing the RFI submission date while objections are pending may:
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-warning-700 dark:text-warning-400 mt-2 space-y-1">
                                            <li>Affect approval timelines and workflows</li>
                                            <li>Impact official records and documentation</li>
                                            <li>Create discrepancies in claims or reports</li>
                                            <li>Cause issues with regulatory compliance</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* RFI Details */}
                            <Card className="mb-4">
                                <CardBody className="p-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <DocumentTextIcon className="w-4 h-4 text-default-500" />
                                            <span className="font-medium">RFI Number:</span>
                                            <span>{dailyWork?.number}</span>
                                        </div>
                                        <Chip size="sm" color="warning" variant="flat">
                                            {activeObjectionsCount} Active Objection{activeObjectionsCount !== 1 ? 's' : ''}
                                        </Chip>
                                    </div>
                                    <Divider className="my-2" />
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CalendarDaysIcon className="w-4 h-4 text-default-500" />
                                            <span>Current Date:</span>
                                            <span className="font-medium">
                                                {formatDate(dailyWork?.rfi_submission_date)}
                                            </span>
                                        </div>
                                        <span>→</span>
                                        <div className="flex items-center gap-2">
                                            <span>New Date:</span>
                                            <span className="font-medium text-primary">
                                                {formatDate(newSubmissionDate)}
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Active Objections List */}
                            {activeObjections.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium mb-2">Active Objections:</p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {activeObjections.map((obj) => (
                                            <div 
                                                key={obj.id} 
                                                className="flex items-center justify-between p-2 bg-default-100 dark:bg-default-50/10 rounded text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
                                                    <span className="font-medium">{obj.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-default-500 text-xs">
                                                    <span>{obj.created_by?.name}</span>
                                                    <Chip size="sm" variant="flat" color="warning">
                                                        {obj.status?.replace('_', ' ')}
                                                    </Chip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reason Input */}
                            <div>
                                <p className="text-sm font-medium mb-2 text-danger">
                                    * Provide a reason for overriding this warning:
                                </p>
                                <Textarea
                                    placeholder="Explain why you need to change the submission date despite active objections..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    minRows={3}
                                    isRequired
                                    classNames={{
                                        inputWrapper: "border-warning focus-within:border-warning-500",
                                    }}
                                />
                                <p className="text-xs text-default-400 mt-1">
                                    This action will be logged for audit purposes.
                                </p>
                            </div>
                        </ModalBody>

                        <ModalFooter className="bg-default-50 dark:bg-default-100/5">
                            <Button
                                variant="light"
                                onPress={handleClose}
                                isDisabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="warning"
                                onPress={handleConfirm}
                                isLoading={isLoading}
                                isDisabled={!reason.trim()}
                                startContent={!isLoading && <ShieldExclamationIcon className="w-4 h-4" />}
                            >
                                I Understand, Proceed Anyway
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ObjectionWarningModal;
