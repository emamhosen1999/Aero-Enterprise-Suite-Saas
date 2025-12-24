import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@heroui/react';
import { hasRoute, safeRoute, safeNavigate } from '@/utils/routeUtils';
import axios from 'axios';
import AuthCard from '@/Components/AuthCard.jsx';
import RegisterLayout from '@/Layouts/RegisterLayout.jsx';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding.js';
import { showToast } from '@/utils/toastUtils';
import ProgressSteps from './components/ProgressSteps.jsx';
import CancelRegistrationButton from './components/CancelRegistrationButton.jsx';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function VerifyEmail({ steps = [], currentStep, savedData = {}, email = '', companyName = '' }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeExpiration, setCodeExpiration] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef([]);
  const hasAutoSentRef = useRef(false);

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

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Code expiration countdown
  useEffect(() => {
    if (codeExpiration > 0) {
      const timer = setTimeout(() => setCodeExpiration(codeExpiration - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeExpiration]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    if (countdown > 0) return;

    setIsSending(true);
    try {
      // Validate route exists before making request
      if (!hasRoute('platform.register.verify-email.send')) {
        throw new Error('Verification route not available');
      }
      
      const response = await axios.post(safeRoute('platform.register.verify-email.send'));
      showToast.success(response.data.message || 'Verification code sent to your email');
      setCountdown(60);
      setCodeExpiration(600); // Reset to 10 minutes
    } catch (error) {
      console.error('Failed to send code:', error);
      
      let message = 'Failed to send verification code';
      
      if (error.response) {
        // Server responded with error status
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
        // Request was made but no response received
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
      // Validate route exists before making request
      if (!hasRoute('platform.register.verify-email.verify')) {
        throw new Error('Verification route not available');
      }
      
      const response = await axios.post(safeRoute('platform.register.verify-email.verify'), {
        code: verificationCode,
      });
      
      showToast.success(response.data.message || 'Email verified successfully');
      
      // Safe redirect to phone verification
      setTimeout(() => {
        safeNavigate('platform.register.verify-phone');
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

  return (
    <RegisterLayout>
      <Head title={`Verify Company Email - ${siteName || 'aeos365'}`} />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4 text-center">
          <p className={`text-[10px] sm:text-sm uppercase tracking-[0.3em] ${palette.badge}`}>Step 4</p>
          <h1 className={`text-2xl sm:text-4xl font-semibold ${palette.heading} px-2`}>Verify Company Email</h1>
          <p className={`${palette.copy} text-sm sm:text-base px-2`}>
            We've sent a 6-digit verification code to your company email <strong className={palette.heading}>{email}</strong>
          </p>
          <p className={`${palette.copy} text-xs sm:text-sm px-2 italic`}>
            Note: You'll create your admin account after completing registration
          </p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <AuthCard>
          <div className="space-y-6 sm:space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <EnvelopeIcon className="w-8 h-8 text-primary" />
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

              <div className="text-center space-y-2">
                {/* Code expiration countdown */}
                {codeExpiration > 0 ? (
                  <p className={`text-xs ${codeExpiration < 60 ? 'text-warning' : palette.copy}`}>
                    Code expires in <strong>{formatTime(codeExpiration)}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-danger">
                    Code has expired. Please request a new one.
                  </p>
                )}
                
                {/* Resend button */}
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

            <Button
              color="primary"
              onPress={() => handleVerify()}
              className="w-full"
              isLoading={isVerifying}
              isDisabled={code.some(digit => digit === '') || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify Company Email'}
            </Button>

            <div className="text-center space-y-3">
              <p className={`text-xs ${palette.copy}`}>
                Didn't receive the code? Check your spam folder or{' '}
                <button onClick={handleSendCode} disabled={countdown > 0 || isSending} className={palette.link}>
                  resend it
                </button>
              </p>
              <p className={`text-xs ${palette.copy} bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800`}>
                💡 <strong>Next Step:</strong> After verification, you'll create your admin account on your workspace subdomain
              </p>
              <div className="pt-2 border-t border-divider">
                <CancelRegistrationButton variant="light" size="sm" />
              </div>
            </div>
          </div>
        </AuthCard>
      </section>
    </RegisterLayout>
  );
}
