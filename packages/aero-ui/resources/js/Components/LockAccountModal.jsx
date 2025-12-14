import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const LockAccountModal = ({ open, onClose, user, onSuccess, themeRadius = 'lg' }) => {
  const [reason, setReason] = useState('');
  const [isLocking, setIsLocking] = useState(false);

  const handleLock = async () => {
    setIsLocking(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('users.lock', user.id), {
          reason: reason || undefined,
        });

        if (response.status === 200) {
          resolve([response.data.message || 'Account locked successfully']);
          onSuccess?.(response.data.user);
          onClose();
          setReason('');
        }
      } catch (error) {
        reject(error.response?.data?.errors || [error.response?.data?.error || error.response?.data?.message || 'Failed to lock account']);
      } finally {
        setIsLocking(false);
      }
    });

    showToast.promise(promise, {
      loading: 'Locking account...',
      success: (data) => data.join(', '),
      error: (data) => Array.isArray(data) ? data.join(', ') : data,
    });
  };

  const handleClose = () => {
    if (!isLocking) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={handleClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5 text-danger" />
            <h2 className="text-lg font-semibold">Lock Account</h2>
          </div>
          <p className="text-sm text-default-500 font-normal">
            Lock {user?.name}'s account and prevent access
          </p>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-danger-50 dark:bg-danger-100/10 border border-danger-200 dark:border-danger-200/20 rounded-lg">
              <p className="text-sm text-danger-600 dark:text-danger-500">
                <strong>Warning:</strong> This will immediately lock the user's account and prevent them from logging in.
                The user will be deactivated and will need an administrator to unlock their account.
              </p>
            </div>

            <Textarea
              label="Reason for Locking (Optional)"
              placeholder="Enter the reason for locking this account..."
              value={reason}
              onValueChange={setReason}
              minRows={3}
              maxRows={6}
              maxLength={500}
              radius={themeRadius}
              classNames={{
                inputWrapper: "bg-default-100",
              }}
              description={`${reason.length}/500 characters`}
            />
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            isDisabled={isLocking}
            radius={themeRadius}
            startContent={<XMarkIcon className="w-4 h-4" />}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={handleLock}
            isLoading={isLocking}
            radius={themeRadius}
            startContent={!isLocking && <LockClosedIcon className="w-4 h-4" />}
          >
            {isLocking ? 'Locking...' : 'Lock Account'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LockAccountModal;
