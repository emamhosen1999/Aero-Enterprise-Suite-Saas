import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Tabs,
    Tab,
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    // Hero Icons - Outline (sample set - most commonly used)
    HomeIcon,
    UserIcon,
    UsersIcon,
    CogIcon,
    BellIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    StarIcon,
    HeartIcon,
    BookmarkIcon,
    ChatBubbleLeftIcon,
    DocumentIcon,
    FolderIcon,
    PhotoIcon,
    VideoCameraIcon,
    MusicalNoteIcon,
    CameraIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    GlobeAltIcon,
    LinkIcon,
    ShareIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    PlusIcon,
    MinusIcon,
    XCircleIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    QuestionMarkCircleIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    LockOpenIcon,
    KeyIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    ShoppingBagIcon,
    GiftIcon,
    TruckIcon,
    BuildingOfficeIcon,
    BuildingStorefrontIcon,
    AcademicCapIcon,
    BeakerIcon,
    BriefcaseIcon,
    ChartBarIcon,
    ChartPieIcon,
    PresentationChartLineIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    ServerIcon,
    CloudIcon,
    CommandLineIcon,
    CodeBracketIcon,
    WrenchIcon,
    WrenchScrewdriverIcon,
    BoltIcon,
    FireIcon,
    SparklesIcon,
    SunIcon,
    MoonIcon,
    CloudArrowUpIcon,
    RocketLaunchIcon,
    PuzzlePieceIcon,
    CubeIcon,
    SquaresStackIcon,
    Squares2X2Icon,
    ViewColumnsIcon,
    ListBulletIcon,
    TableCellsIcon,
    TagIcon,
    FlagIcon,
    PaperAirplaneIcon,
    PaperClipIcon,
    PrinterIcon,
    QrCodeIcon,
    EyeIcon,
    EyeSlashIcon,
    MagnifyingGlassPlusIcon,
    ArrowPathIcon,
    ArrowsPointingOutIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    AdjustmentsHorizontalIcon,
    FunnelIcon,
    WindowIcon,
    PencilIcon,
    TrashIcon,
    ArchiveBoxIcon,
    ClipboardIcon,
    ClipboardDocumentCheckIcon,
    FingerPrintIcon,
    FaceSmileIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    ForwardIcon,
    BackwardIcon,
    CheckIcon,
    XMarkIcon as XMarkIconOutline,
    ChevronDownIcon,
    ChevronUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    Bars3Icon,
    EllipsisVerticalIcon,
    EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

