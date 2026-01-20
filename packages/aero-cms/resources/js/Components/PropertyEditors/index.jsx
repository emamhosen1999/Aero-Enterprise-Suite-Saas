/**
 * Property Editors for CMS Block Settings
 * 
 * These components are used by SchemaPropertyEditor to render
 * form fields based on JSON schema property types.
 */

export { default as ImagePicker } from './ImagePicker';
export { default as IconPicker, iconRegistry, allIcons } from './IconPicker';
export { default as RichTextEditor } from './RichTextEditor';
export { default as ColorPicker } from './ColorPicker';
export { default as DatePicker } from './DatePicker';
export { default as LinkPicker } from './LinkPicker';

/**
 * Property Editor Registry
 * 
 * Maps JSON schema types/formats to editor components.
 * Use this to extend the schema property editor with custom field types.
 */
export const propertyEditorRegistry = {
    // Standard types
    string: 'Input',
    number: 'Input',
    boolean: 'Switch',
    
    // Special formats
    'string:url': 'Input',
    'string:email': 'Input',
    'string:color': 'ColorPicker',
    'string:date': 'DatePicker',
    'string:datetime': 'DatePicker',
    
    // Custom UI types
    image: 'ImagePicker',
    icon: 'IconPicker',
    richtext: 'RichTextEditor',
    textarea: 'Textarea',
    select: 'Select',
    color: 'ColorPicker',
    date: 'DatePicker',
    datetime: 'DatePicker',
    link: 'LinkPicker',
    
    // Complex types
    array: 'Repeater',
    object: 'ObjectEditor',
};

/**
 * Get the appropriate editor for a schema property
 */
export const getEditorForProperty = (property) => {
    const { type, format, ui_type } = property;
    
    // First check for explicit UI type
    if (ui_type && propertyEditorRegistry[ui_type]) {
        return propertyEditorRegistry[ui_type];
    }
    
    // Check for format-specific editors
    if (format && propertyEditorRegistry[`${type}:${format}`]) {
        return propertyEditorRegistry[`${type}:${format}`];
    }
    
    // Check for enum (select)
    if (property.enum) {
        return 'Select';
    }
    
    // Fall back to type-based editor
    return propertyEditorRegistry[type] || 'Input';
};
