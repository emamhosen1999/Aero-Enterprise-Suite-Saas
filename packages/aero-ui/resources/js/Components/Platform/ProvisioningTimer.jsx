import React, { useState, useEffect, useMemo } from 'react';
import { Progress, Card, CardBody, Button, Chip } from '@heroui/react';
import { BellIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/Context/ThemeContext.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * Estimated duration for each provisioning step (in seconds)
 */
const STEP_DURATIONS = {
  creating_db: 8,
  migrating: 20,
  seeding_roles: 8,
  syncing_modules: 10,
  verifying: 5,
  activating: 3,
  completed: 2,
};

const TOTAL_ESTIMATED_SECONDS = Object.values(STEP_DURATIONS).reduce((a, b) => a + b, 0);

/**
 * Provisioning Timer Component
 * 
 * Shows estimated time remaining and progress during tenant provisioning.
 * Also provides a "Notify Me" option for users who don't want to wait.
 */
export default function ProvisioningTimer({
  tenantId,
  currentStep = 'creating_db',
  className = '',
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  // Calculate progress based on current step
  const stepProgress = useMemo(() => {
    const steps = Object.keys(STEP_DURATIONS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex === -1) return 0;

    let completedSeconds = 0;
    for (let i = 0; i < currentIndex; i++) {
      completedSeconds += STEP_DURATIONS[steps[i]];
    }

    // Add partial progress within current step
    const currentStepDuration = STEP_DURATIONS[currentStep] || 10;
    const stepElapsed = Math.min(elapsedTime % currentStepDuration, currentStepDuration);
    completedSeconds += stepElapsed;

    return Math.min(100, (completedSeconds / TOTAL_ESTIMATED_SECONDS) * 100);
  }, [currentStep, elapsedTime]);

  // Remaining time estimate
  const remainingSeconds = useMemo(() => {
    const remaining = Math.max(0, TOTAL_ESTIMATED_SECONDS - (TOTAL_ESTIMATED_SECONDS * stepProgress / 100));
    return Math.ceil(remaining);
  }, [stepProgress]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle notify me request
  const handleNotifyRequest = async () => {
    setNotifyLoading(true);

    try {
      const response = await axios.post(`/api/platform/v1/provisioning/${tenantId}/notify`);
      
      if (response.data?.success) {
        setNotifyRequested(true);
        showToast.success("We'll email you when your workspace is ready!");
      }
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to set notification. Please try again.');
    } finally {
      setNotifyLoading(false);
    }
  };

  const palette = {
    surface: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress with Timer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className={`w-4 h-4 ${palette.muted}`} />
            <span className={`text-sm ${palette.muted}`}>
              Estimated time remaining
            </span>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color={remainingSeconds < 10 ? 'success' : 'primary'}
            className="font-mono"
          >
            ~{formatTime(remainingSeconds)}
          </Chip>
        </div>

        <Progress
          value={stepProgress}
          color="primary"
          size="md"
          className="h-2"
          aria-label="Provisioning progress"
        />

        <p className={`text-xs text-center ${palette.muted}`}>
          {Math.round(stepProgress)}% complete • {elapsedTime}s elapsed
        </p>
      </div>

      {/* Notify Me Card */}
      <Card className={`${palette.surface}`}>
        <CardBody className="flex flex-row items-center gap-4 py-3 px-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-primary/20' : 'bg-primary/10'}`}>
            <BellIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${palette.text}`}>
              Don't want to wait?
            </p>
            <p className={`text-xs ${palette.muted} truncate`}>
              {notifyRequested 
                ? "We'll send you an email when ready!"
                : "Close this tab and we'll notify you."}
            </p>
          </div>
          {!notifyRequested ? (
            <Button
              size="sm"
              variant="flat"
              color="primary"
              isLoading={notifyLoading}
              onPress={handleNotifyRequest}
            >
              Notify Me
            </Button>
          ) : (
            <Chip size="sm" color="success" variant="flat">
              ✓ Enabled
            </Chip>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
