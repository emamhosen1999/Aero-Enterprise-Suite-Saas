import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import CookiesHero from './Components/CookiesHero';
import CookiesTOC from './Components/CookiesTOC';
import CookiesSections from './Components/CookiesSections';
import CookiesCTA from './Components/CookiesCTA';
import './styles/public.css';

export default function LegalCookies({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <CookiesHero />
                    <CookiesTOC />
                    <CookiesSections />
                    <CookiesCTA />
                </PublicLayout>
            </div>
        </>
    );
}
