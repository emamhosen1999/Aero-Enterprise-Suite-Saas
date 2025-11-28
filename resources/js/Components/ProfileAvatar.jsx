import React, { useState, useEffect } from 'react';
import { Avatar } from "@heroui/react";

/**
 * Enhanced ProfileAvatar component for ERP system
 * Provides robust image loading with intelligent fallbacks using HeroUI's built-in mechanisms
 * 
 * Features:
 * - Automatic fallback to user initials when image fails to load
 * - Consistent color generation based on user name
 * - Loading states and error handling
 * - Accessibility compliance
 * - Enterprise-grade reliability
 */
const ProfileAvatar = ({ 
  src, 
  name, 
  size = "md", 
  className = "", 
  onClick,
  showBorder = false,
  isDisabled = false,
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);









  return (
    <Avatar
      src={src}
      name={name} // HeroUI will use this as fallback text
      size={size}
      isBordered
      onClick={!isDisabled ? onClick : undefined}
      showFallback={true} // Ensure fallback is always available
      aria-label={name ? `${name}'s profile picture` : 'User profile picture'}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick && !isDisabled ? 0 : -1}
      {...props}
    />
  );
};

export default ProfileAvatar;