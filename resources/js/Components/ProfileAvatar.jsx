import React, { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@heroui/react';
import { UserIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const gradientPalette = [
  ['#2563EB', '#9333EA'],
  ['#0EA5E9', '#6366F1'],
  ['#F59E0B', '#EF4444'],
  ['#14B8A6', '#2563EB'],
  ['#EC4899', '#8B5CF6'],
  ['#F97316', '#F43F5E'],
  ['#22C55E', '#14B8A6'],
  ['#3B82F6', '#0EA5E9'],
];

const sizeToTextMap = {
  xs: 'text-[0.55rem]',
  sm: 'text-[0.65rem]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

const getInitials = (name = '') => {
  if (!name) {
    return '';
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const pickGradient = (name = '') => {
  if (!name) {
    return gradientPalette[0];
  }

  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradientPalette[hash % gradientPalette.length];
};

export const getProfileAvatarTokens = ({
  name = '',
  size = 'md',
  showBorder = true,
  isInteractive = false,
  className = '',
  style = {},
  fallbackIcon = null,
} = {}) => {
  const [gradientFrom, gradientTo] = pickGradient(name);
  const initials = getInitials(name);

  return {
    className: clsx(
      'relative font-semibold uppercase tracking-wide text-white flex items-center justify-center rounded-full shadow-[0_8px_18px_rgba(15,23,42,0.35)]',
      'bg-slate-800/80 backdrop-blur-sm',
      sizeToTextMap[size] ?? sizeToTextMap.md,
      showBorder && 'ring-1 ring-primary/25 border border-white/10',
      isInteractive &&
        'cursor-pointer transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      className,
    ),
    style: {
      backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
      ...style,
    },
    fallback:
      fallbackIcon || (
        <span className="flex items-center justify-center w-full h-full">
          {initials || <UserIcon className="w-4 h-4" />}
        </span>
      ),
    showFallback: true,
    isBordered: showBorder,
  };
};

const ProfileAvatar = ({
  src,
  name = '',
  size = 'md',
  className = '',
  style = {},
  onClick,
  showBorder = true,
  isDisabled = false,
  isInteractive = false,
  fallbackIcon = null,
  tabIndex,
  onError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const tokens = useMemo(
    () =>
      getProfileAvatarTokens({
        name,
        size,
        showBorder,
        fallbackIcon,
        className: clsx(isDisabled && 'opacity-60', className),
        style,
        isInteractive: (isInteractive || Boolean(onClick)) && !isDisabled,
      }),
    [name, size, showBorder, fallbackIcon, className, style, isInteractive, onClick, isDisabled],
  );

  const computedTabIndex = onClick && !isDisabled ? tabIndex ?? 0 : tabIndex ?? -1;

  return (
    <Avatar
      {...props}
      src={imageError ? undefined : src}
      name={name}
      size={size}
      className={tokens.className}
      style={tokens.style}
      isBordered={showBorder}
      showFallback
      fallback={tokens.fallback}
      onClick={!isDisabled ? onClick : undefined}
      onError={(event) => {
        setImageError(true);
        onError?.(event);
      }}
      aria-label={name ? `${name}'s profile picture` : 'User profile picture'}
      role={onClick && !isDisabled ? 'button' : 'img'}
      tabIndex={computedTabIndex}
    />
  );
};

export default ProfileAvatar;
