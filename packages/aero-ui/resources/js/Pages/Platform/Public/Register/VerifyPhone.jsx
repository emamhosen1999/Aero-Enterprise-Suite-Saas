import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { 
  Button, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure 
} from '@heroui/react';
import axios from 'axios';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import { showToast } from '@/utils/toastUtils';
import ProgressSteps from './components/ProgressSteps.jsx';
import CancelRegistrationButton from './components/CancelRegistrationButton.jsx';
import { DevicePhoneMobileIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function VerifyPhone({ steps = [], currentStep, savedData = {}, phone = '', companyName = '' }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const hasAutoSentRef = useRef(false);
  const { isOpen: isSkipOpen, onOpen: onSkipOpen, onClose: onSkipClose } = useDisclosure();

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();
  
  const palette = {
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    copy: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    badge: isDarkMode ? 'text-slate-300' : 'text-slate-500',
    link: isDarkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700',
  };

  // Auto-send verification code on mount (only once)
  useEffect(() => {
    if (!hasAutoSentRef.current) {
      hasAutoSentRef.current = true;
      handleSendCode();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (countdown > 0) return;

    setIsSending(true);
    try {
      const response = await axios.post(route('platform.register.verify-phone.send'));
      showToast.success(response.data.message || 'Verification code sent to your phone');
      setCountdown(60);
    } catch (error) {
      console.error('Failed to send code:', error);
      
      let message = 'Failed to send verification code';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 429) {
          message = data.message || 'Too many attempts. Please wait before trying again.';
        } else if (status === 500) {
          message = data.message || 'Server error occurred. Please try again later.';
        } else if (status === 422) {
          message = data.message || 'Validation error. Please check your information.';
        } else {
          message = data.message || message;
        }
      } else if (error.request) {
        message = 'No response from server. Please check your connection.';
      }
      
      showToast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.split('').filter(char => /^\d$/.test(char));
    
    if (digits.length > 0) {
      const newCode = [...code];
      digits.forEach((digit, idx) => {
        if (idx < 6) newCode[idx] = digit;
      });
      setCode(newCode);
      
      // Focus the next empty input or last input
      const nextEmptyIndex = newCode.findIndex(c => c === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Auto-submit if complete
      if (newCode.every(digit => digit !== '')) {
        handleVerify(newCode.join(''));
      }
    }
  };

  const handleVerify = async (codeString) => {
    const verificationCode = codeString || code.join('');
    
    if (verificationCode.length !== 6) {
      showToast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(route('platform.register.verify-phone.verify'), {
        code: verificationCode,
      });
      
      showToast.success(response.data.message || 'Phone verified successfully');
      
      // Redirect to plan selection
      setTimeout(() => {
        safeNavigate('platform.register.plan');
      }, 500);
    } catch (error) {
      console.error('Verification failed:', error);
      
      let message = 'Invalid verification code';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 429) {
          message = data.message || 'Too many attempts. Please wait before trying again.';
        } else if (status === 422) {
          message = data.message || 'Invalid or expired verification code';
        } else if (status === 500) {
          message = data.message || 'Server error occurred. Please try again.';
        } else {
          message = data.message || message;
        }
      } else if (error.request) {
        message = 'No response from server. Please check your connection.';
      }
      
      showToast.error(message);
      
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = () => {
    onSkipOpen();
  };

  const confirmSkip = () => {
    onSkipClose();
    showToast.info('Phone verification skipped. You can verify later from settings.');
    safeNavigate('platform.register.plan');
  };

  return (
    <RegisterLayout>
      <Head title={`Verify Company Phone - ${siteName || 'aeos365'}`} />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4 text-center">
          <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 5</p>
          <h1 className={`text-2xl sm:text-4xl font-semibold ${palette.heading} px-2`}>Verify Company Phone</h1>
          <p className={`${palette.copy} text-sm sm:text-base px-2`}>
            We've sent a 6-digit verification code to your company phone <strong className={palette.heading}>{phone}</strong>
          </p>
          <p className={`${palette.copy} text-xs sm:text-sm px-2 italic`}>
            Note: You'll create your admin account after completing registration
          </p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="relative">
          {/* Wire effect wrapping the card */}
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 -m-3 pointer-events-none animate-pulse-subtle">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-primary/60 to-transparent"></div>
          </div>
          
          <AuthCard>
            <div className="space-y-6 sm:space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className={`text-sm ${palette.copy} mb-4`}>Enter the verification code</p>
              </div>

              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-2 rounded-lg transition-all
                      ${digit ? 'border-primary bg-primary/5' : 'border-default-300'}
                      ${isDarkMode ? 'bg-default-100 text-white' : 'bg-white text-slate-900'}
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                    disabled={isVerifying}
                  />
                ))}
              </div>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className={`text-sm ${palette.copy}`}>
                    Resend code in <strong>{countdown}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSending}
                    className={`text-sm ${palette.link} font-medium disabled:opacity-50`}
                  >
                    {isSending ? 'Sending...' : 'Resend verification code'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                color="default"
                variant="bordered"
                onPress={handleSkip}
                className="w-full sm:w-auto"
                isDisabled={isVerifying}
              >
                Skip for now
              </Button>
              <Button
                color="primary"
                onPress={() => handleVerify()}
                className="w-full"
                isLoading={isVerifying}
                isDisabled={code.some(digit => digit === '') || isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify Company Phone'}
              </Button>
            </div>

            <div className="text-center space-y-3">
              <p className={`text-xs ${palette.copy}`}>
                Didn't receive the code?{' '}
                <button onClick={handleSendCode} disabled={countdown > 0 || isSending} className={palette.link}>
                  Resend it
                </button>
              </p>
              <div className="pt-2 border-t border-divider">
                <CancelRegistrationButton variant="light" size="sm" />
              </div>
            </div>
            </div>
          </AuthCard>
        </div>
      </section>

      {/* Skip Confirmation Modal */}
      <Modal 
        isOpen={isSkipOpen} 
        onOpenChange={onSkipClose}
        classNames={{
          base: "bg-content1",
          header: "border-b border-divider",
          body: "py-6",
          footer: "border-t border-divider"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
            <span>Skip Phone Verification?</span>
          </ModalHeader>
          <ModalBody>
            <p className={palette.copy}>
              Are you sure you want to skip phone verification? You will need to verify your phone number later from your account settings.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onSkipClose}>
              Cancel
            </Button>
            <Button color="warning" onPress={confirmSkip}>
              Skip Verification
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </RegisterLayout>
  );
}