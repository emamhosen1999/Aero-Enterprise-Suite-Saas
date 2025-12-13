import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

const NoDataMessage = ({ 
  message = 'No data available', 
  description = 'Try adjusting your search or filters',
  icon = null 
}) => {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-2">
        {icon || <InboxIcon className="w-12 h-12 mx-auto text-default-300" />}
      </div>
      <p className="text-foreground text-sm mb-1">
        {message}
      </p>
      {description && (
        <p className="text-default-400 text-xs">
          {description}
        </p>
      )}
    </div>
  );
};

export default NoDataMessage;
