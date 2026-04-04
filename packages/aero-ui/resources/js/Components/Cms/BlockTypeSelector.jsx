import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner, Button, Chip } from '@heroui/react';
import { 
  PlusIcon, 
  SparklesIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import axios from 'axios';

/**
 * BlockTypeSelector Component
 * 
 * Displays available CMS block types for selection in the admin builder.
 * Fetches block types from API and displays them organized by category.
 */
const BlockTypeSelector = ({ onSelect, selectedType = null, category = null }) => {
  const [blockTypes, setBlockTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedByCategory, setGroupedByCategory] = useState({});

  // Fetch available block types from API
  const fetchBlockTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = category 
        ? `${route('api.block-types.advanced')}?category=${category}`
        : route('api.block-types.index');
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        const types = response.data.data;
        setBlockTypes(Array.isArray(types) ? types : Object.values(types).flat());
        setGroupedByCategory(response.data.data);
      } else {
        setError('Failed to fetch block types');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading block types');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchBlockTypes();
  }, [fetchBlockTypes]);

  // Get icon component by name (simplified)
  const getIconComponent = (iconName) => {
    const iconMap = {
      'StarIcon': <StarIcon className="w-6 h-6" />,
      'CreditCardIcon': <CreditCardIcon className="w-6 h-6" />,
      'CheckCircleIcon': <CheckCircleIcon className="w-6 h-6" />,
      'EnvelopeIcon': <EnvelopeIcon className="w-6 h-6" />,
      'QuestionMarkCircleIcon': <QuestionMarkCircleIcon className="w-6 h-6" />,
      'ChartBarIcon': <ChartBarIcon className="w-6 h-6" />,
      'UserGroupIcon': <UserGroupIcon className="w-6 h-6" />,
      'BullhornIcon': <BullhornIcon className="w-6 h-6" />,
    };
    
    return iconMap[iconName] || <SparklesIcon className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner label="Loading block types..." color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-danger">
        <CardBody className="flex gap-4 flex-row items-start">
          <ExclamationTriangleIcon className="w-6 h-6 text-danger flex-shrink-0 mt-1" />
          <div>
            <p className="text-sm font-semibold text-danger">{error}</p>
            <Button 
              isIconOnly 
              variant="light" 
              size="sm"
              onClick={fetchBlockTypes}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByCategory).map(([categoryName, types]) => (
        <div key={categoryName} className="space-y-3">
          <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wider">
            {categoryName} Block Types
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {(Array.isArray(types) ? types : [types]).map((blockType) => (
              <Card
                key={blockType.id}
                isPressable
                isHoverable
                className={`cursor-pointer transition-all ${
                  selectedType?.id === blockType.id
                    ? 'border-primary border-2'
                    : 'border-divider'
                }`}
                onClick={() => onSelect(blockType)}
              >
                <CardBody className="gap-3 items-center justify-center py-4 px-3">
                  <div className="p-3 rounded-lg bg-default-100">
                    {getIconComponent(blockType.icon)}
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-semibold line-clamp-2">
                      {blockType.name}
                    </h4>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      className="mt-2"
                    >
                      {blockType.category}
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {blockTypes.length === 0 && (
        <Card className="bg-default-100">
          <CardBody className="flex gap-3 flex-row items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-default-500">
                No block types available
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default BlockTypeSelector;
