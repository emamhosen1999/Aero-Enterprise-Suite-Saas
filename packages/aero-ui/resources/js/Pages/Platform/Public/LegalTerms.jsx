import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import TermsHero from './Components/TermsHero';
import TermsTOC from './Components/TermsTOC';
import TermsSections from './Components/TermsSections';
import TermsCTA from './Components/TermsCTA';
import './styles/public.css';

export default function LegalTerms({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <TermsHero />
                    <TermsTOC />
                    <TermsSections />
                    <TermsCTA />
                </PublicLayout>
            </div>
        </>
    );
}
