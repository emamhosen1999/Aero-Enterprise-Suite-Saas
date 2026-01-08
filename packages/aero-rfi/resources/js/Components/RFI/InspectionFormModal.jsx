import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

/**
 * InspectionFormModal - RFI Creation/Edit Modal
 * 
 * TODO: Full implementation with:
 * - GPS coordinate capture
 * - Live continuity checking
 * - Map preview
 * - File upload zone
 * - Precognition validation
 */
const InspectionFormModal = ({ open, onClose, rfi = null, onSaved }) => {
    return (
        <Modal 
            isOpen={open} 
            onOpenChange={onClose}
            size="3xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader>
                    <h2 className="text-lg font-semibold">
                        {rfi ? 'Edit RFI' : 'Create New RFI'}
                    </h2>
                </ModalHeader>
                <ModalBody>
                    <p className="text-default-500">
                        Form implementation in progress. Will include GPS validation, 
                        continuity checking, and real-time map preview.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>Cancel</Button>
                    <Button color="primary" onPress={onSaved}>Save</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default InspectionFormModal;
