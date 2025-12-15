import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { getDashboardUrl } from '@/utils/moduleAccessUtils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button
} from '@heroui/react';
import {
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import ProfileAvatar from '@/Components/ProfileAvatar';

// Simple Profile Menu with HeroUI Dropdown
const ProfileMenu = ({ children }) => {
  const { auth } = usePage().props;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Guard: Don't render menu if no authenticated user
  if (!auth?.user) {
    return children;
  }

  const user = auth.user;
  
  // Additional safety check
  if (!user || !user.name) {
    return children;
  }
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await router.post('/logout');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (url) => {
    if (url) {
      router.visit(url);
    }
  };

  return (
    <Dropdown 
      placement="bottom-end"
      closeDelay={100}
     
    >
      <DropdownTrigger>
        {children}
      </DropdownTrigger>
      
      <DropdownMenu 
        aria-label="User profile and account menu"
        variant="faded"
        className="w-80"
        closeOnSelect={false}
       
      >
      {/* User Info Header */}
      <DropdownItem
        key="user-info"
        className="p-3 hover:bg-transparent cursor-default"
        textValue={`${user.name}'s quick profile`}
        style={{
          fontFamily: `var(--fontFamily, 'Inter')`,
          borderRadius: `var(--borderRadius, 8px)`,
          transform: `scale(var(--scale, 1))`,
        }}
      >
        <div className="flex items-start gap-3 w-full">
          
          {/* Avatar with fallback */}
          <div className="relative">
            <ProfileAvatar
              size="md"
              src={user.profile_image_url || user.profile_image}
              name={user.name}
              className="ring-2 ring-pink-400/40 shadow-md"
              style={{
                borderRadius: `var(--borderRadius, 50%)`,
              }}
            />

            {/* Online pulse dot */}
            <div 
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white shadow-xs"
              style={{
                borderRadius: `var(--borderRadius, 50%)`,
              }}
            >
              <div 
                className="w-full h-full bg-green-400 animate-pulse"
                style={{
                  borderRadius: `var(--borderRadius, 50%)`,
                }}
              />
            </div>
          </div>

          {/* User text info */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate text-foreground">
                {user.name}
              </span>
            </div>

            <span className="text-xs text-default-500 truncate">
              {user.email}
            </span>

            {user.phone && (
              <span className="text-xs text-default-500">
                📱 {user.phone}
              </span>
            )}

            {user.designation?.title && (
              <span className="text-xs text-default-500">
                💼 {user.designation.title}
              </span>
            )}

            {auth.roles?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {auth.roles?.slice(0, 2).map((role, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    style={{
                      borderRadius: `var(--borderRadius, 6px)`,
                      fontFamily: `var(--fontFamily, 'Inter')`,
                      transform: `scale(var(--scale, 1))`,
                      borderWidth: `var(--borderWidth, 1px)`,
                      opacity: `var(--disabledOpacity, 1)`,
                    }}
                  >
                    {role}
                  </span>
                ))}
                {auth.roles?.length > 2 && (
                  <span 
                    className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700"
                    style={{
                      borderRadius: `var(--borderRadius, 6px)`,
                      fontFamily: `var(--fontFamily, 'Inter')`,
                      transform: `scale(var(--scale, 1))`,
                      borderWidth: `var(--borderWidth, 1px)`,
                      opacity: `var(--disabledOpacity, 1)`,
                    }}
                  >
                    +{auth.roles.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </DropdownItem>

      
      {/* Divider */}
      <DropdownItem 
        key="divider-1" 
        className="p-0 py-1 cursor-default" 
        textValue="Menu section divider"
        style={{
          transform: `scale(var(--scale, 1))`,
        }}
      >
        <div 
          className="border-t border-divider mx-2" 
          style={{
            borderWidth: `var(--borderWidth, 1px)`,
          }}
        />
      </DropdownItem>

      {/* Account Actions Section */}
      <DropdownItem 
        key="section-account" 
        className="cursor-default p-0 pb-1" 
        textValue="Account section header"
        style={{
          fontFamily: `var(--fontFamily, 'Inter')`,
          borderRadius: `var(--borderRadius, 4px)`,
          transform: `scale(var(--scale, 1))`,
        }}
      >
        <div className="px-3 py-1">
          <span className="text-xs font-semibold text-default-400 uppercase tracking-wider">
            Account
          </span>
        </div>
      </DropdownItem>

      <DropdownItem
        key="settings"
        startContent={
          <div 
            className="w-7 h-7 flex items-center justify-center"
            style={{
              backgroundColor: `var(--theme-content2, #F4F4F5)`,
              borderRadius: `var(--borderRadius, 8px)`,
              transform: `scale(var(--scale, 1))`,
              borderWidth: `var(--borderWidth, 1px)`,
              borderColor: `var(--theme-divider, #E4E4E7)`,
            }}
          >
            <Cog6ToothIcon 
              className="w-4 h-4"
              style={{ color: `var(--theme-foreground, #11181C)` }}
            />
          </div>
        }
        onPress={() => handleNavigation(getDashboardUrl())}
        className="px-3 py-2 transition-colors duration-200"
        textValue="Account Settings"
        style={{
          fontFamily: `var(--fontFamily, 'Inter')`,
          borderRadius: `var(--borderRadius, 8px)`,
          transform: `scale(var(--scale, 1))`,
          color: `var(--theme-foreground, #11181C)`,
          border: `var(--borderWidth, 2px) solid transparent`,
        }}
        onMouseEnter={(e) => {
          e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
          e.target.style.borderRadius = `var(--borderRadius, 8px)`;
        }}
        onMouseLeave={(e) => {
          e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span 
            className="text-sm font-medium"
            style={{ color: `var(--theme-foreground, #11181C)` }}
          >
            Account Settings
          </span>
          <span 
            className="text-xs"
            style={{ color: `color-mix(in srgb, var(--theme-foreground, #11181C) 60%, transparent)` }}
          >
            Manage your account preferences
          </span>
        </div>
      </DropdownItem>

      {/* Help & Support Section */}
      <DropdownItem 
        key="divider-3" 
        className="p-0 py-1 cursor-default" 
        textValue="Help section divider"
        style={{
          transform: `scale(var(--scale, 1))`,
        }}
      >
        <div 
          className="border-t border-divider mx-2" 
          style={{
            borderWidth: `var(--borderWidth, 1px)`,
          }}
        />
      </DropdownItem>

      <DropdownItem 
        key="section-help" 
        className="cursor-default p-0 pb-1" 
        textValue="Help section header"
        style={{
          fontFamily: `var(--fontFamily, 'Inter')`,
          borderRadius: `var(--borderRadius, 4px)`,
          transform: `scale(var(--scale, 1))`,
        }}
      >
        <div className="px-3 py-1">
          <span className="text-xs font-semibold text-default-400 uppercase tracking-wider">
            Help & Support
          </span>
        </div>
      </DropdownItem>

      <DropdownItem
        key="help"
        startContent={
          <div 
            className="w-7 h-7 flex items-center justify-center"
            style={{
              backgroundColor: `var(--theme-content2, #F4F4F5)`,
              borderRadius: `var(--borderRadius, 8px)`,
              transform: `scale(var(--scale, 1))`,
              borderWidth: `var(--borderWidth, 1px)`,
              borderColor: `var(--theme-divider, #E4E4E7)`,
            }}
          >
            <QuestionMarkCircleIcon 
              className="w-4 h-4"
              style={{ color: `var(--theme-success, #17C964)` }}
            />
          </div>
        }
        className="px-3 py-2 transition-colors duration-200"
        textValue="Help Center"
        style={{
          fontFamily: `var(--fontFamily, 'Inter')`,
          borderRadius: `var(--borderRadius, 8px)`,
          transform: `scale(var(--scale, 1))`,
          color: `var(--theme-foreground, #11181C)`,
          border: `var(--borderWidth, 2px) solid transparent`,
        }}
        onMouseEnter={(e) => {
          e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
          e.target.style.borderRadius = `var(--borderRadius, 8px)`;
        }}
        onMouseLeave={(e) => {
          e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span 
            className="text-sm font-medium"
            style={{ color: `var(--theme-foreground, #11181C)` }}
          >
            Help Center
          </span>
          <span 
            className="text-xs"
            style={{ color: `color-mix(in srgb, var(--theme-foreground, #11181C) 60%, transparent)` }}
          >
            FAQ, guides, and tutorials
          </span>
        </div>
      </DropdownItem>

      <DropdownItem
        key="feedback"
        startContent={
          <div 
            className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
            style={{
              borderRadius: `var(--borderRadius, 8px)`,
              transform: `scale(var(--scale, 1))`,
              borderWidth: `var(--borderWidth, 1px)`,
            }}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
        }
        className="px-3 py-2 transition-colors duration-200"
        textValue="Send Feedback"
        style={{
          fontFamily: `var(--fontFamily, 'Inter')`,
          borderRadius: `var(--borderRadius, 8px)`,
          transform: `scale(var(--scale, 1))`,
          border: `var(--borderWidth, 2px) solid transparent`,
        }}
        onMouseEnter={(e) => {
          e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-warning, #F5A524) 50%, transparent)`;
          e.target.style.borderRadius = `var(--borderRadius, 8px)`;
        }}
        onMouseLeave={(e) => {
          e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Send Feedback</span>
          <span className="text-xs text-default-400">Help us improve your experience</span>
        </div>
      </DropdownItem>

      {/* Logout Section */}
      <DropdownItem 
        key="divider-4" 
        className="p-0 py-1 cursor-default" 
        textValue="Logout section divider"
        style={{
          transform: `scale(var(--scale, 1))`,
        }}
      >
        <div 
          className="border-t border-divider mx-2" 
          style={{
            borderWidth: `var(--borderWidth, 1px)`,
          }}
        />
      </DropdownItem>

      <DropdownItem
        key="logout"
        color="danger"
        startContent={
          <div 
            className="w-7 h-7 bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
            style={{
              borderRadius: `var(--borderRadius, 8px)`,
              fontFamily: `var(--fontFamily, 'Inter')`,
              transform: `scale(var(--scale, 1))`,
              borderWidth: `var(--borderWidth, 1px)`,
              opacity: `var(--disabledOpacity, 1)`,
            }}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
        }
        onPress={handleLogout}
        className="px-3 py-2 transition-colors duration-200"
        textValue="Sign Out"
        isDisabled={isLoggingOut}
        style={{
          opacity: isLoggingOut ? `var(--disabledOpacity, 0.5)` : '1',
          fontFamily: `var(--fontFamily, 'Inter')`,
          borderRadius: `var(--borderRadius, 8px)`,
          transform: `scale(var(--scale, 1))`,
          border: `var(--borderWidth, 2px) solid transparent`,
        }}
        onMouseEnter={(e) => {
          if (!isLoggingOut) {
            e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-danger, #F31260) 50%, transparent)`;
            e.target.style.borderRadius = `var(--borderRadius, 8px)`;
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </span>
            <span className="text-xs text-red-400 dark:text-red-500">
              End your current session
            </span>
          </div>
          {isLoggingOut && (
            <div 
              className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin"
              style={{
                borderRadius: `var(--borderRadius, 50%)`,
                borderWidth: `var(--borderWidth, 2px)`,
              }}
            />
          )}
        </div>
      </DropdownItem>
      
      </DropdownMenu>
    </Dropdown>
  );
};

export default ProfileMenu;
