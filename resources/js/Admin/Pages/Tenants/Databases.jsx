import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Progress } from "@heroui/react";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Databases = ({ auth }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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

    const dbStats = [
        {
            title: "Total Databases",
            value: "245",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Tenant databases",
        },
        {
            title: "Total Size",
            value: "48.2 GB",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "All databases",
        },
        {
            title: "Avg Size",
            value: "196 MB",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Per tenant",
        },
        {
            title: "Connections",
            value: "1,245",
            icon: <CircleStackIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Active connections",
        },
    ];

    const columns = [
        { uid: "database", name: "DATABASE" },
        { uid: "tenant", name: "TENANT" },
        { uid: "size", name: "SIZE" },
        { uid: "tables", name: "TABLES" },
        { uid: "status", name: "STATUS" },
    ];

    const mockDatabases = [
        { id: 1, database: "tenant_1", tenant: "Acme Corp", size: "245 MB", tables: 42, status: "healthy" },
        { id: 2, database: "tenant_2", tenant: "Tech Solutions", size: "512 MB", tables: 38, status: "healthy" },
        { id: 3, database: "tenant_3", tenant: "Startup Inc", size: "89 MB", tables: 35, status: "healthy" },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "database":
                return <span className="font-mono text-sm">{item.database}</span>;
            case "tenant":
                return <span>{item.tenant}</span>;
            case "size":
                return <span>{item.size}</span>;
            case "tables":
                return <span>{item.tables}</span>;
            case "status":
                return (
                    <Chip 
                        size="sm" 
                        color="success" 
                        variant="flat"
                    >
                        {item.status}
                    </Chip>
                );
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title="Database Management" />
            <PageHeader
                title="Database Management"
                subtitle="Monitor tenant databases, size, and performance"
                icon={<CircleStackIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <StatsCards stats={dbStats} />

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Tenant Databases</h3>
                    </CardHeader>
                    <CardBody>
                        <Table
                            aria-label="Databases table"
                            classNames={{
                                wrapper: "shadow-none",
                            }}
                        >
                            <TableHeader columns={columns}>
                                {(column) => (
                                    <TableColumn key={column.uid}>
                                        {column.name}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody items={mockDatabases}>
                                {(item) => (
                                    <TableRow key={item.id}>
                                        {(columnKey) => (
                                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                                        )}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Database Performance</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm">Storage Usage</span>
                                    <span className="text-sm text-default-500">48.2 GB / 100 GB</span>
                                </div>
                                <Progress value={48} color="primary" size="sm" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm">Connection Pool</span>
                                    <span className="text-sm text-default-500">1,245 / 2,000</span>
                                </div>
                                <Progress value={62} color="warning" size="sm" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Databases.layout = (page) => <App>{page}</App>;

export default Databases;
