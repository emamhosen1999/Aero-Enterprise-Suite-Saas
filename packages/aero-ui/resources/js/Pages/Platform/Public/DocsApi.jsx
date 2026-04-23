import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import DocsApiHero from './Components/DocsApiHero';
import DocsApiTOC from './Components/DocsApiTOC';
import DocsApiSections from './Components/DocsApiSections';
import DocsApiCTA from './Components/DocsApiCTA';
import './styles/public.css';

export default function DocsApi({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <DocsApiHero />

                    {/* Flex layout: sticky sidebar TOC + main content on desktop */}
                    <div className="px-6 pb-16 lg:px-10 xl:px-16">
                        <div className="mx-auto max-w-screen-2xl flex flex-col lg:flex-row gap-8 items-start">
                            <DocsApiTOC />
                            <div className="flex-1 min-w-0">
                                <DocsApiSections />
                            </div>
                        </div>
                    </div>

                    <DocsApiCTA />
                </PublicLayout>
            </div>
        </>
    );
}
