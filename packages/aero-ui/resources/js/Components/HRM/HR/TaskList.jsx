import React from 'react';
import {
  Card,
  CardBody,
  Checkbox,
  Chip,
  Divider
} from '@heroui/react';
import {
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

const TaskList = ({ tasks, onTaskStatusChange }) => {
  const normalize = (status) => status === 'in-progress' ? 'in_progress' : status;
  const labelize = (status) => status.replace('_','-');
  
  const getStatusColor = (status) => {
    switch (normalize(status)) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'not-applicable':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tasks</h3>
        
        {tasks.length === 0 ? (
          <p className="text-sm text-default-500 text-center mt-4">
            No tasks found.
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={task.id}>
                <div 
                  className={`flex gap-4 p-4 rounded-lg transition-colors ${
                    normalize(task.status) === 'completed' 
                      ? 'bg-success-50 dark:bg-success-50/20' 
                      : 'hover:bg-default-50 dark:hover:bg-default-50/20'
                  }`}
                >
                  <div className="flex-shrink-0 pt-1">
                    <Checkbox
                      isSelected={task.status === 'completed'}
                      onValueChange={(checked) => 
                        onTaskStatusChange && 
                        onTaskStatusChange(task.id, checked ? 'completed' : 'pending')
                      }
                      isDisabled={!onTaskStatusChange || task.status === 'not-applicable'}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 
                        className={`font-medium ${
                          normalize(task.status) === 'completed' 
                            ? 'line-through text-default-500' 
                            : 'text-default-900'
                        }`}
                      >
                        {task.task}
                      </h4>
                      <Chip
                        size="sm"
                        color={getStatusColor(task.status)}
                        variant="flat"
                      >
                        {labelize(task.status)}
                      </Chip>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-default-600 mb-3">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-xs text-default-500">
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>Assigned to: {task.assignee.name}</span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>Due: {dayjs(task.due_date).format('MMM DD, YYYY')}</span>
                        </div>
                      )}
                      
                      {task.completed_date && (
                        <div className="flex items-center gap-1 text-success">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>Completed: {dayjs(task.completed_date).format('MMM DD, YYYY')}</span>
                        </div>
                      )}
                    </div>
                    
                    {task.notes && (
                      <div className="flex gap-1 mt-3">
                        <DocumentTextIcon className="w-4 h-4 text-default-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-default-500">
                          {task.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {index < tasks.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TaskList;
