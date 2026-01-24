import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { DocumentTextIcon, ArrowDownTrayIcon, FolderIcon, DocumentIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const Documents = ({ title, documents = [] }) => {
    const { auth } = usePage().props;
    const { hasAccess } = useHRMAC();
    const themeRadius = useThemeRadius();
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const stats = useMemo(() => {
        const contracts = documents.filter(d => d.type === 'contract').length;
        const policies = documents.filter(d => d.type === 'policy').length;
        const letters = documents.filter(d => d.type === 'letter').length;
        return { total: documents.length, contracts, policies, letters };
    }, [documents]);

    const statsData = useMemo(() => [
        { title: "Total Documents", value: stats.total, icon: <FolderIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Contracts", value: stats.contracts, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Policies", value: stats.policies, icon: <DocumentIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Letters", value: stats.letters, icon: <DocumentTextIcon className="w-6 h-6" />, color: "text-secondary", iconBg: "bg-secondary/20" },
    ], [stats]);

    const typeColorMap = {
        contract: 'success',
        policy: 'warning',
        letter: 'primary',
        certificate: 'secondary',
    };

    const columns = [
        { uid: 'name', name: 'Document Name' },
        { uid: 'type', name: 'Type' },
        { uid: 'uploaded_at', name: 'Date Added' },
        { uid: 'size', name: 'Size' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'type':
                return <Chip color={typeColorMap[item.type] || 'default'} size="sm" variant="flat">{item.type}</Chip>;
            case 'actions':
                return (
                    <Button size="sm" variant="flat" color="primary" startContent={<ArrowDownTrayIcon className="w-4 h-4" />}>
                        Download
                    </Button>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <StandardPageLayout
            title="My Documents"
            subtitle="Access your employment documents"
            icon={DocumentTextIcon}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            stats={<StatsCards stats={statsData} />}
            ariaLabel="My Documents"
        >
            {documents.length > 0 ? (
                <Table aria-label="Documents" classNames={{
                    wrapper: "shadow-none border border-divider rounded-lg",
                    th: "bg-default-100 text-default-600 font-semibold",
                    td: "py-3"
                }}>
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                    </TableHeader>
                    <TableBody items={documents}>
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-default-500">
                    <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Documents Available</p>
                    <p className="text-sm">Your employment documents will appear here.</p>
                </div>
            )}
        </StandardPageLayout>
    );
};

Documents.layout = (page) => <App children={page} />;
export default Documents;
