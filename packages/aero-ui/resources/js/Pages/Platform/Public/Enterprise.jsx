import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import EnterpriseHero from './Components/EnterpriseHero';
import EnterpriseCapabilities from './Components/EnterpriseCapabilities';
import EnterpriseGovernance from './Components/EnterpriseGovernance';
import EnterpriseTimeline from './Components/EnterpriseTimeline';
import EnterpriseOutcomes from './Components/EnterpriseOutcomes';
import EnterpriseIntegrations from './Components/EnterpriseIntegrations';
import EnterpriseFAQ from './Components/EnterpriseFAQ';
import EnterpriseCTA from './Components/EnterpriseCTA';
import './styles/public.css';

export default function Enterprise({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <EnterpriseHero />
                    <EnterpriseCapabilities />
                    <EnterpriseGovernance />
                    <EnterpriseTimeline />
                    <EnterpriseOutcomes />
                    <EnterpriseIntegrations />
                    <EnterpriseFAQ />
                    <EnterpriseCTA />
                </PublicLayout>
            </div>
        </>
    );
}
