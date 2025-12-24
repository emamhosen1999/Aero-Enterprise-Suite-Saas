import React, { useState } from 'react';
import { 
    Button, 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Textarea,
    useDisclosure
} from '@heroui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import { route } from 'ziggy-js';

export default function ApprovalActions({ leave, onApprovalComplete }) {
    const { isOpen: isApproveOpen, onOpen: onApproveOpen, onClose: onApproveClose } = useDisclosure();
    const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
    const [comments, setComments] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleApprove = async () => {
        setProcessing(true);
        setErrors({});

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('leaves.approve', leave.id), {
                    comments: comments || null
                });

                if (response.status === 200 && response.data.success) {
                    onApproveClose();
                    setComments('');
                    if (onApprovalComplete) {
                        onApprovalComplete(response.data);
                    }
                    resolve([response.data.message || 'Leave approved successfully']);
                } else {
                    reject([response.data.message || 'Failed to approve leave']);
                }
            } catch (error) {
                console.error('Approval error:', error);
                if (error.response?.data?.message) {
                    reject([error.response.data.message]);
                } else {
                    reject(['An error occurred while approving the leave']);
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Approving leave...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };

    const handleReject = async () => {
        setProcessing(true);
        setErrors({});

        if (!rejectionReason || rejectionReason.trim().length < 10) {
            setErrors({ reason: 'Rejection reason must be at least 10 characters' });
            setProcessing(false);
            return;
        }

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('leaves.reject', leave.id), {
                    reason: rejectionReason
                });

                if (response.status === 200 && response.data.success) {
                    onRejectClose();
                    setRejectionReason('');
                    if (onApprovalComplete) {
                        onApprovalComplete(response.data);
                    }
                    resolve([response.data.message || 'Leave rejected successfully']);
                } else {
                    reject([response.data.message || 'Failed to reject leave']);
                }
            } catch (error) {
                console.error('Rejection error:', error);
                if (error.response?.status === 422) {
                    setErrors(error.response.data.errors || {});
                    reject([Object.values(error.response.data.errors || {}).flat().join(', ')]);
                } else if (error.response?.data?.message) {
                    reject([error.response.data.message]);
                } else {
                    reject(['An error occurred while rejecting the leave']);
                }
            } finally {
                setProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Rejecting leave...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    color="success"
                    variant="solid"
                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                    onPress={onApproveOpen}
                    size="sm"
                >
                    Approve
                </Button>
                <Button
                    color="danger"
                    variant="solid"
                    startContent={<XCircleIcon className="w-4 h-4" />}
                    onPress={onRejectOpen}
                    size="sm"
                >
                    Reject
                </Button>
            </div>

            {/* Approve Modal */}
            <Modal isOpen={isApproveOpen} onClose={onApproveClose} size="md">
                <ModalContent>
                    <ModalHeader>Approve Leave Request</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-600 mb-4">
                            Are you sure you want to approve this leave request?
                        </p>
                        <Textarea
                            label="Comments (Optional)"
                            placeholder="Add any comments for the approval..."
                            value={comments}
                            onValueChange={setComments}
                            variant="bordered"
                            size="sm"
                            minRows={3}
                            maxRows={5}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="default"
                            variant="bordered"
                            onPress={onApproveClose}
                            size="sm"
                            isDisabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="success"
                            onPress={handleApprove}
                            size="sm"
                            isLoading={processing}
                            startContent={!processing && <CheckCircleIcon className="w-4 h-4" />}
                        >
                            Approve
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Reject Modal */}
            <Modal isOpen={isRejectOpen} onClose={onRejectClose} size="md">
                <ModalContent>
                    <ModalHeader>Reject Leave Request</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-600 mb-4">
                            Please provide a reason for rejecting this leave request.
                        </p>
                        <Textarea
                            label="Rejection Reason"
                            placeholder="Explain why this leave is being rejected (minimum 10 characters)..."
                            value={rejectionReason}
                            onValueChange={setRejectionReason}
                            isInvalid={Boolean(errors.reason)}
                            errorMessage={errors.reason}
                            variant="bordered"
                            size="sm"
                            minRows={3}
                            maxRows={5}
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="default"
                            variant="bordered"
                            onPress={onRejectClose}
                            size="sm"
                            isDisabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleReject}
                            size="sm"
                            isLoading={processing}
                            startContent={!processing && <XCircleIcon className="w-4 h-4" />}
                        >
                            Reject
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
