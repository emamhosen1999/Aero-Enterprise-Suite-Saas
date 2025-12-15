import React from 'react';
import { Button } from '@heroui/react';

const EmptyState = ({ 
    title, 
    description, 
    icon, 
    action,
    actionText,
    onAction 
}) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4">
            {icon && (
                <div className="mb-3 opacity-50">
                    {icon}
                </div>
            )}
            
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                {title}
            </h3>
            
            {description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-md">
                    {description}
                </p>
            )}
            
            {action && actionText && onAction && (
                <Button
                    color="primary"
                    variant="solid"
                    onPress={onAction}
                    className="bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg hover:shadow-xl transition-shadow"
                >
                    {actionText}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
