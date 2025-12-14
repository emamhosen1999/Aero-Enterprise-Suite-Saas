import React from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip, 
  Divider 
} from "@heroui/react";
import { 
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { motion } from 'framer-motion';

const ProfileSection = ({ 
  title, 
  icon, 
  children, 
  onEdit, 
  canEdit = false,
  isEmpty = false,
  isCompleted = false,
  className = "",
  headerAction = null,
  ...props 
}) => {
  const getCompletionStatus = () => {
    if (isEmpty) return { color: 'danger', icon: XMarkIcon, text: 'Empty' };
    if (isCompleted) return { color: 'success', icon: CheckCircleIcon, text: 'Complete' };
    return { color: 'warning', icon: ExclamationTriangleIcon, text: 'Incomplete' };
  };

  const status = getCompletionStatus();
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card 
        className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 h-full"
        {...props}
      >
        <CardHeader className="flex gap-3 pb-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Section Icon */}
            {icon && (
              <div className="p-2 bg-primary-500/20 rounded-lg">
                {React.cloneElement(icon, { className: "w-5 h-5 text-primary-400" })}
              </div>
            )}
            
            {/* Title and Status */}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-foreground">{title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Chip
                  size="sm"
                  variant="flat"
                  color={status.color}
                  startContent={<StatusIcon className="w-3 h-3" />}
                >
                  {status.text}
                </Chip>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {headerAction}
              {canEdit && onEdit && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    isIconOnly
                    size="sm"
                    variant="bordered"
                    color="primary"
                    onPress={onEdit}
                    className="bg-white/10 hover:bg-white/20 border-white/20"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {isEmpty ? (
            <div className="text-center py-8">
              <div className="p-4 bg-default-100/50 rounded-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-default-400 mx-auto mb-2" />
                <p className="text-default-500 text-sm">No information available</p>
                {canEdit && onEdit && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="bordered"
                    className="mt-3"
                    onPress={onEdit}
                    startContent={<PencilIcon className="w-4 h-4" />}
                  >
                    Add Information
                  </Button>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default ProfileSection;
