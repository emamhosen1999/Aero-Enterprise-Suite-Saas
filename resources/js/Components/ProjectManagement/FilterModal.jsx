import React, { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Checkbox,
    CheckboxGroup,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    DatePicker,
    RangeSlider,
    ButtonGroup,
    Spacer,
} from "@heroui/react";
import {
    FunnelIcon,
    XMarkIcon,
    BookmarkIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    BanknotesIcon,
    UserIcon,
    ChartBarSquareIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

const FilterModal = ({ 
    isOpen, 
    onClose, 
    filters = {}, 
    onApplyFilters,
    onResetFilters,
    onSaveFilterPreset,
    filterPresets = [],
    availableOptions = {} 
}) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [presetName, setPresetName] = useState('');
    const [showPresetInput, setShowPresetInput] = useState(false);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = {
            status: 'all',
            priority: 'all',
            phase: 'all',
            department: 'all',
            lead: 'all',
            budget: 'all',
            risk: 'all',
            timeline: 'all',
            progress: 'all',
            type: 'all',
            methodology: 'all',
            health: 'all',
            tags: [],
            dateRange: null,
            budgetRange: [0, 1000000],
            progressRange: [0, 100],
        };
        setLocalFilters(resetFilters);
        onResetFilters(resetFilters);
    };

    const handleSavePreset = () => {
        if (presetName.trim()) {
            onSaveFilterPreset(presetName.trim(), localFilters);
            setPresetName('');
            setShowPresetInput(false);
        }
    };

    const handleLoadPreset = (preset) => {
        setLocalFilters(preset.filters);
    };

    const activeFiltersCount = Object.values(localFilters).filter(value => 
        value !== 'all' && value !== null && value !== undefined && 
        (!Array.isArray(value) || value.length > 0)
    ).length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="5xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
                header: "border-b border-default-200",
                footer: "border-t border-default-200",
                body: "py-6",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                            <FunnelIcon className="w-6 h-6 text-primary" />
                            <div>
                                <h2 className="text-lg font-semibold">Advanced Project Filters</h2>
                                <p className="text-sm text-default-500">
                                    Refine your project search with comprehensive filtering options
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {activeFiltersCount > 0 && (
                                <Chip color="primary" size="sm" variant="flat">
                                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                                </Chip>
                            )}
                        </div>
                    </div>
                </ModalHeader>

                <ModalBody>
                    <div className="space-y-6">
                        {/* Filter Presets */}
                        {filterPresets.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <BookmarkIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Saved Filter Presets</h3>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="flex flex-wrap gap-2">
                                        {filterPresets.map((preset, index) => (
                                            <Button
                                                key={index}
                                                size="sm"
                                                variant="bordered"
                                                onPress={() => handleLoadPreset(preset)}
                                                className="text-xs"
                                            >
                                                {preset.name}
                                            </Button>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Quick Search */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold">Quick Search</h3>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <Input
                                    placeholder="Search projects by name, code, or description..."
                                    value={localFilters.search || ''}
                                    onValueChange={(value) => handleFilterChange('search', value)}
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                    variant="bordered"
                                    color="default"
                                    size="md"
                                    isClearable
                                    classNames={{
                                        base: "max-w-full",
                                        mainWrapper: "h-full",
                                        input: "text-small",
                                        inputWrapper: "h-full font-normal text-default-500 bg-content1/50 backdrop-blur-md border-divider/50 hover:bg-content1/80 focus-within:!bg-content1/80 data-[hover=true]:bg-content1/80 group-data-[focus=true]:bg-content1/80",
                                    }}
                                />
                            </CardBody>
                        </Card>

                        {/* Status & Priority Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <ChartBarSquareIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Status & Priority</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <Select
                                        label="Project Status"
                                        selectedKeys={[localFilters.status]}
                                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0])}
                                        variant="bordered"
                                        labelPlacement="outside"
                                        placeholder="Choose a status"
                                        classNames={{
                                            base: "max-w-full",
                                            mainWrapper: "h-full",
                                            trigger: "h-full font-normal text-default-500 bg-content1/50 backdrop-blur-md border-divider/50 hover:bg-content1/80 data-[hover=true]:bg-content1/80 group-data-[focus=true]:bg-content1/80",
                                            popoverContent: "bg-content1/80 backdrop-blur-lg border-divider/30",
                                            listbox: "p-0",
                                        }}
                                        popoverProps={{
                                            classNames: {
                                                base: "before:bg-content1/50 backdrop-blur-md",
                                                content: "p-0 border-small border-divider bg-content1/50",
                                            }
                                        }}
                                    >
                                        <SelectItem key="all" value="all">All Statuses</SelectItem>
                                        <SelectItem key="not_started" value="not_started">Not Started</SelectItem>
                                        <SelectItem key="planning" value="planning">Planning</SelectItem>
                                        <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                                        <SelectItem key="monitoring" value="monitoring">Monitoring</SelectItem>
                                        <SelectItem key="on_hold" value="on_hold">On Hold</SelectItem>
                                        <SelectItem key="completed" value="completed">Completed</SelectItem>
                                        <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                                        <SelectItem key="archived" value="archived">Archived</SelectItem>
                                    </Select>

                                    <Select
                                        label="Priority Level"
                                        selectedKeys={[localFilters.priority]}
                                        onSelectionChange={(keys) => handleFilterChange('priority', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Priorities</SelectItem>
                                        <SelectItem key="low" value="low">Low</SelectItem>
                                        <SelectItem key="medium" value="medium">Medium</SelectItem>
                                        <SelectItem key="high" value="high">High</SelectItem>
                                        <SelectItem key="critical" value="critical">Critical</SelectItem>
                                    </Select>

                                    <Select
                                        label="Project Health"
                                        selectedKeys={[localFilters.health]}
                                        onSelectionChange={(keys) => handleFilterChange('health', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Health Status</SelectItem>
                                        <SelectItem key="good" value="good">Good</SelectItem>
                                        <SelectItem key="at_risk" value="at_risk">At Risk</SelectItem>
                                        <SelectItem key="critical" value="critical">Critical</SelectItem>
                                    </Select>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <UserIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Team & Organization</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <Select
                                        label="Department"
                                        selectedKeys={[localFilters.department]}
                                        onSelectionChange={(keys) => handleFilterChange('department', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Departments</SelectItem>
                                        {availableOptions.departments?.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Project Lead"
                                        selectedKeys={[localFilters.lead]}
                                        onSelectionChange={(keys) => handleFilterChange('lead', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Leads</SelectItem>
                                        {availableOptions.leads?.map(lead => (
                                            <SelectItem key={lead.id} value={lead.id}>
                                                {lead.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Project Type"
                                        selectedKeys={[localFilters.type]}
                                        onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Types</SelectItem>
                                        <SelectItem key="internal" value="internal">Internal</SelectItem>
                                        <SelectItem key="client" value="client">Client</SelectItem>
                                        <SelectItem key="research" value="research">Research</SelectItem>
                                        <SelectItem key="maintenance" value="maintenance">Maintenance</SelectItem>
                                    </Select>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Progress & Budget Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <ChartBarSquareIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Progress Range</h3>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <RangeSlider
                                        label="Progress Percentage"
                                        value={localFilters.progressRange || [0, 100]}
                                        onChange={(value) => handleFilterChange('progressRange', value)}
                                        minValue={0}
                                        maxValue={100}
                                        step={5}
                                        formatOptions={{style: "percent", minimumFractionDigits: 0}}
                                        color="primary"
                                        size="md"
                                        showTooltip={true}
                                        showSteps={false}
                                        showOutline={false}
                                        hideValue={false}
                                        hideThumb={false}
                                        fillOffset={0}
                                        classNames={{
                                            base: "max-w-md",
                                            track: "border-s-primary-100",
                                            filler: "bg-gradient-to-r from-primary-500 to-primary-400",
                                        }}
                                        tooltipProps={{
                                            classNames: {
                                                content: "bg-content1/80 backdrop-blur-md border-divider",
                                            }
                                        }}
                                    />
                                    <div className="flex justify-between text-sm text-default-500 mt-2">
                                        <span>{localFilters.progressRange?.[0] || 0}%</span>
                                        <span>{localFilters.progressRange?.[1] || 100}%</span>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <BanknotesIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Budget Range</h3>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <RangeSlider
                                        label="Budget Amount (USD)"
                                        value={localFilters.budgetRange || [0, 1000000]}
                                        onChange={(value) => handleFilterChange('budgetRange', value)}
                                        minValue={0}
                                        maxValue={1000000}
                                        step={10000}
                                        formatOptions={{style: "currency", currency: "USD", minimumFractionDigits: 0}}
                                        color="secondary"
                                        size="md"
                                        showTooltip={true}
                                        showSteps={false}
                                        showOutline={false}
                                        hideValue={false}
                                        hideThumb={false}
                                        fillOffset={0}
                                        classNames={{
                                            base: "max-w-md",
                                            track: "border-s-secondary-100",
                                            filler: "bg-gradient-to-r from-secondary-500 to-secondary-400",
                                        }}
                                        tooltipProps={{
                                            classNames: {
                                                content: "bg-content1/80 backdrop-blur-md border-divider",
                                            }
                                        }}
                                    />
                                    <div className="flex justify-between text-sm text-default-500 mt-2">
                                        <span>${(localFilters.budgetRange?.[0] || 0).toLocaleString()}</span>
                                        <span>${(localFilters.budgetRange?.[1] || 1000000).toLocaleString()}</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Timeline & Methodology */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <CalendarDaysIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Timeline</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <Select
                                        label="Timeline Status"
                                        selectedKeys={[localFilters.timeline]}
                                        onSelectionChange={(keys) => handleFilterChange('timeline', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Timelines</SelectItem>
                                        <SelectItem key="on_track" value="on_track">On Track</SelectItem>
                                        <SelectItem key="at_risk" value="at_risk">At Risk</SelectItem>
                                        <SelectItem key="delayed" value="delayed">Delayed</SelectItem>
                                        <SelectItem key="overdue" value="overdue">Overdue</SelectItem>
                                    </Select>

                                    <Select
                                        label="Project Phase"
                                        selectedKeys={[localFilters.phase]}
                                        onSelectionChange={(keys) => handleFilterChange('phase', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Phases</SelectItem>
                                        <SelectItem key="initiation" value="initiation">Initiation</SelectItem>
                                        <SelectItem key="planning" value="planning">Planning</SelectItem>
                                        <SelectItem key="execution" value="execution">Execution</SelectItem>
                                        <SelectItem key="monitoring" value="monitoring">Monitoring</SelectItem>
                                        <SelectItem key="closing" value="closing">Closing</SelectItem>
                                    </Select>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircleIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Methodology</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <Select
                                        label="Methodology"
                                        selectedKeys={[localFilters.methodology]}
                                        onSelectionChange={(keys) => handleFilterChange('methodology', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Methodologies</SelectItem>
                                        <SelectItem key="agile" value="agile">Agile</SelectItem>
                                        <SelectItem key="scrum" value="scrum">Scrum</SelectItem>
                                        <SelectItem key="kanban" value="kanban">Kanban</SelectItem>
                                        <SelectItem key="waterfall" value="waterfall">Waterfall</SelectItem>
                                        <SelectItem key="hybrid" value="hybrid">Hybrid</SelectItem>
                                        <SelectItem key="pmbok" value="pmbok">PMBOK</SelectItem>
                                        <SelectItem key="prince2" value="prince2">PRINCE2</SelectItem>
                                    </Select>

                                    <Select
                                        label="Risk Level"
                                        selectedKeys={[localFilters.risk]}
                                        onSelectionChange={(keys) => handleFilterChange('risk', Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">All Risk Levels</SelectItem>
                                        <SelectItem key="low" value="low">Low</SelectItem>
                                        <SelectItem key="medium" value="medium">Medium</SelectItem>
                                        <SelectItem key="high" value="high">High</SelectItem>
                                        <SelectItem key="critical" value="critical">Critical</SelectItem>
                                    </Select>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Tags */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <BookmarkIcon className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold">Tags</h3>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <CheckboxGroup
                                    value={localFilters.tags || []}
                                    onValueChange={(value) => handleFilterChange('tags', value)}
                                    orientation="horizontal"
                                    className="flex flex-wrap gap-2"
                                >
                                    {availableOptions.tags?.map(tag => (
                                        <Checkbox key={tag.id} value={tag.id} size="sm">
                                            <Chip size="sm" variant="flat" color="primary">
                                                {tag.name}
                                            </Chip>
                                        </Checkbox>
                                    ))}
                                </CheckboxGroup>
                            </CardBody>
                        </Card>

                        {/* Save Filter Preset */}
                        {showPresetInput && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <BookmarkIcon className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Save Filter Preset</h3>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="flex space-x-2">
                                        <Input
                                            placeholder="Enter preset name..."
                                            value={presetName}
                                            onValueChange={setPresetName}
                                            variant="bordered"
                                            labelPlacement="outside"
                                            color="default"
                                            size="md"
                                            isClearable
                                            className="flex-1"
                                            classNames={{
                                                base: "max-w-full",
                                                mainWrapper: "h-full",
                                                input: "text-small",
                                                inputWrapper: "h-full font-normal text-default-500 bg-content1/50 backdrop-blur-md border-divider/50 hover:bg-content1/80 focus-within:!bg-content1/80 data-[hover=true]:bg-content1/80 group-data-[focus=true]:bg-content1/80",
                                            }}
                                        />
                                        <Button
                                            color="primary"
                                            onPress={handleSavePreset}
                                            disabled={!presetName.trim()}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            variant="light"
                                            onPress={() => setShowPresetInput(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </ModalBody>

                <ModalFooter>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="light"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={handleReset}
                            >
                                Reset All
                            </Button>
                            <Button
                                variant="light"
                                startContent={<BookmarkIcon className="w-4 h-4" />}
                                onPress={() => setShowPresetInput(true)}
                                disabled={activeFiltersCount === 0}
                            >
                                Save Preset
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="light"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleApply}
                                startContent={<FunnelIcon className="w-4 h-4" />}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default FilterModal;
