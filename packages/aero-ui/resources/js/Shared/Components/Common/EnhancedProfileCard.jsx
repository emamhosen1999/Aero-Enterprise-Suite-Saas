import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip, 
  Progress,
  Divider,
  Avatar,
  Badge
} from "@heroui/react";
import { 
  PencilIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  BriefcaseIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  HashtagIcon
} from "@heroicons/react/24/outline";
import ProfileAvatar from './ProfileAvatar';
import { motion } from 'framer-motion';

const EnhancedProfileCard = ({ 
  user, 
  departments = [], 
  designations = [],
  onEditClick,
  profileStats = {},
  canEdit = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const department = departments.find(d => d.id === user.department_id || d.id === user.department);
  const designation = designations.find(d => d.id === user.designation_id || d.id === user.designation);

  const getStatusColor = () => {
    if (user.active) return 'success';
    return 'danger';
  };

  const getCompletionColor = () => {
    const percentage = profileStats.completion_percentage || 0;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="flex gap-4 pb-0">
          <div className="flex gap-4 items-start w-full">
            {/* Enhanced Profile Avatar with Status Badge */}
            <div className="relative">
              <Badge
                content={
                  <div className={`w-4 h-4 rounded-full ${user.active ? 'bg-success-500' : 'bg-danger-500'} border-2 border-background`} />
                }
                placement="bottom-right"
                className="border-0"
              >
                <ProfileAvatar
                  src={user.profile_image_url || user.profile_image}
                  name={user.name}
                  size="lg"
                  className="ring-2 ring-white/20 hover:ring-white/40 transition-all duration-300"
                />
              </Badge>
            </div>

            {/* User Info Section */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {department && (
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        startContent={<BriefcaseIcon className="w-3 h-3" />}
                      >
                        {department.name}
                      </Chip>
                    )}
                    {designation && (
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color="secondary"
                      >
                        {designation.title}
                      </Chip>
                    )}
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={getStatusColor()}
                      startContent={
                        user.active ? 
                        <CheckCircleIcon className="w-3 h-3" /> : 
                        <ExclamationTriangleIcon className="w-3 h-3" />
                      }
                    >
                      {user.active ? 'Active' : 'Inactive'}
                    </Chip>
                  </div>
                </div>

                {/* Edit Button */}
                {canEdit && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      color="primary"
                      variant="bordered"
                      size="sm"
                      startContent={<PencilIcon className="w-4 h-4" />}
                      onPress={onEditClick}
                      className="bg-white/10 hover:bg-white/20 border-white/20"
                    >
                      Edit Profile
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Profile Completion Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-default-600">Profile Completion</span>
                  <span className="text-sm font-semibold text-foreground">
                    {profileStats.completion_percentage || 0}%
                  </span>
                </div>
                <Progress
                  value={profileStats.completion_percentage || 0}
                  color={getCompletionColor()}
                  size="sm"
                  className="max-w-full"
                />
                <p className="text-xs text-default-500 mt-1">
                  {profileStats.completed_sections || 0} of {profileStats.total_sections || 8} sections completed
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-4">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Employee ID */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <HashtagIcon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-default-500">Employee ID</p>
                <p className="text-sm font-medium text-foreground">{user.employee_id || 'N/A'}</p>
              </div>
            </div>

            {/* Join Date */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CalendarIcon className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-default-500">Date of Joining</p>
                <p className="text-sm font-medium text-foreground">
                  {user.date_of_joining ? new Date(user.date_of_joining).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <EnvelopeIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-default-500">Email</p>
                <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <PhoneIcon className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-default-500">Phone</p>
                <p className="text-sm font-medium text-foreground">{user.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          {user.address && (
            <>
              <Divider className="mb-4" />
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <MapPinIcon className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-default-500">Address</p>
                  <p className="text-sm text-foreground">{user.address}</p>
                </div>
              </div>
            </>
          )}

          {/* Quick Stats */}
          {(profileStats.profile_views || profileStats.last_updated) && (
            <>
              <Divider className="my-4" />
              <div className="flex items-center justify-between text-xs text-default-500">
                {profileStats.profile_views && (
                  <span>Views: {profileStats.profile_views}</span>
                )}
                {profileStats.last_updated && (
                  <span>
                    Updated: {new Date(profileStats.last_updated).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default EnhancedProfileCard;
