import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/react';
import { 
    ArrowPathIcon, 
    XMarkIcon,
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const UpdateNotification = ({ 
    isVisible, 
    onUpdate, 
    onDismiss, 
    isUpdating = false,
    version = '1.0.0'
}) => {
    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed top-0 left-0 right-0 z-9999 bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                style={{ 
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                }}
            >
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <motion.div
                                animate={{ rotate: isUpdating ? 360 : 0 }}
                                transition={{ 
                                    duration: 1, 
                                    repeat: isUpdating ? Infinity : 0,
                                    ease: 'linear'
                                }}
                            >
                                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-300" />
                            </motion.div>
                            <div>
                                <h4 className="font-semibold text-sm">
                                    App Update Available
                                </h4>
                                <p className="text-xs text-blue-100">
                                    Version {version} is ready. Update now for the latest features and security improvements.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                color="warning"
                                variant="solid"
                                onClick={onUpdate}
                                disabled={isUpdating}
                                startContent={
                                    <ArrowPathIcon 
                                        className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} 
                                    />
                                }
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                            >
                                {isUpdating ? 'Updating...' : 'Update Now'}
                            </Button>
                            
                            <Button
                                size="sm"
                                variant="light"
                                onClick={onDismiss}
                                disabled={isUpdating}
                                isIconOnly
                                className="text-white hover:bg-white/10"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UpdateNotification;
