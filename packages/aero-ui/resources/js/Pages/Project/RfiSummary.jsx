import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@heroui/react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';

const RfiSummary = ({ title = 'RFI Summary' }) => {
    const { auth } = usePage().props;
    const { hasAccess, isSuperAdmin } = useHRMAC();

    const canViewSummary = hasAccess('project.rfi') || hasAccess('rfi') || isSuperAdmin();

    return (
        <>
            <Head title={title} />

            <StandardPageLayout
                title="RFI Summary"
                subtitle="Summary overview"
                icon={<DocumentTextIcon />}
                ariaLabel="RFI Summary"
            >
                <Card className="aero-card">
                    <CardBody>
                        {!canViewSummary ? (
                            <div className="text-default-500">
                                You do not have permission to view this summary.
                            </div>
                        ) : (
                            <div className="text-default-500">
                                No summary data available.
                            </div>
                        )}
                    </CardBody>
                </Card>
            </StandardPageLayout>
        </>
    );
};

RfiSummary.layout = (page) => <App children={page} />;
export default RfiSummary;
