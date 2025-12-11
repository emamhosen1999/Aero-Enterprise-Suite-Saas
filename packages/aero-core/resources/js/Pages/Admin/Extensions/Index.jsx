import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import App from '@/Layouts/App';
import PageHeader from '@/Components/PageHeader';
import {
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Button,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Tabs,
    Tab,
} from '@heroui/react';
import {
    PuzzlePieceIcon,
    CloudArrowUpIcon,
    ArrowPathIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

/**
 * Extensions Marketplace Page
 * 
 * Displays installed modules and available marketplace modules.
 * Allows activation/deactivation of modules and uploading new modules.
 */
const ExtensionsIndex = ({ installedModules = [], marketplaceModules = [], purchasedCodes = {} }) => {
    const [activeTab, setActiveTab] = useState('installed');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [purchaseCode, setPurchaseCode] = useState('');
    const [uploading, setUploading] = useState(false);
    const [checkingUpdates, setCheckingUpdates] = useState(false);
    
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'xl';
    };
    
    const themeRadius = getThemeRadius();

    const handleToggleModule = (moduleCode, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('core.extensions.toggle', moduleCode));
                if (response.status === 200) {
                    resolve([response.data.message || `Module ${action}d successfully`]);
                    router.reload({ only: ['installedModules'] });
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to ${action} module`]);
            }
        });

        showToast.promise(promise, {
            loading: `${action === 'activate' ? 'Activating' : 'Deactivating'} module...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleUploadModule = () => {
        if (!uploadFile || !purchaseCode.trim()) {
            showToast.error('Please select a file and enter purchase code');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('module', uploadFile);
        formData.append('purchase_code', purchaseCode);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('core.extensions.upload'), formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                if (response.status === 200) {
                    resolve([response.data.message || 'Module installed successfully']);
                    setUploadModalOpen(false);
                    setUploadFile(null);
                    setPurchaseCode('');
                    router.reload();
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to install module']);
            } finally {
                setUploading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Installing module...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleCheckUpdates = async () => {
        setCheckingUpdates(true);

        try {
            const response = await axios.get(route('core.extensions.checkUpdates'));
            
            if (response.data.updates && response.data.updates.length > 0) {
                showToast.success(`${response.data.updates.length} update(s) available`);
            } else {
                showToast.success('All modules are up to date');
            }
        } catch (error) {
            showToast.error('Failed to check for updates');
        } finally {
            setCheckingUpdates(false);
        }
    };

    const renderModuleCard = (module, isInstalled = false) => {
        const isActive = module.enabled;
        const isPurchased = purchasedCodes[module.code];

        return (
            <Card key={module.code} className="border border-divider">
                <CardHeader className="flex flex-col items-start gap-2 pb-2">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            {module.thumbnail ? (
                                <img 
                                    src={module.thumbnail} 
                                    alt={module.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-default-100 flex items-center justify-center">
                                    <PuzzlePieceIcon className="w-6 h-6 text-default-400" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold">{module.name}</h3>
                                <p className="text-xs text-default-500">v{module.version}</p>
                            </div>
                        </div>
                        {isInstalled && (
                            <Chip
                                color={isActive ? 'success' : 'default'}
                                variant="flat"
                                size="sm"
                                startContent={isActive ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                            >
                                {isActive ? 'Active' : 'Inactive'}
                            </Chip>
                        )}
                    </div>
                </CardHeader>

                <CardBody className="py-3">
                    <p className="text-sm text-default-600 mb-3">{module.description}</p>
                    
                    {module.features && module.features.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-semibold text-default-700 mb-1">Features:</p>
                            <ul className="text-xs text-default-600 space-y-1">
                                {module.features.slice(0, 3).map((feature, index) => (
                                    <li key={index}>• {feature}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!isInstalled && module.price && (
                        <div className="mt-2">
                            <p className="text-lg font-bold text-primary">
                                ${module.price} <span className="text-xs font-normal text-default-500">{module.currency}</span>
                            </p>
                        </div>
                    )}
                </CardBody>

                <CardFooter className="pt-2 border-t border-divider">
                    {isInstalled ? (
                        <div className="flex gap-2 w-full">
                            <Button
                                color={isActive ? 'danger' : 'success'}
                                variant="flat"
                                onPress={() => handleToggleModule(module.code, isActive)}
                                className="flex-1"
                                radius={themeRadius}
                            >
                                {isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            {module.has_settings && (
                                <Button
                                    isIconOnly
                                    variant="flat"
                                    onPress={() => router.visit(route('core.extensions.settings', module.code))}
                                    radius={themeRadius}
                                >
                                    <Cog6ToothIcon className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button
                                color="primary"
                                startContent={<ShoppingCartIcon className="w-4 h-4" />}
                                className="flex-1"
                                radius={themeRadius}
                                onPress={() => window.open(module.codecanyon_url, '_blank')}
                            >
                                Buy on CodeCanyon
                            </Button>
                            {module.preview_url && (
                                <Button
                                    variant="flat"
                                    onPress={() => window.open(module.preview_url, '_blank')}
                                    radius={themeRadius}
                                >
                                    Preview
                                </Button>
                            )}
                        </div>
                    )}
                </CardFooter>
            </Card>
        );
    };

    return (
        <>
            <Head title="Extensions Marketplace" />
            <div className="container mx-auto px-4 py-6 space-y-6">
                <PageHeader
                    title="Extensions Marketplace"
                    subtitle="Manage installed modules and discover new extensions"
                    icon={PuzzlePieceIcon}
                    actions={[
                        <Button
                            key="check-updates"
                            variant="flat"
                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                            onPress={handleCheckUpdates}
                            isLoading={checkingUpdates}
                            radius={themeRadius}
                        >
                            Check Updates
                        </Button>,
                        <Button
                            key="upload"
                            color="primary"
                            startContent={<CloudArrowUpIcon className="w-4 h-4" />}
                            onPress={() => setUploadModalOpen(true)}
                            radius={themeRadius}
                        >
                            Upload Module
                        </Button>,
                    ]}
                />

                <Tabs
                    selectedKey={activeTab}
                    onSelectionChange={setActiveTab}
                    variant="underlined"
                    color="primary"
                    classNames={{
                        tabList: "gap-6",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-0 h-12",
                    }}
                >
                    <Tab
                        key="installed"
                        title={
                            <div className="flex items-center gap-2">
                                <PuzzlePieceIcon className="w-4 h-4" />
                                <span>Installed Modules</span>
                                <Chip size="sm" variant="flat">{installedModules.length}</Chip>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            {installedModules.length > 0 ? (
                                installedModules.map(module => renderModuleCard(module, true))
                            ) : (
                                <div className="col-span-full text-center py-12 text-default-500">
                                    No modules installed yet
                                </div>
                            )}
                        </div>
                    </Tab>

                    <Tab
                        key="marketplace"
                        title={
                            <div className="flex items-center gap-2">
                                <ShoppingCartIcon className="w-4 h-4" />
                                <span>Marketplace</span>
                                <Chip size="sm" variant="flat">{marketplaceModules.length}</Chip>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            {marketplaceModules.length > 0 ? (
                                marketplaceModules.map(module => renderModuleCard(module, false))
                            ) : (
                                <div className="col-span-full text-center py-12 text-default-500">
                                    No marketplace modules available
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>

                {/* Upload Module Modal */}
                <Modal
                    isOpen={uploadModalOpen}
                    onOpenChange={setUploadModalOpen}
                    size="2xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "bg-content1",
                        header: "border-b border-divider",
                        body: "py-6",
                        footer: "border-t border-divider",
                    }}
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Upload Module</h2>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Module ZIP File</label>
                                    <Input
                                        type="file"
                                        accept=".zip"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        radius={themeRadius}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />
                                    <p className="text-xs text-default-500 mt-1">
                                        Upload the module ZIP file you purchased from CodeCanyon
                                    </p>
                                </div>

                                <Input
                                    label="Purchase Code"
                                    placeholder="Enter your Envato purchase code"
                                    value={purchaseCode}
                                    onValueChange={setPurchaseCode}
                                    isRequired
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />

                                <div className="bg-default-100 rounded-lg p-3">
                                    <p className="text-xs text-default-600">
                                        <strong>Note:</strong> Your purchase code can be found in your CodeCanyon downloads section.
                                        The module will be validated and installed automatically.
                                    </p>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="flat"
                                onPress={() => setUploadModalOpen(false)}
                                radius={themeRadius}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleUploadModule}
                                isLoading={uploading}
                                radius={themeRadius}
                            >
                                Install Module
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </>
    );
};

ExtensionsIndex.layout = (page) => <App>{page}</App>;

export default ExtensionsIndex;
