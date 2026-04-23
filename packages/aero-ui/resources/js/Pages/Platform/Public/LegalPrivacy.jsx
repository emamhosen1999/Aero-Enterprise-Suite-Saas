import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import PrivacyHero from './Components/PrivacyHero';
import PrivacyTOC from './Components/PrivacyTOC';
import PrivacySections from './Components/PrivacySections';
import PrivacyCTA from './Components/PrivacyCTA';
import './styles/public.css';

export default function LegalPrivacy({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <PrivacyHero />
                    <PrivacyTOC />
                    <PrivacySections />
                    <PrivacyCTA />
                </PublicLayout>
            </div>
        </>
    );
}