// Icon registry with categories
const iconRegistry = {
    navigation: {
        label: 'Navigation',
        icons: {
            home: HomeIcon,
            'chevron-down': ChevronDownIcon,
            'chevron-up': ChevronUpIcon,
            'chevron-left': ChevronLeftIcon,
            'chevron-right': ChevronRightIcon,
            'arrow-right': ArrowRightIcon,
            'arrow-left': ArrowLeftIcon,
            'arrow-up': ArrowUpIcon,
            'arrow-down': ArrowDownIcon,
            bars: Bars3Icon,
            'ellipsis-vertical': EllipsisVerticalIcon,
            'ellipsis-horizontal': EllipsisHorizontalIcon,
        },
    },
    user: {
        label: 'User & Profile',
        icons: {
            user: UserIcon,
            users: UsersIcon,
            'face-smile': FaceSmileIcon,
            'finger-print': FingerPrintIcon,
            'academic-cap': AcademicCapIcon,
        },
    },
    communication: {
        label: 'Communication',
        icons: {
            envelope: EnvelopeIcon,
            phone: PhoneIcon,
            'chat-bubble': ChatBubbleLeftIcon,
            bell: BellIcon,
            'paper-airplane': PaperAirplaneIcon,
            share: ShareIcon,
        },
    },
    media: {
        label: 'Media',
        icons: {
            photo: PhotoIcon,
            camera: CameraIcon,
            'video-camera': VideoCameraIcon,
            microphone: MicrophoneIcon,
            'musical-note': MusicalNoteIcon,
            'speaker-wave': SpeakerWaveIcon,
            play: PlayIcon,
            pause: PauseIcon,
            stop: StopIcon,
            forward: ForwardIcon,
            backward: BackwardIcon,
        },
    },
    files: {
        label: 'Files & Documents',
        icons: {
            document: DocumentIcon,
            folder: FolderIcon,
            'paper-clip': PaperClipIcon,
            clipboard: ClipboardIcon,
            'clipboard-check': ClipboardDocumentCheckIcon,
            'archive-box': ArchiveBoxIcon,
            printer: PrinterIcon,
        },
    },
    actions: {
        label: 'Actions',
        icons: {
            plus: PlusIcon,
            minus: MinusIcon,
            check: CheckIcon,
            'x-mark': XMarkIconOutline,
            pencil: PencilIcon,
            trash: TrashIcon,
            'arrow-download': ArrowDownTrayIcon,
            'arrow-upload': ArrowUpTrayIcon,
            'arrow-path': ArrowPathIcon,
            link: LinkIcon,
            eye: EyeIcon,
            'eye-slash': EyeSlashIcon,
            'magnifying-glass': MagnifyingGlassIcon,
            'magnifying-glass-plus': MagnifyingGlassPlusIcon,
        },
    },
    status: {
        label: 'Status & Alerts',
        icons: {
            'check-circle': CheckCircleIcon,
            'x-circle': XCircleIcon,
            'exclamation-circle': ExclamationCircleIcon,
            'information-circle': InformationCircleIcon,
            'question-circle': QuestionMarkCircleIcon,
            'shield-check': ShieldCheckIcon,
            flag: FlagIcon,
        },
    },
    social: {
        label: 'Social & Engagement',
        icons: {
            heart: HeartIcon,
            star: StarIcon,
            bookmark: BookmarkIcon,
            'thumb-up': HandThumbUpIcon,
            'thumb-down': HandThumbDownIcon,
            gift: GiftIcon,
            sparkles: SparklesIcon,
        },
    },
    security: {
        label: 'Security',
        icons: {
            'lock-closed': LockClosedIcon,
            'lock-open': LockOpenIcon,
            key: KeyIcon,
        },
    },
    commerce: {
        label: 'Commerce',
        icons: {
            'shopping-cart': ShoppingCartIcon,
            'shopping-bag': ShoppingBagIcon,
            'credit-card': CreditCardIcon,
            'currency-dollar': CurrencyDollarIcon,
            truck: TruckIcon,
            tag: TagIcon,
        },
    },
    business: {
        label: 'Business & Work',
        icons: {
            briefcase: BriefcaseIcon,
            'building-office': BuildingOfficeIcon,
            'building-storefront': BuildingStorefrontIcon,
            'chart-bar': ChartBarIcon,
            'chart-pie': ChartPieIcon,
            'presentation-chart': PresentationChartLineIcon,
            cog: CogIcon,
            wrench: WrenchIcon,
            'wrench-screwdriver': WrenchScrewdriverIcon,
            'adjustments': AdjustmentsHorizontalIcon,
            funnel: FunnelIcon,
        },
    },
    technology: {
        label: 'Technology',
        icons: {
            'computer-desktop': ComputerDesktopIcon,
            'device-phone': DevicePhoneMobileIcon,
            server: ServerIcon,
            cloud: CloudIcon,
            'cloud-arrow-up': CloudArrowUpIcon,
            'command-line': CommandLineIcon,
            'code-bracket': CodeBracketIcon,
            'qr-code': QrCodeIcon,
            cube: CubeIcon,
            'puzzle-piece': PuzzlePieceIcon,
            'globe-alt': GlobeAltIcon,
        },
    },
    layout: {
        label: 'Layout & UI',
        icons: {
            'squares-2x2': Squares2X2Icon,
            'squares-stack': SquaresStackIcon,
            'view-columns': ViewColumnsIcon,
            'list-bullet': ListBulletIcon,
            'table-cells': TableCellsIcon,
            window: WindowIcon,
            'arrows-pointing-out': ArrowsPointingOutIcon,
        },
    },
    misc: {
        label: 'Miscellaneous',
        icons: {
            calendar: CalendarIcon,
            clock: ClockIcon,
            'map-pin': MapPinIcon,
            bolt: BoltIcon,
            fire: FireIcon,
            sun: SunIcon,
            moon: MoonIcon,
            beaker: BeakerIcon,
            'rocket-launch': RocketLaunchIcon,
            'arrow-trending-up': ArrowTrendingUpIcon,
            'arrow-trending-down': ArrowTrendingDownIcon,
        },
    },
};

// Flatten all icons for search
const allIcons = Object.entries(iconRegistry).reduce((acc, [category, data]) => {
    Object.entries(data.icons).forEach(([name, component]) => {
        acc[name] = { component, category, categoryLabel: data.label };
    });
    return acc;
}, {});

