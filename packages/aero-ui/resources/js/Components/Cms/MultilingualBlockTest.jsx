import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Skeleton, Chip, Badge } from "@heroui/react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

const MultilingualBlockTest = ({ pageId = 1 }) => {
    const locales = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' },
        { code: 'zh', name: '中文' },
        { code: 'ja', name: '日本語' },
    ];

    const [selectedLocale, setSelectedLocale] = useState(new Set(['en']));
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentLocale = Array.from(selectedLocale)[0] || 'en';

    // Fetch blocks for the selected locale
    const fetchBlocks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                route('api.blocks.index', { page: pageId }),
                { params: { locale: currentLocale } }
            );

            if (response.status === 200) {
                setBlocks(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch blocks:', error);
            showToast.promise(
                Promise.reject(error),
                {
                    error: `Failed to fetch blocks for locale: ${currentLocale}`
                }
            );
        } finally {
            setLoading(false);
        }
    }, [pageId, currentLocale]);

    useEffect(() => {
        fetchBlocks();
    }, [fetchBlocks]);

    return (
        <div className="w-full space-y-6 p-4">
            {/* Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardHeader className="flex items-center gap-3 pb-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <GlobeAltIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Multilingual Block Test</h2>
                        <p className="text-sm text-default-500">Test CMS blocks in different languages</p>
                    </div>
                </CardHeader>
            </Card>

            {/* Language Switcher */}
            <Card>
                <CardHeader className="border-b pb-3">
                    <h3 className="font-semibold">Select Language</h3>
                </CardHeader>
                <CardBody>
                    <Select
                        label="Language"
                        placeholder="Select a language"
                        selectedKeys={selectedLocale}
                        onSelectionChange={setSelectedLocale}
                        className="max-w-sm"
                        startContent={<GlobeAltIcon className="w-4 h-4" />}
                    >
                        {locales.map(locale => (
                            <SelectItem key={locale.code} value={locale.code}>
                                {locale.name} ({locale.code})
                            </SelectItem>
                        ))}
                    </Select>
                </CardBody>
            </Card>

            {/* Blocks Display */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i}>
                            <CardBody className="space-y-3">
                                <Skeleton className="h-8 w-32 rounded" />
                                <Skeleton className="h-4 w-full rounded" />
                                <Skeleton className="h-4 w-2/3 rounded" />
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : blocks.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-8">
                        <p className="text-default-500">No blocks found for this page</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {blocks.map((block, idx) => (
                        <Card key={block.id}>
                            <CardHeader className="border-b pb-4">
                                <div className="flex items-start justify-between w-full">
                                    <div>
                                        <h3 className="text-lg font-semibold">{block.type_name}</h3>
                                        <p className="text-sm text-default-400">{block.slug}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge content={currentLocale.toUpperCase()} color="primary">
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                            >
                                                {block.available_locales?.length || 0} translations
                                            </Chip>
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="space-y-4">
                                {/* Block Type */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-default-500">Block Type</p>
                                    <Chip color="default" variant="flat">
                                        {block.type}
                                    </Chip>
                                </div>

                                {/* Translated Content */}
                                {block.content && Object.keys(block.content).length > 0 && (
                                    <div className="space-y-2 bg-default-50 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-default-500">Content ({currentLocale.toUpperCase()})</p>
                                        <div className="space-y-2">
                                            {Object.entries(block.content).map(([key, value]) => (
                                                <div key={key} className="text-sm">
                                                    <span className="font-medium text-default-600">{key}: </span>
                                                    <span className="text-default-700">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                {block.metadata && Object.keys(block.metadata).length > 0 && (
                                    <div className="space-y-2 bg-success/5 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-success">Metadata ({currentLocale.toUpperCase()})</p>
                                        <div className="space-y-2">
                                            {Object.entries(block.metadata).map(([key, value]) => (
                                                <div key={key} className="text-sm">
                                                    <span className="font-medium text-default-600">{key}: </span>
                                                    <span className="text-default-700">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Available Locales */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-default-500">Available In</p>
                                    <div className="flex flex-wrap gap-2">
                                        {block.available_locales?.map(locale => (
                                            <Chip
                                                key={locale}
                                                color={locale === currentLocale ? 'primary' : 'default'}
                                                variant={locale === currentLocale ? 'solid' : 'bordered'}
                                            >
                                                {locale.toUpperCase()}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>

                                {/* Config */}
                                {block.config && Object.keys(block.config).length > 0 && (
                                    <div className="space-y-2 bg-warning/5 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-warning">Configuration</p>
                                        <pre className="text-xs bg-default-100 p-2 rounded overflow-auto max-h-32">
                                            {JSON.stringify(block.config, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary */}
            <Card className="bg-info/5 border border-info/20">
                <CardBody className="space-y-2">
                    <p className="text-sm font-medium">Summary</p>
                    <p className="text-sm text-default-600">Displaying {blocks.length} block(s) in {currentLocale.toUpperCase()}</p>
                    {blocks.length > 0 && (
                        <p className="text-sm text-default-600">
                            Testing {blocks[0]?.available_locales?.length || 0} language translation(s)
                        </p>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default MultilingualBlockTest;
