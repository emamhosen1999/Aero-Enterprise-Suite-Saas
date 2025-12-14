import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import React from "react";
import {showToast} from "@/utils/toastUtils";


const DeleteLeaveForm = ({ open, handleClose, leaveIdToDelete, setLeavesData }) => {

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('leave-delete', { id: leaveIdToDelete, route: route().current() }));

                if (response.status === 200) {
                    // Assuming dailyWorkData contains the updated list of daily works after deletion
                    setLeavesData(response.data.leavesData);
                    resolve('Leave application deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                reject(error.response.data.error || 'Failed to delete leave application');
            } finally {
                handleClose();
            }
        });

        showToast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <CircularProgress />
                                <span style={{ marginLeft: '8px' }}>Deleting leave application...</span>
                            </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
                success: {
                    render({ data }) {
                        return <>{data}</>;
                    },
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
                error: {
                    render({ data }) {
                        return <>{data}</>;
                    },
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
            }
        );
    };
    return(
        <Modal
            isOpen={open}
            onClose={handleClose}
            size="md"
            classNames={{
                base: "border border-divider bg-content1 shadow-lg",
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
                <ModalHeader>
                    Confirm Deletion
                </ModalHeader>
                <ModalBody>
                    <p className="text-default-600">
                        Are you sure you want to delete this leave? This action cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={handleClose}>
                        Cancel
                    </Button>
                    <Button color="danger" onPress={handleDelete}>
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

    );
}


export default DeleteLeaveForm;
