import React, { useMemo } from 'react';
import { Progress } from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext.jsx';
import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Password Strength Meter Component
 * 
 * Provides real-time password strength feedback without external dependencies.
 * Uses a custom scoring algorithm based on common password rules.
 */

const strengthLevels = [
  { label: 'Very Weak', color: 'danger', score: 0 },
  { label: 'Weak', color: 'warning', score: 25 },
  { label: 'Fair', color: 'warning', score: 50 },
  { label: 'Strong', color: 'success', score: 75 },
  { label: 'Very Strong', color: 'success', score: 100 },
];

const requirements = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

/**
 * Calculate password strength score (0-4)
 */
const calculateStrength = (password) => {
  if (!password) return 0;

  let score = 0;

  // Base requirements
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;

  // Character variety
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 0.5;

  // Bonus for mixing
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) score += 0.5;

  // Penalty for common patterns
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /(.)\1{2,}/, // Repeated characters
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 1;
    }
  }

  // Normalize to 0-4
  return Math.max(0, Math.min(4, Math.floor(score)));
};

export default function PasswordStrengthMeter({
  password = '',
  showRequirements = true,
  className = '',
}) {
  const { isDark: isDarkMode } = useTheme();

  const strength = useMemo(() => calculateStrength(password), [password]);
  const strengthInfo = strengthLevels[strength];
  const requirementsMet = useMemo(
    () => requirements.map((req) => ({
      ...req,
      met: req.test(password),
    })),
    [password]
  );

  const palette = {
    text: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    muted: isDarkMode ? 'text-slate-500' : 'text-slate-400',
    success: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
    danger: isDarkMode ? 'text-red-400' : 'text-red-500',
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${palette.text}`}>
            Password Strength
          </span>
          <span className={`text-xs font-semibold text-${strengthInfo.color}`}>
            {strengthInfo.label}
          </span>
        </div>
        <Progress
          value={strengthInfo.score}
          color={strengthInfo.color}
          size="sm"
          className="h-1.5"
          aria-label="Password strength"
        />
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {requirementsMet.map((req) => (
            <div key={req.id} className="flex items-center gap-2">
              {req.met ? (
                <CheckCircleIcon className={`w-4 h-4 ${palette.success}`} />
              ) : (
                <XCircleIcon className={`w-4 h-4 ${palette.muted}`} />
              )}
              <span className={`text-xs ${req.met ? palette.success : palette.muted}`}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
