import React, { useMemo } from 'react';
import { Input, Select, SelectItem, Textarea, Button, Divider, Tab, Tabs } from '@heroui/react';
import { SchemaPropertyEditor } from './SchemaPropertyEditor';

const BlockSettings = ({ block, blockTypes, onChange }) => {
  const blockTypeConfig = useMemo(
    () => blockTypes.find((b) => b.type === block.block_type),
    [block.block_type, blockTypes]
  );

  if (!blockTypeConfig) {
    return <div className="p-4 text-sm text-slate-500">Block type not found</div>;
  }

  const handleContentChange = (field, value) => {
    onChange({
      content: {
        ...block.content,
        [field]: value,
      },
    });
  };

  const handleSettingsChange = (field, value) => {
    onChange({
      settings: {
        ...block.settings,
        [field]: value,
      },
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Block Type Info */}
      <div>
        <h3 className="font-semibold text-sm mb-2">Block Type</h3>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <p className="font-medium">{blockTypeConfig.label}</p>
          <p className="mt-1">{blockTypeConfig.description}</p>
        </div>
      </div>

      <Divider />

      {/* Content Settings */}
      {blockTypeConfig.schema && blockTypeConfig.schema.properties && (
        <div>
          <h3 className="font-semibold text-sm mb-4">Content</h3>
          <div className="space-y-3">
            {Object.entries(blockTypeConfig.schema.properties).map(([key, property]) => (
              <SchemaPropertyEditor
                key={key}
                field={key}
                property={property}
                value={block.content?.[key]}
                onChange={(value) => handleContentChange(key, value)}
              />
            ))}
          </div>
        </div>
      )}

      <Divider />

      {/* Display Settings */}
      <div>
        <h3 className="font-semibold text-sm mb-4">Display Settings</h3>
        <div className="space-y-3">
          {/* Padding */}
          <Select
            label="Padding"
            selectedKeys={[block.settings?.padding || 'md']}
            onSelectionChange={(keys) => handleSettingsChange('padding', Array.from(keys)[0])}
            size="sm"
            classNames={{ trigger: 'bg-slate-100 dark:bg-slate-950' }}
          >
            <SelectItem key="none">None</SelectItem>
            <SelectItem key="sm">Small</SelectItem>
            <SelectItem key="md">Medium</SelectItem>
            <SelectItem key="lg">Large</SelectItem>
            <SelectItem key="xl">Extra Large</SelectItem>
          </Select>

          {/* Margin */}
          <Select
            label="Margin"
            selectedKeys={[block.settings?.margin || 'md']}
            onSelectionChange={(keys) => handleSettingsChange('margin', Array.from(keys)[0])}
            size="sm"
            classNames={{ trigger: 'bg-slate-100 dark:bg-slate-950' }}
          >
            <SelectItem key="none">None</SelectItem>
            <SelectItem key="sm">Small</SelectItem>
            <SelectItem key="md">Medium</SelectItem>
            <SelectItem key="lg">Large</SelectItem>
            <SelectItem key="xl">Extra Large</SelectItem>
          </Select>

          {/* Text Align */}
          <Select
            label="Text Alignment"
            selectedKeys={[block.settings?.textAlign || 'left']}
            onSelectionChange={(keys) => handleSettingsChange('textAlign', Array.from(keys)[0])}
            size="sm"
            classNames={{ trigger: 'bg-slate-100 dark:bg-slate-950' }}
          >
            <SelectItem key="left">Left</SelectItem>
            <SelectItem key="center">Center</SelectItem>
            <SelectItem key="right">Right</SelectItem>
            <SelectItem key="justify">Justify</SelectItem>
          </Select>

          {/* Background Color */}
          <Input
            type="color"
            label="Background Color"
            value={block.settings?.bgColor || '#ffffff'}
            onChange={(e) => handleSettingsChange('bgColor', e.target.value)}
            size="sm"
          />

          {/* Text Color */}
          <Input
            type="color"
            label="Text Color"
            value={block.settings?.textColor || '#000000'}
            onChange={(e) => handleSettingsChange('textColor', e.target.value)}
            size="sm"
          />

          {/* Custom CSS Class */}
          <Input
            label="Custom CSS Class"
            placeholder="e.g., my-custom-class"
            value={block.settings?.customClass || ''}
            onValueChange={(value) => handleSettingsChange('customClass', value)}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />
        </div>
      </div>

      <Divider />

      {/* Advanced Settings */}
      <div>
        <h3 className="font-semibold text-sm mb-4">Advanced</h3>
        <div className="space-y-3">
          {/* Visibility */}
          <Select
            label="Visibility"
            selectedKeys={[block.settings?.visibility || 'all']}
            onSelectionChange={(keys) => handleSettingsChange('visibility', Array.from(keys)[0])}
            size="sm"
            classNames={{ trigger: 'bg-slate-100 dark:bg-slate-950' }}
          >
            <SelectItem key="all">All Devices</SelectItem>
            <SelectItem key="desktop">Desktop Only</SelectItem>
            <SelectItem key="tablet">Tablet & Up</SelectItem>
            <SelectItem key="mobile">Mobile Only</SelectItem>
          </Select>

          {/* Block ID */}
          <Input
            label="Block ID (for anchor links)"
            placeholder="e.g., features-section"
            value={block.settings?.blockId || ''}
            onValueChange={(value) => handleSettingsChange('blockId', value)}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />

          {/* Custom Attributes */}
          <Textarea
            label="Custom HTML Attributes"
            placeholder='e.g., data-test="block" aria-label="Features"'
            value={block.settings?.customAttrs || ''}
            onValueChange={(value) => handleSettingsChange('customAttrs', value)}
            minRows={3}
            maxRows={6}
            size="sm"
            classNames={{ inputWrapper: 'bg-slate-100 dark:bg-slate-950' }}
          />
        </div>
      </div>
    </div>
  );
};

export default BlockSettings;
