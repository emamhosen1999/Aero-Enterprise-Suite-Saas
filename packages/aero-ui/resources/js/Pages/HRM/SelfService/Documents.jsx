import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { DocumentTextIcon, ArrowDownTrayIcon, FolderIcon, DocumentIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';

const Documents = ({ title, documents = [] }) => {
    const { auth } = usePage().props;
    
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
        <>
            <Head title={title || "My Documents"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                                <CardHeader className="border-b p-0" style={{
                                    borderColor: `var(--theme-divider, #E4E4E7)`,
                                    background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                }}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`} style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}>
                                                    <DocumentTextIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>My Documents</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Access your employment documents</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
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
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

Documents.layout = (page) => <App children={page} />;
export default Documents;
