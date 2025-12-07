import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const Automation = ({ auth }) => {
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

    return (
        <>
            <Head title="Welcome Automation" />
            <PageHeader
                title="Welcome Automation"
                subtitle="Configure welcome emails and onboarding sequences"
                icon={<EnvelopeIcon className="w-8 h-8" />}
            />
            
            <div className="space-y-6">
                <Card 
                    className="transition-all duration-200"
                    style={getCardStyle()}
                >
                    <CardHeader style={getCardHeaderStyle()}>
                        <h3 className="text-lg font-semibold">Welcome Automation</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-default-600">
                            Configure automated welcome emails and onboarding email sequences for new tenants.
                        </p>
                        <p className="mt-4 text-sm text-default-500">
                            Email template and sequence builder coming soon.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

Automation.layout = (page) => <App>{page}</App>;

export default Automation;
