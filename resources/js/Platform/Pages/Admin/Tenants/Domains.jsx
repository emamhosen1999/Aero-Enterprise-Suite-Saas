import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const Domains = ({ auth }) => {
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

    const columns = [
        { uid: "domain", name: "DOMAIN" },
        { uid: "tenant", name: "TENANT" },
        { uid: "type", name: "TYPE" },
        { uid: "status", name: "STATUS" },
        { uid: "ssl", name: "SSL" },
    ];

    const mockDomains = [
        { id: 1, domain: "acme.domain.com", tenant: "Acme Corp", type: "subdomain", status: "active", ssl: "valid" },
        { id: 2, domain: "custom.com", tenant: "Tech Solutions", type: "custom", status: "active", ssl: "valid" },
        { id: 3, domain: "startup.domain.com", tenant: "Startup Inc", type: "subdomain", status: "pending", ssl: "pending" },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "domain":
                return <span className="font-medium">{item.domain}</span>;
            case "tenant":
                return <span>{item.tenant}</span>;
            case "type":
                return <Chip size="sm" variant="flat">{item.type}</Chip>;
            case "status":
                return (
                    <Chip 
                        size="sm" 
                        color={item.status === 'active' ? 'success' : 'warning'} 
                        variant="flat"
                    >
                        {item.status}
                    </Chip>
                );
            case "ssl":
                return (
                    <Chip 
                        size="sm" 
                        color={item.ssl === 'valid' ? 'success' : 'warning'} 
                        variant="flat"
                    >
                        {item.ssl}
                    </Chip>
                );
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title="Domain Management" />
            <PageHeader
                title="Domain Management"
                subtitle="Manage tenant domains, custom domains, and SSL certificates"
                icon={<GlobeAltIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">All Domains</h3>
                    </CardHeader>
                    <CardBody>
                        <Table
                            aria-label="Domains table"
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
                            <TableBody items={mockDomains}>
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
                        <h3 className="text-lg font-semibold">Domain Management</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Manage tenant domains, configure custom domains, SSL certificates, and DNS settings.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Advanced domain management features coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Domains.layout = (page) => <App>{page}</App>;

export default Domains;
