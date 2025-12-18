import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Avatar,
  Chip,
  Skeleton
} from '@heroui/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  UsersIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import OnboardEmployeeModal from './OnboardEmployeeModal';

const PendingOnboardingSection = ({
  departments = [],
  designations = [],
  managers = [],
  onOnboardingComplete
}) => {
  // Theme radius helper
  const getThemeRadius = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
  };

  const themeRadius = getThemeRadius();

  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch pending users
  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(route('hrm.employees.pending-onboarding'), {
        params: {
          search: debouncedSearch,
          per_page: pagination.per_page
        }
      });

      if (response.data) {
        setPendingUsers(response.data.data || []);
        if (response.data.meta) {
          setPagination(prev => ({
            ...prev,
            current_page: response.data.meta.current_page || 1,
            total: response.data.meta.total || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, pagination.per_page]);

  // Fetch on mount and when debounced search changes
  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // Handle onboard button click
  const handleOnboardClick = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  // Handle successful onboarding
  const handleOnboardingSuccess = (employee) => {
    // Remove the user from pending list
    setPendingUsers(prev => prev.filter(u => u.id !== selectedUser?.id));
    
    // Update pagination count
    setPagination(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1)
    }));

    // Call parent callback
    if (onOnboardingComplete) {
      onOnboardingComplete(employee);
    }

    // Close modal
    setModalOpen(false);
    setSelectedUser(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  // Don't render if no pending users and not loading
  if (!loading && pendingUsers.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card
        radius={themeRadius}
        className="mb-6"
        classNames={{
          base: "bg-content1 border border-divider"
        }}
      >
        <CardBody className="p-0">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-default-50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/20">
                <UsersIcon className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Pending Onboarding
                </h3>
                <p className="text-sm text-default-500">
                  {loading ? (
                    'Loading...'
                  ) : (
                    `${pagination.total} user${pagination.total !== 1 ? 's' : ''} awaiting employee onboarding`
                  )}
                </p>
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              radius={themeRadius}
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Expandable Content */}
          {isExpanded && (
            <div className="border-t border-divider">
              {/* Search Bar */}
              <div className="p-4">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  radius={themeRadius}
                  classNames={{
                    inputWrapper: "bg-default-100"
                  }}
                />
              </div>

              {/* User List */}
              <div className="p-4 pt-0">
                {loading ? (
                  // Loading Skeleton
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-lg border border-divider">
                        <div className="flex items-start gap-3">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-3 w-1/2 rounded" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                        </div>
                        <Skeleton className="h-9 w-full rounded-lg mt-3" />
                      </div>
                    ))}
                  </div>
                ) : pendingUsers.length === 0 ? (
                  // Empty State
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-default-100 mb-4">
                      <ExclamationCircleIcon className="w-8 h-8 text-default-400" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {searchQuery ? 'No users found' : 'All caught up!'}
                    </h3>
                    <p className="text-sm text-default-500 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Try adjusting your search criteria'
                        : 'There are no users pending employee onboarding at the moment.'}
                    </p>
                  </div>
                ) : (
                  // User Cards Grid
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 rounded-lg border border-divider hover:border-primary-300 hover:bg-default-50 dark:hover:bg-default-100/50 transition-all"
                      >
                        {/* User Info */}
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar
                            src={user.profile_picture}
                            name={user.name}
                            size="md"
                            radius={themeRadius}
                            classNames={{
                              base: "bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0",
                              icon: "text-white"
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-default-500 truncate">
                              {user.email}
                            </p>
                            {user.roles && user.roles.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {user.roles.slice(0, 2).map((role, index) => (
                                  <Chip
                                    key={index}
                                    size="sm"
                                    variant="flat"
                                    color="default"
                                    classNames={{
                                      base: "h-5 text-xs"
                                    }}
                                  >
                                    {role.name || role}
                                  </Chip>
                                ))}
                                {user.roles.length > 2 && (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color="default"
                                    classNames={{
                                      base: "h-5 text-xs"
                                    }}
                                  >
                                    +{user.roles.length - 2}
                                  </Chip>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Account Created Date */}
                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-xs text-default-400">Joined:</span>
                          <span className="text-xs text-default-500 font-medium">
                            {formatDate(user.created_at)}
                          </span>
                        </div>

                        {/* Onboard Button */}
                        <Button
                          color="primary"
                          size="sm"
                          radius={themeRadius}
                          startContent={<UserPlusIcon className="w-4 h-4" />}
                          onPress={() => handleOnboardClick(user)}
                          className="w-full"
                        >
                          Onboard Now
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Load More Info */}
                {!loading && pendingUsers.length > 0 && pagination.total > pendingUsers.length && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-default-500">
                      Showing {pendingUsers.length} of {pagination.total} pending users
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Onboarding Modal */}
      <OnboardEmployeeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        departments={departments}
        designations={designations}
        managers={managers}
        onSuccess={handleOnboardingSuccess}
      />
    </>
  );
};

export default PendingOnboardingSection;
