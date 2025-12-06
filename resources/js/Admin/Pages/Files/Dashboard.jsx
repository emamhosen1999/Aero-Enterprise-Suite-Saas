import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Progress,
} from "@heroui/react";
import {
    CloudArrowUpIcon,
    FolderIcon,
    PhotoIcon,
    DocumentTextIcon,
    ServerStackIcon,
    ChartBarIcon,
    ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const FilesDashboard = ({ stats, storage, recentFiles, tenantUsage, auth }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
            setIsLargeScreen(window.innerWidth >= 1280);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    const hasPermission = (permission) => {
        return auth?.user?.permissions?.includes(permission) || auth?.user?.isPlatformSuperAdmin;
    };

    const dashboardStats = useMemo(() => [
        {
            title: "Total Storage",
            value: stats?.totalStorage || "2.4 TB",
            icon: <ServerStackIcon className="w-8 h-8" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Platform-wide storage"
        },
        {
            title: "Files Uploaded",
            value: stats?.totalFiles || "48,523",
            icon: <FolderIcon className="w-8 h-8" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Total files",
            trend: 'up'
        },
        {
            title: "Storage Used",
            value: `${stats?.storageUsed || 68}%`,
            icon: <ChartBarIcon className="w-8 h-8" />,
            color: stats?.storageUsed > 80 ? "text-red-400" : "text-yellow-400",
            iconBg: stats?.storageUsed > 80 ? "bg-red-500/20" : "bg-yellow-500/20",
            description: "Capacity used"
        },
        {
            title: "Avg Upload Speed",
            value: stats?.avgUploadSpeed || "2.4 MB/s",
            icon: <CloudArrowUpIcon className="w-8 h-8" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Upload performance"
        },
    ], [stats]);

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        transform: `scale(var(--scale, 1))`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    });

    const storageByType = storage || [
        { type: 'Images', size: '845 GB', percentage: 35, count: '24,532' },
        { type: 'Documents', size: '612 GB', percentage: 25, count: '18,245' },
        { type: 'Videos', size: '492 GB', percentage: 20, count: '3,421' },
        { type: 'Others', size: '491 GB', percentage: 20, count: '2,325' },
    ];

    const recentUploads = recentFiles || [
        { name: 'invoice_2024_001.pdf', tenant: 'Acme Corp', size: '2.4 MB', uploadedAt: '2 mins ago' },
        { name: 'product_catalog.pdf', tenant: 'Tech Solutions', size: '5.8 MB', uploadedAt: '15 mins ago' },
        { name: 'company_logo.png', tenant: 'Creative Agency', size: '124 KB', uploadedAt: '1 hour ago' },
        { name: 'report_Q4.xlsx', tenant: 'Finance Co', size: '3.2 MB', uploadedAt: '2 hours ago' },
        { name: 'presentation.pptx', tenant: 'Marketing Inc', size: '12.5 MB', uploadedAt: '3 hours ago' },
    ];

    const topTenants = tenantUsage || [
        { name: 'Acme Corp', storage: '156 GB', files: 8245, quota: '200 GB' },
        { name: 'Tech Solutions', storage: '124 GB', files: 6532, quota: '150 GB' },
        { name: 'Creative Agency', storage: '98 GB', files: 5421, quota: '100 GB' },
        { name: 'Finance Co', storage: '87 GB', files: 4236, quota: '100 GB' },
    ];

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
            return <PhotoIcon className="w-5 h-5 text-blue-500" />;
        }
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    };

    return (
        <App>
            <Head title="Files & Storage Dashboard" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Files & Storage</h1>
                        <p className="text-sm text-default-500 mt-1">Platform-wide storage management</p>
                    </div>
                    {hasPermission('files.manage') && (
                        <Button
                            color="primary"
                            startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                            radius={themeRadius}
                        >
                            Upload File
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <StatsCards stats={dashboardStats} isLoading={false} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Storage by Type */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Storage by Type</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {storageByType.map((item, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <span className="font-medium">{item.type}</span>
                                                <span className="text-sm text-default-500 ml-2">
                                                    ({item.count} files)
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium">{item.size}</span>
                                        </div>
                                        <Progress
                                            value={item.percentage}
                                            color="primary"
                                            size="sm"
                                            className="mb-1"
                                        />
                                        <div className="text-xs text-default-500 text-right">
                                            {item.percentage}% of total
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Recent Uploads */}
                    <Card className="transition-all duration-200" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <CloudArrowUpIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Recent Uploads</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {recentUploads.map((file, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-100 transition-colors">
                                        {getFileIcon(file.name)}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{file.name}</div>
                                            <div className="text-xs text-default-500">
                                                {file.tenant} • {file.size}
                                            </div>
                                        </div>
                                        <div className="text-xs text-default-500">
                                            {file.uploadedAt}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Top Tenants by Storage */}
                    <Card className="transition-all duration-200 lg:col-span-2" style={getCardStyle()}>
                        <CardHeader className="flex justify-between items-center" style={getCardHeaderStyle()}>
                            <div className="flex items-center gap-2">
                                <ServerStackIcon className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Top Tenants by Storage</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {topTenants.map((tenant, index) => (
                                    <div key={index} className="p-4 rounded-lg bg-default-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="font-medium">{tenant.name}</div>
                                            <div className="text-sm text-default-500">
                                                {tenant.storage} / {tenant.quota}
                                            </div>
                                        </div>
                                        <Progress
                                            value={(parseInt(tenant.storage) / parseInt(tenant.quota)) * 100}
                                            color={(parseInt(tenant.storage) / parseInt(tenant.quota)) > 0.8 ? 'danger' : 'primary'}
                                            size="sm"
                                            className="mb-2"
                                        />
                                        <div className="flex justify-between text-xs text-default-500">
                                            <span>{tenant.files.toLocaleString()} files</span>
                                            <span>
                                                {Math.round((parseInt(tenant.storage) / parseInt(tenant.quota)) * 100)}% used
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </motion.div>
        </App>
    );
};

export default FilesDashboard;