const IconPicker = ({
    value,
    onChange,
    label = "Icon",
    placeholder = "Select an icon",
    required = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedIcon, setSelectedIcon] = useState(value || null);

    // Get the current icon component
    const CurrentIcon = value && allIcons[value]?.component;

    // Filter icons based on search and category
    const filteredIcons = useMemo(() => {
        let icons = Object.entries(allIcons);

        if (selectedCategory !== 'all') {
            icons = icons.filter(([, data]) => data.category === selectedCategory);
        }

        if (search) {
            const searchLower = search.toLowerCase();
            icons = icons.filter(([name]) => 
                name.toLowerCase().includes(searchLower)
            );
        }

        return icons;
    }, [search, selectedCategory]);

    // Handle selection
    const handleSelect = (iconName) => {
        setSelectedIcon(iconName);
    };

    // Confirm selection
    const handleConfirm = () => {
        if (selectedIcon) {
            onChange(selectedIcon);
        }
        setIsOpen(false);
    };

    // Clear selection
    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSelectedIcon(null);
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-default-700">
                    {label}
                    {required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            {/* Picker Trigger */}
            <div
                className="flex items-center gap-3 p-3 border-2 border-default-200 rounded-lg cursor-pointer hover:border-default-400 transition-colors"
                onClick={() => setIsOpen(true)}
            >
                {CurrentIcon ? (
                    <>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CurrentIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{value}</p>
                            <p className="text-xs text-default-400">
                                {allIcons[value]?.categoryLabel}
                            </p>
                        </div>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleClear}
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </Button>
                    </>
                ) : (
                    <div className="flex items-center gap-3 text-default-400">
                        <div className="w-10 h-10 rounded-lg border-2 border-dashed border-default-300 flex items-center justify-center">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm">{placeholder}</span>
                    </div>
                )}
            </div>

            {/* Icon Picker Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                size="4xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-0",
                    footer: "border-t border-divider",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">Select Icon</h2>
                        <p className="text-sm text-default-500">
                            Choose from {Object.keys(allIcons).length} icons
                        </p>
                    </ModalHeader>
                    <ModalBody className="p-4">
                        {/* Search & Category Filter */}
                        <div className="flex gap-3 mb-4">
                            <Input
                                placeholder="Search icons..."
                                value={search}
                                onValueChange={setSearch}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                isClearable
                                onClear={() => setSearch('')}
                                className="flex-1"
                                size="sm"
                            />
                        </div>

                        {/* Category Tabs */}
                        <Tabs
                            selectedKey={selectedCategory}
                            onSelectionChange={setSelectedCategory}
                            variant="underlined"
                            classNames={{
                                tabList: "flex-wrap gap-0",
                                tab: "text-xs px-2",
                                panel: "pt-4",
                            }}
                        >
                            <Tab key="all" title="All" />
                            {Object.entries(iconRegistry).map(([key, data]) => (
                                <Tab key={key} title={data.label} />
                            ))}
                        </Tabs>

                        {/* Icon Grid */}
                        <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto p-1">
                            <AnimatePresence mode="popLayout">
                                {filteredIcons.map(([name, data]) => {
                                    const IconComponent = data.component;
                                    const isSelected = selectedIcon === name;

                                    return (
                                        <motion.button
                                            key={name}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                                                isSelected
                                                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                                                    : 'bg-default-100 hover:bg-default-200 text-default-600'
                                            }`}
                                            onClick={() => handleSelect(name)}
                                            title={name}
                                        >
                                            <IconComponent className="w-6 h-6" />
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {filteredIcons.length === 0 && (
                            <div className="text-center py-8 text-default-400">
                                <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>No icons found matching "{search}"</p>
                            </div>
                        )}

                        {/* Selected Preview */}
                        {selectedIcon && (
                            <div className="mt-4 p-4 bg-default-100 rounded-lg flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                    {allIcons[selectedIcon]?.component && (
                                        <allIcons[selectedIcon].component className="w-8 h-8 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">{selectedIcon}</p>
                                    <p className="text-sm text-default-500">
                                        {allIcons[selectedIcon]?.categoryLabel}
                                    </p>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleConfirm}
                            isDisabled={!selectedIcon}
                        >
                            Select Icon
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

// Export icon registry for use in block components
export { iconRegistry, allIcons };
export default IconPicker;
