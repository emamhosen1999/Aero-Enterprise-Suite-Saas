import React, { useState, useEffect } from 'react';
import { Input, Textarea, Select, SelectItem, Button, Divider, Card, CardBody } from '@heroui/react';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export const SchemaPropertyEditor = ({ field, property, value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  switch (property.type) {
    case 'string':
      if (property.enum) {
        return (
          <Select
            label={property.title || field}
            description={property.description}
            selectedKeys={[localValue || ''].filter(Boolean)}
            onSelectionChange={(keys) => handleChange(Array.from(keys)[0])}
            size="sm"
            classNames={{ trigger: 'bg-slate-100 dark:bg-slate-950' }}
          >
            {property.enum.map((option) => (
              <SelectItem key={option}>{option}</SelectItem>
            ))}
          </Select>
        );
      }

      if (property.format === 'textarea' || property.maxLength > 200) {
        return (
          <Textarea
            label={property.title || field}
            description={property.description}
            placeholder={property.placeholder}
            value={localValue || ''}
            onValueChange={handleChange}
            minRows={3}
            maxRows={8}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />
        );
      }

      if (property.format === 'url') {
        return (
          <Input
            label={property.title || field}
            description={property.description}
            placeholder={property.placeholder || 'https://example.com'}
            type="url"
            value={localValue || ''}
            onValueChange={handleChange}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />
        );
      }

      if (property.format === 'email') {
        return (
          <Input
            label={property.title || field}
            description={property.description}
            placeholder={property.placeholder || 'email@example.com'}
            type="email"
            value={localValue || ''}
            onValueChange={handleChange}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />
        );
      }

      if (property.format === 'color') {
        return (
          <Input
            label={property.title || field}
            description={property.description}
            type="color"
            value={localValue || '#000000'}
            onValueChange={handleChange}
            size="sm"
          />
        );
      }

      return (
        <Input
          label={property.title || field}
          description={property.description}
          placeholder={property.placeholder}
          value={localValue || ''}
          onValueChange={handleChange}
          maxLength={property.maxLength}
          size="sm"
          classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
        />
      );

    case 'number':
      return (
        <Input
          label={property.title || field}
          description={property.description}
          type="number"
          value={localValue !== undefined ? String(localValue) : ''}
          onValueChange={(val) => handleChange(val ? Number(val) : '')}
          min={property.minimum}
          max={property.maximum}
          step={property.multipleOf || 1}
          size="sm"
          classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={field}
            checked={localValue || false}
            onChange={(e) => handleChange(e.target.checked)}
            className="rounded"
          />
          <label htmlFor={field} className="text-sm font-medium">
            {property.title || field}
          </label>
          {property.description && (
            <p className="text-xs text-slate-500">{property.description}</p>
          )}
        </div>
      );

    case 'array':
      return (
        <ArrayEditor
          field={field}
          property={property}
          value={localValue || []}
          onChange={handleChange}
        />
      );

    case 'object':
      return (
        <ObjectEditor
          field={field}
          property={property}
          value={localValue || {}}
          onChange={handleChange}
        />
      );

    default:
      return (
        <Input
          label={property.title || field}
          description="Unsupported property type"
          disabled
          size="sm"
        />
      );
  }
};

const ArrayEditor = ({ field, property, value, onChange }) => {
  const itemSchema = property.items;

  const handleAddItem = () => {
    const newItem = itemSchema.type === 'object' 
      ? Object.keys(itemSchema.properties || {}).reduce((acc, key) => {
          acc[key] = '';
          return acc;
        }, {})
      : '';

    onChange([...value, newItem]);
  };

  const handleRemoveItem = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, newValue) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{property.title || field}</label>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={handleAddItem}
          startContent={<PlusIcon className="w-4 h-4" />}
        />
      </div>

      {property.description && (
        <p className="text-xs text-slate-500">{property.description}</p>
      )}

      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              {itemSchema.type === 'object' && itemSchema.properties ? (
                <ObjectEditor
                  field={`${field}[${index}]`}
                  property={itemSchema}
                  value={item}
                  onChange={(newValue) => handleItemChange(index, newValue)}
                />
              ) : (
                <SchemaPropertyEditor
                  field={`${field}[${index}]`}
                  property={itemSchema}
                  value={item}
                  onChange={(newValue) => handleItemChange(index, newValue)}
                />
              )}
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => handleRemoveItem(index)}
              startContent={<TrashIcon className="w-4 h-4" />}
            />
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-slate-400 italic">No items yet</p>
      )}
    </div>
  );
};

const ObjectEditor = ({ field, property, value, onChange }) => {
  const handleFieldChange = (key, newValue) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  if (!property.properties) {
    return <p className="text-xs text-slate-500">Object editor: no properties defined</p>;
  }

  return (
    <Card className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10">
      <CardBody className="gap-3">
        {Object.entries(property.properties).map(([key, prop]) => (
          <SchemaPropertyEditor
            key={key}
            field={key}
            property={prop}
            value={value?.[key]}
            onChange={(newValue) => handleFieldChange(key, newValue)}
          />
        ))}
      </CardBody>
    </Card>
  );
};
