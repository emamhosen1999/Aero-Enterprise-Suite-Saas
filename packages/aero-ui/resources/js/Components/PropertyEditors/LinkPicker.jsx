import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Input, Popover, PopoverTrigger, PopoverContent, Tabs, Tab, Select, SelectItem, Switch, Spinner } from "@heroui/react";
import { LinkIcon, GlobeAltIcon, DocumentTextIcon, HashtagIcon, EnvelopeIcon, PhoneIcon, MagnifyingGlassIcon, XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import axios from 'axios';

/**
 * LinkPicker Property Editor
 * Select internal pages, external URLs, anchors, email, or phone links
 * 
 * @param {Object} props
 * @param {Object} props.value - Link object { type, url, text, target, nofollow }
 * @param {Function} props.onChange - Callback with new link value
 * @param {string} props.label - Field label
 * @param {boolean} props.showText - Whether to show link text field (default: true)
 * @param {boolean} props.showTarget - Whether to show target options (default: true)
 * @param {boolean} props.isRequired - Whether field is required
 * @param {boolean} props.isDisabled - Whether field is disabled
 */
const LinkPicker = ({
    value = { type: 'external', url: '', text: '', target: '_self', nofollow: false },
    onChange,
    label = 'Link',
    showText = true,
    showTarget = true,
    isRequired = false,
    isDisabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [linkType, setLinkType] = useState(value?.type || 'external');
    const [localValue, setLocalValue] = useState(value || { type: 'external', url: '', text: '', target: '_self', nofollow: false });
    const [pages, setPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch internal pages
    const fetchPages = useCallback(async () => {
        setLoadingPages(true);
        try {
            const response = await axios.get(route('cms.api.pages.search'), {
                params: { q: searchQuery, status: 'published' }
            });
            if (response.status === 200) {
                setPages(response.data.pages || []);
            }
        } catch (error) {
            console.error('Failed to fetch pages:', error);
            // Mock data for development
            setPages([
                { id: 1, title: 'Home', slug: '/' },
                { id: 2, title: 'About Us', slug: '/about' },
                { id: 3, title: 'Services', slug: '/services' },
                { id: 4, title: 'Pricing', slug: '/pricing' },
                { id: 5, title: 'Contact', slug: '/contact' },
                { id: 6, title: 'Blog', slug: '/blog' },
                { id: 7, title: 'Features', slug: '/features' },
            ]);
        } finally {
            setLoadingPages(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (linkType === 'internal' && isOpen) {
            fetchPages();
        }
    }, [linkType, isOpen, fetchPages]);

    // Filter pages by search query
    const filteredPages = useMemo(() => {
        if (!searchQuery) return pages;
        const query = searchQuery.toLowerCase();
        return pages.filter(page => 
            page.title.toLowerCase().includes(query) ||
            page.slug.toLowerCase().includes(query)
        );
    }, [pages, searchQuery]);

    // Update local value
    const updateValue = (field, newValue) => {
        const updated = { ...localValue, [field]: newValue };
        setLocalValue(updated);
    };

    // Apply changes
    const applyChanges = () => {
        onChange(localValue);
        setIsOpen(false);
    };

    // Clear link
    const clearLink = () => {
        const empty = { type: 'external', url: '', text: '', target: '_self', nofollow: false };
        setLocalValue(empty);
        onChange(empty);
        setIsOpen(false);
    };

    // Select internal page
    const selectPage = (page) => {
        updateValue('url', page.slug);
        if (!localValue.text) {
            updateValue('text', page.title);
        }
    };

    // Get icon for link type
    const getLinkTypeIcon = (type) => {
        switch (type) {
            case 'internal': return <DocumentTextIcon className="w-4 h-4" />;
            case 'external': return <GlobeAltIcon className="w-4 h-4" />;
            case 'anchor': return <HashtagIcon className="w-4 h-4" />;
            case 'email': return <EnvelopeIcon className="w-4 h-4" />;
            case 'phone': return <PhoneIcon className="w-4 h-4" />;
            default: return <LinkIcon className="w-4 h-4" />;
        }
    };

    // Format display value
    const formatDisplayValue = () => {
        if (!value?.url) return '';
        
        switch (value.type) {
            case 'email':
                return value.url.replace('mailto:', '');
            case 'phone':
                return value.url.replace('tel:', '');
            default:
                return value.text || value.url;
        }
    };

    // Build final URL based on type
    const buildUrl = (type, input) => {
        switch (type) {
            case 'email':
                return input.startsWith('mailto:') ? input : `mailto:${input}`;
            case 'phone':
                return input.startsWith('tel:') ? input : `tel:${input.replace(/\D/g, '')}`;
            case 'anchor':
                return input.startsWith('#') ? input : `#${input}`;
            default:
                return input;
        }
    };

    // Handle URL input change
    const handleUrlChange = (newUrl) => {
        const processedUrl = buildUrl(linkType, newUrl);
        updateValue('url', processedUrl);
    };

    // Sync link type with local value
    useEffect(() => {
        if (localValue.type !== linkType) {
            setLocalValue(prev => ({ ...prev, type: linkType, url: '' }));
        }
    }, [linkType]);

    return (
        <div className="w-full">
            <Popover 
                isOpen={isOpen} 
                onOpenChange={setIsOpen}
                placement="bottom-start"
            >
                <PopoverTrigger>
                    <div className="relative">
                        <Input
                            label={label}
                            placeholder="Select or enter link..."
                            value={formatDisplayValue()}
                            readOnly
                            isRequired={isRequired}
                            isDisabled={isDisabled}
                            startContent={getLinkTypeIcon(value?.type || 'external')}
                            endContent={
                                value?.url && !isDisabled ? (
                                    <div className="flex items-center gap-1">
                                        {value.target === '_blank' && (
                                            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-default-400" />
                                        )}
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                clearLink();
                                            }}
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : null
                            }
                            classNames={{
                                inputWrapper: "cursor-pointer bg-default-100",
                                input: "cursor-pointer"
                            }}
                        />
                    </div>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0">
                    <div className="p-4 min-w-[400px] max-h-[500px] overflow-y-auto">
                        {/* Link type tabs */}
                        <Tabs 
                            selectedKey={linkType}
                            onSelectionChange={setLinkType}
                            size="sm"
                            classNames={{
                                tabList: "gap-2 w-full",
                                tab: "px-3",
                            }}
                        >
                            <Tab 
                                key="internal" 
                                title={
                                    <div className="flex items-center gap-1">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Page</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="external" 
                                title={
                                    <div className="flex items-center gap-1">
                                        <GlobeAltIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">URL</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="anchor" 
                                title={
                                    <div className="flex items-center gap-1">
                                        <HashtagIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Anchor</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="email" 
                                title={
                                    <div className="flex items-center gap-1">
                                        <EnvelopeIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Email</span>
                                    </div>
                                }
                            />
                            <Tab 
                                key="phone" 
                                title={
                                    <div className="flex items-center gap-1">
                                        <PhoneIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Phone</span>
                                    </div>
                                }
                            />
                        </Tabs>

                        <div className="mt-4 space-y-4">
                            {/* Internal page selector */}
                            {linkType === 'internal' && (
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Search pages..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                        size="sm"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                    
                                    <div className="max-h-48 overflow-y-auto border border-divider rounded-lg">
                                        {loadingPages ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Spinner size="sm" />
                                            </div>
                                        ) : filteredPages.length === 0 ? (
                                            <div className="text-center py-8 text-default-400 text-sm">
                                                No pages found
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-divider">
                                                {filteredPages.map(page => (
                                                    <button
                                                        key={page.id}
                                                        onClick={() => selectPage(page)}
                                                        className={`
                                                            w-full px-3 py-2 text-left hover:bg-default-100 transition-colors
                                                            ${localValue.url === page.slug ? 'bg-primary/10 text-primary' : ''}
                                                        `}
                                                    >
                                                        <div className="font-medium text-sm">{page.title}</div>
                                                        <div className="text-xs text-default-400">{page.slug}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {localValue.url && (
                                        <Input
                                            label="Selected Page"
                                            value={localValue.url}
                                            isReadOnly
                                            size="sm"
                                            classNames={{ inputWrapper: "bg-content2" }}
                                        />
                                    )}
                                </div>
                            )}

                            {/* External URL input */}
                            {linkType === 'external' && (
                                <Input
                                    label="URL"
                                    placeholder="https://example.com"
                                    value={localValue.url}
                                    onValueChange={(val) => updateValue('url', val)}
                                    startContent={<GlobeAltIcon className="w-4 h-4 text-default-400" />}
                                    size="sm"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            )}

                            {/* Anchor input */}
                            {linkType === 'anchor' && (
                                <Input
                                    label="Anchor ID"
                                    placeholder="section-name"
                                    value={localValue.url.replace('#', '')}
                                    onValueChange={handleUrlChange}
                                    startContent={<span className="text-default-400">#</span>}
                                    size="sm"
                                    description="Enter the ID of the element to scroll to"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            )}

                            {/* Email input */}
                            {linkType === 'email' && (
                                <Input
                                    label="Email Address"
                                    placeholder="email@example.com"
                                    type="email"
                                    value={localValue.url.replace('mailto:', '')}
                                    onValueChange={handleUrlChange}
                                    startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
                                    size="sm"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            )}

                            {/* Phone input */}
                            {linkType === 'phone' && (
                                <Input
                                    label="Phone Number"
                                    placeholder="+1 (555) 123-4567"
                                    type="tel"
                                    value={localValue.url.replace('tel:', '')}
                                    onValueChange={handleUrlChange}
                                    startContent={<PhoneIcon className="w-4 h-4 text-default-400" />}
                                    size="sm"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            )}

                            {/* Link text */}
                            {showText && (
                                <Input
                                    label="Link Text"
                                    placeholder="Click here"
                                    value={localValue.text}
                                    onValueChange={(val) => updateValue('text', val)}
                                    size="sm"
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            )}

                            {/* Target options */}
                            {showTarget && (linkType === 'external' || linkType === 'internal') && (
                                <div className="space-y-3 pt-2 border-t border-divider">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium">Open in new tab</div>
                                            <div className="text-xs text-default-400">Link opens in a new browser tab</div>
                                        </div>
                                        <Switch
                                            size="sm"
                                            isSelected={localValue.target === '_blank'}
                                            onValueChange={(checked) => updateValue('target', checked ? '_blank' : '_self')}
                                        />
                                    </div>

                                    {linkType === 'external' && (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium">Nofollow</div>
                                                <div className="text-xs text-default-400">Adds rel="nofollow" for SEO</div>
                                            </div>
                                            <Switch
                                                size="sm"
                                                isSelected={localValue.nofollow}
                                                onValueChange={(checked) => updateValue('nofollow', checked)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="mt-4 pt-4 border-t border-divider flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="flat"
                                onPress={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                color="primary"
                                onPress={applyChanges}
                                isDisabled={!localValue.url}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default LinkPicker;
