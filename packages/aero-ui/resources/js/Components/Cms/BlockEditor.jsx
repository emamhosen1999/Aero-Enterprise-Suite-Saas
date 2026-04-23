import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Tab, Tabs, Textarea, Switch } from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const BlockEditor = ({ isOpen, onOpenChange, block = null, blockType = null, onSave, saving = false }) => {
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('content');

    useEffect(() => {
        if (block?.data) {
            setFormData(block.data);
        } else {
            setFormData({});
        }
    }, [block, isOpen]);

    const themeRadius = useThemeRadius();

    const renderFormField = (field) => {
        const value = formData[field.name] || '';
        const commonProps = {
            label: field.label,
            placeholder: field.placeholder,
            isRequired: field.required,
            size: "sm",
            radius: themeRadius,
        };

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <Input
                        key={field.name}
                        {...commonProps}
                        type={field.type}
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        key={field.name}
                        {...commonProps}
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        minRows={3}
                    />
                );
            case 'select':
                return (
                    <Select
                        key={field.name}
                        {...commonProps}
                        selectedKeys={value ? [value] : []}
                        onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0];
                            setFormData({ ...formData, [field.name]: selected });
                        }}
                    >
                        {(field.options || []).map(option => (
                            <SelectItem key={option.value || option}>{option.label || option}</SelectItem>
                        ))}
                    </Select>
                );
            case 'boolean':
                return (
                    <Switch
                        key={field.name}
                        checked={!!value}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                    >
                        {field.label}
                    </Switch>
                );
            case 'color':
                return (
                    <Input
                        key={field.name}
                        {...commonProps}
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                );
            default:
                return (
                    <Input
                        key={field.name}
                        {...commonProps}
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                );
        }
    };

    // Parse schema from blockType if available
    const schema = blockType?.schema ? JSON.parse(blockType.schema) : {};
    const contentFields = schema.fields?.filter(f => !f.section || f.section === 'content') || getDefaultFieldsForType(blockType?.name || '');
    const settingsFields = schema.fields?.filter(f => f.section === 'settings') || [];

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">
                        {block?.id ? 'Edit Block' : 'Add Block'} - {blockType?.label}
                    </h2>
                    <p className="text-xs text-default-500">{blockType?.description}</p>
                </ModalHeader>
                <ModalBody className="gap-4">
                    <Tabs
                        aria-label="Block editor tabs"
                        selectedKey={activeTab}
                        onSelectionChange={setActiveTab}
                    >
                        <Tab key="content" title="Content" className="space-y-4">
                            {contentFields.length > 0 ? (
                                contentFields.map(renderFormField)
                            ) : (
                                <p className="text-sm text-default-500">No content fields for this block type</p>
                            )}
                        </Tab>
                        {settingsFields.length > 0 && (
                            <Tab key="settings" title="Settings" className="space-y-4">
                                {settingsFields.map(renderFormField)}
                            </Tab>
                        )}
                        <Tab key="advanced" title="Advanced" className="space-y-4">
                            <Input
                                label="Custom CSS Classes"
                                placeholder="e.g. mt-4 bg-blue-50"
                                value={formData.customClasses || ''}
                                onChange={(e) => setFormData({ ...formData, customClasses: e.target.value })}
                                size="sm"
                                radius={themeRadius}
                            />
                            <Select
                                label="Visibility"
                                placeholder="Always visible"
                                selectedKeys={formData.visibility ? [formData.visibility] : []}
                                onSelectionChange={(keys) => setFormData({ ...formData, visibility: Array.from(keys)[0] })}
                                size="sm"
                                radius={themeRadius}
                            >
                                <SelectItem key="always">Always Visible</SelectItem>
                                <SelectItem key="desktop">Desktop Only</SelectItem>
                                <SelectItem key="mobile">Mobile Only</SelectItem>
                                <SelectItem key="logged-in">Logged In Only</SelectItem>
                            </Select>
                        </Tab>
                    </Tabs>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        color="primary"
                        isLoading={saving}
                        onPress={() => onSave(formData)}
                    >
                        {block?.id ? 'Update Block' : 'Add Block'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// Default fields based on block type if schema not provided
function getDefaultFieldsForType(blockType) {
    const defaultSchemas = {
        Hero: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'subtitle', label: 'Subtitle', type: 'textarea', required: false },
            { name: 'backgroundImage', label: 'Background Image URL', type: 'text', required: false },
            { name: 'ctaText', label: 'CTA Button Text', type: 'text', required: false },
            { name: 'ctaUrl', label: 'CTA URL', type: 'text', required: false },
        ],
        'Rich Text': [
            { name: 'content', label: 'Content', type: 'textarea', required: true },
        ],
        CTA: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
            { name: 'buttonText', label: 'Button Text', type: 'text', required: true },
            { name: 'buttonUrl', label: 'Button URL', type: 'text', required: true },
        ],
        'Image Gallery': [
            { name: 'title', label: 'Gallery Title', type: 'text', required: false },
            { name: 'columns', label: 'Columns', type: 'select', options: [1, 2, 3, 4], required: false },
        ],
        Testimonials: [
            { name: 'title', label: 'Section Title', type: 'text', required: false },
            { name: 'testimonials', label: 'Number of Testimonials', type: 'number', required: false },
        ],
        FAQ: [
            { name: 'title', label: 'FAQ Title', type: 'text', required: false },
            { name: 'faqs', label: 'Number of FAQs', type: 'number', required: false },
        ],
    };

    return defaultSchemas[blockType] || [
        { name: 'title', label: 'Title', type: 'text', required: false },
        { name: 'description', label: 'Description', type: 'textarea', required: false },
    ];
}

export default BlockEditor;