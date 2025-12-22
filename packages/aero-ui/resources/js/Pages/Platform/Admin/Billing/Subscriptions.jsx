import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";

const Subscriptions = ({ auth, subscriptions }) => {
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

    const subscriptionStats = [
        {
            title: "Active Subscriptions",
            value: "245",
            icon: <CreditCardIcon className="w-6 h-6" />,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: "Currently paying",
        },
        {
            title: "Trial Users",
            value: "58",
            icon: <CreditCardIcon className="w-6 h-6" />,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "In trial period",
        },
        {
            title: "Monthly Revenue",
            value: "$12,450",
            icon: <CreditCardIcon className="w-6 h-6" />,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "This month",
        },
        {
            title: "Churn Rate",
            value: "2.3%",
            icon: <CreditCardIcon className="w-6 h-6" />,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Last 30 days",
        },
    ];

    const columns = [
        { uid: "tenant", name: "TENANT" },
        { uid: "plan", name: "PLAN" },
        { uid: "status", name: "STATUS" },
        { uid: "amount", name: "AMOUNT" },
        { uid: "next_billing", name: "NEXT BILLING" },
    ];

    const mockSubscriptions = [
        { id: 1, tenant: "Acme Corp", plan: "Professional", status: "active", amount: "$99/mo", next_billing: "2025-01-15" },
        { id: 2, tenant: "Tech Solutions", plan: "Enterprise", status: "active", amount: "$299/mo", next_billing: "2025-01-10" },
        { id: 3, tenant: "Startup Inc", plan: "Basic", status: "trial", amount: "$0", next_billing: "Trial ends 2025-01-05" },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "tenant":
                return <span className="font-medium">{item.tenant}</span>;
            case "plan":
                return <span>{item.plan}</span>;
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
            case "amount":
                return <span>{item.amount}</span>;
            case "next_billing":
                return <span className="text-sm text-default-500">{item.next_billing}</span>;
            default:
                return item[columnKey];
        }
    };

    return (
        <>
            <Head title="Subscriptions" />
            <PageHeader
                title="Subscription Management"
                subtitle="Manage tenant subscriptions, billing cycles, and revenue"
                icon={<CreditCardIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <StatsCards stats={subscriptionStats} />

                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Recent Subscriptions</h3>
                    </CardHeader>
                    <CardBody>
                        <Table
                            aria-label="Subscriptions table"
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
                            <TableBody items={mockSubscriptions}>
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
                        <h3 className="text-lg font-semibold">Subscription Management</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Comprehensive subscription management with billing cycles, upgrades/downgrades, 
                            and revenue tracking.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Advanced billing features and payment gateway integration coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Subscriptions.layout = (page) => <App>{page}</App>;

export default Subscriptions;
