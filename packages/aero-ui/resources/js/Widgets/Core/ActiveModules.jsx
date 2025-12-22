import React from 'react';
import { Card, CardHeader, CardBody, Chip } from '@heroui/react';
import {
    CubeIcon,
    HomeIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
    FolderIcon,
    ShoppingCartIcon,
    TruckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClipboardDocumentCheckIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

/**
 * ActiveProducts Widget
 * Displays status of all available products (subscription-based features)
 * Note: "Core" is hidden as it's a foundation product always included
 */
const ActiveModules = ({ data = [], isRefreshing = false }) => {
    // Support both old 'modules' and new 'products' data structure
    const products = Array.isArray(data) ? data : (data?.products || data?.modules || []);

    // Icon mapping for products
    const iconMap = {
        HomeIcon: <HomeIcon className="w-5 h-5" />,
        UserGroupIcon: <UserGroupIcon className="w-5 h-5" />,
        CurrencyDollarIcon: <CurrencyDollarIcon className="w-5 h-5" />,
        UserCircleIcon: <UserCircleIcon className="w-5 h-5" />,
        FolderIcon: <FolderIcon className="w-5 h-5" />,
        CubeIcon: <CubeIcon className="w-5 h-5" />,
        ShoppingCartIcon: <ShoppingCartIcon className="w-5 h-5" />,
        TruckIcon: <TruckIcon className="w-5 h-5" />,
        ClipboardDocumentCheckIcon: <ClipboardDocumentCheckIcon className="w-5 h-5" />,
    };

    const getIcon = (iconName) => iconMap[iconName] || <CubeIcon className="w-5 h-5" />;

    // Default products if none provided (Core is hidden)
    const displayProducts = products.length > 0 ? products : [
        { code: 'hrm', name: 'Human Resources', icon: 'UserGroupIcon', enabled: false },
        { code: 'finance', name: 'Finance', icon: 'CurrencyDollarIcon', enabled: false },
        { code: 'crm', name: 'CRM', icon: 'UserCircleIcon', enabled: false },
        { code: 'project', name: 'Projects', icon: 'FolderIcon', enabled: false },
        { code: 'inventory', name: 'Inventory', icon: 'CubeIcon', enabled: false },
        { code: 'rfi', name: 'RFI Management', icon: 'ClipboardDocumentCheckIcon', enabled: false },
    ];

    // Filter out 'core' if it somehow appears (should be hidden)
    const filteredProducts = displayProducts.filter(p => p.code !== 'core');
    const enabledCount = filteredProducts.filter(p => p.enabled).length;

    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-success" />
                        <h2 className="text-lg font-semibold">Products</h2>
                    </div>
                    <Chip size="sm" color="success" variant="flat">
                        {enabledCount} Active
                    </Chip>
                </div>
            </CardHeader>
            <CardBody className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((product, idx) => (
                        <div 
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                                product.enabled 
                                    ? 'border-success/30 bg-success/5' 
                                    : 'border-default-200 bg-default-50 opacity-60'
                            }`}
                        >
                            <div className={`p-1.5 rounded-lg ${
                                product.enabled ? 'bg-success/10' : 'bg-default-100'
                            }`}>
                                <span className={product.enabled ? 'text-success' : 'text-default-400'}>
                                    {getIcon(product.icon)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                            </div>
                            {product.enabled ? (
                                <CheckCircleIcon className="w-4 h-4 text-success flex-shrink-0" />
                            ) : (
                                <XCircleIcon className="w-4 h-4 text-default-300 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
};

export default ActiveModules;
