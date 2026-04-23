import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import DocsHero from './Components/DocsHero';
import DocsCategories from './Components/DocsCategories';
import DocsQuickStart from './Components/DocsQuickStart';
import DocsPopular from './Components/DocsPopular';
import DocsChangelog from './Components/DocsChangelog';
import DocsCommunity from './Components/DocsCommunity';
import DocsCTA from './Components/DocsCTA';
import './styles/public.css';

export default function Docs({ title = 'Documentation — aeos365' }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <DocsHero />
                    <DocsCategories />
                    <DocsQuickStart />
                    <DocsPopular />
                    <DocsChangelog />
                    <DocsCommunity />
                    <DocsCTA />
                </PublicLayout>
            </div>
        </>
    );
}
