import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';

/**
 * ResumeRegistration Component
 * 
 * Provides functionality for users to save their registration progress and
 * receive a magic link to resume later. Shows a prompt when user tries to
 * leave the registration flow.
 * 
 * @param {Object} props
 * @param {Object} props.registrationData - Current registration form data
 * @param {string} props.currentStep - Current registration step name
 * @param {Function} props.onSaved - Callback when progress is saved
 * @param {string} props.className - Additional CSS classes
 */
export default function ResumeRegistration({ 
  registrationData = {}, 
  currentStep = '',
  onSaved = () => {},
  className = '' 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState(registrationData?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill email from registration data
  useEffect(() => {
    if (registrationData?.email) {
      setEmail(registrationData.email);
    }
  }, [registrationData?.email]);

  const handleSaveProgress = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await axios.post('/api/platform/v1/registration/save-progress', {
        email,
        step: currentStep,
        data: registrationData,
      });

      if (response.status === 200) {
        setIsSaved(true);
        onSaved();
        showToast.success('Check your email for a link to resume your registration');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save progress. Please try again.';
      setError(message);
      showToast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSaved(false);
    setError('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 text-sm text-default-500 hover:text-primary transition-colors ${className}`}
      >
        <ArrowPathIcon className="w-4 h-4" />
        Save & continue later
      </button>

      <Modal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        size="md"
        classNames={{
          base: "bg-content1",
          header: "border-b border-divider",
          body: "py-6",
          footer: "border-t border-divider"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <EnvelopeIcon className="w-5 h-5 text-primary" />
              Save Your Progress
            </h2>
          </ModalHeader>
          <ModalBody>
            {isSaved ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircleIcon className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Progress Saved</h3>
                <p className="text-default-500 text-sm">
                  A secure link has been sent to <strong>{email}</strong>. 
                  Use that link to resume your registration at any time within the next 7 days.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-default-500 text-sm">
                  Enter your email address to receive a secure link and resume your registration session.
                  Progress is retained for 7 days.
                </p>
                
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  isInvalid={!!error}
                  errorMessage={error}
                  isRequired
                  autoFocus
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                />

                <div className="flex items-start gap-2 p-3 rounded-lg bg-default-100">
                  <div className="shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-default-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-xs text-default-500">
                    Your registration data is encrypted and stored securely. 
                    The secure link expires after 7 days.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {isSaved ? (
              <Button color="primary" onPress={closeModal}>
                Understood
              </Button>
            ) : (
              <>
                <Button variant="flat" onPress={closeModal}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSaveProgress}
                  isLoading={isSaving}
                  startContent={!isSaving && <EnvelopeIcon className="w-4 h-4" />}
                >
                  Send Secure Link
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/**
 * Hook to detect when user is leaving the page
 * Shows a prompt to save progress if there's unsaved data
 */
export function useBeforeUnloadPrompt(hasUnsavedData = false) {
  useEffect(() => {
    if (!hasUnsavedData) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedData]);
}
