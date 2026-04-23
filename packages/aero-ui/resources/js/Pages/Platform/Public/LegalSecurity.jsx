import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import SecurityHero from './Components/SecurityHero';
import SecurityTOC from './Components/SecurityTOC';
import SecuritySections from './Components/SecuritySections';
import SecurityCTA from './Components/SecurityCTA';
import './styles/public.css';

export default function LegalSecurity({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <SecurityHero />
                    <SecurityTOC />
                    <SecuritySections />
                    <SecurityCTA />
                </PublicLayout>
            </div>
        </>
    );
}
