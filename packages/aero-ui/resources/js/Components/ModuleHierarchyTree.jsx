import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardBody,
    Chip,
    Button,
    Badge,
    Checkbox
} from "@heroui/react";
import {
    ChevronRightIcon,
    ChevronDownIcon,
    CubeIcon,
    FolderIcon,
    RectangleGroupIcon,
    CommandLineIcon
} from "@heroicons/react/24/outline";

/**
 * ModuleHierarchyTree Component
 * 
 * Renders a 4-level hierarchical tree structure:
 * Modules → Submodules → Components → Actions
 * 
 * @param {Array} moduleHierarchy - Complete hierarchy from backend
 * @param {Boolean} selectable - Enable checkboxes for selection
 * @param {Array} selectedItems - Array of selected item IDs
 * @param {Function} onSelectionChange - Callback when selection changes
 * @param {Function} onItemClick - Callback when an item is clicked
 * @param {Boolean} showInactive - Show inactive modules/items
 */
const ModuleHierarchyTree = ({
    moduleHierarchy = [],
    selectable = false,
    selectedItems = [],
    onSelectionChange,
    onItemClick,
    showInactive = false
}) => {
    const [expandedModules, setExpandedModules] = useState(new Set());
    const [expandedSubmodules, setExpandedSubmodules] = useState(new Set());
    const [expandedComponents, setExpandedComponents] = useState(new Set());

    // Toggle expand/collapse
    const toggleExpand = (set, setter, id) => {
        const newSet = new Set(set);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setter(newSet);
    };

    // Check if item is selected
    const isSelected = (type, id) => {
        if (!selectable) return false;
        return selectedItems.some(item => item.type === type && item.id === id);
    };

    // Handle selection change
    const handleSelect = (type, id, item) => {
        if (!selectable || !onSelectionChange) return;
        
        const isCurrentlySelected = isSelected(type, id);
        let newSelection;
        
        if (isCurrentlySelected) {
            newSelection = selectedItems.filter(item => !(item.type === type && item.id === id));
        } else {
            newSelection = [...selectedItems, { type, id, data: item }];
        }
        
        onSelectionChange(newSelection);
    };

    // Render Action (Level 4)
    const renderAction = (action, componentId, submoduleId, moduleId) => {
        const actionId = `action-${action.id}`;
        const selected = isSelected('action', action.id);

        return (
            <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 p-3 hover:bg-default-50 rounded-lg transition-colors ml-12"
            >
                {selectable && (
                    <Checkbox
                        isSelected={selected}
                        onChange={() => handleSelect('action', action.id, action)}
                        size="sm"
                    />
                )}
                
                <CommandLineIcon className="w-4 h-4 text-warning" />
                
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{action.name}</span>
                        <Chip size="sm" variant="flat" color="warning">
                            {action.code}
                        </Chip>
                    </div>
                    {action.description && (
                        <p className="text-xs text-default-400 mt-1">{action.description}</p>
                    )}
                </div>

                {onItemClick && (
                    <Button
                        size="sm"
                        variant="light"
                        onClick={() => onItemClick('action', action)}
                    >
                        View
                    </Button>
                )}
            </motion.div>
        );
    };

    // Render Component (Level 3)
    const renderComponent = (component, submoduleId, moduleId) => {
        const isExpanded = expandedComponents.has(component.id);
        const actions = component.actions || [];
        const selected = isSelected('component', component.id);

        return (
            <div key={component.id} className="ml-8 mb-2">
                <div
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-default-100 rounded-lg transition-colors ${
                        selected ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => toggleExpand(expandedComponents, setExpandedComponents, component.id)}
                >
                    {selectable && (
                        <Checkbox
                            isSelected={selected}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleSelect('component', component.id, component);
                            }}
                            size="sm"
                        />
                    )}

                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(expandedComponents, setExpandedComponents, component.id);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                        )}
                    </Button>

                    <RectangleGroupIcon className="w-5 h-5 text-success" />

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{component.name}</span>
                            <Chip size="sm" variant="flat" color="success">
                                {component.code}
                            </Chip>
                            {actions.length > 0 && (
                                <Badge content={actions.length} color="warning" size="sm">
                                    <Chip size="sm" variant="bordered">Actions</Chip>
                                </Badge>
                            )}
                        </div>
                        {component.description && (
                            <p className="text-sm text-default-500 mt-1">{component.description}</p>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && actions.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {actions.map(action => renderAction(action, component.id, submoduleId, moduleId))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Render Submodule (Level 2)
    const renderSubmodule = (submodule, moduleId) => {
        const isExpanded = expandedSubmodules.has(submodule.id);
        const components = submodule.components || [];
        const selected = isSelected('submodule', submodule.id);

        return (
            <div key={submodule.id} className="ml-6 mb-2">
                <div
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-default-100 rounded-lg transition-colors ${
                        selected ? 'bg-secondary-50' : ''
                    }`}
                    onClick={() => toggleExpand(expandedSubmodules, setExpandedSubmodules, submodule.id)}
                >
                    {selectable && (
                        <Checkbox
                            isSelected={selected}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleSelect('submodule', submodule.id, submodule);
                            }}
                            size="sm"
                        />
                    )}

                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(expandedSubmodules, setExpandedSubmodules, submodule.id);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                        )}
                    </Button>

                    <FolderIcon className="w-5 h-5 text-secondary" />

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{submodule.name}</span>
                            <Chip size="sm" variant="flat" color="secondary">
                                {submodule.code}
                            </Chip>
                            {components.length > 0 && (
                                <Badge content={components.length} color="success" size="sm">
                                    <Chip size="sm" variant="bordered">Components</Chip>
                                </Badge>
                            )}
                        </div>
                        {submodule.description && (
                            <p className="text-sm text-default-500 mt-1">{submodule.description}</p>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && components.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {components.map(component => renderComponent(component, submodule.id, moduleId))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Render Module (Level 1)
    const renderModule = (module) => {
        if (!showInactive && !module.is_active) return null;

        const isExpanded = expandedModules.has(module.id);
        const submodules = module.submodules || [];
        const selected = isSelected('module', module.id);

        return (
            <Card key={module.id} className="mb-3">
                <CardBody className="p-0">
                    <div
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-default-100 transition-colors ${
                            selected ? 'bg-primary-50' : ''
                        } ${!module.is_active ? 'opacity-60' : ''}`}
                        onClick={() => toggleExpand(expandedModules, setExpandedModules, module.id)}
                    >
                        {selectable && (
                            <Checkbox
                                isSelected={selected}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleSelect('module', module.id, module);
                                }}
                                size="sm"
                            />
                        )}

                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(expandedModules, setExpandedModules, module.id);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                                <ChevronRightIcon className="w-4 h-4" />
                            )}
                        </Button>

                        <CubeIcon className="w-6 h-6 text-primary" />

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{module.name}</span>
                                <Chip size="sm" variant="flat" color="primary">
                                    {module.code}
                                </Chip>
                                {!module.is_active && (
                                    <Chip size="sm" variant="flat" color="danger">Inactive</Chip>
                                )}
                                {module.is_core && (
                                    <Chip size="sm" variant="flat" color="default">Core</Chip>
                                )}
                            </div>
                            {module.description && (
                                <p className="text-sm text-default-500 mt-1">{module.description}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {submodules.length > 0 && (
                                <Badge content={submodules.length} color="secondary" size="sm">
                                    <Chip size="sm" variant="bordered">Features</Chip>
                                </Badge>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {isExpanded && submodules.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="pb-4"
                            >
                                {submodules.map(submodule => renderSubmodule(submodule, module.id))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardBody>
            </Card>
        );
    };

    // Main render
    return (
        <div className="space-y-3">
            {moduleHierarchy.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-8">
                        <p className="text-default-400">No modules available</p>
                    </CardBody>
                </Card>
            ) : (
                moduleHierarchy.map(module => renderModule(module))
            )}
        </div>
    );
};

export default ModuleHierarchyTree;
